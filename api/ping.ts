/**
 * Minimal health endpoint — no imports, no Hono — used to verify that
 * Vercel serverless functions are deploying & responding at all.
 * If THIS works but /api/v1/* doesn't, the issue is in the Hono app bundling.
 */
export const config = { runtime: 'nodejs' };

export default function handler(_req: Request): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      env: typeof process !== 'undefined' ? 'nodejs' : 'edge',
      time: new Date().toISOString(),
    }),
    { headers: { 'content-type': 'application/json' } },
  );
}
