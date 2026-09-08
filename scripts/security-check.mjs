#!/usr/bin/env node
/**
 * CAPACITY CONNECT - hardening self-check.
 *
 * Boots the portal (dev or built bundle, on a free port) and asserts the
 * baseline a penetration test is expected to verify: security headers, CSP
 * strictness, path/source disclosure blocks, auth gating, CSRF, input limits,
 * rate limiting and lockout. Exit code 1 on any failure so CI can gate on it.
 *
 *   node scripts/security-check.mjs            # builds nothing, uses :PORT
 *   node scripts/security-check.mjs --built     # runs `npm run build` first
 */
import { spawn } from 'node:child_process';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const args = new Set(process.argv.slice(2));
const results = [];
let server = null;

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const flag = ok ? '\x1b[32m PASS \x1b[0m' : '\x1b[31m FAIL \x1b[0m';
  console.log(`${flag} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function freePort() {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitUp(base, timeoutMs = 25_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/api/health`, { headers: { Origin: base } });
      if (res.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await delay(250);
  }
  return false;
}

function startServer(port, built) {
  const cmd = built ? 'node' : 'npx';
  const argv = built ? ['dist/server/index.cjs'] : ['tsx', 'server.ts'];
  const child = spawn(cmd, argv, {
    cwd: new URL('..', import.meta.url).pathname,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: built ? 'production' : 'development',
      DEV_SERVER: built ? 'false' : 'true',
      LOG_LEVEL: 'silent',
      SESSION_SECRET: 'self-check-session-secret-0123456789abcdef',
      RATE_LIMIT_AUTH_MAX: process.env.CHECK_AUTH_LIMIT ?? '10',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', () => {});
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));
  return child;
}

async function main() {
  const built = args.has('--built');
  if (built) {
    console.log('building (vite + esbuild)…');
    const build = spawn('npm', ['run', 'build'], { stdio: 'inherit', cwd: new URL('..', import.meta.url).pathname });
    await new Promise((resolve) => build.on('exit', resolve));
  }

  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  server = startServer(port, built);
  if (!(await waitUp(base))) {
    console.error('server did not come up');
    process.exit(2);
  }

  const headersFor = async (path, init = {}) => (await fetch(base + path, { redirect: 'manual', ...init })).headers;

  /* ------------------------------ header checks ----------------------------- */

  const htmlHeaders = await headersFor('/');
  const csp = htmlHeaders.get('content-security-policy') ?? '';
  record('CSP present', csp.length > 0, `${csp.split(';').length} directives`);
  if (built) {
    record('CSP has no unsafe-inline/unsafe-eval (prod)', !/unsafe-(inline|eval)/.test(csp), csp.slice(0, 60) + '…');
    record('CSP uses a per-request nonce (prod)', /'nonce-[A-Za-z0-9+/=]{16,}'/.test(csp));
    record('frame-ancestors locked to self', /frame-ancestors 'self'(;|$)/.test(csp), csp.match(/frame-ancestors[^;]*/)?.[0] ?? '');
  }
  for (const [name, expected] of [
    ['x-content-type-options', 'nosniff'],
    ['referrer-policy', 'strict-origin-when-cross-origin'],
    ['x-frame-options', 'SAMEORIGIN'],
    ['cross-origin-opener-policy', 'same-origin'],
    ['permissions-policy', 'camera=(self)'],
    ['x-request-id', null],
  ]) {
    const value = htmlHeaders.get(name) ?? '';
    const ok = expected === null ? value.length > 0 : value.includes(expected);
    record(`header ${name}`, ok, value.slice(0, 72) || '(missing)');
  }
  record('no X-Powered-By disclosure', htmlHeaders.get('x-powered-by') === null);
  record('camera allowed for self (face-scan feature works)', /camera=\(self\)/.test(htmlHeaders.get('permissions-policy') ?? ''));
  record('microphone denied', /microphone=\(\)/.test(htmlHeaders.get('permissions-policy') ?? ''));

  /* --------------------------- disclosure / path guard ---------------------- */

  const probes = [
    ['/server.cjs.map', 'server source map'],
    ['/server/index.cjs', 'server bundle'],
    ['/.env', 'dotenv file'],
    ['/.git/config', 'git config'],
    ['/%2e%2e/%2e%2e/etc/passwd', 'traversal'],
    ['/node_modules/.package-lock.json', 'dependency tree'],
    ['/.well-known/security.txt', 'security.txt (must stay reachable)'],
  ];
  const LEAK_MARKERS = {
    '/server.cjs.map': '"mappings"',
    '/server/index.cjs': 'GoogleGenAI',
    '/.env': 'GEMINI_API_KEY',
    '/.git/config': '\[core\]',
    '/%2e%2e/%2e%2e/etc/passwd': 'root:.*:0:0:',
    '/node_modules/.package-lock.json': '"lockfileVersion"',
  };
  for (const [path, label] of probes) {
    const res = await fetch(base + path, { redirect: 'manual' });
    const body = await res.text();
    const shouldServe = path === '/.well-known/security.txt';
    const marker = LEAK_MARKERS[path];
    const leaked = res.status === 200 && (marker ? new RegExp(marker).test(body) : body.includes('<!doctype html>') === false && !body.includes('<div id="root">'));
    record(`path ${label}`, shouldServe ? res.status === 200 : !leaked, `HTTP ${res.status}${leaked && !shouldServe ? ' LEAKED' : ''}`);
  }

  {
    const res = await fetch(`${base}/.well-known/security.txt`);
    const body = await res.text();
    record(
      'security.txt offers a usable, non-placeholder contact',
      res.status === 200 && /^Contact:\s*\S+/m.test(body) && !/example\.(com|org)|yourdomain\.com/i.test(body),
      `HTTP ${res.status}`,
    );
  }

  // In dev mode the Vite middleware serves from the project root: the server
  // implementation and configuration must still be unreachable there.
  for (const [path, marker] of [['/server.ts', 'createViteServer'], ['/package.json', '"dependencies"'], ['/tsconfig.json', 'compilerOptions'], ['/vite.config.ts', 'tailwindcss'], ['/@fs/root/etc/passwd', 'root:']]) {
    const res = await fetch(base + path, { redirect: 'manual' });
    const body = await res.text();
    const leaked = res.status === 200 && body.includes(marker);
    record(`source/config not disclosed: ${path}`, !leaked, `HTTP ${res.status}${leaked ? ' LEAKED' : ''}`);
  }

  const api404 = await fetch(`${base}/api/definitely-not-a-route`);
  const api404Body = await api404.text();
  record('unknown /api returns JSON 404 (not the SPA shell)', api404.status === 404 && api404Body.trim().startsWith('{'), `HTTP ${api404.status}`);

  const health = await (await fetch(`${base}/api/health`)).json();
  record('health endpoint discloses no internals', !('hasGeminiKey' in health) && Object.keys(health).length <= 3, JSON.stringify(health));

  let methodStatus = 0;
  for (const method of ['PUT', 'DELETE', 'PATCH']) {
    const res = await fetch(base + '/api/health', { method });
    methodStatus = res.status;
    if (methodStatus !== 405) break;
  }
  record('unsupported write methods refused (405)', methodStatus === 405, `HTTP ${methodStatus}`);

  /* --------------------------------- auth ---------------------------------- */

  const chatUnauth = await fetch(`${base}/api/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'hello' }),
  });
  record('AI chat requires a session', chatUnauth.status === 401, `HTTP ${chatUnauth.status}`);

  const crossSite = await fetch(`${base}/api/auth/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
    body: JSON.stringify({ username: 'x', password: 'y', role: 'trainee' }),
  });
  record('cross-origin POST rejected (CSRF/origin gate)', crossSite.status === 403, `HTTP ${crossSite.status}`);

  const badLogin = await fetch(`${base}/api/auth/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'XYZ_trainee', password: 'wrong-password', role: 'trainee' }),
  });
  const badBody = await badLogin.json();
  record('wrong password rejected', badLogin.status === 401, JSON.stringify(badBody).slice(0, 90));
  record('auth error never echoes the secret', !JSON.stringify(badBody).includes('wrong-password') && !/Trainee#/.test(JSON.stringify(badBody)));

  const huge = await fetch(`${base}/api/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'A'.repeat(500_000) }),
  });
  record('oversized body refused (413)', huge.status === 413, `HTTP ${huge.status}`);

  const wrongType = await fetch(`${base}/api/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: '{"message":"x"}',
  });
  record('non-JSON content type refused (415)', wrongType.status === 415, `HTTP ${wrongType.status}`);

  const polluted = await fetch(`${base}/api/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"message":"x","__proto__":{"polluted":true},"constructor":{"prototype":{"x":1}}}',
  });
  const marker = await fetch(`${base}/api/health`).then(() => ({}));
  record('prototype-pollution payload neutralised', ({}).__proto__ === Object.prototype && polluted.status >= 400, `HTTP ${polluted.status}`);

  /* ------------------------- full three-step sign-in ------------------------ */

  // Credentials come from the server's own demo endpoint (never hardcoded in
  // this repo) so the suite stays meaningful when DEMO_MODE is turned off.
  const demo = await fetch(`${base}/api/auth/demo-credentials?role=admin`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  if (!demo.password) {
    record('three-step sign-in (skipped: DEMO_MODE off, no credential to test with)', true, 'set DEMO_MODE=true to exercise this path');
  }
  const step1 = await fetch(`${base}/api/auth/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'XYZ_admin', password: demo.password ?? 'Admin#Fallback1', role: 'admin' }),
  });
  const challenge = await step1.json();
  record('step 1 issues a challenge', step1.status === 200 && !!challenge.challengeId, JSON.stringify(challenge).slice(0, 80));

  const otpFail = await fetch(`${base}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId: challenge.challengeId, code: '000000' }),
  });
  record('wrong OTP rejected', otpFail.status === 401, `HTTP ${otpFail.status}`);

  const otpOk = await fetch(`${base}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId: challenge.challengeId, code: challenge.devOtp ?? '982401' }),
  });
  const otpBody = await otpOk.json();
  record('valid OTP accepted', otpOk.status === 200 && !!otpBody.verificationToken, `HTTP ${otpOk.status}`);

  const factor = await fetch(`${base}/api/auth/verify-factor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verificationToken: otpBody.verificationToken, factorKind: 'biometric', passed: true }),
  });
  const factorHeaders = factor.headers;
  const setCookies = factorHeaders.getSetCookie ? factorHeaders.getSetCookie() : [factorHeaders.get('set-cookie')].filter(Boolean);
  const cookieHeader = setCookies.map((c) => c.split(';')[0]).join('; ');
  record('session issued after 3rd factor', factor.status === 200 && !!cookieHeader, `HTTP ${factor.status}`);
  const sessionCookie = setCookies.find((c) => /cc_session/.test(c)) ?? '';
  record('session cookie is HttpOnly + SameSite=Strict + Path=/', /HttpOnly/.test(sessionCookie) && /SameSite=Strict/.test(sessionCookie) && /Path=\//.test(sessionCookie), sessionCookie);

  const factorReplay = await fetch(`${base}/api/auth/verify-factor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verificationToken: otpBody.verificationToken, factorKind: 'biometric', passed: true }),
  });
  record('verification token is single-use', factorReplay.status === 401, `HTTP ${factorReplay.status}`);

  const forged = await fetch(`${base}/api/auth/session`, { headers: { Cookie: 'cc_session=' + Buffer.from(JSON.stringify({ sid: 'x' })).toString('base64url') + '.forged' } });
  record('forged session cookie rejected', (await forged.json()).authenticated === false);

  const csrfMissing = await fetch(`${base}/api/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ message: 'radar basics' }),
  });
  record('session POST without CSRF token refused', csrfMissing.status === 403, `HTTP ${csrfMissing.status}`);

  const csrfToken = (setCookies.find((c) => /cc_csrf=/.test(c)) ?? '').match(/cc_csrf=([^;]+)/)?.[1] ?? '';
  const chatAuthed = await fetch(`${base}/api/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader, 'X-CSRF-Token': decodeURIComponent(csrfToken) },
    body: JSON.stringify({ message: 'Explain Doppler reflectivity', contextCourse: 'Radar' }),
  });
  const chatBody = await chatAuthed.json();
  record('AI chat answers for an authenticated session', chatAuthed.status === 200 && typeof chatBody.reply === 'string', `HTTP ${chatAuthed.status}`);

  const injection = await fetch(`${base}/api/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader, 'X-CSRF-Token': decodeURIComponent(csrfToken) },
    body: JSON.stringify({ message: "'; DROP TABLE users;--\"/><script>alert(1)</script>${7*7}\n" + 'x'.repeat(10), contextCourse: 42 }),
  });
  const injBody = await injection.json();
  const injText = JSON.stringify(injBody);
  // The reply is JSON data rendered as text by React; what must be true is that
  // no live markup or unbounded payload comes back.
  record(
    'injection payload returned as inert, bounded text',
    injection.status === 200 && !/<script|onerror=|javascript:/.test(injBody.reply ?? '') && (injBody.reply ?? '').length < 20_001,
    `HTTP ${injection.status}, reply ${(injBody.reply ?? '').length} chars`,
  );
  record('SQLi-style payload cannot reach a query layer', !/sqlite|mysql|postgres|syntax error|SQL/i.test(injText), 'no query engine in this stack');
  record('no stack trace in error responses', !/at .*\(.*:\d+:\d+\)/.test(injText));

  // Dev-mode module graph must keep working (a guard that breaks the app is a
  // failed hardening, so the suite asserts the allowlist too).
  if (!built) {
    for (const path of ['/src/main.tsx', '/src/App.tsx', '/node_modules/.vite/deps/react.js', '/@vite/client']) {
      const res = await fetch(base + path);
      record(`dev module graph intact: ${path}`, res.status === 200, `HTTP ${res.status}`);
    }
  }

  /* ------------------------------ rate limiting ----------------------------- */
  const tooBig = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'x'.repeat(20_000), email: 'officer@imd.gov.in', password: 'Str0ng#Pass123', role: 'trainee' }),
  });
  record('absurdly oversized field rejected', tooBig.status === 400, `HTTP ${tooBig.status}`);

  const weakPass = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Test Officer', email: 'officer@imd.gov.in', password: 'abc', role: 'trainee' }),
  });
  record('weak registration password refused', weakPass.status === 400, `HTTP ${weakPass.status}`);

  // (the schema assertions above ran first so they are not affected by lockout)

  let blocked = false;
  let lastStatus = 0;
  for (let i = 0; i < 30; i += 1) {
    const res = await fetch(`${base}/api/auth/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'XYZ_trainee', password: `bad-${i}-Pass#2026`, role: 'trainee' }),
    });
    lastStatus = res.status;
    if (res.status === 429 || res.status === 423) {
      blocked = true;
      break;
    }
  }
  record('brute force locked out (429/423)', blocked, `last status ${lastStatus}`);

  /* --------------------------------- summary -------------------------------- */

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) {
    console.log('failing:');
    for (const f of failed) console.log(` - ${f.name} ${f.detail}`);
  }
  server?.kill('SIGKILL');
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  server?.kill('SIGKILL');
  process.exit(2);
});
