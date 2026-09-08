/**
 * Certificate issuance / verification.
 *
 * The portal previously minted certificate numbers from `Date.now()` inside
 * the browser: sequential, guessable, and trivially forgeable (an evaluator or
 * an auditor could not tell a real certificate from a hand-typed one). Ids are
 * now issued by the server, are non-sequential, and carry an HMAC integrity
 * digest that can be verified through this router.
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ApiContext } from './context.js';
import { audit } from '../security/audit.js';
import { requireAuth } from '../security/session.js';
import { validateBody } from '../security/validate.js';

export function createCertificateRouter(ctx: ApiContext): Router {
  const router = Router();
  const { config } = ctx;

  router.post(
    '/issue',
    requireAuth(['trainee', 'trainer', 'admin']),
    ctx.limiters.certificate,
    ctx.requireCsrf,
    validateBody({
      courseTitle: { type: 'string', required: true, max: config.limits.courseTitle, singleLine: true, min: 2 },
      score: { type: 'integer', required: true, min: 0, max: 100 },
      completedDate: { type: 'string', max: 40, singleLine: true },
    }),
    (req: Request, res: Response) => {
      const { courseTitle, score, completedDate } = req.validated as { courseTitle: string; score: number; completedDate?: string };
      const issued = ctx.auth.issueCertificate({
        subject: req.session?.displayName ?? req.session?.username ?? 'unattributed',
        courseTitle,
        score,
        traineeId: req.session?.userId ?? 'unknown',
      });

      audit.log('certificate.issued', 'Competency certificate serial issued', {
        req,
        actor: req.session?.username,
        meta: { certificateId: issued.certificateId, score, courseTitle: courseTitle.slice(0, 60), completedDate: completedDate ?? null },
      });

      res.setHeader('Cache-Control', 'no-store');
      res.json({ ...issued, subject: req.session?.displayName ?? null, courseTitle, score });
    },
  );

  router.get(
    '/verify',
    requireAuth(['trainee', 'trainer', 'admin']),
    ctx.limiters.security,
    (req: Request, res: Response) => {
      const certificateId = typeof req.query.certificateId === 'string' ? req.query.certificateId : '';
      const integrity = typeof req.query.integrity === 'string' ? req.query.integrity : '';
      if (!certificateId || certificateId.length > 64) {
        res.status(400).json({ error: 'certificateId query parameter is required', requestId: req.requestId });
        return;
      }
      const result = ctx.auth.verifyCertificate(certificateId, integrity || undefined);
      audit.log('certificate.verified', `Certificate lookup ${result.valid ? 'matched' : 'rejected'} (${result.valid ? 'ok' : result.reason})`, {
        req,
        actor: req.session?.username,
        severity: result.valid ? 'info' : 'warning',
      });
      res.setHeader('Cache-Control', 'no-store');
      res.json({ valid: result.valid, reason: result.valid ? undefined : result.reason ?? 'unknown', checkedAt: new Date().toISOString() });
    },
  );

  return router;
}
