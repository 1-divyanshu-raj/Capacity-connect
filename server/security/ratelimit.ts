/**
 * Dependency-free rate limiting, brute-force lockout and abuse counters.
 *
 * All stores are bounded (`maxTrackedKeys`) with opportunistic eviction so the
 * limiter itself cannot be used as a memory-exhaustion amplifier.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { pseudonymous } from './crypto.js';

interface Bucket {
  count: number;
  resetAt: number;
}

/** Bounded keyed counter with fixed windows and lazy sweep. */
export class KeyedCounter {
  private readonly store = new Map<string, Bucket>();
  private sweeper: NodeJS.Timeout | null = null;

  constructor(private readonly maxKeys: number) {}

  private sweep(): void {
    const now = Date.now();
    for (const [key, bucket] of this.store) {
      if (bucket.resetAt <= now) this.store.delete(key);
    }
  }

  private startSweeper(): void {
    if (this.sweeper) return;
    this.sweeper = setInterval(() => this.sweep(), 30_000);
    // Never keep the event loop alive just for housekeeping.
    this.sweeper.unref?.();
  }

  /** Returns the post-increment state for `key`. */
  hit(key: string, windowMs: number, limit: number): { count: number; resetAt: number; blocked: boolean } {
    this.startSweeper();
    const now = Date.now();
    let bucket = this.store.get(key);
    if (!bucket || bucket.resetAt <= now) {
      if (this.store.size >= this.maxKeys) {
        // Evict the oldest half (insertion order) instead of growing unbounded.
        const drop = Math.ceil(this.store.size / 2);
        let i = 0;
        for (const k of this.store.keys()) {
          this.store.delete(k);
          if (++i >= drop) break;
        }
      }
      bucket = { count: 0, resetAt: now + windowMs };
      this.store.set(key, bucket);
    }
    bucket.count += 1;
    return { count: bucket.count, resetAt: bucket.resetAt, blocked: bucket.count > limit };
  }

  peek(key: string): Bucket | undefined {
    return this.store.get(key);
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  get size(): number {
    return this.store.size;
  }

  dispose(): void {
    if (this.sweeper) clearInterval(this.sweeper);
    this.sweeper = null;
    this.store.clear();
  }
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** Distinguishes independent limiters in logs. */
  name: string;
  /** Skip limiting for benign probes (health checks). */
  skip?: (req: Request) => boolean;
  /** Custom key derivation; defaults to client IP. */
  key?: (req: Request) => string;
  message?: string;
  maxKeys?: number;
}

export function clientIp(req: Request): string {
  const raw = req.ip || req.socket?.remoteAddress || '';
  const normalized = raw.replace(/^::ffff:/, '');
  if (!normalized) return 'unknown';
  return normalized.slice(0, 64);
}

/** Generic fixed-window limiter middleware. */
export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  const counter = new KeyedCounter(options.maxKeys ?? 20_000);

  const middleware: RequestHandler = (req, res, next) => {
    if (options.skip?.(req)) return next();
    const key = `${options.name}:${options.key ? options.key(req) : clientIp(req)}`;
    const state = counter.hit(key, options.windowMs, options.max);

    res.setHeader('X-RateLimit-Limit', String(options.max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, options.max - state.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(state.resetAt / 1000)));

    if (state.blocked) {
      const retrySeconds = Math.max(1, Math.ceil((state.resetAt - Date.now()) / 1000));
      res.setHeader('Retry-After', String(retrySeconds));
      // Machine-readable policy per the IETF RateLimit draft.
      res.setHeader('RateLimit', `limit=${options.max}, remaining=0, reset=${retrySeconds}`);
      res.setHeader('Cache-Control', 'no-store');
      res.status(429).json({
        error: 'Too many requests',
        message: options.message ?? `Rate limit reached. Retry in ${retrySeconds}s.`,
        retryAfterSeconds: retrySeconds,
        requestId: req.requestId,
      });
      return;
    }
    return next();
  };

  (middleware as RequestHandler & { counter: KeyedCounter }).counter = counter;
  return middleware;
}

/** Per-session limiter keyed on the authenticated session when available. */
export function sessionAwareKey(secret: string) {
  return (req: Request): string => {
    if (req.session?.id) return `sid:${req.session.id.slice(0, 16)}`;
    return `ip:${pseudonymous(clientIp(req), secret)}`;
  };
}

export interface LockoutState {
  failures: number;
  lockedUntil: number;
  lastAttempt: number;
}

/**
 * Credential-stuffing / brute-force defence for every authentication surface.
 * Counts failures per *account* (anonymised) and per *source address*, applies
 * exponential back-off and a hard lockout window.
 */
export class LoginGuard {
  private readonly accounts = new KeyedCounter(20_000);
  private readonly addresses = new KeyedCounter(20_000);
  private readonly locks = new Map<string, LockoutState>();

  constructor(
    private readonly opts: {
      windowMs: number;
      maxFailures: number;
      lockoutMs: number;
      maxKeys: number;
    },
  ) {}

  private lockKey(identifier: string): string {
    return identifier.toLowerCase().slice(0, 128);
  }

  stateFor(identifier: string): LockoutState {
    const key = this.lockKey(identifier);
    const existing = this.locks.get(key);
    if (existing && existing.lockedUntil > Date.now()) return existing;
    if (existing) this.locks.delete(key);
    const failures = this.accounts.peek(`f:${key}`)?.count ?? 0;
    return { failures, lockedUntil: 0, lastAttempt: 0 };
  }

  blocked(identifier: string): { blocked: boolean; retryInMs: number } {
    const state = this.stateFor(identifier);
    if (state.lockedUntil > Date.now()) return { blocked: true, retryInMs: state.lockedUntil - Date.now() };
    return { blocked: false, retryInMs: 0 };
  }

  /** Returns the remaining attempts before lockout (never precise enough to leak). */
  recordFailure(req: Request, identifier: string): { failures: number; lockedForMs: number; remaining: number } {
    const key = this.lockKey(identifier);
    const windowMs = this.opts.windowMs;
    const accountState = this.accounts.hit(`f:${key}`, windowMs, this.opts.maxFailures * 4);
    const ipState = this.addresses.hit(`f:${clientIp(req)}`, windowMs, this.opts.maxFailures * 6);

    let failures = Math.max(accountState.count, ipState.count);
    let lockedForMs = 0;
    if (failures >= this.opts.maxFailures) {
      // Exponential back-off, capped at the configured lockout window.
      const exponent = Math.min(4, Math.max(0, failures - this.opts.maxFailures));
      lockedForMs = Math.min(this.opts.lockoutMs, this.opts.lockoutMs / 4) * 2 ** exponent;
      const current = this.locks.get(key) ?? { failures, lockedUntil: 0, lastAttempt: Date.now() };
      this.locks.set(key, { ...current, failures, lockedUntil: Date.now() + lockedForMs, lastAttempt: Date.now() });
      if (this.locks.size > this.opts.maxKeys / 10) {
        const oldest = this.locks.keys().next().value;
        if (oldest) this.locks.delete(oldest);
      }
    }
    failures = Math.min(failures, 99);
    return { failures, lockedForMs, remaining: Math.max(0, this.opts.maxFailures - failures) };
  }

  clear(identifier: string): void {
    const key = this.lockKey(identifier);
    this.locks.delete(key);
    this.accounts.reset(`f:${key}`);
  }
}

/**
 * Small token bucket used for expensive upstream calls (Gemini), so a single
 * client cannot burn paid API quota (availability + cost-abuse control).
 */
export class TokenBucket {
  private readonly buckets = new Map<string, { tokens: number; updatedAt: number }>();

  constructor(
    private readonly capacity: number,
    private readonly refillPerMinute: number,
    private readonly maxKeys: number = 20_000,
  ) {}

  take(key: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      if (this.buckets.size >= this.maxKeys) {
        const oldest = this.buckets.keys().next().value;
        if (oldest) this.buckets.delete(oldest);
      }
      bucket = { tokens: this.capacity, updatedAt: now };
      this.buckets.set(key, bucket);
    }
    const refill = ((now - bucket.updatedAt) / 60_000) * this.refillPerMinute;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + refill);
    bucket.updatedAt = now;

    if (bucket.tokens < 1) {
      const needed = 1 - bucket.tokens;
      const retry = Math.ceil((needed / this.refillPerMinute) * 60);
      return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, retry) };
    }
    bucket.tokens -= 1;
    return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterSeconds: 0 };
  }
}

export function tokenBucketMiddleware(opts: { capacity: number; refillPerMinute: number; name: string }): RequestHandler {
  const bucket = new TokenBucket(opts.capacity, opts.refillPerMinute);
  return (req, res, next) => {
    const key = req.session?.id ? `sid:${req.session.id.slice(0, 16)}` : `ip:${clientIp(req)}`;
    const state = bucket.take(key);
    res.setHeader('X-Upstream-Budget-Remaining', String(state.remaining));
    if (!state.allowed) {
      res.setHeader('Retry-After', String(state.retryAfterSeconds));
      res.status(429).json({
        error: 'Upstream budget exhausted',
        message: `The AI assistant is rate limited to protect portal quota. Try again in ${state.retryAfterSeconds}s.`,
        retryAfterSeconds: state.retryAfterSeconds,
        requestId: req.requestId,
      });
      return;
    }
    next();
  };
}
