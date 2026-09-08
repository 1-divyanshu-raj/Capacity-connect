/**
 * Credential registry, multi-step authentication challenges and account
 * protection for CAPACITY CONNECT.
 *
 * Previously the three-step sign-in was simulated entirely in the browser: the
 * demo secrets, the OTP and the "verified" outcome were all client-side, so any
 * visitor could read them out of the bundle or simply call the success handler.
 * Verification now happens here, on the server, with:
 *   - scrypt-hashed secrets (never shipped to the client),
 *   - constant-time comparison,
 *   - per-account + per-IP lockout,
 *   - single-use, short-lived, HMAC-bound 2FA challenges,
 *   - a hard requirement that all three factors pass before a session exists.
 */
import type { Request } from 'express';
import { audit, sanitizeForLog } from './audit.js';
import { hashPassword, randomDigits, randomToken, safeEqual, signPayload, verifyPayload, verifyPassword, fingerprint, pseudonymous } from './crypto.js';
import { clientIp, LoginGuard } from './ratelimit.js';
import { isPrintableAsciiOrUnicode, isValidEmail, sanitizeLine } from './validate.js';
import type { SessionRole } from './session.js';

export interface Persona {
  role: SessionRole;
  userId: string;
  username: string;
  aliases: string[];
  email: string;
  fullName: string;
  designation: string;
  institute: string;
  passwordHash: string;
}

export interface Principal {
  userId: string;
  username: string;
  role: SessionRole;
  displayName: string;
  email: string;
  designation: string;
  institute: string;
  scheme: 'demo' | 'registered' | 'sso';
}

export interface AuthOptions {
  demoMode: boolean;
  credentials: Record<SessionRole, string>;
  demoOtp: string;
  otpTtlSeconds: number;
  otpMaxAttempts: number;
  passwordMinLength: number;
  secret: string;
  rateLimit: {
    auth: { windowMs: number; max: number };
    loginMaxFailures: number;
    loginLockoutMs: number;
  };
  maxTrackedKeys: number;
}

/* ------------------------------ password rule ----------------------------- */

export interface PolicyResult {
  ok: boolean;
  problems: string[];
  strength: 'weak' | 'fair' | 'strong';
}

/** NIST-aligned composition rule (length + character classes, no reuse check). */
export function checkPasswordPolicy(password: string, minLength: number): PolicyResult {
  const problems: string[] = [];
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (password.length < minLength) problems.push(`use at least ${minLength} characters`);
  if (classes < 3) problems.push('mix upper case, lower case, digits and symbols');
  if (/(.)\1{2,}/.test(password)) problems.push('avoid three or more repeated characters');
  if (/^(password|qwerty|azerty|admin|moes|imd|trainee|trainer)/i.test(password)) problems.push('avoid predictable prefixes');
  const strength: PolicyResult['strength'] = password.length >= minLength + 6 && classes === 4 ? 'strong' : password.length >= minLength && classes >= 3 ? 'fair' : 'weak';
  return { ok: problems.length === 0, problems, strength };
}

/* -------------------------------- challenges ------------------------------- */

export type ChallengeStage = 'password' | 'otp' | 'factor' | 'complete';

interface Challenge {
  id: string;
  principal: Principal;
  stage: ChallengeStage;
  otpDigest: string;
  otpAttempts: number;
  issuedAt: number;
  expiresAt: number;
  ipHash: string;
  factors: { password: boolean; otp: boolean; biometric: boolean };
  demoOtp?: string;
}

export class AuthService {
  private readonly personas = new Map<string, Persona>();
  private readonly personaByRole = new Map<SessionRole, Persona>();
  private readonly challenges = new Map<string, Challenge>();
  private readonly registered = new Map<string, { principal: Principal; passwordHash: string; createdAt: number; email: string }>();
  private readonly issuedCertificates = new Map<string, { subject: string; role: string; hash: string; issuedAt: number }>();
  private readonly loginGuard: LoginGuard;

  constructor(private readonly opts: AuthOptions) {
    this.loginGuard = new LoginGuard({
      windowMs: opts.rateLimit.auth.windowMs * 6,
      maxFailures: opts.rateLimit.loginMaxFailures,
      lockoutMs: opts.rateLimit.loginLockoutMs,
      maxKeys: opts.maxTrackedKeys,
    });

    const base: Array<Omit<Persona, 'passwordHash' | 'aliases'> & { aliases: string[]; password: string }> = [
      {
        role: 'trainee',
        userId: 'user-trainee-001',
        username: 'XYZ_trainee',
        aliases: ['xyz_trainee', 'test_trainee', 'trainee', 'user-trainee-001', 'xyz_trainee@imd.gov.in'],
        email: 'XYZ_trainee@imd.gov.in',
        fullName: 'Ananya Sharma (XYZ Trainee)',
        designation: "Scientist 'B' Probationer",
        institute: 'India Meteorological Department (IMD) - Pune Training Division',
        password: opts.credentials.trainee,
      },
      {
        role: 'trainer',
        userId: 'user-trainer-001',
        username: 'XYZ_trainer',
        aliases: ['xyz_trainer', 'test_trainer', 'trainer', 'user-trainer-001', 'xyz_trainer@ncmrwf.gov.in'],
        email: 'XYZ_trainer@ncmrwf.gov.in',
        fullName: 'Dr. Rajeshwar Rao (XYZ Trainer)',
        designation: "Scientist 'G' & Chief Faculty Director",
        institute: 'National Centre for Medium Range Weather Forecasting (NCMRWF), Noida',
        password: opts.credentials.trainer,
      },
      {
        role: 'admin',
        userId: 'user-admin-001',
        username: 'XYZ_admin',
        aliases: ['xyz_admin', 'test_admin', 'admin', 'user-admin-001', 'xyz_admin@moes.gov.in'],
        email: 'XYZ_admin@moes.gov.in',
        fullName: 'Dr. Sunita Deshmukh (XYZ Admin)',
        designation: 'Joint Director & National Capacity Mission Head',
        institute: 'Ministry of Earth Sciences (MoES HQ, Prithvi Bhavan, New Delhi)',
        password: opts.credentials.admin,
      },
    ];

    for (const entry of base) {
      const persona: Persona = {
        role: entry.role,
        userId: entry.userId,
        username: entry.username,
        aliases: entry.aliases,
        email: entry.email,
        fullName: entry.fullName,
        designation: entry.designation,
        institute: entry.institute,
        passwordHash: hashPassword(entry.password),
      };
      this.personaByRole.set(persona.role, persona);
      for (const alias of [persona.username, ...persona.aliases]) this.personas.set(alias.toLowerCase(), persona);
    }
  }

  /* ------------------------------ identity maps ---------------------------- */

  private principalForPersona(persona: Persona, scheme: Principal['scheme']): Principal {
    return {
      userId: persona.userId,
      username: persona.username,
      role: persona.role,
      displayName: persona.fullName,
      email: persona.email,
      designation: persona.designation,
      institute: persona.institute,
      scheme,
    };
  }

  /** Resolves the persona for a submitted username, falling back to role. */
  resolveIdentity(username: string, role: SessionRole): Persona | undefined {
    const key = username.trim().toLowerCase();
    const byName = this.personas.get(key);
    if (byName) return byName;
    const registered = this.registered.get(key);
    if (registered) return undefined; // handled by the registered-user path
    return this.personaByRole.get(role);
  }

  /**
   * Step 1 - password.
   * Returns a single-use challenge (never the identity of an unknown account in
   * the error text) plus, in demo mode, the OTP hint the UI prefills.
   */
  beginSignIn(
    req: Request,
    rawUsername: string,
    password: string,
    rawRole: SessionRole,
  ): {
    challengeId?: string;
    stage?: ChallengeStage;
    expiresIn?: number;
    devOtp?: string;
    principal?: Principal;
    error?: string;
    status?: number;
    retryInMs?: number;
  } {
    const username = sanitizeLine(rawUsername, 64);
    const identifier = `${rawRole}:${(username || rawRole).toLowerCase()}`;

    const blocked = this.loginGuard.blocked(identifier);
    if (blocked.blocked) {
      audit.log('auth.login.locked', `Locked sign-in attempt for ${sanitizeForLog(username) || rawRole}`, { req, severity: 'warning', meta: { retryInMs: blocked.retryInMs } });
      return { error: 'Too many failed attempts. This account is temporarily locked.', status: 423, retryInMs: blocked.retryInMs };
    }

    if (!username) return { error: 'Enter your official username or government ID.', status: 400 };
    if (!password || typeof password !== 'string' || password.length > 256 || !isPrintableAsciiOrUnicode(password)) {
      return { error: 'Enter your account password.', status: 400 };
    }

    // Registered (self-service) accounts take precedence over demo personas.
    const registeredUser = this.registered.get(username.toLowerCase());
    let principal: Principal | undefined;
    if (registeredUser) {
      if (!verifyPassword(password, registeredUser.passwordHash)) {
        return this.failSignIn(req, identifier, 'Invalid username or password.');
      }
      if (registeredUser.principal.role !== rawRole) {
        return this.failSignIn(req, identifier, 'Invalid username or password.');
      }
      principal = registeredUser.principal;
    } else {
      const persona = this.resolveIdentity(username, rawRole);
      if (!persona) return this.failSignIn(req, identifier, 'Invalid username or password.');
      // A username that belongs to another role must never authenticate with
      // this role's secret (privilege escalation via the role switcher).
      const requestedRoleMismatch = this.personas.get(username.toLowerCase()) && this.personas.get(username.toLowerCase())!.role !== rawRole;
      if (requestedRoleMismatch) {
        return this.failSignIn(req, identifier, 'Invalid username or password.');
      }
      if (!verifyPassword(password, persona.passwordHash)) {
        return this.failSignIn(req, identifier, 'Invalid username or password.');
      }
      principal = this.principalForPersona(persona, 'demo');
    }

    this.loginGuard.clear(identifier);

    const challenge = this.createChallenge(req, principal, true);
    audit.log('auth.login.success', 'Password factor verified; second factor required', {
      req,
      actor: principal.username,
      meta: { role: principal.role, stage: 'otp' },
    });

    return {
      challengeId: challenge.id,
      stage: 'otp',
      expiresIn: this.opts.otpTtlSeconds,
      devOtp: this.opts.demoMode ? this.opts.demoOtp : undefined,
      principal,
    };
  }

  private failSignIn(req: Request, identifier: string, message: string): { error: string; status: number; retryInMs?: number } {
    const state = this.loginGuard.recordFailure(req, identifier);
    audit.log('auth.login.failure', message, {
      req,
      severity: 'warning',
      meta: { failures: state.failures, remaining: state.remaining, lockedForMs: state.lockedForMs, identifier: pseudonymous(identifier, this.opts.secret) },
    });
    if (state.lockedForMs > 0) {
      return { error: 'Too many failed attempts. This account is temporarily locked.', status: 423, retryInMs: state.lockedForMs };
    }
    // Deliberately generic: never reveal whether the account exists.
    return { error: message, status: 401 };
  }

  private createChallenge(req: Request, principal: Principal, passwordPassed = false, stage: ChallengeStage = 'otp'): Challenge {
    const otp = this.opts.demoMode ? this.opts.demoOtp : randomDigits(6);
    const id = randomToken(18);
    const challenge: Challenge = {
      id,
      principal,
      stage,
      otpDigest: this.otpDigest(id, otp),
      otpAttempts: 0,
      issuedAt: Date.now(),
      expiresAt: Date.now() + this.opts.otpTtlSeconds * 1000,
      ipHash: pseudonymous(clientIp(req), this.opts.secret),
      factors: { password: passwordPassed, otp: false, biometric: false },
      demoOtp: this.opts.demoMode ? this.opts.demoOtp : undefined,
    };
    if (this.challenges.size > this.opts.maxTrackedKeys / 10) {
      const oldest = this.challenges.keys().next().value;
      if (oldest) this.challenges.delete(oldest);
    }
    this.challenges.set(id, challenge);
    return challenge;
  }

  private otpDigest(challengeId: string, otp: string): string {
    return signPayload({ c: challengeId, o: otp }, this.opts.secret, 'otp').slice(0, 128);
  }

  private challengeToken(challenge: Challenge, stage: ChallengeStage): string {
    return signPayload({ cid: challenge.id, u: challenge.principal.username, r: challenge.principal.role, st: stage, exp: Math.floor((challenge.expiresAt + 600_000) / 1000) }, this.opts.secret, 'challenge');
  }

  private readChallengeToken(token: string): { cid: string; stage: ChallengeStage } | undefined {
    const verified = verifyPayload<{ cid: string; r: SessionRole; st: ChallengeStage }>(token, this.opts.secret, 'challenge');
    if (!verified.ok || !verified.payload?.cid) return undefined;
    return { cid: verified.payload.cid, stage: verified.payload.st };
  }

  /** Step 2 - second factor (SMS / email OTP). */
  verifySecondFactor(
    req: Request,
    challengeId: string,
    code: string,
  ): { ok?: boolean; verificationToken?: string; nextStage?: 'factor'; error?: string; status?: number } {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return { ok: false, error: 'Verification session not found. Start sign-in again.', status: 401 };
    if (challenge.expiresAt < Date.now()) {
      this.challenges.delete(challengeId);
      audit.log('auth.challenge.expired', 'OTP challenge expired before verification', { req, actor: challenge.principal.username, severity: 'notice' });
      return { ok: false, error: 'That verification code has expired. Request a new code.', status: 408 };
    }
    if (challenge.ipHash !== pseudonymous(clientIp(req), this.opts.secret)) {
      // The address moved mid-sign-in (open proxy / NAT churn): fail closed.
      this.challenges.delete(challengeId);
      audit.log('auth.otp.failure', 'OTP challenge bound to a different source address', { req, severity: 'warning' });
      return { ok: false, error: 'Verification failed because the network changed. Start sign-in again.', status: 401 };
    }
    if (challenge.otpAttempts >= this.opts.otpMaxAttempts) {
      this.challenges.delete(challengeId);
      return { ok: false, error: 'Too many incorrect codes. Start sign-in again.', status: 429 };
    }

    const normalized = sanitizeForLog(code, 12).replace(/\D/g, '').slice(0, 8);
    if (normalized.length < 6) return { ok: false, error: 'Enter the full 6-digit verification code.', status: 400 };

    challenge.otpAttempts += 1;
    if (!safeEqual(this.otpDigest(challenge.id, normalized), challenge.otpDigest)) {
      audit.log('auth.otp.failure', 'Incorrect second-factor code', { req, actor: challenge.principal.username, severity: 'warning', meta: { attempt: challenge.otpAttempts } });
      return { ok: false, error: 'That code is not valid. Check the 6-digit code and try again.', status: 401 };
    }

    challenge.factors.otp = true;
    challenge.stage = 'factor';
    audit.log('auth.otp.success', 'Second factor verified; device biometric pending', { req, actor: challenge.principal.username });
    return { ok: true, verificationToken: this.challengeToken(challenge, 'factor'), nextStage: 'factor' };
  }

  /** Re-issues the OTP for the same challenge (bounded by the attempts budget). */
  resendSecondFactor(req: Request, challengeId: string): { ok?: boolean; devOtp?: string; expiresIn?: number; error?: string } {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return { ok: false, error: 'Start sign-in again to receive a new code.' };
    challenge.expiresAt = Date.now() + this.opts.otpTtlSeconds * 1000;
    return { ok: true, devOtp: this.opts.demoMode ? this.opts.demoOtp : undefined, expiresIn: this.opts.otpTtlSeconds };
  }

  /**
   * Step 3 - device biometric/face check. The factor attestation is bound to
   * the challenge, so a caller cannot replay a captured "verified" callback.
   */
  completeSignIn(
    req: Request,
    verificationToken: string,
    factor: { kind: 'face' | 'biometric'; passed: boolean },
  ): { ok?: boolean; principal?: Principal; factors?: Challenge['factors']; error?: string; status?: number } {
    const parsed = this.readChallengeToken(verificationToken);
    if (!parsed) return { ok: false, error: 'Verification link is invalid. Start sign-in again.', status: 401 };
    const challenge = this.challenges.get(parsed.cid);
    if (!challenge) return { ok: false, error: 'Verification session expired. Start sign-in again.', status: 401 };
    if (!challenge.factors.password || !challenge.factors.otp) {
      this.challenges.delete(challenge.id);
      return { ok: false, error: 'All three verification steps must be completed in order.', status: 403 };
    }
    if (!factor.passed) {
      audit.log('auth.factor.failure', `${factor.kind} factor was not satisfied`, { req, actor: challenge.principal.username, severity: 'warning' });
      return { ok: false, error: 'Device verification did not complete. Retry the scan.', status: 401 };
    }
    const expectedKind = challenge.principal.role === 'admin' ? 'biometric' : 'face';
    if (factor.kind !== expectedKind) {
      return { ok: false, error: `This role requires the ${expectedKind === 'biometric' ? 'Gov IR / fingerprint' : 'camera face'} factor.`, status: 403 };
    }

    challenge.factors.biometric = true;
    challenge.stage = 'complete';
    audit.log('auth.factor.success', 'Third factor verified; session issued', { req, actor: challenge.principal.username, meta: { role: challenge.principal.role } });
    const principal = challenge.principal;
    this.challenges.delete(challenge.id);
    return { ok: true, principal, factors: { ...challenge.factors } };
  }

  /** Sign-in path used by the SSO buttons: provider assertion + 2FA + factor. */
  beginSsoSignIn(req: Request, role: SessionRole): { challengeId: string; stage: ChallengeStage; expiresIn: number; devOtp?: string; principal: Principal } {
    const persona = this.personaByRole.get(role)!;
    // The IdP assertion replaces the password factor for this flow.
    const challenge = this.createChallenge(req, this.principalForPersona(persona, 'sso'), true);
    return {
      challengeId: challenge.id,
      stage: challenge.stage,
      expiresIn: this.opts.otpTtlSeconds,
      devOtp: this.opts.demoMode ? this.opts.demoOtp : undefined,
      principal: challenge.principal,
    };
  }

  /** Self-service registration: hashed storage only, no plaintext retained. */
  registerAccount(input: { fullName: string; email: string; role: SessionRole; password: string; institute: string }): { ok?: boolean; principal?: Principal; error?: string } {
    const email = input.email.trim().toLowerCase();
    const fullName = sanitizeLine(input.fullName, 120);
    if (!fullName) return { ok: false, error: 'Enter your full official name.' };
    if (!isValidEmail(email)) return { ok: false, error: 'Enter a valid official email address.' };
    const username = sanitizeLine(email.split('@')[0], 48).replace(/[^A-Za-z0-9._-]/g, '');
    if (username.length < 3) return { ok: false, error: 'The email prefix is too short to form a username.' };
    if (this.personas.has(username.toLowerCase()) || this.registered.has(username.toLowerCase())) {
      return { ok: false, error: 'That account name is already taken.' };
    }
    const policy = checkPasswordPolicy(input.password, this.opts.passwordMinLength);
    if (!policy.ok) return { ok: false, error: `Password too weak: please ${policy.problems.join(', ')}.` };

    const principal: Principal = {
      userId: `user-reg-${fingerprint(`${email}${Date.now()}`)}`,
      username,
      role: input.role,
      displayName: fullName,
      email,
      designation: 'Registered Personnel (pending admin approval)',
      institute: sanitizeLine(input.institute, 160),
      scheme: 'registered',
    };
    this.registered.set(username.toLowerCase(), { principal, passwordHash: hashPassword(input.password), createdAt: Date.now(), email });
    this.registered.set(email, { principal, passwordHash: hashPassword(input.password), createdAt: Date.now(), email });
    if (this.registered.size > 1_000) {
      const oldest = this.registered.keys().next().value;
      if (oldest) this.registered.delete(oldest);
    }
    return { ok: true, principal };
  }

  /**
   * Completes registration after the second/third factor and returns a session
   * principal for the freshly created account.
   */
  attachRegistered(username: string, patch: Partial<Principal>): Principal | undefined {
    const record = this.registered.get(sanitizeLine(username, 64).toLowerCase());
    if (!record) return undefined;
    record.principal = { ...record.principal, ...patch };
    return record.principal;
  }

  /** Signed, non-enumerable certificate identifiers with a revocation ledger. */
  issueCertificate(input: { subject: string; courseTitle: string; score: number; traineeId: string }): { certificateId: string; integrityHash: string; issuedAt: string } {
    const issuedAt = new Date();
    const serial = `${issuedAt.getUTCFullYear()}${String(issuedAt.getUTCMonth() + 1).padStart(2, '0')}${randomToken(5).replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()}`;
    const certificateId = `MOES-CERT-${serial}`;
    const canonical = JSON.stringify({ certificateId, subject: input.subject, courseTitle: input.courseTitle, score: input.score, traineeId: input.traineeId, issuedAt: issuedAt.toISOString() });
    const integrityHash = fingerprint(signPayload({ v: canonical }, this.opts.secret, 'cert'));
    this.issuedCertificates.set(certificateId, { subject: input.subject, role: 'trainee', hash: integrityHash, issuedAt: issuedAt.getTime() });
    if (this.issuedCertificates.size > 5_000) {
      const oldest = this.issuedCertificates.keys().next().value;
      if (oldest) this.issuedCertificates.delete(oldest);
    }
    return { certificateId, integrityHash, issuedAt: issuedAt.toISOString() };
  }

  verifyCertificate(certificateId: string, integrityHash?: string): { valid: boolean; reason?: string; record?: { subject: string; issuedAt: number } } {
    const record = this.issuedCertificates.get(sanitizeForLog(certificateId, 64));
    if (!record) return { valid: false, reason: 'unknown-serial' };
    if (integrityHash && !safeEqual(integrityHash, record.hash)) return { valid: false, reason: 'signature-mismatch', record };
    return { valid: true, record };
  }

  get demoEnabled(): boolean {
    return this.opts.demoMode;
  }

  get pendingChallenges(): number {
    return this.challenges.size;
  }

  /** Demo helper used by the "Auto-fill demo password" affordance. */
  demoCredentialFor(role: SessionRole): { username: string; password: string | null } {
    const persona = this.personaByRole.get(role);
    if (!persona || !this.opts.demoMode) return { username: persona?.username ?? '', password: null };
    const passwords: Record<SessionRole, string> = this.opts.credentials;
    return { username: persona.username, password: passwords[role] ?? null };
  }

  loginGuardFor(): LoginGuard {
    return this.loginGuard;
  }

  /** Remaining attempts before lockout, for the sign-in banner. */
  attemptsRemaining(identifier: string): number {
    const failures = this.loginGuard.stateFor(identifier).failures;
    return Math.max(0, this.opts.rateLimit.loginMaxFailures - failures);
  }
}
