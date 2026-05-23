/**
 * CoinWise AI — Standalone Node server (used in local dev).
 *
 * Re-exports the shared Hono `app` and binds it to a TCP port via @hono/node-server.
 * For production on Vercel, the same `app` is consumed by api/[[...path]].ts.
 */
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { app } from './app.js';

const PORT = Number(process.env.COINWISE_API_PORT || 3001);

// Attach the dev-only logger here so serverless functions stay quiet.
app.use('*', logger());

serve({ fetch: app.fetch, port: PORT }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`\n  ✓ CoinWise OpenAPI server listening on http://localhost:${info.port}`);
  console.log(`  ✓ Swagger UI:    http://localhost:${info.port}/docs`);
  console.log(`  ✓ OpenAPI spec:  http://localhost:${info.port}/openapi.yaml\n`);
});
