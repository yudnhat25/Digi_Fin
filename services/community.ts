/**
 * Community Pulse — the social layer of CoinWise.
 *
 * Users post short takes ("nhận định") on a coin. Each post is scored by the
 * trained Naive-Bayes sentiment model (server-side, free, no Gemini quota),
 * and the per-coin aggregate becomes a "Community Sentiment" signal that the
 * agentic chatbot can read and blend with the alt-data stack (sentiment,
 * Fear & Greed) when giving advice.
 *
 * Storage: Firebase Realtime Database (same instance the Arena leaderboard
 * uses) under `community/posts/{pushId}` so the feed is realtime out of the box.
 */
import {
  ref,
  push,
  set,
  onValue,
  query,
  orderByChild,
  limitToLast,
  get,
} from 'firebase/database';
import { db } from '../firebaseConfig';
import { apiNbClassify } from './coinwiseApi';

export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export interface CommunityPost {
  id: string;
  symbol: string;          // e.g. "BTCUSDT"
  text: string;
  label: SentimentLabel;   // from the trained NB model
  compound: number;        // ∈ [-1, +1]  (P(pos) − P(neg))
  confidence: number;      // ∈ [0, 1]
  userId: string;
  userName: string;
  createdAt: number;       // epoch ms
}

export interface CommunityPulse {
  symbol: string | 'ALL';
  total: number;            // posts counted (within window)
  bullishPct: number;       // 0-100
  bearishPct: number;       // 0-100
  neutralPct: number;       // 0-100
  weightedCompound: number; // ∈ [-1, +1], confidence-weighted
  score: number;            // 0-100 community mood (50 = neutral)
  label: SentimentLabel;    // dominant class
  trend: 'rising' | 'falling' | 'flat'; // recent half vs older half
  lastPostAt: number | null;
}

const POSTS_PATH = 'community/posts';
const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_FEED = 200;

const postsRef = () => ref(db, POSTS_PATH);

/** Normalise a raw RTDB snapshot value into a typed post. */
function toPost(id: string, v: any): CommunityPost | null {
  if (!v || typeof v.text !== 'string' || typeof v.symbol !== 'string') return null;
  const compound = Number.isFinite(v.compound) ? v.compound : 0;
  return {
    id,
    symbol: String(v.symbol).toUpperCase(),
    text: v.text,
    label: (v.label === 'positive' || v.label === 'negative') ? v.label : 'neutral',
    compound,
    confidence: Number.isFinite(v.confidence) ? v.confidence : 0.5,
    userId: v.userId || 'anon',
    userName: v.userName || 'Anonymous',
    createdAt: Number.isFinite(v.createdAt) ? v.createdAt : Date.now(),
  };
}

/**
 * Score a comment with the trained model, then persist it.
 * Returns the created post (with its NB label) so the UI can show the badge
 * instantly.
 */
/**
 * Score a comment with the trained NB model (server-side, no Gemini quota).
 * Falls back to neutral if the model is unreachable so the UI never blocks.
 */
export async function scoreComment(text: string): Promise<{
  label: SentimentLabel; compound: number; confidence: number;
}> {
  try {
    const nb = await apiNbClassify(text);
    const anyNb = nb as any;
    const compound = Number.isFinite(anyNb.compound)
      ? anyNb.compound
      : Number(((nb.perClassProb?.positive ?? 0) - (nb.perClassProb?.negative ?? 0)).toFixed(4));
    return {
      label: nb.label,
      compound,
      confidence: Number.isFinite(nb.confidence) ? nb.confidence : 0.5,
    };
  } catch {
    return { label: 'neutral', compound: 0, confidence: 0.5 };
  }
}

/** Persist a scored post to Realtime DB. Throws on permission errors. */
export async function persistCommunityPost(post: Omit<CommunityPost, 'id'>): Promise<string> {
  const node = push(postsRef());
  await set(node, post);
  return node.key as string;
}

export async function postCommunityComment(args: {
  symbol: string;
  text: string;
  userId: string;
  userName: string;
}): Promise<CommunityPost> {
  const text = args.text.trim();
  if (!text) throw new Error('Comment is empty.');
  if (text.length > 280) throw new Error('Comment is too long (max 280 characters).');

  const score = await scoreComment(text);
  const post: Omit<CommunityPost, 'id'> = {
    symbol: args.symbol.toUpperCase(),
    text,
    ...score,
    userId: args.userId,
    userName: args.userName,
    createdAt: Date.now(),
  };
  const id = await persistCommunityPost(post);
  return { id, ...post };
}

// ─── Sample seed takes so the feed/verdict look alive before real posts ───
const SEED_AUTHORS = ['cryptojoe', 'anna_trades', 'satoshi_fan', 'degen_lin', 'hodl_mike'];
type Seed = { text: (b: string) => string; label: SentimentLabel; compound: number; confidence: number };
const SEED_TEMPLATES: Seed[] = [
  { text: (b) => `${b} looks ready to break out, strong inflows this week`, label: 'positive', compound: 0.62, confidence: 0.91 },
  { text: (b) => `Accumulating ${b} here, fundamentals still look solid`, label: 'positive', compound: 0.44, confidence: 0.81 },
  { text: (b) => `${b} just chopping sideways, waiting for a clearer signal`, label: 'neutral', compound: 0.02, confidence: 0.7 },
  { text: (b) => `Not loving ${b} price action, momentum is fading fast`, label: 'negative', compound: -0.41, confidence: 0.83 },
  { text: (b) => `${b} could dump if it loses this support, staying cautious`, label: 'negative', compound: -0.56, confidence: 0.88 },
];

/** Deterministic sample posts for a coin (local-only; not persisted). */
export function seedPostsFor(symbol: string): CommunityPost[] {
  const sym = symbol.toUpperCase();
  const base = sym.replace(/USDT$|USD$/i, '');
  const now = Date.now();
  return SEED_TEMPLATES.map((s, i) => ({
    id: `seed-${base}-${i}`,
    symbol: sym,
    text: s.text(base),
    label: s.label,
    compound: s.compound,
    confidence: s.confidence,
    userId: 'seed',
    userName: SEED_AUTHORS[i % SEED_AUTHORS.length],
    createdAt: now - (i + 1) * 6 * 60 * 1000, // staggered over the last ~30 min
  }));
}

export const isSeedPost = (p: CommunityPost) => p.userId === 'seed' || p.id.startsWith('seed-');

/**
 * Live subscription to the community feed. Returns an unsubscribe fn.
 * If `symbol` is given, only posts for that coin are delivered.
 */
export function subscribeCommunityFeed(
  symbol: string | null,
  cb: (posts: CommunityPost[]) => void,
): () => void {
  const q = query(postsRef(), orderByChild('createdAt'), limitToLast(MAX_FEED));
  const unsub = onValue(q, (snap) => {
    const out: CommunityPost[] = [];
    snap.forEach((child) => {
      const p = toPost(child.key as string, child.val());
      if (p && (!symbol || p.symbol === symbol.toUpperCase())) out.push(p);
    });
    out.sort((a, b) => b.createdAt - a.createdAt); // newest first
    cb(out);
  });
  return unsub;
}

/** Aggregate a list of posts into a single pulse object. */
export function aggregatePulse(
  posts: CommunityPost[],
  symbol: string | 'ALL',
  windowMs = DEFAULT_WINDOW_MS,
): CommunityPulse {
  const now = Date.now();
  const inWindow = posts.filter((p) => now - p.createdAt <= windowMs);
  const total = inWindow.length;

  if (total === 0) {
    return {
      symbol, total: 0, bullishPct: 0, bearishPct: 0, neutralPct: 0,
      weightedCompound: 0, score: 50, label: 'neutral', trend: 'flat',
      lastPostAt: null,
    };
  }

  const counts = { positive: 0, negative: 0, neutral: 0 };
  let wSum = 0;
  let wCompound = 0;
  for (const p of inWindow) {
    counts[p.label]++;
    const w = Math.max(0.1, p.confidence);
    wSum += w;
    wCompound += p.compound * w;
  }
  const weightedCompound = Number((wCompound / (wSum || 1)).toFixed(4));

  const bullishPct = Math.round((counts.positive / total) * 100);
  const bearishPct = Math.round((counts.negative / total) * 100);
  const neutralPct = Math.max(0, 100 - bullishPct - bearishPct);

  const label: SentimentLabel =
    counts.positive >= counts.negative && counts.positive >= counts.neutral ? 'positive' :
    counts.negative >= counts.neutral ? 'negative' : 'neutral';

  // mood score 0-100: map weightedCompound [-1,1] → [0,100]
  const score = Math.round(Math.min(100, Math.max(0, (weightedCompound + 1) * 50)));

  // trend: compare avg compound of newer half vs older half (chronological)
  const chrono = [...inWindow].sort((a, b) => a.createdAt - b.createdAt);
  const mid = Math.floor(chrono.length / 2);
  const avg = (arr: CommunityPost[]) =>
    arr.length ? arr.reduce((s, p) => s + p.compound, 0) / arr.length : 0;
  const older = avg(chrono.slice(0, mid));
  const newer = avg(chrono.slice(mid));
  const diff = newer - older;
  const trend: CommunityPulse['trend'] = diff > 0.08 ? 'rising' : diff < -0.08 ? 'falling' : 'flat';

  return {
    symbol, total, bullishPct, bearishPct, neutralPct,
    weightedCompound, score, label, trend,
    lastPostAt: chrono[chrono.length - 1]?.createdAt ?? null,
  };
}

/**
 * One-shot pulse fetch for a symbol (or ALL). Used by the chatbot tool so it
 * can read the community mood without holding a live subscription.
 */
export async function getCommunityPulse(
  symbol?: string,
  windowMs = DEFAULT_WINDOW_MS,
): Promise<CommunityPulse> {
  const q = query(postsRef(), orderByChild('createdAt'), limitToLast(MAX_FEED));
  const snap = await get(q);
  const all: CommunityPost[] = [];
  snap.forEach((child) => {
    const p = toPost(child.key as string, child.val());
    if (p) all.push(p);
  });
  const sym = symbol ? symbol.toUpperCase() : null;
  const filtered = sym ? all.filter((p) => p.symbol === sym) : all;
  return aggregatePulse(filtered, sym ?? 'ALL', windowMs);
}

export const labelToText = (l: SentimentLabel): string =>
  l === 'positive' ? 'Positive' : l === 'negative' ? 'Negative' : 'Neutral';
