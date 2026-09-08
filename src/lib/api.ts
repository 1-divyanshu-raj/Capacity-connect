/**
 * Same-origin API client for the portal.
 *
 * Everything the browser sends to `server.ts` goes through here so that the
 * security-relevant details cannot be forgotten at a call site:
 *
 *  - JSON only, with the double-submit CSRF header the server requires;
 *  - `credentials: 'same-origin'` so the HttpOnly session cookie travels, but
 *    no opaque body ever carries a secret into a query string;
 *  - an abort timeout, so a hung upstream cannot pin the UI;
 *  - errors normalised to `{ status, code, message, retryAfterSeconds }` — the
 *    server never returns stack traces, and this client never renders one;
 *  - `network: true` when the API itself is unreachable, which callers use to
 *    keep the offline demo path alive (see `isApiOffline`).
 */

export interface ApiFailure {
  status: number;
  code?: string;
  message: string;
  details?: string[];
  retryAfterSeconds?: number;
  network: boolean;
}

/**
 * Single-shape result (this project compiles without `strictNullChecks`, so a
 * discriminated union would not narrow at call sites). `ok` is the only signal
 * callers should branch on; `data` is present exactly when `ok` is true.
 */
export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: ApiFailure;
}

const CSRF_COOKIE = 'cc_csrf';
const CSRF_HEADER = 'X-CSRF-Token';
const DEFAULT_TIMEOUT_MS = 20_000;

let csrfToken: string | null = null;
let offlineSince = 0;
const OFFLINE_COOLDOWN_MS = 20_000;

/* ------------------------------- csrf handling ------------------------------ */

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  for (const entry of document.cookie.split(';')) {
    const idx = entry.indexOf('=');
    if (idx === -1) continue;
    if (entry.slice(0, idx).trim() === name) return decodeURIComponent(entry.slice(idx + 1).trim());
  }
  return null;
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

export function currentCsrfToken(): string | null {
  return csrfToken ?? readCookie(CSRF_COOKIE);
}

export function isApiOffline(): boolean {
  return Date.now() - offlineSince < OFFLINE_COOLDOWN_MS;
}

function markOffline(): void {
  offlineSince = Date.now();
}

function markOnline(): void {
  offlineSince = 0;
}

/* --------------------------------- requests -------------------------------- */

export interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Absolute cap on characters read from the response body. */
  maxBytes?: number;
}

const GENERIC_FAILURE = 'The portal could not reach its security service. Please retry.';

function safeJsonPreview(text: string, max = 4_000): string {
  return text.slice(0, max);
}

/** Performs a same-origin JSON request and normalises every failure mode. */
export async function apiRequest<T = Record<string, unknown>>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const method = options.method ?? 'GET';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
    const token = currentCsrfToken();
    if (token) headers[CSRF_HEADER] = token;
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      credentials: 'same-origin',
      // No secrets in URLs: everything sensitive travels in the JSON body.
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      referrerPolicy: 'no-referrer',
      mode: 'same-origin',
      cache: 'no-store',
    });
    markOnline();
  } catch (err) {
    clearTimeout(timer);
    markOffline();
    const aborted = (err as Error)?.name === 'AbortError';
    return {
      ok: false,
      error: {
        status: 0,
        code: aborted ? 'aborted' : 'network_unavailable',
        message: aborted ? 'The request timed out.' : GENERIC_FAILURE,
        network: !aborted,
      },
    };
  }

  clearTimeout(timer);

  const text = safeJsonPreview(await response.text().catch(() => ''));
  let payload: Record<string, unknown> = {};
  if (text) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) payload = parsed as Record<string, unknown>;
    } catch {
      // Non-JSON body (proxy error page, html): never echo it into the DOM.
      payload = {};
    }
  }

  if (!response.ok) {
    const retryAfterHeader = response.headers.get('retry-after');
    const retryAfterSeconds = Number.parseInt(String(payload.retryAfterSeconds ?? retryAfterHeader ?? ''), 10);
    return {
      ok: false,
      error: {
        status: response.status,
        code: typeof payload.code === 'string' ? payload.code : undefined,
        message:
          typeof payload.message === 'string' && payload.message.length <= 400
            ? payload.message
            : typeof payload.error === 'string' && payload.error.length <= 400
              ? payload.error
              : response.status === 429
                ? 'Too many requests for this window. Please wait before retrying.'
                : response.status === 401
                  ? 'Your session is no longer valid. Please sign in again.'
                  : GENERIC_FAILURE,
        details: Array.isArray(payload.details) ? (payload.details as string[]).slice(0, 4) : undefined,
        retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
        network: false,
      },
    };
  }

  return { ok: true, data: payload as T };
}

/** Fire-and-forget variant used for logout / best-effort pings. */
export function apiSend(path: string, body?: unknown): void {
  void apiRequest(path, { method: 'POST', body, timeoutMs: 5_000 });
}
