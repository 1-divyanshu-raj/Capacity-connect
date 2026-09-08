/**
 * Response header hardening for CAPACITY CONNECT.
 *
 * One place builds Content-Security-Policy (with a per-request nonce for the
 * HTML shell) plus every other defensive header a penetration-test checklist
 * looks for. The dev profile only relaxes what the Vite middleware genuinely
 * needs (inline HMR bootstrap + websocket); the production profile ships
 * without `unsafe-inline` / `unsafe-eval`.
 */
import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { AppConfig } from '../config.js';

/**
 * Every third-party origin the portal legitimately loads. Tightened from the
 * previous wildcard `https:` allowlist so a lookalike host can no longer be
 * used to exfiltrate data or inject script.
 */
const FONT_SOURCES = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
const IMAGE_SOURCES = ['https://images.unsplash.com', 'data:', 'blob:'];

export interface CspOptions {
  isProduction: boolean;
  nonce?: string;
  frameAncestors: string;
  frameSrc: string[];
  connectExtra: string[];
}

export function buildCsp(opts: CspOptions): string {
  // Production HTML is served through `renderHtmlDocument`, which stamps a
  // fresh nonce on the single module script tag, so neither `unsafe-inline`
  // nor `unsafe-eval` is required anywhere in the shipped bundle.
  const scriptSrc = opts.isProduction
    ? ["'self'", ...(opts.nonce ? [`'nonce-${opts.nonce}'`] : [])]
    : ["'self'", "'unsafe-inline'", "'unsafe-eval'"];

  const styleSrc = opts.isProduction
    ? ["'self'", ...FONT_SOURCES]
    : ["'self'", "'unsafe-inline'", ...FONT_SOURCES];

  const connectSrc = [
    "'self'",
    // Websocket is only needed for the dev HMR channel.
    ...(opts.isProduction ? [] : ['ws:', 'wss:']),
    ...opts.connectExtra,
  ];

  const directives: Array<[string, string[]]> = [
    ['default-src', ["'self'"]],
    ['base-uri', ["'self'"]],
    ['object-src', ["'none'"]],
    ['embed-src', ["'none'"]],
    ['frame-src', ["'self'", ...opts.frameSrc]],
    ['child-src', ["'self'"]],
    ['worker-src', ["'self'", 'blob:']],
    ['script-src', scriptSrc],
    ['style-src', styleSrc],
    ['img-src', ["'self'", ...IMAGE_SOURCES]],
    ['font-src', ["'self'", 'data:', ...FONT_SOURCES]],
    ['manifest-src', ["'self'"]],
    ['form-action', ["'self'"]],
    ['frame-ancestors', [opts.frameAncestors]],
    ['upgrade-insecure-requests', []],
    ['report-uri', ['/api/security/csp-report']],
  ];

  return directives
    .map(([name, values]) => (values.length > 0 ? `${name} ${values.join(' ')}` : name))
    .join('; ');
}

export function newNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/** Percent-decodes repeatedly (defeats double-encoding) without throwing. */
export function safeDecode(value: string): string {
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}

/**
 * Files that must never be reachable over HTTP - in **either** mode - even if
 * they end up inside the public directory or the Vite dev server would happily
 * hand them out from the project root:
 *   - the server implementation and its source maps (full logic disclosure),
 *   - environment / lock / tsconfig files (dependency & secret disclosure),
 *   - VCS, IDE and tooling metadata, backup/temp editor files.
 */
const PROTECTED_PATHS = [
  /^\/server(\.ts|\.cjs|\.js)?(\/|$)/i,
  /^\/scripts(\/|$)/i,
  /^\/dist(\/|$)/i,
  /(^|\/|\.)package(-lock)?\.json$/i,
  /^\/tsconfig/i,
  /^\/vite\.config\./i,
  /^\/\.?env(\.|$)/i,
  /^\/(\.npmrc|\.yarnrc|\.htaccess|\.DS_Store)$/i,
  /(^|\/)(\.git|\.svn|\.hg|\.vscode|\.idea|\.vercel)(\/|$)/i,
  /\.(pem|key|p12|pfx|crt|der|sqlite|sqlite3|env|npmrc|lock|log)$/i,
  /\.(bak|old|orig|rej|swp|swo|dist|map)$/i,
];

/**
 * Requests the Vite dev pipeline needs to function (module graph, pre-bundled
 * deps, HMR client). They are still subject to `PROTECTED_PATHS`, so dev mode
 * serves application code but never the server or its configuration.
 */
const VITE_DEV_INTERNAL = /^(\/(src|@vite|@vite-plugin|@id|@fs|@react-refresh|__vite|node_modules)(\/|$)|\/index\.html(\?|$))/i;

export interface PathSafetyResult {
  ok: boolean;
  status: 200 | 400 | 403 | 404 | 414;
  reason: string;
}

/**
 * Guards the static handler (and the dev middleware) against traversal,
 * dot-file disclosure, source/secret disclosure, backup files and over-long
 * request lines (resource-exhaustion probes).
 *
 * `allowSource` keeps the Vite dev pipeline working - `/src/*.tsx` and
 * `/node_modules/.vite/deps/*` are legitimately requested by the browser -
 * while the `PROTECTED_PATHS` list still blocks the server, its maps, and the
 * environment/lock files that would otherwise be readable from the root.
 */
export function isPathSafe(urlPath: string, options: { allowSource?: boolean } = {}): PathSafetyResult {
  const reject = (status: PathSafetyResult['status'], reason: string): PathSafetyResult => ({ ok: false, status, reason });

  if (typeof urlPath !== 'string' || urlPath.length === 0) return reject(404, 'empty-path');
  if (urlPath.length > 2_048) return reject(414, 'uri-too-long');
  if (urlPath.includes('\0') || urlPath.includes('%00')) return reject(400, 'null-byte');
  if (/[\x01-\x08\x0a-\x1f\x7f]/.test(urlPath)) return reject(400, 'control-character');

  const decoded = safeDecode(urlPath);
  if (decoded.includes('..') || decoded.includes('~') || decoded.includes('\\')) return reject(400, 'traversal');
  if (!decoded.startsWith('/') || decoded.includes('//')) return reject(400, 'malformed-path');

  const normalized = decoded.replace(/\?.*$/, '').replace(/#.*$/, '');
  // `/@fs/<absolute path>` (dev) must be judged on the path it resolves to;
  // Vite's own `fs.strict` boundary (configured in server.ts) covers the rest.
  const fsTarget = normalized.startsWith('/@fs/') ? normalized.slice('/@fs'.length) : '';
  for (const candidate of [normalized, fsTarget]) {
    if (!candidate) continue;
    for (const pattern of PROTECTED_PATHS) {
      if (pattern.test(candidate)) return reject(404, 'protected-path');
    }
  }

  // `/.well-known/*` is a deliberate, public exception (RFC 8615 / RFC 9116).
  const isWellKnown = normalized.startsWith('/.well-known/');
  const isViteInternal = options.allowSource === true && VITE_DEV_INTERNAL.test(normalized);
  if (!isWellKnown && !isViteInternal && /(^|\/)\.[^/]/.test(normalized)) return reject(404, 'dotfile');

  if (options.allowSource) return { ok: true, status: 200, reason: 'allowed-dev' };

  // Production: only hashed build output and copied public assets exist.
  if (/^\/(src|test|tests|server|scripts)(\/|$)/.test(normalized)) return reject(404, 'source-path');
  return { ok: true, status: 200, reason: 'allowed' };
}

/** Media types we are willing to serve from the public directory. */
export const SERVEABLE_EXTENSIONS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export function extensionOf(value: string): string {
  const clean = value.split('?')[0].split('#')[0];
  const dot = clean.lastIndexOf('.');
  if (dot === -1) return '';
  return clean.slice(dot).toLowerCase().slice(0, 12);
}

/** Middleware: applies every defensive header and strips disclosure headers. */
export function securityHeaders(config: AppConfig, options: { isProduction?: boolean } = {}) {
  const isProduction = options.isProduction ?? config.isProduction;
  const reportOnly = ['true', '1', 'yes'].includes((process.env.CSP_REPORT_ONLY || 'false').trim().toLowerCase());
  const csp = buildCsp({
    isProduction,
    frameAncestors: config.frameAncestors,
    frameSrc: config.frameSrcList,
    connectExtra: config.connectExtraSources,
  });

  return (req: Request, res: Response, next: NextFunction) => {
    if (config.headers.csp) {
      res.setHeader(reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy', csp);
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', config.headers.referrerPolicy);
    // Legacy clickjacking guard. Browsers that understand CSP3 prefer
    // `frame-ancestors` (which carries the explicit allowlist) and ignore this.
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cross-Origin-Opener-Policy', config.headers.crossOriginOpener);
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Origin-Agent-Cluster', '?1');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('Permissions-Policy', config.headers.permissionPolicy);
    if (config.headers.robotsNoIndex) res.setHeader('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');

    // HSTS only where it is honoured (TLS-terminated requests); sending it over
    // plain HTTP is ignored by browsers and confuses scanners.
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', `max-age=${config.headers.hstsSeconds}; includeSubDomains; preload`);
    }

    res.removeHeader('X-Powered-By');
    res.removeHeader('X-Runtime');
    res.removeHeader('X-Version');
    res.setHeader('X-Request-Id', req.requestId);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Vary', 'Cookie, Origin');
    next();
  };
}
