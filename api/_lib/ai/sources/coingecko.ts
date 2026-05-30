/**
 * REAL data source #3 — CoinGecko community signals.
 *
 * Endpoint: https://api.coingecko.com/api/v3/coins/{id}?community_data=true
 *
 * Free tier: 10–30 req/min. We cache 10 minutes per coin id.
 * Surfaces:
 *   - sentiment_votes_up_percentage     (community ↑ vote share)
 *   - sentiment_votes_down_percentage
 *   - public_interest_stats.alexa_rank  (web traffic proxy — Alexa rank lower = more traffic)
 *   - community_data.reddit_subscribers / reddit_average_posts_48h
 *   - community_data.twitter_followers
 */

export interface CoinGeckoSignals {
  ok: true;
  source: 'coingecko';
  coinId: string;
  fetchedAt: string;
  voteUpPct: number;          // 0–100, share of community votes Up
  voteDownPct: number;
  redditSubscribers: number;
  redditPosts48h: number;
  twitterFollowers: number;
  developerScore: number;     // 0–100 (commits, prs, issues blend)
  communityScore: number;     // 0–100 (CoinGecko's own composite)
  alexaRank: number | null;
}

interface CoinGeckoFail { ok: false; coinId: string; error: string; fetchedAt: string }

const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  XRP: 'ripple', DOGE: 'dogecoin', ADA: 'cardano', AVAX: 'avalanche-2',
  LINK: 'chainlink', DOT: 'polkadot', SHIB: 'shiba-inu', NEAR: 'near',
  WIF: 'dogwifcoin', PEPE: 'pepe', TIA: 'celestia', INJ: 'injective-protocol',
  ARB: 'arbitrum', OP: 'optimism',
};

interface CacheEntry { ts: number; data: CoinGeckoSignals }
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 10 * 60 * 1000;

const USER_AGENT = 'CoinWiseAI/1.0 (Vietnam fintech assignment)';

export async function fetchCoinGecko(symbol: string): Promise<CoinGeckoSignals | CoinGeckoFail> {
  const base = symbol.replace(/USDT$|USD$/i, '').toUpperCase();
  const coinId = COIN_IDS[base];
  if (!coinId) {
    return { ok: false, coinId: base, error: 'unknown_coin_id', fetchedAt: new Date().toISOString() };
  }

  const hit = CACHE.get(coinId);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data;

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}` +
      '?localization=false&tickers=false&market_data=false' +
      '&community_data=true&developer_data=true&sparkline=false';
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`coingecko_${res.status}`);
    const json = (await res.json()) as any;

    const data: CoinGeckoSignals = {
      ok: true,
      source: 'coingecko',
      coinId,
      fetchedAt: new Date().toISOString(),
      voteUpPct: Number(json.sentiment_votes_up_percentage) || 0,
      voteDownPct: Number(json.sentiment_votes_down_percentage) || 0,
      redditSubscribers: Number(json.community_data?.reddit_subscribers) || 0,
      redditPosts48h: Number(json.community_data?.reddit_average_posts_48h) || 0,
      twitterFollowers: Number(json.community_data?.twitter_followers) || 0,
      developerScore: Number(json.developer_score) || 0,
      communityScore: Number(json.community_score) || 0,
      alexaRank: json.public_interest_stats?.alexa_rank ?? null,
    };
    CACHE.set(coinId, { ts: Date.now(), data });
    return data;
  } catch (e) {
    return { ok: false, coinId, error: (e as Error).message, fetchedAt: new Date().toISOString() };
  }
}

export async function pingCoinGecko(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const t0 = Date.now();
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/ping', {
      headers: { 'User-Agent': USER_AGENT },
    });
    return { ok: res.ok, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, error: (e as Error).message };
  }
}
