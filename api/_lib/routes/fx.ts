import { Hono } from 'hono';
import { convert, getRates } from '../fx';

export const fxRouter = new Hono();

fxRouter.get('/rates', (c) => c.json(getRates()));

fxRouter.post('/convert', async (c) => {
  const body = await c.req.json().catch(() => null) as { amount?: number; from?: string; to?: string } | null;
  if (!body || typeof body.amount !== 'number' || !body.from || !body.to) {
    return c.json({ error: 'Invalid body. Required: { amount, from, to }' }, 400);
  }
  try {
    const r = convert(body.amount, body.from, body.to);
    return c.json({ amount: body.amount, from: body.from, to: body.to, ...r });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});
