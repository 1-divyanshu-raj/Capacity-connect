/**
 * Build-time marker injected by esbuild (`--define:__CC_BUNDLED__=true`).
 * It lets the runtime recognise the production bundle even when the hosting
 * platform forgot to export NODE_ENV, so the dev pipeline (which serves
 * unbundled source) can never be started by accident.
 */
declare const __CC_BUNDLED__: boolean | undefined;
