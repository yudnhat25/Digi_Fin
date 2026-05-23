/**
 * Vercel serverless entry — proxies every /api/*, /docs, /openapi.yaml request
 * into the shared Hono `app`. Configured by vercel.json rewrites.
 */
import { handle } from 'hono/vercel';
import { app } from '../server/app.js';

export const config = {
  runtime: 'nodejs',
};

export default handle(app);
