/**
 * Client-side security helpers.
 *
 * These are *defences in depth*, never the authority: every rule mirrored here
 * is enforced again on the server (`server/security/validate.ts`). Their jobs
 * are to stop hostile data that is already in application state (a crafted
 * avatar URL, an uploaded filename, an upstream AI string) from reaching a
 * dangerous DOM sink, and to fail fast on obvious input mistakes.
 */

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\u00AD]/g;

/** Strips control/zero-width/bidi-override characters and caps the length. */
export function safeText(value: unknown, max = 2_000): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\r\n?/g, '\n').replace(CONTROL_CHARS, '').trim().slice(0, max);
}

/** Same as `safeText` but collapses newlines (for names, ids, table cells). */
export function safeLine(value: unknown, max = 160): string {
  return safeText(value, max).replace(/[\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').slice(0, max);
}

/**
 * Only `https`, `http` and `mailto` URLs (plus `data:image` previews) are
 * allowed into `href`/`src`. `javascript:`, `data:text/html`, `file:` and
 * obfuscated variants resolve to the fallback, which callers render as inert.
 */
export function safeUrl(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const candidate = value.replace(/[\s\u0000-\u001F]/g, '').slice(0, 2_048);
  if (!candidate) return fallback;
  if (/^data:image\/(png|jpe?g|webp|gif)$/i.test(candidate)) return candidate;
  let url: URL;
  try {
    url = new URL(candidate, typeof window !== 'undefined' ? window.location.origin : 'https://portal.invalid');
  } catch {
    return fallback;
  }
  if (url.protocol === 'data:' || url.protocol === 'blob:') return fallback;
  if (url.protocol !== 'https:' && url.protocol !== 'http:' && url.protocol !== 'mailto:') return fallback;
  if ((url.protocol === 'https:' || url.protocol === 'http:') && (url.username || url.password)) return fallback;
  return url.toString().slice(0, 2_048);
}

/** Image sources must be TLS (or a local preview) - never a downgrade path. */
export function safeImageUrl(value: unknown, fallback = ''): string {
  const url = safeUrl(value);
  if (!url) return fallback;
  if (url.startsWith('data:')) return url;
  return /^https:/.test(url) ? url : fallback;
}

export function safeMailto(value: unknown): string {
  const url = safeUrl(value);
  return url.startsWith('mailto:') ? url : '';
}

/**
 * Identifiers that end up in state, logs or exported documents. `Math.random`
 * and `Date.now` are predictable (enumerable certificate ids, colliding keys);
 * the WebCrypto generator is what a reviewer expects here.
 */
export function secureId(prefix: string, length = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Only for ancient/insecure contexts; the server never trusts these ids.
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = '';
  for (let i = 0; i < length; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return `${prefix}-${out}`;
}

export function uuid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return secureId('id', 24).replace('-', '');
}

/* ------------------------------- form rules -------------------------------- */

/** Must stay aligned with `config.limits` on the server. */
export const FIELD_LIMITS = {
  username: 64,
  password: 256,
  fullName: 120,
  email: 254,
  institute: 160,
  chatMessage: 4_000,
  topic: 300,
  lessonText: 20_000,
  forumTitle: 240,
  forumBody: 4_000,
  bio: 800,
  freeText: 240,
} as const;

export const UPLOAD_RULES = {
  allowedExtensions: ['.pdf', '.csv', '.json', '.py', '.ipynb'] as readonly string[],
  maxBytes: 50 * 1024 * 1024,
};

/** Extensions that are never acceptable as an upload payload. */
const BLOCKED_UPLOAD = /\.(js|mjs|cjs|html?|svg|exe|bat|cmd|com|sh|bash|jar|ps1|vbs|wsf|php\d?|pyc|dll|dylib|apk|iso|scr)$|\.php$/i;

export interface UploadCheck {
  ok: boolean;
  reason?: string;
  extension?: string;
}

/**
 * Client mirror of the upload policy. Rejects double-extension and hidden-file
 * tricks (`payload.pdf.js`, `.gitignore`) and enforces the size ceiling before
 * the file is ever read into memory.
 */
export function checkUpload(file: { name: string; size: number }, rules: { allowedExtensions?: readonly string[]; maxBytes?: number } = {}): UploadCheck {
  const allowed = rules.allowedExtensions ?? UPLOAD_RULES.allowedExtensions;
  const maxBytes = rules.maxBytes ?? UPLOAD_RULES.maxBytes;
  const name = file.name.trim();
  if (!name) return { ok: false, reason: 'The file has no name.' };
  const segments = name.split('.').filter(Boolean);
  if (segments.length < 2) return { ok: false, reason: 'The file has no extension.' };
  if (name.startsWith('.')) return { ok: false, reason: 'Hidden files are not accepted.' };
  const lower = name.toLowerCase();
  const extension = `.${segments[segments.length - 1]}`;
  if (BLOCKED_UPLOAD.test(lower)) return { ok: false, reason: 'Executable and markup payloads are blocked.' };
  if (!allowed.includes(extension)) {
    return { ok: false, reason: `Unsupported file type "${extension}". Allowed: ${allowed.join(', ')}.` };
  }
  if (!Number.isFinite(file.size) || file.size <= 0) return { ok: false, reason: 'The file is empty.' };
  if (file.size > maxBytes) return { ok: false, reason: `File exceeds the ${Math.round(maxBytes / (1024 * 1024))}MB limit.` };
  return { ok: true, extension };
}

export interface PasswordAssessment {
  ok: boolean;
  score: 0 | 1 | 2 | 3 | 4;
  problems: string[];
}

/** Mirror of the server policy (`checkPasswordPolicy`) for instant feedback. */
export function assessPassword(password: string, minLength = 10): PasswordAssessment {
  const problems: string[] = [];
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (password.length < minLength) problems.push(`use at least ${minLength} characters`);
  if (classes < 3) problems.push('mix upper case, lower case, digits and symbols');
  if (/(.)\1{2,}/.test(password)) problems.push('avoid three or more repeated characters');
  if (/^(password|qwerty|azerty|admin|moes|imd|trainee|trainer)/i.test(password)) problems.push('avoid predictable prefixes');
  const rawScore = classes - (password.length < minLength ? 1 : 0);
  const score = Math.min(4, Math.max(0, rawScore)) as 0 | 1 | 2 | 3 | 4;
  return { ok: problems.length === 0, score, problems };
}

export function clampText(value: string, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

/** Human-friendly wait time for 429 responses (never a raw millisecond count). */
export function formatRetry(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return 'a moment';
  if (seconds < 60) return `${Math.ceil(seconds)} seconds`;
  const minutes = Math.round(seconds / 60);
  return minutes === 1 ? 'about a minute' : `about ${minutes} minutes`;
}
