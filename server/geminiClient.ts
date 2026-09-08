/**
 * Lazily constructed, server-side-only Gemini client.
 *
 * `GEMINI_API_KEY` is read from the process environment at call time and is
 * never interpolated into a client bundle, a log line or an error response.
 */
import { GoogleGenAI } from '@google/genai';

/** Allowlist-filtered model id from the environment (no injection surface). */
export const GEMINI_MODEL: string = ((process.env.GEMINI_MODEL || 'gemini-3.8-flash').replace(/[^A-Za-z0-9._-]/g, '') || 'gemini-3.8-flash').slice(0, 64);

/** Hard ceiling on upstream latency so a slow provider cannot pin a worker. */
const UPSTREAM_TIMEOUT_MS = Math.min(Math.max(Number.parseInt(process.env.GEMINI_TIMEOUT_MS || '25000', 10) || 25_000, 3_000), 120_000);

let client: GoogleGenAI | null = null;
let clientFor = '';

export function hasGeminiKey(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return typeof key === 'string' && key.trim().length >= 20;
}

export function getGeminiClient(): GoogleGenAI | null {
  const key = (process.env.GEMINI_API_KEY ?? '').trim();
  if (key.length < 20 || key.length > 256) return null;
  if (client && clientFor === key) return client;
  clientFor = key;
  client = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        // Neutral product identifier; no stack or version fingerprint.
        'User-Agent': 'capacity-connect-portal',
      },
      timeout: UPSTREAM_TIMEOUT_MS,
    },
  });
  return client;
}

/**
 * Neutralises model-input smuggling: strips control characters, caps the size
 * and removes the markers a caller could use to break out of the prompt
 * envelope ("### System:", "<|...|>", role impersonation).
 */
export function hardenPromptSegment(value: string, max = 4_000): string {
  if (typeof value !== 'string') return '';
  return value
    .slice(0, Math.min(max * 2, 262_144))
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .replace(/(<\|[^|>]{0,32}\|>)/gi, '[redacted]')
    .replace(/^\s*(system|assistant|developer)\s*:/gim, '[quoted] $1:')
    .replace(/###\s*(System|Instruction) Override/gi, '[redacted]')
    .slice(0, max)
    .trim();
}

export const upstreamTimeoutMs = UPSTREAM_TIMEOUT_MS;
