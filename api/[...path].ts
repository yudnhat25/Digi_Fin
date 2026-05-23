/**
 * Vercel serverless entry — adapts Vercel's Node-style (req, res) handler
 * into a Web standard Request for the shared Hono `app`, then streams the
 * Response back through res.
 *
 * This is more explicit than `hono/vercel.handle()` and avoids the runtime
 * mismatch that caused 30s timeouts.
 */
import { app } from '../server/app';

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  try {
    const proto = (req.headers['x-forwarded-proto'] as string | undefined) || 'https';
    const host = (req.headers['x-forwarded-host'] as string | undefined)
      || (req.headers['host'] as string | undefined)
      || 'localhost';
    const url = `${proto}://${host}${req.url || '/'}`;

    const method = (req.method || 'GET').toUpperCase();
    const hasBody = !['GET', 'HEAD'].includes(method);

    // Copy headers across.
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
    }

    const webReq = new Request(url, { method, headers, body });
    const webRes = await app.fetch(webReq);

    res.status(webRes.status);
    webRes.headers.forEach((value, key) => res.setHeader(key, value));
    const buf = Buffer.from(await webRes.arrayBuffer());
    res.end(buf);
  } catch (err) {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.status(500).end(JSON.stringify({
      error: 'function_crash',
      message: (err as Error).message,
      stack: (err as Error).stack?.split('\n').slice(0, 5),
    }));
  }
}
