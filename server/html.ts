/**
 * Production HTML shell serving with per-request CSP nonces.
 *
 * Serving `index.html` straight from `express.static` (as the portal used to
 * do) meant (a) no nonce could ever be applied, so the CSP had to allow
 * `'unsafe-inline'`, and (b) the whole `dist/` folder - including the bundled
 * **server** (`server.cjs`) and its **source map**, which contains the full
 * TypeScript sources - was downloadable by anyone. Both are fixed here: only
 * the extension allowlist in `headers.ts` is served, and the HTML is emitted by
 * this module with a fresh nonce.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Response } from 'express';
import { newNonce, buildCsp } from './security/headers.js';
import type { AppConfig } from './config.js';

interface CachedHtml {
  raw: string;
  readAt: number;
  mtimeMs: number;
}

const TTL_MS = 5_000;

export class HtmlShell {
  private cached: CachedHtml | null = null;

  constructor(private readonly indexPath: string) {}

  private read(): CachedHtml | null {
    const now = Date.now();
    if (this.cached && now - this.cached.readAt < TTL_MS) return this.cached;
    try {
      const stat = fs.statSync(this.indexPath);
      if (this.cached && this.cached.mtimeMs === stat.mtimeMs && now - this.cached.readAt < 60_000) {
        this.cached = { ...this.cached, readAt: now };
        return this.cached;
      }
      const raw = fs.readFileSync(this.indexPath, 'utf8').slice(0, 512 * 1024);
      this.cached = { raw, readAt: now, mtimeMs: stat.mtimeMs };
      return this.cached;
    } catch {
      return null;
    }
  }

  /** Returns the HTML with a fresh nonce stamped on every inline/external tag. */
  render(nonce: string): { html: string; assets: string[] } | null {
    const cached = this.read();
    if (!cached) return null;
    let html = cached.raw;

    // Vite emits one `<script type="module" crossorigin src="...">` and one
    // `<link rel="stylesheet">`. Stamp the nonce on script/style tags and keep
    // the asset list so preloads stay same-origin.
    html = html.replace(/<script(?![^>]*\bsrc=)(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`);
    html = html.replace(/<script(?=[^>]*\bsrc=)(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`);
    html = html.replace(/<style(?![^>]*\bnonce=)/gi, `<style nonce="${nonce}"`);
    // A meta-refresh CSP could not carry the nonce, so it must not be emitted
    // by the build (it would silently win over the header and weaken the policy).
    html = html.replace(/<meta[^>]+http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');

    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]).slice(0, 20);
    return { html, assets };
  }

  /** True when a built shell exists at all (used for the boot warning). */
  exists(): boolean {
    try {
      return fs.statSync(this.indexPath).isFile();
    } catch {
      return false;
    }
  }
}

export function sendHtml(res: Response, config: AppConfig, shell: HtmlShell, options: { status?: number } = {}): boolean {
  const nonce = newNonce();
  const rendered = shell.render(nonce);
  if (!rendered) return false;

  res.setHeader(
    'Content-Security-Policy',
    buildCsp({
      isProduction: config.isProduction,
      nonce,
      frameAncestors: config.frameAncestors,
      frameSrc: config.frameSrcList,
      connectExtra: config.connectExtraSources,
    }),
  );
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('Vary', 'Accept-Encoding');
  res.removeHeader('ETag');
  res.status(options.status ?? 200).send(rendered.html);
  return true;
}
