/**
 * Single Vercel serverless function that wires every CoinWise OpenAPI route.
 * vercel.json rewrites map `/api/v1/*`, `/api/openapi.yaml`, `/api/docs`,
 * `/docs`, and `/openapi.yaml` to `/api/dispatch`.
 */
import { app } from '../server/app';

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  try {
    const proto = (req.headers['x-forwarded-proto'] as string | undefined) || 'https';
    const host = (req.headers['x-forwarded-host'] as string | undefined)
      || (req.headers['host'] as string | undefined)
      || 'localhost';

    // Vercel passes the original request URL untouched through rewrites.
    // Defensive: if it ever points back at /api/dispatch (which Hono has no route for),
    // try the matched-path header used by some Vercel runtimes.
    let path = req.url || '/';
    if (path.startsWith('/api/dispatch')) {
      const matched = req.headers['x-matched-path'] as string | undefined;
      const original = req.headers['x-vercel-original-pathname'] as string | undefined;
      path = matched || original || path;
    }

    const url = `${proto}://${host}${path}`;
    const method = (req.method || 'GET').toUpperCase();
    const hasBody = !['GET', 'HEAD'].includes(method);

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers || {})) {
      if (typeof v === 'string') headers.set(k, v);
      else if (Array.isArray(v)) headers.set(k, v.join(', '));
    }

    let body: BodyInit | undefined;
    if (hasBody && req.body !== undefined && req.body !== null) {
      if (typeof req.body === 'string') body = req.body;
      else if (Buffer.isBuffer(req.body)) body = req.body;
      else body = JSON.stringify(req.body);
      if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    }

    const webReq = new Request(url, { method, headers, body });
    const webRes = await app.fetch(webReq);

    res.status(webRes.status);
    webRes.headers.forEach((value: string, key: string) => res.setHeader(key, value));
    const buf = Buffer.from(await webRes.arrayBuffer());
    res.end(buf);
  } catch (err) {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.status(500).end(JSON.stringify({
      error: 'function_crash',
      message: (err as Error).message,
      stack: (err as Error).stack?.split('\n').slice(0, 6),
    }));
  }
}
