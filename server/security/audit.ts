/**
 * Security event audit trail.
 *
 * Pentest/ASVS requirement: security events must be logged with enough context
 * to reconstruct an incident (timestamp, actor, source address, outcome,
 * correlation id) while never recording secrets, credentials or full tokens.
 */
import type { Request } from 'express';
import { clientIp } from './ratelimit.js';

export type AuditSeverity = 'info' | 'notice' | 'warning' | 'error';

export type AuditEvent =
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.login.locked'
  | 'auth.otp.success'
  | 'auth.otp.failure'
  | 'auth.factor.success'
  | 'auth.factor.failure'
  | 'auth.challenge.expired'
  | 'auth.logout'
  | 'auth.session.adopted'
  | 'auth.session.invalid'
  | 'auth.session.expired'
  | 'auth.register.success'
  | 'auth.register.failure'
  | 'auth.demo.credentials'
  | 'authz.denied'
  | 'csrf.rejected'
  | 'ratelimit.blocked'
  | 'input.rejected'
  | 'path.blocked'
  | 'csp.violation'
  | 'certificate.issued'
  | 'certificate.verified'
  | 'gemini.upstream.failure'
  | 'config.warning'
  | 'http.request'
  | 'app.start'
  | 'app.shutdown';

const REDACTED_KEYS = /(password|passwd|secret|token|authorization|cookie|otp|code|apikey|api_key|key)/i;

// eslint-disable-next-line no-control-regex
const UNPRINTABLE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u206F\uFEFF]/g;

/** Single-line, log-injection safe (CR/LF and control characters removed). */
export function sanitizeForLog(value: unknown, max = 300): string {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/[\r\n\t]+/g, ' ').replace(UNPRINTABLE, '');
  return text.slice(0, max);
}

export function redactObject<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (REDACTED_KEYS.test(key)) {
      out[key] = typeof value === 'string' ? `[redacted:len=${value.length}]` : '[redacted]';
    } else if (typeof value === 'string') {
      out[key] = sanitizeForLog(value);
    } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
      out[key] = value;
    } else if (Array.isArray(value)) {
      out[key] = `[array:len=${value.length}]`;
    } else if (value !== undefined) {
      out[key] = '[object]';
    }
  }
  return out;
}

export interface AuditRecord {
  ts: string;
  severity: AuditSeverity;
  event: AuditEvent;
  message: string;
  requestId?: string;
  actor?: string;
  role?: string;
  ip?: string;
  meta?: Record<string, unknown>;
}

export class AuditLog {
  private readonly records: AuditRecord[] = [];
  private readonly levelOrder: Record<AuditSeverity, number> = { info: 10, notice: 20, warning: 30, error: 40 };

  constructor(
    private readonly ringSize: number,
    private readonly level: 'debug' | 'info' | 'warn' | 'error' | 'silent' = 'info',
    private readonly sink: (line: string) => void = (line) => process.stdout.write(`${line}\n`),
  ) {}

  private threshold(): number {
    switch (this.level) {
      case 'debug':
        return 0;
      case 'info':
        return this.levelOrder.info;
      case 'warn':
        return this.levelOrder.warning;
      case 'error':
        return this.levelOrder.error;
      default:
        return Number.POSITIVE_INFINITY;
    }
  }

  log(event: AuditEvent, message: string, extra: { severity?: AuditSeverity; req?: Request; actor?: string; meta?: Record<string, unknown> } = {}): void {
    const severity: AuditSeverity = extra.severity ?? (event.includes('failure') || event.includes('denied') || event.includes('blocked') ? 'warning' : 'info');
    const record: AuditRecord = {
      ts: new Date().toISOString(),
      severity,
      event,
      message: sanitizeForLog(message, 240),
      requestId: extra.req?.requestId,
      actor: extra.actor ? sanitizeForLog(extra.actor, 96) : extra.req?.session?.username ? sanitizeForLog(extra.req.session.username, 96) : undefined,
      role: extra.req?.session?.role,
      ip: extra.req ? clientIp(extra.req) : undefined,
      meta: extra.meta ? redactObject(extra.meta) : undefined,
    };

    this.records.push(record);
    if (this.records.length > this.ringSize) this.records.splice(0, this.records.length - this.ringSize);

    if (this.levelOrder[severity] >= this.threshold()) {
      const flat = [
        `[security] ${record.ts}`,
        severity.toUpperCase().padEnd(7),
        record.event.padEnd(28),
        record.message,
        record.requestId ? `id=${record.requestId}` : '',
        record.actor ? `actor=${record.actor}` : '',
        record.role ? `role=${record.role}` : '',
        record.ip ? `ip=${record.ip}` : '',
        record.meta && Object.keys(record.meta).length > 0 ? `meta=${JSON.stringify(record.meta)}` : '',
      ]
        .filter(Boolean)
        .join(' ');
      this.sink(flat);
    }
  }

  recent(limit = 100, severityFilter?: AuditSeverity): AuditRecord[] {
    const slice = severityFilter ? this.records.filter((r) => r.severity === severityFilter) : this.records;
    return slice.slice(-Math.min(Math.max(1, limit), 500)).reverse();
  }

  counts(): Record<AuditSeverity, number> {
    const totals: Record<AuditSeverity, number> = { info: 0, notice: 0, warning: 0, error: 0 };
    for (const record of this.records) totals[record.severity] += 1;
    return totals;
  }
}

export const audit = new AuditLog(500, 'info');
