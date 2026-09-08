/**
 * Server-authoritative session and CSRF layer.
 *
 * The portal used to derive the signed-in identity (and therefore the role /
 * authorisation boundary) purely in the browser, which is trivially tampered
 * with from devtools. Identity now comes from an HMAC-signed, HttpOnly,
 * SameSite=Strict cookie that the browser cannot read and an attacker cannot
 * forge, and every privileged API call is checked against it server side.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { randomToken, safeEqual, signPayload, verifyPayload } from './crypto.js';
import { audit } from './audit.js';

export type SessionRole = 'trainee' | 'trainer' | 'admin';

export interface SessionRecord {
  id: string;
  userId: string;
  username: string;
  role: SessionRole;
  displayName: string;
  issuedAt: number;
  lastSeenAt: number;
  expiresAt: number;
  csrfToken: string;
  ipHash: string;
  factors: { password: boolean; otp: boolean; biometric: boolean };
  scheme: 'demo' | 'registered' | 'sso';
}

export interface SessionManagerOptions {
  secret: string;
  cookieName: string;
  csrfCookieName: string;
  idleMs: number;
  absoluteMs: number;
  secure: boolean;
  maxSessions: number;
}

/* ------------------------------ cookie utils ------------------------------ */

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';').slice(0, 40)) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    const rawValue = part.slice(idx + 1).trim();
    if (rawValue.length > 4_096) continue;
    try {
      out[name] = decodeURIComponent(rawValue);
    } catch {
      out[name] = rawValue;
    }
  }
  return out;
}

export function serializeCookie(name: string, value: string, opts: { maxAgeSeconds: number; secure: boolean; sameSite?: 'Strict' | 'Lax'; httpOnly?: boolean }): string {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${Math.max(0, Math.floor(opts.maxAgeSeconds))}`,
    `SameSite=${opts.sameSite ?? 'Strict'}`,
    opts.httpOnly === false ? '' : 'HttpOnly',
    opts.secure ? 'Secure' : '',
  ].filter(Boolean);
  return attributes.join('; ');
}

/* --------------------------------- manager -------------------------------- */

export class SessionManager {
  private readonly sessions = new Map<string, SessionRecord>();
  private sweeper: NodeJS.Timeout | null = null;

  constructor(private readonly opts: SessionManagerOptions) {
    this.sweeper = setInterval(() => this.sweep(), 60_000);
    this.sweeper.unref?.();
  }

  private sweep(): void {
    const now = Date.now();
    for (const [id, record] of this.sessions) {
      if (record.expiresAt <= now || now - record.lastSeenAt > this.opts.idleMs) this.sessions.delete(id);
    }
  }

  private cookieValue(record: SessionRecord): string {
    return signPayload({ sid: record.id, exp: Math.floor(record.expiresAt / 1000) }, this.opts.secret, 'session');
  }

  create(input: Omit<SessionRecord, 'id' | 'issuedAt' | 'lastSeenAt' | 'expiresAt' | 'csrfToken'>): SessionRecord {
    if (this.sessions.size >= this.opts.maxSessions) {
      const oldest = this.sessions.keys().next().value;
      if (oldest) this.sessions.delete(oldest);
    }
    const now = Date.now();
    const record: SessionRecord = {
      ...input,
      id: randomToken(18),
      issuedAt: now,
      lastSeenAt: now,
      expiresAt: now + this.opts.absoluteMs,
      csrfToken: randomToken(24),
    };
    this.sessions.set(record.id, record);
    return record;
  }

  /**
   * Rotates the session identifier on privilege change / login completion
   * (fixates nothing, defeats session-fixation and replay of a pre-login id).
   */
  rotate(previousId: string | undefined, input: Omit<SessionRecord, 'id' | 'issuedAt' | 'lastSeenAt' | 'expiresAt' | 'csrfToken'>): SessionRecord {
    if (previousId) this.sessions.delete(previousId);
    return this.create(input);
  }

  find(id: string): SessionRecord | undefined {
    const record = this.sessions.get(id);
    if (!record) return undefined;
    const now = Date.now();
    if (record.expiresAt <= now) {
      this.sessions.delete(id);
      return undefined;
    }
    if (now - record.lastSeenAt > this.opts.idleMs) {
      this.sessions.delete(id);
      return undefined;
    }
    record.lastSeenAt = now;
    return record;
  }

  destroy(id: string): void {
    this.sessions.delete(id);
  }

  destroyForUser(userId: string): number {
    let removed = 0;
    for (const [id, record] of this.sessions) {
      if (record.userId === userId) {
        this.sessions.delete(id);
        removed += 1;
      }
    }
    return removed;
  }

  setCookies(res: Response, record: SessionRecord): void {
    const maxAgeSeconds = Math.floor((record.expiresAt - Date.now()) / 1000);
    const cookies = [
      serializeCookie(this.opts.cookieName, this.cookieValue(record), { maxAgeSeconds, secure: this.opts.secure }),
      // Readable by JS on purpose: the SPA must attach it as a header.
      serializeCookie(this.opts.csrfCookieName, record.csrfToken, { maxAgeSeconds, secure: this.opts.secure, httpOnly: false }),
    ];
    res.setHeader('Set-Cookie', cookies);
  }

  clearCookies(res: Response): void {
    res.setHeader('Set-Cookie', [
      serializeCookie(this.opts.cookieName, '', { maxAgeSeconds: 0, secure: this.opts.secure }),
      serializeCookie(this.opts.csrfCookieName, '', { maxAgeSeconds: 0, secure: this.opts.secure, httpOnly: false }),
    ]);
  }

  readCookie(req: Request): { id?: string; invalid?: boolean } {
    const cookies = parseCookies(req.headers.cookie);
    const raw = cookies[this.opts.cookieName];
    if (!raw) return {};
    const verified = verifyPayload<{ sid: string }>(raw, this.opts.secret, 'session');
    if (!verified.ok || !verified.payload?.sid) return { invalid: true };
    return { id: verified.payload.sid };
  }

  get size(): number {
    return this.sessions.size;
  }

  dispose(): void {
    if (this.sweeper) clearInterval(this.sweeper);
    this.sweeper = null;
    this.sessions.clear();
  }
}

/* ------------------------------- middleware ------------------------------- */

export interface AuthContext {
  manager: SessionManager;
  csrfCookieName: string;
}

/** Attaches `req.session` when a valid cookie is present; never throws. */
export function attachSession(ctx: AuthContext): RequestHandler {
  return (req, _res, next) => {
    req.session = null;
    const { id, invalid } = ctx.manager.readCookie(req);
    if (invalid) {
      audit.log('auth.session.invalid', 'Rejected a session cookie with a bad signature', { req, severity: 'warning' });
      return next();
    }
    if (!id) return next();
    const record = ctx.manager.find(id);
    if (record) {
      req.session = record;
      req.csrfToken = record.csrfToken;
    } else {
      audit.log('auth.session.expired', 'Session no longer valid (idle or absolute timeout reached)', { req, severity: 'notice' });
    }
    return next();
  };
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Same-site/Origin gate + double-submit CSRF token for state-changing calls.
 * Only enforced when a session cookie is in play (unauthenticated public
 * endpoints have no ambient authority to abuse).
 */
export function requireCsrf(ctx: AuthContext & { isProduction?: boolean }): RequestHandler {
  return (req, res, next) => {
    if (!UNSAFE_METHODS.has(req.method)) return next();

    const host = String(req.headers.host ?? '').split(':')[0].toLowerCase();
    const origin = req.headers.origin ? String(req.headers.origin).replace(/^https?:\/\//, '').split(':')[0].toLowerCase() : '';
    const refererHost = req.headers.referer ? safeHost(req.headers.referer) : '';
    const sourceHost = origin || refererHost;

    if (sourceHost && host && sourceHost !== host) {
      audit.log('csrf.rejected', `Cross-site ${req.method} from ${sourceHost} blocked`, { req, severity: 'warning', meta: { origin, referer: refererHost } });
      res.status(403).json({ error: 'Cross-site request blocked', code: 'csrf_origin', requestId: req.requestId });
      return;
    }

    if (!req.session) return next();

    const cookies = parseCookies(req.headers.cookie);
    const cookieToken = cookies[ctx.csrfCookieName] ?? '';
    const headerToken = String(req.headers['x-csrf-token'] ?? '');
    if (!headerToken || !safeEqual(headerToken, req.session.csrfToken) || !safeEqual(cookieToken, headerToken)) {
      audit.log('csrf.rejected', `Missing or invalid CSRF token on ${req.method} ${req.path}`, { req, severity: 'warning' });
      res.setHeader('Cache-Control', 'no-store');
      res.status(403).json({
        error: 'CSRF token missing or invalid',
        code: 'csrf_token',
        hint: 'Send the value of the cc_csrf cookie in the X-CSRF-Token header.',
        requestId: req.requestId,
      });
      return;
    }
    return next();
  };
}

function safeHost(value: string): string {
  try {
    return new URL(value).host.split(':')[0].toLowerCase();
  } catch {
    return '';
  }
}

/** Rejects the request unless an authenticated session exists. */
export function requireAuth(roles?: SessionRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
      res.setHeader('Cache-Control', 'no-store');
      res.status(401).json({
        error: 'Authentication required',
        code: 'unauthenticated',
        message: 'Complete the three-step sign-in to use this service.',
        requestId: req.requestId,
      });
      return;
    }
    if (roles && roles.length > 0 && !roles.includes(req.session.role)) {
      audit.log('authz.denied', `Role '${req.session.role}' is not permitted to ${req.method} ${req.path}`, { req, severity: 'warning' });
      res.setHeader('Cache-Control', 'no-store');
      res.status(403).json({
        error: 'Insufficient privileges',
        code: 'forbidden_role',
        message: 'Your role is not authorised for this action.',
        requestId: req.requestId,
      });
      return;
    }
    return next();
  };
}

/** True when `Origin` names the very site the browser is talking to. */
export function isSameOrigin(originHeader: string, requestHost: string | undefined): boolean {
  if (!requestHost) return false;
  try {
    return new URL(originHeader).host.toLowerCase() === requestHost.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Same-origin enforcement for the API surface: no ambient cross-origin reads.
 *
 * A request whose `Origin` matches the host being addressed is the normal case
 * (the portal calling its own API) and is always allowed — otherwise a strict
 * allowlist would break every deployment whose domain was not pre-configured.
 * The configured list only widens the door for *additional* cross-origin
 * clients; it can never narrow same-origin access.
 */
export function rejectCrossOriginApi(allowedOrigins: string[]): RequestHandler {
  const allow = new Set(allowedOrigins.map((origin) => origin.toLowerCase()));
  return (req, res, next) => {
    const origin = req.headers.origin ? String(req.headers.origin) : undefined;
    if (origin && !allow.has(origin.toLowerCase()) && !isSameOrigin(origin, req.headers.host)) {
      audit.log('authz.denied', `Cross-origin API call from ${origin.slice(0, 80)} blocked`, { req, severity: 'warning' });
      res.status(403).json({ error: 'Origin not allowed', code: 'cors_origin', requestId: req.requestId });
      return;
    }
    if (origin && allow.has(origin.toLowerCase())) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    return next();
  };
}
