/**
 * Single Vercel serverless function. Uses dynamic import so that any module
 * load error surfaces inside the handler's catch and is returned to the
 * client instead of triggering Vercel's opaque FUNCTION_INVOCATION_FAILED.
 */
export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  try {
    const mod = await import('./_lib/app').catch((e) => {
      throw new Error('IMPORT_FAILED: ' + (e as Error).message);
    });
    const app = mod.app;
    if (!app) throw new Error('App export is missing from server/app');

    const proto = (req.headers['x-forwarded-proto'] as string | undefined) || 'https';
    const host = (req.headers['x-forwarded-host'] as string | undefined)
      || (req.headers['host'] as string | undefined)
      || 'localhost';

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
    const e = err as Error;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.status(500).end(JSON.stringify({
      error: 'function_crash',
      message: e.message,
      stack: e.stack?.split('\n').slice(0, 12),
    }));
  }
}
