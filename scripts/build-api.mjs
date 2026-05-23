#!/usr/bin/env node
/**
 * Pre-bundle the serverless function entry so Vercel ships ONE self-contained
 * .js file with all transitive imports inlined.
 *
 *   src:  api/_lib/_entry.ts    (handler + dynamic import of app)
 *   out:  api/dispatch.js       (function Vercel detects)
 *
 * Without this, Vercel only compiles files marked as functions and treats
 * everything under api/_lib/ as raw .ts that Node can't import at runtime.
 */
import { build } from 'esbuild';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const entry = resolve(root, 'api/_lib/_entry.ts');
const outfile = resolve(root, 'api/dispatch.js');

mkdirSync(dirname(outfile), { recursive: true });

console.log('[build-api] bundling', entry, '\n            ->', outfile);

await build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile,
  // hono is small; inline it. @hono/node-server is local-dev-only.
  external: ['@hono/node-server'],
  loader: { '.yaml': 'text', '.yml': 'text' },
  logLevel: 'info',
  banner: {
    // Some bundled deps still use require() at the top of cjs interop.
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
  },
});

console.log('[build-api] done');
