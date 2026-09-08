/**
 * CAPACITY CONNECT - hardened runtime configuration.
 *
 * Every security-relevant knob of the portal is resolved here, once, at boot
 * time, and validated so that a misconfigured environment fails loudly instead
 * of silently running in a weaker mode.
 *
 * No secrets have defaults in the client bundle: credentials/OTP live in the
 * server environment only (see SECURITY.md for the deployment matrix).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/* -------------------------------------------------------------------------- */
/* helpers                                                                    */
/* -------------------------------------------------------------------------- */

const isTruthy = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const intFrom = (value: string | undefined, fallback: number, min: number, max: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const listFrom = (value: string | undefined, fallback: string[]): string[] => {
  if (!value) return fallback;
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= 256)
    .slice(0, 64);
  return items.length > 0 ? items : fallback;
};

/**
 * Loads a `.env` file into process.env without overriding values that are
 * already present (real environment always wins over the file).
 *
 * Implemented locally so that the hardened runtime keeps a zero-dependency
 * attack surface: the dotenv package is still used by `server.ts` for parity,
 * but the security layer never depends on a third-party parser.
 */
function loadDotEnvFile(explicitPath?: string): void {
  const file = explicitPath || path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(file)) return;

  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8').slice(0, 64 * 1024);
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

/* -------------------------------------------------------------------------- */
/* configuration                                                              */
/* -------------------------------------------------------------------------- */

export type RuntimeEnv = 'development' | 'production' | 'test';

const warnings: string[] = [];

let bootstrapped = false;

export interface AppConfig {
  env: RuntimeEnv;
  isProduction: boolean;
  isTest: boolean;
  port: number;
  host: string;

  /** Demo affordances (auto-fill buttons, seeded credentials, OTP echo). */
  demoMode: boolean;
  /** Credentials accepted for the three demo personas (server side only). */
  credentials: Record<'trainee' | 'trainer' | 'admin', string>;
  /** Static second factor used when no real OTP delivery channel exists. */
  demoOtp: string;
  otpTtlSeconds: number;
  otpMaxAttempts: number;

  sessionCookieName: string;
  csrfCookieName: string;
  sessionIdleMinutes: number;
  sessionAbsoluteHours: number;
  passwordMinLength: number;

  secret: string;
  trustProxy: number | false;
  enforceSecureCookies: boolean;

  /** Host names accepted by the dev/preview server (DNS-rebinding allowlist). */
  allowedHosts: string[];
  /** Origins allowed to frame the portal (clickjacking allowlist). */
  frameAncestors: string;
  /** Additional parent origins allowed to frame the portal. */
  frameAncestorSourceList: string[];
  /** Extra connect targets for the CSP (empty keeps data flows same-origin). */
  connectExtraSources: string[];
  /** Third-party origins allowed to serve frames (e.g. course videos). */
  frameSrcList: string[];
  /** Cross-origin API consumers; empty means strictly same-origin. */
  corsAllowedOrigins: string[];

  bodyLimitBytes: number;
  rateLimit: {
    global: { windowMs: number; max: number };
    aiChat: { windowMs: number; max: number };
    mcq: { windowMs: number; max: number };
    auth: { windowMs: number; max: number };
    certificate: { windowMs: number; max: number };
    loginMaxFailures: number;
    loginLockoutMs: number;
  };

  /** Max characters accepted per user-supplied text field (server side). */
  limits: {
    username: number;
    password: number;
    message: number;
    topic: number;
    sourceText: number;
    difficulty: number;
    courseTitle: number;
    fullName: number;
    email: number;
    institute: number;
  };

  /** Response header hardening toggles. */
  headers: {
    csp: boolean;
    hstsSeconds: number;
    permissionPolicy: string;
    referrerPolicy: string;
    crossOriginOpener: string;
    robotsNoIndex: boolean;
  };

  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  auditRingSize: number;

  /** In-memory registries are bounded so abusive traffic cannot grow RAM. */
  maxTrackedKeys: number;

  warnings: string[];
}

let config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (config) return config;
  config = buildConfig();
  return config;
}

/** Test hook: allows suites to rebuild the configuration from a new env. */
export function resetConfigForTests(): void {
  config = null;
  warnings.length = 0;
  bootstrapped = false;
}

function buildConfig(): AppConfig {
  const env = process.env;

  if (!bootstrapped) {
    bootstrapped = true;
    loadDotEnvFile(env.DOTENV_CONFIG_PATH);
  }

  const nodeEnv = (env.NODE_ENV || 'development').trim().toLowerCase();
  /**
   * Running from the esbuild bundle (`npm start`) *is* the production path, even
   * on hosts that forget to export NODE_ENV. Without this, a missed env var
   * would silently boot the dev middleware and expose unbundled server source.
   */
  const runningBundled = typeof __CC_BUNDLED__ !== 'undefined' && __CC_BUNDLED__ === true;
  const isProduction = nodeEnv === 'production' || nodeEnv === 'prod' || runningBundled;
  const isTest = nodeEnv === 'test';

  // Demo personas keep the evaluation flow working; `DEMO_MODE=false` turns the
  // portal into a credentials-from-environment-only deployment.
  const demoMode = isTruthy(env.DEMO_MODE, true);

  /* ------------------------------ secrets -------------------------------- */
  let secret = (env.SESSION_SECRET || env.CC_SESSION_SECRET || '').trim();
  if (secret) {
    if (secret.length < 32) {
      const message =
        'SESSION_SECRET is shorter than 32 characters - sessions, CSRF tokens and certificate signatures are weaker than the baseline. Rotate to a 32+ byte random value.';
      if (isProduction) {
        // Refuse to boot with a weak signing key in production.
        throw new Error(`[security] ${message}`);
      }
      warnings.push(message);
    }
    const obviouslyStatic = /^(change|changeme|secret|test|dev|example|your|replace|dummy)/i.test(secret);
    if (obviouslyStatic) {
      const message = 'SESSION_SECRET looks like a placeholder value; generate one with `openssl rand -hex 32`.';
      if (isProduction) throw new Error(`[security] ${message}`);
      warnings.push(message);
    }
  } else {
    // Ephemeral key: sessions and signed certificates die with the process.
    secret = crypto.randomBytes(48).toString('base64url');
    const message = isProduction
      ? 'SESSION_SECRET is not set; an ephemeral key was generated so every deploy restart invalidates sessions and previously issued certificates.'
      : 'SESSION_SECRET is not set; using an ephemeral per-process key (sessions die on restart).';
    if (isProduction) {
      // Not fatal on purpose: an ephemeral key is safe, it just cannot be shared
      // across instances. Surfaced loudly in logs and /api/security/status.
      warnings.push(message);
    } else {
      warnings.push(message);
    }
  }

  /* ---------------------------- credentials ------------------------------ */
  const demoDefaults: Record<'trainee' | 'trainer' | 'admin', string> = {
    trainee: 'Trainee#2026',
    trainer: 'Trainer#2026',
    admin: 'AdminSec#2026',
  };
  const credentials = {
    trainee: (env.TRAINEE_PASSWORD || demoDefaults.trainee).slice(0, 256),
    trainer: (env.TRAINER_PASSWORD || demoDefaults.trainer).slice(0, 256),
    admin: (env.ADMIN_PASSWORD || demoDefaults.admin).slice(0, 256),
  };
  if (!env.ADMIN_PASSWORD && demoMode) {
    warnings.push('ADMIN_PASSWORD is not set: the built-in demo administrator secret is active. Set DEMO_MODE=false and provide a real secret before going live.');
  }

  const demoOtp = (env.DEMO_OTP || '982401').replace(/\D/g, '').slice(0, 8) || '982401';

  /* ------------------------------- cookies ------------------------------- */
  const trustProxyRaw = (env.TRUST_PROXY || '1').trim().toLowerCase();
  const trustProxy: number | false =
    trustProxyRaw === 'false' || trustProxyRaw === 'off' || trustProxyRaw === '0'
      ? false
      : Number.isFinite(Number.parseInt(trustProxyRaw, 10))
        ? Math.min(10, Math.max(0, Number.parseInt(trustProxyRaw, 10)))
        : 1;

  const sessionCookieName = isProduction ? '__Host-cc_session' : 'cc_session';
  const csrfCookieName = isProduction ? '__Host-cc_csrf' : 'cc_csrf';

  /* ------------------------------- network ------------------------------- */
  const allowedHosts = listFrom(env.ALLOWED_HOSTS, [
    'localhost',
    '127.0.0.1',
    '::1',
    '.e2b.app',
    '.vercel.app',
    '.ngrok-free.app',
    '.loca.lt',
  ]);

  const frameAncestorSourceList = listFrom(env.ALLOWED_FRAME_ANCESTORS, []);
  const frameAncestors = ["'self'", ...frameAncestorSourceList].join(' ');

  const connectExtraSources = listFrom(env.CSP_CONNECT_EXTRA, []);
  const frameSrcList = listFrom(env.CSP_FRAME_SRC, [
    'https://www.youtube.com',
    'https://www.youtube-nocookie.com',
    'https://storage.googleapis.com',
  ]);

  const bodyLimitBytes = (() => {
    const raw = (env.BODY_LIMIT || '32kb').trim().toLowerCase();
    const match = /^(\d+(?:\.\d+)?)\s*(b|kb|mb)?$/.exec(raw);
    if (!match) return 32 * 1024;
    const mult = match[2] === 'mb' ? 1024 * 1024 : match[2] === 'kb' || !match[2] ? 1024 : 1;
    const size = Math.round(Number.parseFloat(match[1]) * mult);
    // Never allow an unbounded body: cap at 1 MiB regardless of configuration.
    return Math.min(Math.max(size, 1024), 1024 * 1024);
  })();

  const windowMs = intFrom(env.RATE_LIMIT_WINDOW_MS, 60_000, 5_000, 3_600_000);

  const config: AppConfig = {
    env: isProduction ? 'production' : isTest ? 'test' : 'development',
    isProduction,
    isTest,
    port: intFrom(env.PORT, 3000, 1, 65_535),
    host: (env.HOST || '0.0.0.0').slice(0, 64),

    demoMode,
    credentials,
    demoOtp,
    otpTtlSeconds: intFrom(env.OTP_TTL_SECONDS, 600, 60, 3_600),
    otpMaxAttempts: intFrom(env.OTP_MAX_ATTEMPTS, 5, 1, 20),

    sessionCookieName,
    csrfCookieName,
    sessionIdleMinutes: intFrom(env.SESSION_IDLE_MINUTES, 45, 5, 720),
    sessionAbsoluteHours: intFrom(env.SESSION_ABSOLUTE_HOURS, 12, 1, 72),
    passwordMinLength: intFrom(env.PASSWORD_MIN_LENGTH, 10, 8, 64),

    secret,
    trustProxy,
    enforceSecureCookies: isProduction,

    allowedHosts,
    frameAncestors,
    frameAncestorSourceList,
    connectExtraSources,
    frameSrcList,
    corsAllowedOrigins: listFrom(env.CORS_ALLOWED_ORIGINS, []),

    bodyLimitBytes,
    rateLimit: {
      global: { windowMs, max: intFrom(env.RATE_LIMIT_GLOBAL_MAX, 300, 10, 100_000) },
      aiChat: { windowMs, max: intFrom(env.RATE_LIMIT_AI_MAX, 20, 1, 10_000) },
      mcq: { windowMs, max: intFrom(env.RATE_LIMIT_MCQ_MAX, 10, 1, 10_000) },
      auth: { windowMs, max: intFrom(env.RATE_LIMIT_AUTH_MAX, 10, 1, 1_000) },
      certificate: { windowMs, max: intFrom(env.RATE_LIMIT_CERT_MAX, 30, 1, 1_000) },
      loginMaxFailures: intFrom(env.LOGIN_MAX_FAILURES, 5, 3, 50),
      loginLockoutMs: intFrom(env.LOGIN_LOCKOUT_MS, 15 * 60_000, 60_000, 3_600_000),
    },

    limits: {
      username: 64,
      password: 256,
      message: 4_000,
      topic: 300,
      sourceText: 20_000,
      difficulty: 48,
      courseTitle: 240,
      fullName: 120,
      email: 254,
      institute: 160,
    },

    headers: {
      csp: isTruthy(env.ENABLE_CSP, true),
      hstsSeconds: intFrom(env.HSTS_MAX_AGE, 31_536_000, 0, 63_072_000),
      permissionPolicy:
        env.PERMISSIONS_POLICY ||
        [
          // Camera is required by the Step-3 face/biometric verifiers; scoping it
          // to this origin (instead of `()`) keeps the feature working while still
          // denying every third-party frame embedded in the portal.
          'camera=(self)',
          'microphone=()',
          'geolocation=()',
          'display-capture=()',
          'document-domain=()',
          'usb=()',
          'serial=()',
          'hid=()',
          'clipboard-read=()',
          'clipboard-write=(self)',
          'fullscreen=(self)',
          'payment=()',
          'interest-cohort=()',
          'browsing-topics=()',
          'unload=()',
          'attribution-reporting=()',
        ].join(', '),
      referrerPolicy: env.REFERRER_POLICY || 'strict-origin-when-cross-origin',
      crossOriginOpener: env.CROSS_ORIGIN_OPENER_POLICY || 'same-origin',
      robotsNoIndex: isTruthy(env.ENABLE_NOINDEX, true),
    },

    logLevel: (['debug', 'info', 'warn', 'error', 'silent'].includes((env.LOG_LEVEL || 'info').toLowerCase())
      ? (env.LOG_LEVEL || 'info').toLowerCase()
      : 'info') as AppConfig['logLevel'],
    auditRingSize: intFrom(env.AUDIT_RING_SIZE, 500, 50, 5_000),

    maxTrackedKeys: intFrom(env.MAX_TRACKED_KEYS, 20_000, 1_000, 200_000),

    warnings,
  };

  return config;
}

export const appConfig = new Proxy({} as AppConfig, {
  get(_target, prop: keyof AppConfig) {
    return getConfig()[prop];
  },
});
