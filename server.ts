/**
 * CAPACITY CONNECT - hardened portal server.
 *
 * Functionality is unchanged (same routes, same payloads, same UI); this file
 * now composes a defence-in-depth pipeline in front of it:
 *
 *   transport guards -> request id -> security headers / CSP (nonces) ->
 *   path & method allowlists -> bounded body parsing -> rate limiting /
 *   lockout -> session + CSRF -> role authorisation -> validated handlers ->
 *   generic error envelope -> audit trail.
 *
 * The AI handler bodies live in `server/routes/ai.ts`, authentication in
 * `server/security/auth.ts`, and every knob is resolved once in
 * `server/config.ts`. No third-party security middleware is required, which
 * keeps the dependency graph (and therefore its CVE surface) minimal.
 */
import express, { type NextFunction, type Request as ExRequest, type Response as ExResponse } from 'express';
import http from 'node:http';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { getConfig } from './server/config';
import { AuditLog, audit } from './server/security/audit';
import { AuthService, type AuthOptions } from './server/security/auth';
import { randomToken } from './server/security/crypto';
import {
  extensionOf,
  isPathSafe,
  securityHeaders,
  SERVEABLE_EXTENSIONS,
} from './server/security/headers';
import { clientIp, createRateLimiter, sessionAwareKey, tokenBucketMiddleware } from './server/security/ratelimit';
import { attachSession, rejectCrossOriginApi, requireCsrf, SessionManager } from './server/security/session';
import { assertShallow, ValidationError } from './server/security/validate';
import { createAiRouter } from './server/routes/ai';
import { createAuthRouter } from './server/routes/auth';
import { createCertificateRouter } from './server/routes/certificates';
import { createSecurityRouter } from './server/routes/security';
import type { ApiContext } from './server/routes/context';
import { HtmlShell, sendHtml } from './server/html';

const config = getConfig();

/* -------------------------------------------------------------------------- */
/* bootstrap                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The Vite middleware (unbundled sources, HMR websocket) is only ever mounted
 * when the process is *not* running the production bundle. `DEV_SERVER=true`
 * forces it for tooling; the bundle switch alone is enough for the default
 * `npm start` path, so a missing NODE_ENV cannot expose source.
 */
const devForced = ['true', '1', 'yes'].includes((process.env.DEV_SERVER ?? '').trim().toLowerCase());
const useViteDev = devForced || !config.isProduction;
const app = express();

// Never advertise the framework or the runtime.
app.disable('x-powered-by');
app.disable('etag');
// `simple` keeps the query string parser out of `qs`' nested-object mode,
// closing the prototype-pollution / deep-object DoS class at the framework level.
app.set('query parser', 'simple');
app.set('trust proxy', config.trustProxy);
app.set('case sensitive routing', false);

const log = new AuditLog(config.auditRingSize, config.logLevel);
const sessions = new SessionManager({
  secret: config.secret,
  cookieName: config.sessionCookieName,
  csrfCookieName: config.csrfCookieName,
  idleMs: config.sessionIdleMinutes * 60_000,
  absoluteMs: config.sessionAbsoluteHours * 3_600_000,
  secure: config.enforceSecureCookies,
  maxSessions: Math.min(config.maxTrackedKeys, 50_000),
});
const auth = new AuthService({
  demoMode: config.demoMode,
  credentials: config.credentials,
  demoOtp: config.demoOtp,
  otpTtlSeconds: config.otpTtlSeconds,
  otpMaxAttempts: config.otpMaxAttempts,
  passwordMinLength: config.passwordMinLength,
  secret: config.secret,
  rateLimit: config.rateLimit,
  maxTrackedKeys: config.maxTrackedKeys,
} satisfies AuthOptions);

const limiters = {
  global: createRateLimiter({
    name: 'global',
    windowMs: config.rateLimit.global.windowMs,
    max: config.rateLimit.global.max,
    maxKeys: config.maxTrackedKeys,
    skip: (req) => req.path === '/api/health',
  }),
  auth: createRateLimiter({
    name: 'auth',
    windowMs: config.rateLimit.auth.windowMs,
    max: config.rateLimit.auth.max,
    maxKeys: config.maxTrackedKeys,
    message: 'Too many authentication attempts for this window. Wait a moment before retrying.',
  }),
  aiChat: createRateLimiter({
    name: 'ai-chat',
    windowMs: config.rateLimit.aiChat.windowMs,
    max: config.rateLimit.aiChat.max,
    maxKeys: config.maxTrackedKeys,
    key: sessionAwareKey(config.secret),
  }),
  mcq: createRateLimiter({
    name: 'ai-mcq',
    windowMs: config.rateLimit.mcq.windowMs,
    max: config.rateLimit.mcq.max,
    maxKeys: config.maxTrackedKeys,
    key: sessionAwareKey(config.secret),
  }),
  certificate: createRateLimiter({
    name: 'certificate',
    windowMs: config.rateLimit.certificate.windowMs,
    max: config.rateLimit.certificate.max,
    maxKeys: config.maxTrackedKeys,
    key: sessionAwareKey(config.secret),
  }),
  security: createRateLimiter({
    name: 'security',
    windowMs: config.rateLimit.global.windowMs,
    max: 120,
    maxKeys: config.maxTrackedKeys,
  }),
};

const ctx: ApiContext = {
  config,
  sessions,
  auth,
  log,
  limiters,
  requireCsrf: requireCsrf({ manager: sessions, csrfCookieName: config.csrfCookieName, isProduction: config.isProduction }),
  attachSession: attachSession({ manager: sessions, csrfCookieName: config.csrfCookieName }),
};

/* -------------------------------------------------------------------------- */
/* request plumbing                                                           */
/* -------------------------------------------------------------------------- */

/** Correlation id + arrival timestamp for every request (logs and responses). */
app.use((req: ExRequest, res: ExResponse, next: NextFunction) => {
  req.startedAt = Date.now();
  const incoming = req.headers['x-request-id'];
  req.requestId =
    typeof incoming === 'string' && /^[A-Za-z0-9._-]{8,64}$/.test(incoming) ? incoming : randomToken(8);
  req.clientIp = clientIp(req);
  req.validated = {};
  next();
});

app.use(securityHeaders(config, { isProduction: !useViteDev }));

/** Only the verbs the portal actually implements. */
const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'POST', 'OPTIONS']);
app.use((req: ExRequest, res: ExResponse, next: NextFunction) => {
  if (ALLOWED_METHODS.has(req.method)) return next();
  log.log('input.rejected', `Unsupported HTTP method ${req.method}`, { req, severity: 'warning' });
  res.setHeader('Allow', 'GET, HEAD, POST, OPTIONS');
  res.status(405).json({ error: 'Method not allowed', requestId: req.requestId });
  return undefined;
});

/** Header-size and control-character gate for the raw request line. */
app.use((req: ExRequest, res: ExResponse, next: NextFunction) => {
  const rawUrl = req.originalUrl || req.url || '';
  if (rawUrl.length > 2_048) {
    res.status(414).json({ error: 'Request URI too long', requestId: req.requestId });
    return;
  }
  if (Object.keys(req.headers).length > 40) {
    res.status(431).json({ error: 'Too many request headers', requestId: req.requestId });
    return;
  }
  const userAgent = req.headers['user-agent'];
  if (typeof userAgent === 'string' && userAgent.length > 512) {
    // Truncate rather than reject: some proxies append large markers.
    req.headers['user-agent'] = userAgent.slice(0, 512);
  }
  next();
});

/** Path allowlist for everything that is not an API call. */
app.use((req: ExRequest, res: ExResponse, next: NextFunction) => {
  if (req.path.startsWith('/api/')) return next();
  const check = isPathSafe(req.path, { allowSource: useViteDev });
  if (!check.ok) {
    log.log('path.blocked', `Blocked request path (${check.reason})`, { req, severity: 'warning', meta: { path: req.path.slice(0, 200) } });
    res.status(check.status === 200 ? 404 : check.status).json({ error: 'Not found', requestId: req.requestId });
    return;
  }
  next();
});

/**
 * Bounded, hardened JSON body parsing.
 *
 * - `Content-Type` must be exactly application/json (no form/text smuggling),
 * - the payload is capped at `config.bodyLimitBytes` (default 32 KB),
 * *after* an untrusted-length check on the raw stream,
 * - `__proto__` / `constructor` keys are dropped (prototype pollution),
 * - nesting and array breadth are bounded (parser DoS / memory amplification).
 */
app.use(
  express.json({
    limit: config.bodyLimitBytes,
    type: (req) => /^application\/json\s*(;|$)/i.test(String(req.headers['content-type'] ?? '').trim()),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reviver(this: unknown, key: string, value: any) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined;
      if (typeof value === 'string' && value.length > 400_000) return value.slice(0, 400_000);
      return value;
    },
    strict: true,
  }),
);

/** Rejects structurally hostile bodies before any handler sees them. */
app.use((req: ExRequest, res: ExResponse, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  if (req.is('application/json') === false && req.method !== 'OPTIONS') {
    res.setHeader('Accept', 'application/json');
    res.status(415).json({ error: 'Content-Type must be application/json', code: 'unsupported_media_type', requestId: req.requestId });
    return;
  }
  if (req.body !== undefined && !assertShallow(req.body)) {
    log.log('input.rejected', 'Rejected deeply nested or oversized JSON payload', { req, severity: 'warning' });
    res.status(400).json({ error: 'Payload structure is not supported', code: 'payload_shape', requestId: req.requestId });
    return;
  }
  next();
});

/** Access logging without secrets: method, route shape, status, latency. */
app.use((req: ExRequest, res: ExResponse, next: NextFunction) => {
  if (!req.path.startsWith('/api/')) return next();
  res.on('finish', () => {
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'notice' : 'info';
    if (config.logLevel === 'silent' || config.logLevel === 'error') return;
    if (level === 'info' && config.logLevel !== 'debug' && config.logLevel !== 'info') return;
    log.log('http.request', `${req.method} ${req.path.split('?')[0]} ${res.statusCode}`, {
      req,
      severity: level,
      meta: { ms: Date.now() - (req.startedAt || Date.now()) },
    });
  });
  next();
});

/* -------------------------------------------------------------------------- */
/* API surface                                                                */
/* -------------------------------------------------------------------------- */

const api = express.Router();
api.use(rejectCrossOriginApi(config.corsAllowedOrigins));
api.use(limiters.global);
api.use(ctx.attachSession);
api.use((req: ExRequest, res: ExResponse, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, HEAD, POST, OPTIONS');
    res.status(204).end();
    return;
  }
  next();
});

// CSRF/origin enforcement for every state-changing API call (the token is only
// required once a session exists, so sign-in itself stays reachable).
api.use(ctx.requireCsrf);

api.use(createSecurityRouter(ctx));
api.use('/auth', createAuthRouter(ctx));
api.use('/certificates', createCertificateRouter(ctx));
api.use(
  createAiRouter({
    config,
    upstreamLimiter: tokenBucketMiddleware({
      capacity: Math.max(3, Math.floor(config.rateLimit.aiChat.max / 2)),
      refillPerMinute: config.rateLimit.aiChat.max,
      name: 'gemini-budget',
    }),
  }),
);

// Anything else under /api is a deliberate 404 (never the SPA shell), so that
// probing cannot confuse "route exists" with "route returns HTML".
api.use((req: ExRequest, res: ExResponse) => {
  res.status(404).json({ error: 'Endpoint not found', code: 'not_found', requestId: req.requestId });
});

app.use('/api', api);

/* -------------------------------------------------------------------------- */
/* client delivery                                                            */
/* -------------------------------------------------------------------------- */

const distPath = path.resolve(process.cwd(), 'dist');
const shell = new HtmlShell(path.join(distPath, 'index.html'));

async function startServer(): Promise<void> {
  let server: http.Server | null = null;

  if (useViteDev) {
    /**
     * Dev / preview mode: the Vite middleware is embedded, so it must be given
     * the same boundaries the hardened production path enforces.
     */
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Explicit host allowlist defeats DNS rebinding; wildcard is never used.
        allowedHosts: config.allowedHosts,
        fs: { strict: true, allow: [process.cwd()] },
        cors: false,
        // Honour the repo's DISABLE_HMR switch (see vite.config.ts) and otherwise
        // inherit the configured HMR settings - never widen them here.
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
      logLevel: 'warn',
    });
    app.use(vite.middlewares);
  } else {
    if (!shell.exists()) {
      log.log('config.warning', 'dist/index.html is missing - run `npm run build` before `npm start`', { severity: 'error' });
    }
    /**
     * Production: hashed assets are served with a long-lived immutable cache
     * entry, but *only* for allowlisted extensions and after the path guard.
     * `index: false` + `redirect: false` stop directory probes and rewrites.
     */
    app.use(
      express.static(distPath, {
        index: false,
        redirect: false,
        // Dotfiles are allowed here because the path guard above already
        // refuses every dot-prefixed request except /.well-known/ (which RFC
        // 9116 requires for security.txt). Keeping the rule in one place means
        // /.git, /.env and ./dist/* stay unreachable while security.txt serves.
        dotfiles: 'allow',
        fallthrough: true,
        maxAge: '1y',
        immutable: true,
        setHeaders: (res: ExResponse, filePath: string) => {
          const ext = path.extname(filePath).toLowerCase();
          if (ext === '.html') {
            res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
            return;
          }
          if (/^\/?assets\//.test(path.relative(distPath, filePath).replace(/\\/g, '/')) === false) {
            // Outside the hashed asset folder: no long-lived caching.
            res.setHeader('Cache-Control', 'public, max-age=300');
          }
          if (ext === '.svg' || ext === '.txt') {
            res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
          }
        },
      }),
    );

    // HTML shell (with a fresh CSP nonce) for the app entry point.
    app.get(['/', '/index.html'], (req: ExRequest, res: ExResponse) => {
      if (!sendHtml(res, config, shell)) {
        res.status(503).type('text/plain').send('Portal assets are not built yet.');
      }
    });
  }

  const next404 = (_req: ExRequest, res: ExResponse) => {
    res.status(404).json({ error: 'Not found', requestId: _req.requestId ?? String(res.getHeader('X-Request-Id') ?? '') });
  };

  /* ----------------------------- SPA fallback ----------------------------- */

  app.get('*', (req: ExRequest, res: ExResponse) => {
    const check = isPathSafe(req.path, { allowSource: useViteDev });
    if (!check.ok) {
      res.status(check.status === 200 ? 404 : check.status).json({ error: 'Not found', requestId: req.requestId });
      return;
    }
    const ext = extensionOf(req.path);
    if (ext && !SERVEABLE_EXTENSIONS[ext]) {
      res.status(404).json({ error: 'Not found', requestId: req.requestId });
      return;
    }
    if (useViteDev) {
      // Vite's own SPA fallback already transforms `/`; anything reaching this
      // handler in dev is a missing asset, so answer with a plain 404.
      next404(req, res);
      return;
    }
    if (!ext || ext === '.html') {
      if (!sendHtml(res, config, shell)) next404(req, res);
      return;
    }
    next404(req, res);
  });

  /* ----------------------------- error envelope ---------------------------- */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use((err: any, req: ExRequest, res: ExResponse, _next: NextFunction) => {
    if (res.headersSent) return;

    if (err instanceof ValidationError) {
      res.status(400).json({ error: 'Invalid request payload', details: err.details.slice(0, 4), requestId: req.requestId });
      return;
    }

    const status: number = typeof err?.status === 'number' ? err.status : typeof err?.statusCode === 'number' ? err.statusCode : 500;

    if (status === 413) {
      res.status(413).json({ error: 'Request body too large', limit: config.bodyLimitBytes, requestId: req.requestId });
      return;
    }
    if (err?.type === 'entity.parse.failed' || status === 400) {
      res.status(400).json({ error: 'Malformed JSON payload', code: 'bad_json', requestId: req.requestId });
      return;
    }

    log.log('app.shutdown', `Unhandled error while serving ${req.method} ${req.path.split('?')[0]}`, {
      req,
      severity: 'error',
      meta: { status, cause: err instanceof Error ? err.message.slice(0, 200) : 'non-error thrown' },
    });
    if (config.logLevel === 'debug') {
      // Local debugging only: never enabled in a deployed environment.
      // eslint-disable-next-line no-console
      console.error(err);
    }
    res.status(500).json({ error: 'The portal could not complete this request.', code: 'internal_error', requestId: req.requestId });
  });

  /* -------------------------------- listen -------------------------------- */

  server = http.createServer(app);
  server.keepAliveTimeout = 5_000;
  server.headersTimeout = 10_000;
  server.requestTimeout = 30_000;
  // Slow-loris / connection-exhaustion ceilings.
  try {
    // Node >= 18.4
    (server as http.Server & { maxRequestsPerSocket?: number }).maxRequestsPerSocket = 100;
  } catch {
    /* older runtimes simply keep the default */
  }
  server.on('clientError', (err: NodeJS.ErrnoException, socket) => {
    if (!socket.destroyed && (err?.code === 'HPE_HEADER_OVERFLOW' || err?.code === 'ECONNRESET')) {
      socket.end('HTTP/1.1 431 Request Header Fields Too Large\r\nConnection: close\r\n\r\n');
    }
    socket.destroy();
  });

  server.listen(config.port, config.host, () => {
    log.log('app.start', `CAPACITY CONNECT listening on http://${config.host}:${config.port}`, {
      severity: 'info',
      meta: {
        env: config.env,
        viteDev: useViteDev,
        demoMode: config.demoMode,
        cookie: config.sessionCookieName,
        csp: config.headers.csp ? (config.isProduction ? 'strict (nonce-based)' : 'dev profile') : 'disabled',
      },
    });
    for (const warning of config.warnings) log.log('config.warning', warning, { severity: 'warning' });
    if (useViteDev) {
      log.log('config.warning', 'Dev mode serves unbundled source and must never be exposed publicly. Build with `npm run build` and run `NODE_ENV=production npm start`.', { severity: 'notice' });
    }
  });

  /* ---------------------------- graceful shutdown --------------------------- */

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.log('app.shutdown', `${signal} received: draining connections`, { severity: 'notice' });
    sessions.dispose();
    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();
    server?.close(() => {
      clearTimeout(force);
      process.exit(0);
    });
    setTimeout(() => server?.closeAllConnections?.(), 8_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Availability guard: a stray rejection must not take the portal down, but it
 * must never be swallowed silently either.
 */
process.on('unhandledRejection', (reason) => {
  audit.log('app.shutdown', 'Unhandled promise rejection captured', {
    severity: 'error',
    meta: { reason: reason instanceof Error ? reason.message.slice(0, 200) : typeof reason },
  });
});
process.on('uncaughtException', (error) => {
  audit.log('app.shutdown', `Uncaught exception: ${error?.message?.slice(0, 200) ?? 'unknown'}`, { severity: 'error' });
  // Give the log a chance to flush, then let the supervisor restart us.
  setTimeout(() => process.exit(1), 250).unref();
});

void startServer();
