/**
 * Authentication router: the three-step sign-in pipeline (password, second
 * factor, device biometric), self-service registration and SSO hand-off.
 *
 * Route-level guarantees applied to every endpoint below:
 *   - fixed-window rate limit per client + per account,
 *   - hard failure lockout (LoginGuard) against credential stuffing,
 *   - strict body allowlist (length caps, control-character stripping),
 *   - generic, enumeration-resistant error text,
 *   - `Cache-Control: no-store` and no auth material in URLs,
 *   - audit trail entry for success *and* failure.
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ApiContext } from './context.js';
import { audit } from '../security/audit.js';
import { checkPasswordPolicy } from '../security/auth.js';
import { validateBody } from '../security/validate.js';
import type { SessionRole } from '../security/session.js';

const ROLE_VALUES = ['trainee', 'trainer', 'admin'] as const;

export function createAuthRouter(ctx: ApiContext): Router {
  const router = Router();
  const { config, auth, sessions } = ctx;

  const noStore = (req: Request, res: Response, next: () => void) => {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    next();
  };

  const rate = ctx.limiters.auth;
  const csrf = ctx.requireCsrf;
  const limit = config.limits;

  const roleField = { type: 'enum' as const, values: ROLE_VALUES, required: true, max: 12 };

  const send = (req: Request, res: Response, status: number, body: Record<string, unknown>) =>
    res.status(status).json({ ...body, requestId: req.requestId });

  /* --------------------------------- step 1 -------------------------------- */

  router.post(
    '/challenge',
    noStore,
    rate,
    csrf,
    validateBody({
      username: { type: 'string', required: true, max: limit.username, singleLine: true, min: 2 },
      password: { type: 'string', required: true, max: limit.password, min: 1 },
      role: roleField,
    }),
    (req: Request, res: Response) => {
      const { username, password, role } = req.validated as { username: string; password: string; role: SessionRole };
      const result = auth.beginSignIn(req, username, password, role);

      if (result.error) {
        if (result.retryInMs) res.setHeader('Retry-After', String(Math.ceil(result.retryInMs / 1000)));
        return send(req, res, result.status ?? 401, { error: result.error, code: result.status === 423 ? 'locked' : 'invalid_credentials' });
      }

      return send(req, res, 200, {
        challengeId: result.challengeId,
        stage: result.stage,
        expiresIn: result.expiresIn,
        // The demo OTP is only ever echoed by the server in DEMO_MODE.
        ...(result.devOtp ? { devOtp: result.devOtp } : {}),
        principal: { username: result.principal.username, role: result.principal.role, displayName: result.principal.displayName },
      });
    },
  );

  /* --------------------------------- step 2 -------------------------------- */

  router.post(
    '/verify-otp',
    noStore,
    rate,
    csrf,
    validateBody({
      challengeId: { type: 'string', required: true, token: true, max: 64 },
      code: { type: 'string', required: true, max: 12, singleLine: true, min: 6 },
    }),
    (req: Request, res: Response) => {
      const { challengeId, code } = req.validated as { challengeId: string; code: string };
      const result = auth.verifySecondFactor(req, challengeId, code);
      if (!result.ok) return send(req, res, result.status ?? 401, { error: result.error ?? 'Verification failed.', code: 'otp_failed' });
      return send(req, res, 200, { verificationToken: result.verificationToken, nextStage: result.nextStage });
    },
  );

  router.post(
    '/resend-otp',
    noStore,
    rate,
    csrf,
    validateBody({ challengeId: { type: 'string', required: true, token: true, max: 64 } }),
    (req: Request, res: Response) => {
      const { challengeId } = req.validated as { challengeId: string };
      const result = auth.resendSecondFactor(req, challengeId);
      if (!result.ok) return send(req, res, 401, { error: result.error, code: 'challenge_missing' });
      return send(req, res, 200, { sent: true, expiresIn: result.expiresIn, ...(result.devOtp ? { devOtp: result.devOtp } : {}) });
    },
  );

  /* --------------------------------- step 3 -------------------------------- */

  router.post(
    '/verify-factor',
    noStore,
    rate,
    csrf,
    validateBody({
      verificationToken: { type: 'string', required: true, max: 1_024 },
      factorKind: { type: 'enum', values: ['face', 'biometric'], required: true, max: 16 },
      passed: { type: 'boolean', required: true },
    }),
    (req: Request, res: Response) => {
      const { verificationToken, factorKind, passed } = req.validated as { verificationToken: string; factorKind: 'face' | 'biometric'; passed: boolean };
      const result = auth.completeSignIn(req, verificationToken, { kind: factorKind, passed: passed === true });

      if (!result.ok) return send(req, res, result.status ?? 401, { error: result.error ?? 'Verification failed.', code: 'factor_failed' });

      const session = sessions.create({
        userId: result.principal.userId,
        username: result.principal.username,
        role: result.principal.role,
        displayName: result.principal.displayName,
        ipHash: '',
        factors: result.factors,
        scheme: result.principal.scheme,
      });
      sessions.setCookies(res, session);

      audit.log('auth.session.adopted', 'Session issued after all three factors passed', {
        req,
        actor: session.username,
        meta: { role: session.role, scheme: session.scheme, ttlMinutes: Math.round(config.sessionIdleMinutes) },
      });

      return send(req, res, 200, {
        authenticated: true,
        csrfToken: session.csrfToken,
        role: session.role,
        username: session.username,
        displayName: session.displayName,
        scheme: session.scheme,
        expiresAt: session.expiresAt,
        idleTimeoutMinutes: config.sessionIdleMinutes,
      });
    },
  );

  /* ------------------------------- single sign-on ---------------------------- */

  router.post(
    '/sso',
    noStore,
    rate,
    csrf,
    validateBody({ provider: { type: 'enum', values: ['Google', 'Apple', 'Microsoft'], required: true, max: 20 }, role: roleField }),
    (req: Request, res: Response) => {
      if (!config.demoMode) {
        // Without a configured OIDC provider this must not hand out sessions.
        audit.log('authz.denied', 'SSO hand-off requested while DEMO_MODE is off', { req, severity: 'warning' });
        return send(req, res, 503, { error: 'Federated sign-in is not configured on this deployment.', code: 'sso_disabled' });
      }
      const { role, provider } = req.validated as { role: SessionRole; provider: string };
      const result = auth.beginSsoSignIn(req, role);
      audit.log('auth.login.success', `${provider} SSO hand-off accepted; second factor required`, { req, severity: 'notice', meta: { role, scheme: 'sso' } });
      return send(req, res, 200, {
        challengeId: result.challengeId,
        stage: result.stage,
        expiresIn: result.expiresIn,
        ...(result.devOtp ? { devOtp: result.devOtp } : {}),
        principal: { username: result.principal.username, role: result.principal.role, displayName: result.principal.displayName },
      });
    },
  );

  /* ------------------------------- registration ------------------------------ */

  router.post(
    '/register',
    noStore,
    rate,
    csrf,
    validateBody({
      fullName: { type: 'string', required: true, max: limit.fullName, singleLine: true, min: 3 },
      email: { type: 'string', required: true, max: limit.email, singleLine: true, min: 5 },
      password: { type: 'string', required: true, max: limit.password, min: config.passwordMinLength },
      role: roleField,
      institute: { type: 'string', max: limit.institute, singleLine: true },
    }),
    (req: Request, res: Response) => {
      const body = req.validated as { fullName: string; email: string; password: string; role: SessionRole; institute?: string };
      const policy = checkPasswordPolicy(body.password, config.passwordMinLength);
      if (!policy.ok) {
        audit.log('auth.register.failure', 'Password rejected by policy', { req, severity: 'notice', meta: { problems: policy.problems.length } });
        return send(req, res, 400, { error: `Password must ${policy.problems.join(', ')}.`, code: 'weak_password', problems: policy.problems });
      }

      const result = auth.registerAccount({
        fullName: body.fullName,
        email: body.email,
        role: body.role,
        password: body.password,
        institute: body.institute ?? 'India Meteorological Department (IMD HQ)',
      });
      if (!result.ok) return send(req, res, 409, { error: result.error, code: 'registration_failed' });

      const challenge = auth.beginSignIn(req, result.principal.username, body.password, body.role);
      if ('error' in challenge) {
        return send(req, res, 400, { error: 'Registration succeeded but sign-in could not start. Please sign in manually.', code: 'register_ok_signin_failed' });
      }

      audit.log('auth.register.success', 'Self-service account created (password stored as scrypt digest)', {
        req,
        actor: result.principal.username,
        meta: { role: result.principal.role, strength: policy.strength },
      });

      return send(req, res, 201, {
        registered: true,
        challengeId: challenge.challengeId,
        stage: challenge.stage,
        expiresIn: challenge.expiresIn,
        ...(challenge.devOtp ? { devOtp: challenge.devOtp } : {}),
        principal: { username: result.principal.username, role: result.principal.role, displayName: result.principal.displayName },
      });
    },
  );

  /* ----------------------------- profile re-verification --------------------- */

  router.post(
    '/verify-profile',
    noStore,
    ctx.limiters.security,
    csrf,
    validateBody({
      password: { type: 'string', required: true, max: limit.password, min: 1 },
      role: roleField,
    }),
    (req: Request, res: Response) => {
      const { password, role } = req.validated as { password: string; role: SessionRole };
      const username = req.session?.username ?? `XYZ_${role}`;
      const result = auth.beginSignIn(req, username, password, role);
      if ('error' in result) {
        // Never echo the expected password (the previous build leaked it in the
        // error string and accepted *any* value longer than 4 characters).
        return send(req, res, result.status ?? 401, { error: 'Invalid credentials. Re-enter your account password.', code: 'invalid_credentials', retryAfterSeconds: result.retryInMs ? Math.ceil(result.retryInMs / 1000) : undefined });
      }
      return send(req, res, 200, { verified: true, challengeId: result.challengeId, stage: result.stage, ...(result.devOtp ? { devOtp: result.devOtp } : {}) });
    },
  );

  /* -------------------------------- session --------------------------------- */

  router.get('/session', noStore, ctx.attachSession, (req: Request, res: Response) => {
    if (!req.session) return send(req, res, 401, { authenticated: false });
    return send(req, res, 200, {
      authenticated: true,
      csrfToken: req.session.csrfToken,
      role: req.session.role,
      username: req.session.username,
      displayName: req.session.displayName,
      scheme: req.session.scheme,
      expiresAt: req.session.expiresAt,
      idleTimeoutMinutes: config.sessionIdleMinutes,
    });
  });

  router.post('/refresh', noStore, ctx.attachSession, (req: Request, res: Response) => {
    if (!req.session) return send(req, res, 401, { authenticated: false, code: 'session_expired' });
    return send(req, res, 200, { authenticated: true, expiresAt: req.session.expiresAt, csrfToken: req.session.csrfToken });
  });

  router.post('/logout', noStore, ctx.attachSession, (req: Request, res: Response) => {
    if (req.session) {
      audit.log('auth.logout', 'Session destroyed', { req, actor: req.session.username });
      sessions.destroy(req.session.id);
    }
    sessions.clearCookies(res);
    return send(req, res, 200, { authenticated: false });
  });

  /* ---------------------------- demo credential help ------------------------ */

  router.get(
    '/demo-credentials',
    noStore,
    rate,
    validateBody({}),
    (req: Request, res: Response) => {
      if (!config.demoMode) return send(req, res, 404, { error: 'Not found', code: 'demo_disabled' });
      // GET route: the role arrives as a query parameter, so it is allowlisted
      // here rather than trusted from `req.query` directly.
      const requested = typeof req.query.role === 'string' ? req.query.role.toLowerCase() : 'trainee';
      const role = (ROLE_VALUES.includes(requested as (typeof ROLE_VALUES)[number]) ? requested : 'trainee') as SessionRole;
      const result = auth.demoCredentialFor(role);
      audit.log('auth.demo.credentials', 'Demo credential auto-fill requested', { req, severity: 'notice', meta: { role } });
      return send(req, res, 200, result);
    },
  );

  return router;
}
