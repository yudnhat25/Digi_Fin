/**
 * Pure Hono application — shared between the standalone Node server (server/index.ts)
 * and Vercel serverless entry (api/[[...path]].ts).
 *
 * No side-effects, no listen(). Export the Hono instance only.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fxRouter } from './routes/fx.js';
import { marketRouter } from './routes/market.js';
import { aiRouter } from './routes/ai.js';
import { accountsRouter } from './routes/accounts.js';
import { agentRouter } from './routes/agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const startedAt = Date.now();

export const app = new Hono();

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));

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

// Locate openapi.yaml: prefer co-located file, fall back to repo root (Vercel).
function loadSpec(): string | null {
  const candidates = [
    resolve(__dirname, 'openapi.yaml'),
    resolve(__dirname, '../server/openapi.yaml'),
    resolve(process.cwd(), 'server/openapi.yaml'),
  ];
  for (const path of candidates) {
    try {
      return readFileSync(path, 'utf8');
    } catch {
      /* try next */
    }
  }
  return null;
}

app.get('/openapi.yaml', (c) => {
  const spec = loadSpec();
  if (!spec) return c.json({ error: 'Spec file not found in bundle' }, 500);
  return new Response(spec, { headers: { 'content-type': 'text/yaml; charset=utf-8' } });
});

app.get('/docs', (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CoinWise AI — OpenAPI Docs</title>
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

// Root redirect → docs (only when hitting the API host directly).
app.get('/', (c) => c.redirect('/docs'));

app.get('/meta', (c) =>
  c.json({
    name: 'CoinWise AI Fintech OpenAPI',
    docs: '/docs',
    spec: '/openapi.yaml',
    health: '/api/v1/health',
  }),
);
