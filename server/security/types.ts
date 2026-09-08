/**
 * Shared typing for the hardened request pipeline (Express request augmentation).
 */
import type { SessionRecord } from './session.js';

declare module 'express-serve-static-core' {
  interface Request {
    /** Correlation id echoed in responses and audit log entries. */
    requestId: string;
    /** Sanitised, allowlisted body produced by `validateBody`. */
    validated: Record<string, string | number | boolean>;
    /** Verified session attached by `attachSession`/`requireAuth`. */
    session?: SessionRecord | null;
    /** CSRF token bound to the current browsing context. */
    csrfToken?: string;
    /** Epoch millis of arrival, used for latency logging. */
    startedAt: number;
    /** Client address after `trust proxy` resolution (already IP-shaped). */
    clientIp: string;
  }
}

export type SessionRole = 'trainee' | 'trainer' | 'admin';
