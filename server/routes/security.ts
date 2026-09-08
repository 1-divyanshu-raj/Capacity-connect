/**
 * Security-support endpoints: liveness probe, client bootstrap, CSP violation
 * reporting and (role-gated) audit/inspection views.
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ApiContext } from './context.js';
import { audit } from '../security/audit.js';
import { buildCsp } from '../security/headers.js';
import { hasGeminiKey } from '../geminiClient.js';
import { sanitizeLine, sanitizeToken } from '../security/validate.js';

export function createSecurityRouter(ctx: ApiContext): Router {
  const router = Router();
  const { config } = ctx;

  /* --------------------------------- health -------------------------------- */

  router.get('/health', (req: Request, res: Response) => {
    // Liveness only. The previous build disclosed whether an API key was
    // configured, which is reconnaissance material for an unauthenticated
    // caller and therefore moved behind the admin-only status endpoint.
    res.setHeader('Cache-Control', 'no-store');
    res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
  });

  /* ------------------------------ client bootstrap -------------------------- */

  router.get('/security/config', ctx.attachSession, (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      portal: 'CAPACITY CONNECT',
      environment: config.env,
      demoMode: config.demoMode,
      csrf: { header: 'X-CSRF-Token', token: req.session?.csrfToken ?? null },
      passwordPolicy: { minLength: config.passwordMinLength, requireMixedClasses: true },
      session: {
        idleTimeoutMinutes: config.sessionIdleMinutes,
        absoluteTimeoutHours: config.sessionAbsoluteHours,
        cookie: { httpOnly: true, sameSite: 'Strict', secure: config.enforceSecureCookies },
      },
      // Order of the mandatory verification steps enforced by /api/auth/*.
      authFlow: ['password', 'otp', 'biometric'],
      factorByRole: { trainee: 'face', trainer: 'face', admin: 'biometric' },
      limits: {
        requestBodyBytes: config.bodyLimitBytes,
        aiChatPerMinute: config.rateLimit.aiChat.max,
        mcqPerMinute: config.rateLimit.mcq.max,
        authAttemptsPerMinute: config.rateLimit.auth.max,
        loginMaxFailures: config.rateLimit.loginMaxFailures,
        loginLockoutMinutes: Math.round(config.rateLimit.loginLockoutMs / 60_000),
        otpTtlSeconds: config.otpTtlSeconds,
        otpMaxAttempts: config.otpMaxAttempts,
        fileUpload: { maxBytes: 50 * 1024 * 1024, extensions: ['.pdf', '.csv', '.json', '.py', '.ipynb'] },
      },
      uploads: { allowedExtensions: ['.pdf', '.csv', '.json', '.py', '.ipynb'], maxSizeMb: 50 },
      cspEnforced: config.headers.csp,
    });
  });

  router.get('/security/headers', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      'Content-Security-Policy': buildCsp({
        isProduction: config.isProduction,
        frameAncestors: config.frameAncestors,
        frameSrc: config.frameSrcList,
        connectExtra: config.connectExtraSources,
      }),
      'Referrer-Policy': config.headers.referrerPolicy,
      'Permissions-Policy': config.headers.permissionPolicy,
      'Cross-Origin-Opener-Policy': config.headers.crossOriginOpener,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Strict-Transport-Security': `max-age=${config.headers.hstsSeconds}; includeSubDomains; preload (sent on TLS responses only)`,
    });
  });

  /* ------------------------------ csp violation ----------------------------- */

  router.post(
    '/security/csp-report',
    ctx.limiters.security,
    (req: Request, res: Response) => {
      const raw = req.body as { 'csp-report'?: Record<string, unknown> } | undefined;
      const report = (raw && typeof raw === 'object' && raw['csp-report'] ? raw['csp-report'] : (raw as Record<string, unknown> | undefined)) ?? {};
      const blocked = sanitizeLine(report['blocked-uri'] ?? report.blockedURI ?? '', 200);
      const directive = sanitizeToken(report['violated-directive'] ?? report.effectiveDirective ?? '', 120);
      if (blocked.length > 0 || directive.length > 0) {
        audit.log('csp.violation', `CSP violation on ${directive || 'unknown directive'}`, {
          req,
          severity: 'warning',
          meta: { blocked: blocked.slice(0, 120), disposition: sanitizeToken(report['disposition'] ?? '', 16) },
        });
      }
      // Never reflect report contents back to the caller.
      res.status(204).end();
    },
  );

  /* ------------------------- admin-only inspection views ------------------- */

  router.get('/security/events', ctx.attachSession, (req: Request, res: Response) => {
    if (req.session?.role !== 'admin') {
      audit.log('authz.denied', 'Audit stream requested without admin session', { req, severity: 'warning' });
      res.status(403).json({ error: 'Administrator session required', code: 'forbidden_role', requestId: req.requestId });
      return;
    }
    const limit = Math.min(200, Math.max(1, Number.parseInt(String(req.query.limit ?? '50'), 10) || 50));
    res.setHeader('Cache-Control', 'no-store');
    res.json({ events: ctx.log.recent(limit), counts: ctx.log.counts() });
  });

  router.get('/security/status', ctx.attachSession, (req: Request, res: Response) => {
    if (req.session?.role !== 'admin') {
      res.status(403).json({ error: 'Administrator session required', code: 'forbidden_role', requestId: req.requestId });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      environment: config.env,
      gemini: { configured: hasGeminiKey(), model: process.env.GEMINI_MODEL || 'gemini-3.8-flash' },
      sessions: { active: ctx.sessions.size, pendingChallenges: ctx.auth.pendingChallenges },
      demoMode: config.demoMode,
      trustProxy: config.trustProxy,
      configurationWarnings: config.warnings,
      rateLimitWindows: {
        global: config.rateLimit.global,
        aiChat: config.rateLimit.aiChat,
        auth: config.rateLimit.auth,
      },
    });
  });

  return router;
}

