/**
 * REAL data source #2 — alternative.me Crypto Fear & Greed Index.
 *
 * Endpoint: https://api.alternative.me/fng/?limit=30
 * No auth, no rate-limit headache for low-traffic apps. Cached 30 min.
 *
 * The index is itself a composite alt-data score (50 % volatility,
 * 25 % market momentum, 15 % social media volume, 10 % survey), so
 * surfacing it directly already satisfies the assignment's "social media
 * sentiment + market mood" alt-data category.
 */

export interface FearGreedPoint {
  date: string;        // YYYY-MM-DD
  value: number;       // 0–100
  classification: string;
}

export interface FearGreedReal {
  ok: true;
  source: 'alternative.me';
  fetchedAt: string;
  current: FearGreedPoint;
  delta24h: number;
  delta7d: number;
  history: FearGreedPoint[];
}

interface FearGreedFail {
  ok: false;
  error: string;
  fetchedAt: string;
}

interface CacheEntry { ts: number; data: FearGreedReal }
let CACHE: CacheEntry | null = null;
const TTL_MS = 30 * 60 * 1000; // 30 minutes (the upstream index only updates daily anyway)

const USER_AGENT = 'CoinWiseAI/1.0 (Vietnam fintech assignment)';

export async function fetchFearGreedReal(): Promise<FearGreedReal | FearGreedFail> {
  if (CACHE && Date.now() - CACHE.ts < TTL_MS) return CACHE.data;

  try {
    const url = 'https://api.alternative.me/fng/?limit=30&format=json';
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`alternative.me responded ${res.status}`);
    const json = (await res.json()) as {
      data: { value: string; value_classification: string; timestamp: string }[];
      metadata?: { error?: string | null };
    };
    if (!json?.data?.length) throw new Error('empty payload');

    // alternative.me returns newest first. Convert to oldest → newest for charts.
    const points: FearGreedPoint[] = json.data
      .map((d) => ({
        date: new Date(Number(d.timestamp) * 1000).toISOString().slice(0, 10),
        value: Number(d.value),
        classification: d.value_classification,
      }))
      .reverse();

    const current = points[points.length - 1];
    const yesterday = points[points.length - 2];
    const lastWeek = points[points.length - 8] || points[0];

    const data: FearGreedReal = {
      ok: true,
      source: 'alternative.me',
      fetchedAt: new Date().toISOString(),
      current,
      delta24h: yesterday ? current.value - yesterday.value : 0,
      delta7d: lastWeek ? current.value - lastWeek.value : 0,
      history: points,
    };
    CACHE = { ts: Date.now(), data };
    return data;
  } catch (e) {
    return { ok: false, error: (e as Error).message, fetchedAt: new Date().toISOString() };
  }
}

export async function pingFearGreed(): Promise<{ ok: boolean; latencyMs: number; value?: number; error?: string }> {
  const t0 = Date.now();
  const r = await fetchFearGreedReal();
  if (r.ok === true) return { ok: true, latencyMs: Date.now() - t0, value: r.current.value };
  const err = 'error' in r ? r.error : 'unknown';
  return { ok: false, latencyMs: Date.now() - t0, error: err };
}
