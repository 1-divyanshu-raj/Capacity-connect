import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

/**
 * Build/dev-server configuration for CAPACITY CONNECT.
 *
 * Security-relevant settings are called out inline. They harden the tool chain
 * without touching what the portal renders: Tailwind, React, the alias map and
 * the dev HMR switch behave exactly as before.
 */
export default defineConfig(() => {
  // Explicit, non-wildcard host allowlist for the dev server. This is the
  // DNS-rebinding guard Vite 6.0.9+ enforces: requests carrying any other Host
  // header are refused instead of served (which also used to disclose source).
  const allowedHosts = (
    process.env.ALLOWED_HOSTS ||
    'localhost,127.0.0.1,::1,.e2b.app,.vercel.app,.ngrok-free.app,.loca.lt'
  )
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const isProduction = (process.env.NODE_ENV || 'development') === 'production';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@lib': path.resolve(__dirname, './src/lib'),
      },
    },
    // Vite inlines `import.meta.env` values for the client bundle. The prefix is
    // deliberately unmatchable so that *no* environment variable - not even a
    // future VITE_* one - can be baked into a publicly downloadable asset.
    envPrefix: 'VITE_DISABLED_',
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      allowedHosts,
      // The dev server never answers cross-origin reads.
      cors: false,
      // Nothing outside the project root is reachable through /@fs.
      fs: { strict: true, allow: [path.resolve(__dirname)] },
    },
    preview: {
      allowedHosts,
      cors: false,
    },
    build: {
      // Source maps in a public directory disclose the implementation (and, for
      // the server bundle, its configuration). They are emitted only on demand.
      sourcemap: process.env.ENABLE_SOURCEMAPS === 'true',
      target: 'es2022',
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1200,
    },
    // Production bundles drop `console.*` and `debugger` (information
    // disclosure through developer tools) while keeping third-party licences.
    esbuild: {
      drop: (isProduction ? ['console', 'debugger'] : []) as ('console' | 'debugger')[],
    },
  };
});
