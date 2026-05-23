import { Hono } from 'hono';
import { usdToVnd } from '../fx';
import {
  getSentiment,
  getWhaleFlow,
  getFearGreed,
  getSocialPulse,
  signalFromSentiment,
} from '../ai/altdata';

export const marketRouter = new Hono();

const BINANCE = 'https://api.binance.com/api/v3';

marketRouter.get('/prices', async (c) => {
  const symbolsRaw = c.req.query('symbols') || '';
  const symbols = symbolsRaw ? symbolsRaw.split(',').map((s) => s.trim().toUpperCase()) : [];
  try {
    const res = await fetch(`${BINANCE}/ticker/24hr`);
    const all = (await res.json()) as Array<{
      symbol: string;
      lastPrice: string;
      priceChangePercent: string;
      highPrice: string;
      lowPrice: string;
    }>;
    const set = new Set(symbols);
    const filtered = symbols.length ? all.filter((d) => set.has(d.symbol)) : all.slice(0, 100);
    const out = filtered.map((d) => {
      const price = Number(d.lastPrice);
      const change = Number(d.priceChangePercent);
      const sentiment = getSentiment(d.symbol).score;
      return {
        symbol: d.symbol,
        price,
        priceVnd: usdToVnd(price),
        change24h: change,
        high24h: Number(d.highPrice),
        low24h: Number(d.lowPrice),
        aiSignal: signalFromSentiment(sentiment, change),
      };
    });
    return c.json(out);
  } catch (e) {
    return c.json({ error: 'binance_proxy_failed', detail: (e as Error).message }, 502);
  }
});

marketRouter.get('/:symbol/sentiment', (c) => c.json(getSentiment(c.req.param('symbol'))));

marketRouter.get('/:symbol/whale-flow', (c) => c.json(getWhaleFlow(c.req.param('symbol'))));

marketRouter.get('/fear-greed', (c) => c.json(getFearGreed()));

marketRouter.get('/social-pulse', (c) => c.json(getSocialPulse()));
