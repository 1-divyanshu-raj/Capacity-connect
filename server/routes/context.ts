/**
 * Shared dependency bag for the API routers (built once in `server.ts`).
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../config.js';
import type { AuditLog } from '../security/audit.js';
import type { AuthService } from '../security/auth.js';
import type { SessionManager } from '../security/session.js';

export interface ApiContext {
  config: AppConfig;
  sessions: SessionManager;
  auth: AuthService;
  log: AuditLog;
  limiters: {
    global: RequestHandler;
    auth: RequestHandler;
    aiChat: RequestHandler;
    mcq: RequestHandler;
    certificate: RequestHandler;
    security: RequestHandler;
  };
  requireCsrf: RequestHandler;
  attachSession: RequestHandler;
}
