import { Hono } from 'hono';
import { usdToVnd } from '../fx';
import {
  getSentiment,
  getFearGreed,
  getSocialPulse,
  signalFromSentiment,
} from '../ai/altdata';
import { fetchLatestNews } from '../ai/sources/cryptoNewsRss';

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

marketRouter.get('/fear-greed', async (c) => c.json(await getFearGreed()));

marketRouter.get('/social-pulse', async (c) => c.json(await getSocialPulse()));

// Real aggregated crypto-news headlines (RSS, no API key). Powers the
// dashboard "Market News" widget.
marketRouter.get('/news', async (c) => {
  const limit = Math.min(20, Math.max(1, Number(c.req.query('limit')) || 8));
  try {
    const items = await fetchLatestNews(limit);
    if (!items.length) return c.json({ items: [], source: 'rss', degraded: true });
    return c.json({ items, source: 'rss', degraded: false, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return c.json({ items: [], source: 'rss', degraded: true, error: (e as Error).message }, 200);
  }
});
