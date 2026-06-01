/**
 * REAL data source #4 — CoinGecko Bitcoin market snapshot + 1Y history.
 *
 * Powers the Fear & Greed page (Binance-style): current BTC price, 24h volume,
 * total crypto market cap %, and a 365-day daily price series for the overlay
 * chart.
 *
 * Free tier: 10–30 req/min. Cached separately per endpoint (snapshot 5 min,
 * history 6 hours — history barely changes intraday).
 */

const USER_AGENT = 'CoinWiseAI/1.0 (Vietnam fintech assignment)';

export interface BtcSnapshot {
  ok: true;
  source: 'coingecko';
  fetchedAt: string;
  priceUsd: number;
  volume24hUsd: number;
  marketCapUsd: number;
  priceChange24hPct: number;
  marketCapChange24hPct: number;
  totalMarketCapUsd: number;
  totalVolume24hUsd: number;
}
interface BtcSnapshotFail { ok: false; error: string; fetchedAt: string }

export interface BtcHistoryPoint {
  date: string;        // YYYY-MM-DD
  priceUsd: number;
  volumeUsd: number;
}
export interface BtcHistory {
  ok: true;
  source: 'coingecko';
  fetchedAt: string;
  days: number;
  points: BtcHistoryPoint[];
}
interface BtcHistoryFail { ok: false; error: string; fetchedAt: string }

let SNAPSHOT_CACHE: { ts: number; data: BtcSnapshot } | null = null;
const SNAPSHOT_TTL_MS = 5 * 60 * 1000;

let HISTORY_CACHE: { ts: number; days: number; data: BtcHistory } | null = null;
const HISTORY_TTL_MS = 6 * 60 * 60 * 1000; // 6h — daily granularity barely changes

export async function fetchBtcSnapshot(): Promise<BtcSnapshot | BtcSnapshotFail> {
  if (SNAPSHOT_CACHE && Date.now() - SNAPSHOT_CACHE.ts < SNAPSHOT_TTL_MS) return SNAPSHOT_CACHE.data;

  try {
    const [marketsRes, globalRes] = await Promise.all([
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&price_change_percentage=24h', {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      }),
      fetch('https://api.coingecko.com/api/v3/global', {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      }),
    ]);
    if (!marketsRes.ok) throw new Error(`markets_${marketsRes.status}`);
    if (!globalRes.ok) throw new Error(`global_${globalRes.status}`);

    const markets = await marketsRes.json() as Array<{
      current_price: number; total_volume: number; market_cap: number;
      price_change_percentage_24h: number; price_change_percentage_24h_in_currency?: number;
    }>;
    const globalJson = await globalRes.json() as {
      data: {
        total_market_cap: { usd: number };
        total_volume: { usd: number };
        market_cap_change_percentage_24h_usd: number;
      };
    };
    const btc = markets[0];
    if (!btc) throw new Error('empty_markets_payload');

    const snap: BtcSnapshot = {
      ok: true,
      source: 'coingecko',
      fetchedAt: new Date().toISOString(),
      priceUsd: Number(btc.current_price) || 0,
      volume24hUsd: Number(btc.total_volume) || 0,
      marketCapUsd: Number(btc.market_cap) || 0,
      priceChange24hPct: Number(btc.price_change_percentage_24h_in_currency ?? btc.price_change_percentage_24h) || 0,
      marketCapChange24hPct: Number(globalJson.data.market_cap_change_percentage_24h_usd) || 0,
      totalMarketCapUsd: Number(globalJson.data.total_market_cap.usd) || 0,
      totalVolume24hUsd: Number(globalJson.data.total_volume.usd) || 0,
    };
    SNAPSHOT_CACHE = { ts: Date.now(), data: snap };
    return snap;
  } catch (e) {
    return { ok: false, error: (e as Error).message, fetchedAt: new Date().toISOString() };
  }
}

export async function fetchBtcHistory(days = 365): Promise<BtcHistory | BtcHistoryFail> {
  const cappedDays = Math.min(Math.max(days, 7), 365);
  if (HISTORY_CACHE && Date.now() - HISTORY_CACHE.ts < HISTORY_TTL_MS && HISTORY_CACHE.days >= cappedDays) {
    if (HISTORY_CACHE.days === cappedDays) return HISTORY_CACHE.data;
    const trimmed = HISTORY_CACHE.data.points.slice(-cappedDays);
    return { ...HISTORY_CACHE.data, days: cappedDays, points: trimmed };
  }

  try {
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${cappedDays}&interval=daily`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`market_chart_${res.status}`);
    const json = await res.json() as { prices: [number, number][]; total_volumes: [number, number][] };
    if (!json?.prices?.length) throw new Error('empty_history_payload');

    const volByDate = new Map<string, number>();
    for (const [ts, v] of (json.total_volumes || [])) {
      const date = new Date(ts).toISOString().slice(0, 10);
      volByDate.set(date, Number(v) || 0);
    }
    const points: BtcHistoryPoint[] = json.prices.map(([ts, price]) => {
      const date = new Date(ts).toISOString().slice(0, 10);
      return { date, priceUsd: Number(price) || 0, volumeUsd: volByDate.get(date) || 0 };
    });

    const data: BtcHistory = {
      ok: true,
      source: 'coingecko',
      fetchedAt: new Date().toISOString(),
      days: cappedDays,
      points,
    };
    HISTORY_CACHE = { ts: Date.now(), days: cappedDays, data };
    return data;
  } catch (e) {
    return { ok: false, error: (e as Error).message, fetchedAt: new Date().toISOString() };
  }
}
