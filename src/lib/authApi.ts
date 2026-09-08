/**
 * Authentication API surface used by the sign-in, registration and profile
 * unlock flows. The UI is unchanged; what changed is *who decides* whether a
 * factor passed — the portal's server, not the browser.
 *
 * Contract (see `server/routes/auth.ts`):
 *   1. POST /api/auth/challenge        password  -> challengeId
 *   2. POST /api/auth/verify-otp       6-digit   -> verificationToken
 *   3. POST /api/auth/verify-factor    biometric -> HttpOnly session cookie
 */
import { apiRequest, setCsrfToken, type ApiFailure, type ApiResult } from './api';
import type { UserRole } from '../types';

export interface AuthPrincipal {
  username: string;
  role: UserRole;
  displayName: string;
}

export interface ChallengeResponse {
  challengeId: string;
  stage: string;
  expiresIn?: number;
  /** Present only when the server runs in DEMO_MODE. */
  devOtp?: string;
  principal?: AuthPrincipal;
}

export interface SessionResponse {
  authenticated: boolean;
  csrfToken?: string;
  role?: UserRole;
  username?: string;
  displayName?: string;
  scheme?: 'demo' | 'registered' | 'sso';
  expiresAt?: number;
  idleTimeoutMinutes?: number;
}

export interface SecurityConfig {
  portal?: string;
  environment?: string;
  demoMode?: boolean;
  csrf?: { header: string; token: string | null };
  passwordPolicy?: { minLength: number; requireMixedClasses: boolean };
  session?: { idleTimeoutMinutes: number; absoluteTimeoutHours: number };
  limits?: {
    aiChatPerMinute: number;
    mcqPerMinute: number;
    authAttemptsPerMinute: number;
    loginMaxFailures: number;
    loginLockoutMinutes: number;
    otpTtlSeconds: number;
    otpMaxAttempts: number;
    fileUpload?: { maxBytes: number; extensions: string[] };
  };
  factorByRole?: Record<UserRole, 'face' | 'biometric'>;
}

export interface AuthOutcome<T> {
  ok: boolean;
  data?: T;
  error?: ApiFailure;
  /** True when the portal API itself could not be reached (offline demo path). */
  offline?: boolean;
}

function toOutcome<T>(result: ApiResult<T>): AuthOutcome<T> {
  if (result.ok) return { ok: true, data: result.data };
  return { ok: false, error: result.error, offline: !!result.error && (result.error.network || result.error.status === 0) };
}

/* --------------------------------- bootstrap -------------------------------- */

/** Public, non-sensitive settings used to size client-side guards. */
export async function fetchSecurityConfig(): Promise<SecurityConfig | null> {
  const result = await apiRequest<SecurityConfig>('/api/security/config', { timeoutMs: 8_000 });
  if (!result.ok || !result.data) return null;
  if (result.data.csrf?.token) setCsrfToken(result.data.csrf.token);
  return result.data;
}

export async function fetchSession(): Promise<SessionResponse | null> {
  const result = await apiRequest<SessionResponse>('/api/auth/session', { timeoutMs: 8_000 });
  if (!result.ok || !result.data) return null;
  if (result.data.csrfToken) setCsrfToken(result.data.csrfToken);
  return result.data;
}

export function logout(): void {
  setCsrfToken(null);
  // Best effort: a failed logout must not trap the user in the UI.
  void apiRequest('/api/auth/logout', { method: 'POST', timeoutMs: 5_000 });
}

/* ------------------------------- three factors ------------------------------ */

export function beginSignIn(username: string, password: string, role: UserRole): Promise<AuthOutcome<ChallengeResponse>> {
  return apiRequest<ChallengeResponse>('/api/auth/challenge', {
    method: 'POST',
    body: { username, password, role },
    timeoutMs: 12_000,
  }).then(toOutcome);
}

export function verifySecondFactor(challengeId: string, code: string): Promise<AuthOutcome<{ verificationToken: string; nextStage: 'factor' }>> {
  return apiRequest<{ verificationToken: string; nextStage: 'factor' }>('/api/auth/verify-otp', {
    method: 'POST',
    body: { challengeId, code },
    timeoutMs: 12_000,
  }).then(toOutcome);
}

export function resendSecondFactor(challengeId: string): Promise<AuthOutcome<{ sent: boolean; devOtp?: string; expiresIn?: number }>> {
  return apiRequest<{ sent: boolean; devOtp?: string; expiresIn?: number }>('/api/auth/resend-otp', {
    method: 'POST',
    body: { challengeId },
    timeoutMs: 12_000,
  }).then(toOutcome);
}

export function completeThirdFactor(
  verificationToken: string,
  factorKind: 'face' | 'biometric',
): Promise<AuthOutcome<SessionResponse>> {
  return apiRequest<SessionResponse>('/api/auth/verify-factor', {
    method: 'POST',
    body: { verificationToken, factorKind, passed: true },
    timeoutMs: 12_000,
  }).then(toOutcome);
}

export function startSsoSignIn(provider: 'Google' | 'Apple' | 'Microsoft', role: UserRole): Promise<AuthOutcome<ChallengeResponse>> {
  return apiRequest<ChallengeResponse>('/api/auth/sso', { method: 'POST', body: { provider, role }, timeoutMs: 12_000 }).then(toOutcome);
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  institute: string;
}

export function registerAccount(payload: RegisterPayload): Promise<AuthOutcome<ChallengeResponse & { registered?: boolean }>> {
  return apiRequest<ChallengeResponse & { registered?: boolean }>('/api/auth/register', {
    method: 'POST',
    body: payload,
    timeoutMs: 15_000,
  }).then(toOutcome);
}

/** Re-verification for the protected profile dossier. */
export function verifyProfilePassword(password: string, role: UserRole): Promise<AuthOutcome<{ verified: boolean; retryAfterSeconds?: number }>> {
  return apiRequest<{ verified: boolean; retryAfterSeconds?: number }>('/api/auth/verify-profile', {
    method: 'POST',
    body: { password, role },
    timeoutMs: 12_000,
  }).then(toOutcome);
}

/**
 * Demo convenience. The secret lives on the server; `DEMO_MODE=false` makes
 * this endpoint 404 and the UI simply stops offering the shortcut.
 */
export async function fetchDemoCredential(role: UserRole): Promise<{ username: string; password: string | null } | null> {
  const result = await apiRequest<{ username: string; password: string | null }>(`/api/auth/demo-credentials?role=${encodeURIComponent(role)}`, {
    timeoutMs: 8_000,
  });
  return result.ok ? result.data : null;
}
