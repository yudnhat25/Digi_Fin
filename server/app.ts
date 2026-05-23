/**
 * Pure Hono application — shared between the standalone Node server (server/index.ts)
 * and Vercel serverless entry (api/[...path].ts).
 *
 * No side-effects, no listen(). Export the Hono instance only.
 *
 * All endpoints are mounted under /api/ so that Vercel filesystem routing
 * (api/[...path].ts catches /api/*) automatically forwards every URL we care
 * about. Top-level `/docs` and `/openapi.yaml` are exposed via vercel.json
 * rewrites that point to /api/docs and /api/openapi.yaml respectively.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fxRouter } from './routes/fx';
import { marketRouter } from './routes/market';
import { aiRouter } from './routes/ai';
import { accountsRouter } from './routes/accounts';
import { agentRouter } from './routes/agent';

const startedAt = Date.now();

export const app = new Hono();

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));

// Diagnostic ping — does not depend on anything, useful when debugging cold-start crashes.
app.get('/api/ping', (c) =>
  c.json({ ok: true, uptimeSec: Math.floor((Date.now() - startedAt) / 1000), time: new Date().toISOString() }),
);

app.get('/api/v1/health', (c) =>
  c.json({
    status: 'ok',
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    version: '1.0.0',
    name: 'CoinWise AI Fintech OpenAPI',
  }),
);

app.route('/api/v1/fx', fxRouter);
app.route('/api/v1/market', marketRouter);
app.route('/api/v1/ai', aiRouter);
app.route('/api/v1/accounts', accountsRouter);
app.route('/api/v1/agent', agentRouter);

function loadSpec(): string | null {
  // Candidate paths cover: local tsx run (__dirname = server/), Vercel bundle (cwd/server/), and a fallback.
  const here = (() => {
    try { return dirname(fileURLToPath(import.meta.url)); } catch { return ''; }
  })();
  const candidates = [
    here && resolve(here, 'openapi.yaml'),
    here && resolve(here, '../server/openapi.yaml'),
    resolve(process.cwd(), 'server/openapi.yaml'),
    resolve(process.cwd(), 'openapi.yaml'),
  ].filter(Boolean) as string[];
  for (const path of candidates) {
    try {
      return readFileSync(path, 'utf8');
    } catch { /* try next */ }
  }
  return null;
}

app.get('/api/openapi.yaml', (c) => {
  const spec = loadSpec();
  if (!spec) return c.json({ error: 'Spec file not in bundle. Check vercel.json includeFiles.' }, 500);
  return new Response(spec, { headers: { 'content-type': 'text/yaml; charset=utf-8' } });
});

app.get('/api/docs', (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CoinWise AI · OpenAPI Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
  <style>body{margin:0;background:#0f172a}.swagger-ui .topbar{background:#0f172a}</style>
</head>
<body>
  <div id="swagger"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.yaml',
        dom_id: '#swagger',
        deepLinking: true,
        docExpansion: 'list',
        presets: [SwaggerUIBundle.presets.apis]
      });
    };
  </script>
</body>
</html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
});

// Local-server convenience routes (when running via `npm run dev:api` on port 3001).
app.get('/openapi.yaml', (c) => {
  const spec = loadSpec();
  if (!spec) return c.json({ error: 'Spec not found' }, 500);
  return new Response(spec, { headers: { 'content-type': 'text/yaml; charset=utf-8' } });
});
app.get('/docs', (c) => c.redirect('/api/docs'));
app.get('/', (c) => c.redirect('/api/docs'));
app.get('/meta', (c) =>
  c.json({
    name: 'CoinWise AI Fintech OpenAPI',
    docs: '/api/docs',
    spec: '/api/openapi.yaml',
    health: '/api/v1/health',
  }),
);
