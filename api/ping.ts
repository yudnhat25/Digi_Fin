/**
 * Minimal Vercel Node function — uses classic (req, res) signature so we know
 * the Vercel function infrastructure is reachable at all.
 */
export const config = { runtime: 'nodejs' };

export default function handler(req: any, res: any) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.status(200).end(JSON.stringify({
    ok: true,
    time: new Date().toISOString(),
    url: req.url,
    method: req.method,
  }));
}
