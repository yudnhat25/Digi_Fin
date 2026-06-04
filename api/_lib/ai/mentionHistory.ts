/**
 * Persistent mention-volume history for the Z-score anomaly detector.
 *
 * The detector used an in-memory ring buffer, which Vercel wipes on every cold
 * start — so the baseline never accumulated and the z-score sat at 0 / NORMAL
 * forever. We now persist the rolling history in Firebase RTDB (the same store
 * the bank uses), so the baseline survives cold starts and a real surge in
 * chatter can actually trip the SPIKE flag.
 *
 * Storage path — note: the serverless backend calls RTDB over REST WITHOUT an
 * auth token, and in database.rules.json only `/banks` is world-writable (every
 * other node requires auth). So we park this under a RESERVED key inside /banks
 * (`__altdata_mentions`). It can never collide with a real account: account keys
 * come from Firebase-Auth emails and nothing ever enumerates the /banks node.
 * (If you later open a dedicated `/altdata` rule, just change PATH below.)
 *
 * Sampling: keep at most 24 samples; accumulate a NEW sample only when
 * >= MIN_GAP_MS has elapsed since the last one (bursty page reloads overwrite
 * the latest sample instead of flooding the window). The z-score baseline uses
 * only samples OLDER than the gap — genuine past observations — so the current
 * reading is never compared against itself.
 */
const FIREBASE_DB_URL =
  'https://gen-lang-client-0742583847-default-rtdb.asia-southeast1.firebasedatabase.app';
const PATH = 'banks/__altdata_mentions'; // reserved key under the world-writable /banks node
const HISTORY_MAX = 24;
const MIN_GAP_MS = 30 * 60 * 1000; // >= 30 min between accumulated samples

export interface MentionSample { ts: number; count: number }
export interface MentionStats { z: number; mean: number; std: number; n: number; spike: boolean }

function coinKey(coin: string): string {
  return coin.replace(/[.#$/\[\]]/g, '_').toUpperCase();
}
function url(coin: string): string {
  return `${FIREBASE_DB_URL}/${PATH}/${encodeURIComponent(coinKey(coin))}.json`;
}

async function load(coin: string): Promise<MentionSample[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const res = await fetch(url(coin), { signal: ctrl.signal });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((s) => s && typeof s.ts === 'number' && typeof s.count === 'number')
      .sort((a, b) => a.ts - b.ts);
  } catch {
    return []; // RTDB hiccup → behave like a cold history (z=0/NORMAL), never throw
  } finally {
    clearTimeout(timer);
  }
}

async function save(coin: string, arr: MentionSample[]): Promise<void> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    await fetch(url(coin), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(arr),
      signal: ctrl.signal,
    });
  } catch {
    /* non-critical: next run just has a slightly shorter history */
  } finally {
    clearTimeout(timer);
  }
}

function stats(baseline: number[], current: number): { z: number; mean: number; std: number; n: number } {
  if (baseline.length < 3) return { z: 0, mean: current, std: 0, n: baseline.length };
  const mean = baseline.reduce((s, v) => s + v, 0) / baseline.length;
  const variance = baseline.reduce((s, v) => s + (v - mean) ** 2, 0) / baseline.length;
  const std = Math.sqrt(variance);
  const z = std > 0 ? (current - mean) / std : 0;
  return { z: Number(z.toFixed(2)), mean: Math.round(mean), std: Math.round(std), n: baseline.length };
}

/**
 * Score the current mention count against the persisted baseline, then record
 * it. Returns { z, mean, std, n, spike }. `spike` needs z > 1.5σ over >= 5 past
 * samples, so it only fires once a genuine multi-hour baseline exists.
 */
export async function recordAndScore(coin: string, current: number, nowMs: number): Promise<MentionStats> {
  const hist = await load(coin);
  // Baseline = genuine PAST observations (older than the de-dupe gap) so the
  // current reading is never part of its own baseline.
  const baseline = hist.filter((s) => nowMs - s.ts >= MIN_GAP_MS).map((s) => s.count);
  const s = stats(baseline, current);

  // Accumulate: overwrite the latest sample if it's within the gap (burst of
  // page loads), otherwise append a fresh one. Cap to the last HISTORY_MAX.
  let next = hist.slice();
  if (next.length && nowMs - next[next.length - 1].ts < MIN_GAP_MS) {
    next[next.length - 1] = { ts: nowMs, count: current };
  } else {
    next.push({ ts: nowMs, count: current });
  }
  if (next.length > HISTORY_MAX) next = next.slice(next.length - HISTORY_MAX);
  await save(coin, next);

  return { ...s, spike: s.z > 1.5 && s.n >= 5 };
}
