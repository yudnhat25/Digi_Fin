/**
 * Vercel serverless entry — Vercel's filesystem routing automatically routes
 * every `/api/<anything>` URL to this catch-all function.
 *
 * We mount the shared Hono `app` and let it route internally using the full URL.
 */
import { handle } from 'hono/vercel';
import { app } from '../server/app';

// Newer Vercel runtime declaration (top-level export, not via `config`).
export const runtime = 'nodejs';

export default handle(app);
