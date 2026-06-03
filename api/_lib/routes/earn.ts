import { Hono } from 'hono';
import { getEarnYields } from '../earn';

export const earnRouter = new Hono();

// Live per-asset APY (median of reputable DefiLlama pools, cached 30 min).
// Frontend overlays these onto the static Earn product catalog.
earnRouter.get('/yields', async (c) => c.json(await getEarnYields()));
