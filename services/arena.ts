/**
 * Arena perpetual cycle math — shared between App.tsx (for entry/exit
 * orchestration) and CompetitionView (for the live timer display).
 *
 * The whole cycle is derived from a single anchor timestamp stored in
 * localStorage. As long as every client reads the same anchor, every tab,
 * window, and reload shows the same round number and remaining time.
 */
export const ROUND_MS = 3 * 60 * 1000;
export const BREAK_MS = 30 * 1000;
export const CYCLE_MS = ROUND_MS + BREAK_MS;
const ANCHOR_KEY = 'coinwise_arena_anchor';

export function getCycleAnchor(): number {
  if (typeof window === 'undefined') return Date.now();
  const stored = Number(localStorage.getItem(ANCHOR_KEY));
  if (Number.isFinite(stored) && stored > 0) return stored;
  const now = Date.now();
  localStorage.setItem(ANCHOR_KEY, String(now));
  return now;
}

export interface ArenaTick {
  phase: 'active' | 'break';
  remainingMs: number;
  roundIndex: number;
  display: string;
}

export function computeArenaTick(anchor: number = getCycleAnchor()): ArenaTick {
  const elapsed = (Date.now() - anchor) % CYCLE_MS;
  const phase: 'active' | 'break' = elapsed < ROUND_MS ? 'active' : 'break';
  const remainingMs = phase === 'active' ? ROUND_MS - elapsed : CYCLE_MS - elapsed;
  const roundIndex = Math.floor((Date.now() - anchor) / CYCLE_MS) + 1;
  const m = Math.floor(remainingMs / 60000);
  const s = Math.floor((remainingMs % 60000) / 1000);
  const display = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return { phase, remainingMs, roundIndex, display };
}

/**
 * When the round that a user joining RIGHT NOW will start.
 *  - During an active round: the user joins the round in progress, so it
 *    "starts" for them right now (Date.now()).
 *  - During a break: the user is queued and the round actually starts when
 *    the break ends.
 */
export function computeNextRoundStartsAt(anchor: number = getCycleAnchor()): number {
  const tick = computeArenaTick(anchor);
  if (tick.phase === 'active') {
    return Date.now();
  }
  return Date.now() + tick.remainingMs;
}

/**
 * When the round that a user joining RIGHT NOW will end.
 *  - During an active round: end of the current round (partial round, less
 *    than 3 minutes of trading).
 *  - During a break: end of the upcoming round (full 3 minutes).
 */
export function computeRoundEndsAt(anchor: number = getCycleAnchor()): number {
  const tick = computeArenaTick(anchor);
  if (tick.phase === 'active') {
    return Date.now() + tick.remainingMs;
  }
  return Date.now() + tick.remainingMs + ROUND_MS;
}
