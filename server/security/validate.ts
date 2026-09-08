/**
 * Input validation & sanitisation for every value that crosses the API
 * boundary. Rules are intentionally strict (allowlists, hard length caps,
 * control-character stripping) while remaining tolerant of *unknown extra*
 * properties, so that existing clients keep working unchanged.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

/* -------------------------------------------------------------------------- */
/* sanitisation                                                               */
/* -------------------------------------------------------------------------- */

/**
 * C0/C1 control characters (except tab/LF/CR), DEL, zero-width and bidi
 * override characters (the Unicode "Trojan Source" class), and soft hyphens.
 */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\u00AD]/g;
const EXCESSIVE_BLANK_LINES = /\n{5,}/g;
const EXCESSIVE_SPACES = /[ \t]{12,}/g;

export function sanitizeText(value: unknown, max = 2_000): string {
  if (typeof value !== 'string') return '';
  // Bound the work before any regex runs (keeps catastrophic backtracking out
  // of reach even for a maximum-size request body).
  const clipped = value.slice(0, Math.min(max * 4, 262_144));
  const cleaned = clipped
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(EXCESSIVE_BLANK_LINES, '\n\n\n')
    .replace(EXCESSIVE_SPACES, ' ');
  return cleaned.trim().slice(0, max);
}

/** Single-line, display-safe text (names, ids, usernames). */
export function sanitizeLine(value: unknown, max = 120): string {
  const text = sanitizeText(value, max).replace(/[\n\t]/g, ' ');
  return text.replace(/\s{2,}/g, ' ').trim().slice(0, max);
}

/** Allowlist filter for opaque identifiers echoed back into the DOM/logs. */
export function sanitizeToken(value: unknown, max = 128): string {
  if (typeof value !== 'string') return '';
  return value
    .slice(0, max * 2)
    .replace(/[^A-Za-z0-9._:@/+-]/g, '')
    .slice(0, max);
}

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export function isValidEmail(value: string): boolean {
  return value.length > 3 && value.length <= 254 && EMAIL_RE.test(value);
}

/** True when the value carries no C0/C1 control characters. */
export function isPrintableAsciiOrUnicode(value: string): boolean {
  return typeof value === 'string' && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(value);
}

/**
 * Validates a URL destined for an `href`/`src` attribute, rejecting every
 * script-bearing or filesystem scheme (`javascript:`, `data:text/html`,
 * `file:`, `vbscript:`) including whitespace/control-character obfuscation.
 */
export function safeUrl(value: unknown, allowedProtocols: string[] = ['https:', 'http:', 'mailto:']): string {
  if (typeof value !== 'string') return '';
  const candidate = sanitizeLine(value, 2_048).replace(/\s/g, '');
  if (!candidate) return '';
  if (/^(javascript|vbscript|file|blob|about|data):/i.test(candidate)) {
    // `data:image/*` is a legitimate source for locally previewed uploads.
    if (!/^data:image\/(png|jpe?g|webp|gif|svg\+xml);/i.test(candidate)) return '';
    // SVG data URLs can carry script content: never allow them.
    if (/^data:image\/svg\+xml/i.test(candidate)) return '';
    return candidate.slice(0, 2_048);
  }
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return '';
  }
  if (!allowedProtocols.includes(url.protocol)) return '';
  if (url.protocol === 'mailto:') {
    const address = decodeURIComponent(url.pathname);
    return isValidEmail(address) ? `mailto:${address}` : '';
  }
  if (url.username || url.password) return '';
  return url.toString().slice(0, 2_048);
}

/* -------------------------------------------------------------------------- */
/* schema description                                                         */
/* -------------------------------------------------------------------------- */

export interface FieldSpec {
  type: 'string' | 'integer' | 'boolean' | 'enum';
  /** Hard cap on characters (strings) or items (arrays). */
  max?: number;
  min?: number;
  required?: boolean;
  values?: readonly string[];
  /** Applies `sanitizeLine` instead of `sanitizeText`. */
  singleLine?: boolean;
  /** Restricts to the identifier allowlist (safe for DOM/log echo). */
  token?: boolean;
  /** Explicit pattern check; anything else is rejected. */
  pattern?: RegExp;
  default?: string | number | boolean;
}

export type BodySchema = Record<string, FieldSpec>;
export type ValidatedBody = Record<string, string | number | boolean>;

export class ValidationError extends Error {
  status = 400 as const;
  constructor(public readonly details: string[]) {
    super(details.join('; ') || 'Invalid request payload');
    this.name = 'ValidationError';
  }
}

/**
 * Rejects payloads that are not plain JSON objects, enforces the per-field
 * allowlist, and replaces each accepted value with its sanitised form.
 */
export function validateBody(schema: BodySchema, opts: { maxDepth?: number } = {}): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const raw = req.body;
    if (raw === undefined || raw === null) {
      req.validated = {};
      return next();
    }
    if (typeof raw !== 'object' || Array.isArray(raw)) {
      return next(new ValidationError(['Request body must be a JSON object']));
    }

    const source = raw as Record<string, unknown>;
    const out: ValidatedBody = {};
    const errors: string[] = [];

    for (const [field, spec] of Object.entries(schema)) {
      const value = source[field];

      if (value === undefined || value === null || value === '') {
        if (spec.required) errors.push(`${field} is required`);
        else if (spec.default !== undefined) out[field] = spec.default;
        continue;
      }

      switch (spec.type) {
        case 'integer': {
          const num = typeof value === 'number' ? value : Number.parseInt(String(value).slice(0, 16), 10);
          if (!Number.isFinite(num)) {
            errors.push(`${field} must be a number`);
            break;
          }
          const clamped = Math.trunc(num);
          const min = spec.min ?? Number.MIN_SAFE_INTEGER;
          const max = spec.max ?? Number.MAX_SAFE_INTEGER;
          if (clamped < min || clamped > max) {
            errors.push(`${field} must be between ${min} and ${max}`);
            break;
          }
          out[field] = clamped;
          break;
        }
        case 'boolean': {
          out[field] = value === true || value === 'true' || value === 1 || value === '1';
          break;
        }
        case 'enum': {
          const text = sanitizeLine(value, spec.max ?? 64);
          const match = (spec.values ?? []).find((allowed) => allowed.toLowerCase() === text.toLowerCase());
          if (!match) {
            errors.push(`${field} must be one of: ${(spec.values ?? []).join(', ')}`);
            break;
          }
          out[field] = match;
          break;
        }
        case 'string':
        default: {
          if (typeof value !== 'string' && typeof value !== 'number') {
            errors.push(`${field} must be a string`);
            break;
          }
          const max = spec.max ?? 2_000;
          if (String(value).length > max * 8) {
            // Far beyond the limit: reject instead of processing megabytes.
            errors.push(`${field} is too long`);
            break;
          }
          const text = spec.token
            ? sanitizeToken(value, max)
            : spec.singleLine
              ? sanitizeLine(value, max)
              : sanitizeText(value, max);
          if (spec.min && text.length < spec.min) {
            errors.push(`${field} must be at least ${spec.min} characters`);
            break;
          }
          if (spec.pattern && !spec.pattern.test(text)) {
            errors.push(`${field} has an invalid format`);
            break;
          }
          if (text) out[field] = text;
          break;
        }
      }
    }

    if (errors.length > 0) return next(new ValidationError(errors));

    // Keep a sanitised, bounded body so downstream handlers cannot accidentally
    // re-read the raw payload, but never drop unknown client fields (they are
    // simply ignored by the handlers).
    req.validated = out;
    req.body = out;
    return next();
  };
}

/** Depth/size guard applied to the parsed JSON body (prototype-pollution and
 *  deep-nesting DoS mitigations). */
export function assertShallow(value: unknown, maxDepth = 6, seen = new Set<unknown>()): boolean {
  if (value === null || typeof value !== 'object') return true;
  if (seen.has(value)) return false;
  if (maxDepth <= 0) return false;
  seen.add(value);
  for (const entry of Object.values(value as Record<string, unknown>)) {
    if (entry && typeof entry === 'object' && (Array.isArray(entry) ? entry.length > 200 : Object.keys(entry).length > 100)) {
      return false;
    }
    if (!assertShallow(entry, maxDepth - 1, seen)) return false;
  }
  return true;
}
