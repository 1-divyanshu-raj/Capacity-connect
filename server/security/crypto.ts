/**
 * Primitive crypto helpers for the CAPACITY CONNECT security layer.
 *
 * Uses only `node:crypto` (no third-party dependency, no transitive CVE
 * surface). All comparisons that involve secrets are constant time.
 */
import crypto from 'node:crypto';

const SCRYPT_PARAMS: crypto.ScryptOptions = {
  N: 131_072,
  r: 8,
  p: 1,
  maxmem: 256 * 1024 * 1024,
};

const KEY_LEN = 32;
const SALT_LEN = 16;

/** URL-safe random token with 128+ bits of entropy. */
export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/** Random numeric code (used for OTP issuance in non-demo channels). */
export function randomDigits(length: number): string {
  let out = '';
  while (out.length < length) {
    out += crypto.randomInt(0, 10).toString();
  }
  return out.slice(0, length);
}

/** Non-sequential, non-guessable identifier for certificates/records. */
export function randomId(prefix: string, bytes = 9): string {
  return `${prefix}-${crypto.randomBytes(bytes).toString('base64url').replace(/[-_]/g, '').slice(0, 12).toUpperCase()}`;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LEN);
  const derived = crypto.scryptSync(password.normalize('NFKC').slice(0, 1024), salt, KEY_LEN, SCRYPT_PARAMS);
  return `scrypt$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

/** Verifies a password against a stored scrypt digest in constant time. */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, n, r, p, saltB64, hashB64] = stored.split('$');
    if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
    const expected = Buffer.from(hashB64, 'base64url');
    const derived = crypto.scryptSync(password.normalize('NFKC').slice(0, 1024), Buffer.from(saltB64, 'base64url'), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 512 * 1024 * 1024,
    });
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Constant-time string comparison that never short-circuits on length. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(String(a).normalize('NFKC'), 'utf8');
  const bufB = Buffer.from(String(b).normalize('NFKC'), 'utf8');
  if (bufA.length === 0 || bufB.length === 0) return bufA.length === bufB.length;
  // Compare digests so differing lengths do not leak through timingSafeEqual.
  return crypto.timingSafeEqual(crypto.createHash('sha256').update(bufA).digest(), crypto.createHash('sha256').update(bufB).digest());
}

export function signPayload(payload: unknown, secret: string, purpose = 'cc'): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const mac = crypto.createHmac('sha256', secret).update(`${purpose}.${body}`).digest('base64url');
  return `${body}.${mac}`;
}

export interface VerifyResult<T> {
  ok: boolean;
  payload?: T;
  reason?: 'malformed' | 'signature' | 'expired';
}

export function verifyPayload<T>(token: string, secret: string, purpose = 'cc', maxAgeSeconds?: number): VerifyResult<T> {
  if (typeof token !== 'string') return { ok: false, reason: 'malformed' };
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed' };
  const [body, mac] = parts;
  if (body.length > 8_192 || mac.length > 256) return { ok: false, reason: 'malformed' };

  const expected = crypto.createHmac('sha256', secret).update(`${purpose}.${body}`).digest();
  const provided = Buffer.from(mac, 'base64url');
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return { ok: false, reason: 'signature' };
  }

  let payload: T & { exp?: number; iat?: number };
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (payload && typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
    return { ok: false, reason: 'expired' };
  }
  if (maxAgeSeconds && payload && typeof payload.iat === 'number' && Date.now() / 1000 - payload.iat > maxAgeSeconds) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, payload };
}

/** SHA-256 fingerprint used for the integrity banner on issued certificates. */
export function fingerprint(value: string): string {
  return crypto.createHash('sha256').update(value).digest('base64url').slice(0, 16);
}

/** Deterministic, non-reversible identifier for log correlation (no PII). */
export function pseudonymous(value: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(String(value)).digest('hex').slice(0, 12);
}
