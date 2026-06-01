import React, { useEffect, useMemo, useState } from 'react';
import { UserState, MarketData } from '../types';
import {
  CommunityPost,
  CommunityPulse as Pulse,
  SentimentLabel,
  scoreComment,
  persistCommunityPost,
  subscribeCommunityFeed,
  aggregatePulse,
  seedPostsFor,
  isSeedPost,
  labelToText,
} from '../services/community';
import { getGeminiResponse } from '../services/geminiService';
import { apiCoinInsight, CoinInsight } from '../services/coinwiseApi';

interface Props {
  userState: UserState;
  marketData: MarketData[];
}

const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];

// ─── small presentational helpers ───
const labelTone = (l: SentimentLabel) =>
  l === 'positive'
    ? { text: 'text-emerald-300', bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400' }
    : l === 'negative'
    ? { text: 'text-rose-300', bg: 'bg-rose-500/15', ring: 'ring-rose-500/30', dot: 'bg-rose-400' }
    : { text: 'text-slate-300', bg: 'bg-slate-500/15', ring: 'ring-slate-500/30', dot: 'bg-slate-400' };

const timeAgo = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const SentimentBadge: React.FC<{ label: SentimentLabel }> = ({ label }) => {
  const t = labelTone(label);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${t.bg} ${t.text} ${t.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
      {labelToText(label)}
    </span>
  );
};

const MoodScore: React.FC<{ pulse: Pulse }> = ({ pulse }) => {
  const tone = pulse.score >= 60 ? 'text-emerald-400' : pulse.score <= 40 ? 'text-rose-400' : 'text-amber-400';
  const trendIcon = pulse.trend === 'rising' ? '↗' : pulse.trend === 'falling' ? '↘' : '→';
  const trendText = pulse.trend === 'rising' ? 'rising' : pulse.trend === 'falling' ? 'falling' : 'stable';
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-4xl font-bold tabular-nums ${tone}`}>{pulse.score}</span>
      <span className="text-slate-500 text-sm">/100</span>
      <span className={`ml-1 text-sm ${tone}`}>{trendIcon} {trendText}</span>
    </div>
  );
};

const Bars: React.FC<{ pulse: Pulse }> = ({ pulse }) => (
  <div className="space-y-2">
    {([
      ['Positive', pulse.bullishPct, 'bg-emerald-500'],
      ['Neutral', pulse.neutralPct, 'bg-slate-500'],
      ['Negative', pulse.bearishPct, 'bg-rose-500'],
    ] as const).map(([name, pct, color]) => (
      <div key={name} className="flex items-center gap-3 text-sm">
        <span className="w-16 text-slate-400">{name}</span>
        <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
        <span className="w-10 text-right tabular-nums text-slate-300">{pct}%</span>
      </div>
    ))}
  </div>
);

// ─── Deterministic market verdict: community comments + news/alt-data + F&G ───
type VerdictTone = 'good' | 'soft-good' | 'neutral' | 'soft-bad' | 'bad';
interface Verdict {
  score: number;          // 0-100 blended
  tone: VerdictTone;
  label: string;          // verdict word
  rationale: string;
  warning: string | null; // divergence / FOMO caution
  parts: { community: number | null; news: number | null; fearGreed: number | null };
}

function computeVerdict(pulse: Pulse, insight: CoinInsight | null): Verdict {
  const community = pulse.total > 0 ? pulse.score : null;
  const news = insight?.sentiment ? Math.round((insight.sentiment.score + 1) * 50) : null;
  const fearGreed = insight?.fearGreed ? insight.fearGreed.value : null;

  const parts: { v: number; w: number }[] = [];
  if (community !== null) parts.push({ v: community, w: 0.5 });
  if (news !== null) parts.push({ v: news, w: 0.35 });
  if (fearGreed !== null) parts.push({ v: fearGreed, w: 0.15 });
  const wSum = parts.reduce((s, p) => s + p.w, 0) || 1;
  const score = Math.round(parts.reduce((s, p) => s + p.v * p.w, 0) / wSum) || 50;

  const tone: VerdictTone =
    score >= 66 ? 'good' : score >= 55 ? 'soft-good' : score >= 45 ? 'neutral' : score >= 35 ? 'soft-bad' : 'bad';
  const label =
    tone === 'good' ? 'Bullish' : tone === 'soft-good' ? 'Leaning bullish' :
    tone === 'neutral' ? 'Neutral' : tone === 'soft-bad' ? 'Leaning bearish' : 'Bearish';

  const bits: string[] = [];
  if (community !== null) bits.push(`community ${community}/100 (${pulse.total} takes)`);
  if (news !== null) bits.push(`news/alt-data ${news}/100`);
  if (fearGreed !== null) bits.push(`Fear & Greed ${fearGreed}`);
  const rationale = bits.length
    ? `Blends ${bits.join(' · ')}.`
    : 'Not enough community or alt-data signal yet.';

  let warning: string | null = null;
  const signal = insight?.signal;
  if (community !== null && community >= 60 && (signal === 'SELL' || signal === 'STRONG_SELL')) {
    warning = '⚠️ Crowd is bullish but the alt-data signal says SELL — watch for FOMO.';
  } else if (community !== null && community >= 60 && fearGreed !== null && fearGreed >= 75) {
    warning = '⚠️ Crowd euphoria during Extreme Greed — elevated reversal risk.';
  } else if (community !== null && community <= 40 && (signal === 'BUY' || signal === 'STRONG_BUY')) {
    warning = 'ℹ️ Crowd is more bearish than the market signal — possible accumulation zone.';
  }

  return { score, tone, label, rationale, warning, parts: { community, news, fearGreed } };
}

const verdictStyle = (t: VerdictTone) =>
  t === 'good' ? { ring: 'ring-emerald-500/40', text: 'text-emerald-300', bar: 'bg-emerald-500', glow: 'bg-emerald-500/10' } :
  t === 'soft-good' ? { ring: 'ring-emerald-500/30', text: 'text-emerald-300', bar: 'bg-emerald-500/80', glow: 'bg-emerald-500/10' } :
  t === 'neutral' ? { ring: 'ring-amber-500/30', text: 'text-amber-300', bar: 'bg-amber-400', glow: 'bg-amber-500/10' } :
  t === 'soft-bad' ? { ring: 'ring-rose-500/30', text: 'text-rose-300', bar: 'bg-rose-500/80', glow: 'bg-rose-500/10' } :
  { ring: 'ring-rose-500/40', text: 'text-rose-300', bar: 'bg-rose-500', glow: 'bg-rose-500/10' };

const CommunityPulse: React.FC<Props> = ({ userState, marketData }) => {
  const symbols = useMemo(() => {
    const fromMarket = (marketData || [])
      .filter((m) => m?.symbol?.endsWith('USDT'))
      .slice(0, 6)
      .map((m) => m.symbol);
    return Array.from(new Set([...DEFAULT_SYMBOLS, ...fromMarket])).slice(0, 6);
  }, [marketData]);

  const [symbol, setSymbol] = useState(symbols[0] || 'BTCUSDT');
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [localExtra, setLocalExtra] = useState<CommunityPost[]>([]); // optimistic posts when persistence is blocked
  const [permissionIssue, setPermissionIssue] = useState(false);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBadge, setLastBadge] = useState<SentimentLabel | null>(null);

  // Inline AI
  const [aiQuestion, setAiQuestion] = useState('');
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  // Live alt-data insight (news sentiment + whale + Fear&Greed) for the verdict.
  const [insight, setInsight] = useState<CoinInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    if (!symbols.includes(symbol)) setSymbol(symbols[0] || 'BTCUSDT');
  }, [symbols]); // eslint-disable-line

  useEffect(() => {
    setAdvice(null);
    const unsub = subscribeCommunityFeed(symbol, setFeed);
    return () => unsub();
  }, [symbol]);

  // Pull alt-data insight whenever the coin changes so the verdict blends
  // community comments with news/market signals automatically.
  useEffect(() => {
    let alive = true;
    setInsight(null);
    setInsightLoading(true);
    apiCoinInsight(symbol)
      .then((r) => { if (alive) setInsight(r); })
      .catch(() => { if (alive) setInsight(null); })
      .finally(() => { if (alive) setInsightLoading(false); });
    return () => { alive = false; };
  }, [symbol]);

  const seeds = useMemo(() => seedPostsFor(symbol), [symbol]);
  const localForSym = useMemo(() => localExtra.filter((p) => p.symbol === symbol), [localExtra, symbol]);

  // Live data wins; otherwise show optimistic local posts + sample seeds.
  const effectiveFeed = feed.length > 0 ? feed : [...localForSym, ...seeds];
  const showingSamples = feed.length === 0 && localForSym.length === 0;

  const pulse = useMemo(() => aggregatePulse(effectiveFeed, symbol), [effectiveFeed, symbol]);
  const verdict = useMemo(() => computeVerdict(pulse, insight), [pulse, insight]);
  const base = symbol.replace('USDT', '');

  const handlePost = async () => {
    const text = draft.trim();
    if (!text || posting) return;
    setPosting(true);
    setError(null);
    try {
      const score = await scoreComment(text); // trained model scores it
      setLastBadge(score.label);
      const post: Omit<CommunityPost, 'id'> = {
        symbol, text, ...score,
        userId: userState.accountId,
        userName: userState.name,
        createdAt: Date.now(),
      };
      try {
        await persistCommunityPost(post); // live subscription will pick it up
        setPermissionIssue(false);
      } catch {
        // Persistence blocked (e.g. RTDB rules) — keep it locally so the demo
        // still works, and surface a hint.
        setLocalExtra((prev) => [{ id: `local-${Math.random().toString(36).slice(2)}`, ...post }, ...prev]);
        setPermissionIssue(true);
      }
      setDraft('');
      setTimeout(() => setLastBadge(null), 4000);
    } catch (e) {
      setError((e as Error).message || 'Could not post, please try again.');
    } finally {
      setPosting(false);
    }
  };

  const askAI = async (question?: string) => {
    if (adviceLoading) return;
    setAdviceLoading(true);
    setAdvice(null);
    try {
      let insightLine = '';
      if (insight) {
        insightLine = `Alt-data ${base}: sentiment ${insight.sentiment?.label ?? 'n/a'} (${insight.sentiment?.score ?? '?'}), ` +
          `whale net flow 24h ${insight.whale?.netFlow24hUsd ?? '?'} USD, Fear & Greed ${insight.fearGreed?.value ?? '?'} (${insight.fearGreed?.classification ?? '?'}), signal ${insight.signal ?? '?'}.`;
      }
      const q = (question || '').trim();
      const prompt =
        (q
          ? `User question about ${base}: "${q}"\n\n`
          : `Assess the current market state of ${base} and give a short verdict.\n\n`) +
        `CoinWise community mood (trained NLP model scored ${pulse.total} takes in 24h):\n` +
        `- Mood score: ${pulse.score}/100 (${pulse.label}, trend ${pulse.trend}).\n` +
        `- Positive ${pulse.bullishPct}% · Neutral ${pulse.neutralPct}% · Negative ${pulse.bearishPct}%.\n` +
        (insightLine ? `\n${insightLine}\n` : '') +
        `\nCombine community mood with the alt-data. If the crowd is bullish but alt-data/whale flow disagree, WARN about FOMO risk. ` +
        `Answer in English, max 4 sentences, and remind the user this is simulated paper trading.`;

      const text = await getGeminiResponse(prompt, userState, marketData);
      setAdvice(text);
    } catch {
      setAdvice('⚠️ Could not fetch AI advice (check the Gemini API key / quota).');
    } finally {
      setAdviceLoading(false);
    }
  };

  const st = verdictStyle(verdict.tone);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <span className="text-fuchsia-400">💬</span> Community Pulse
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Takes auto-scored by the trained NLP model → per-coin sentiment + AI verdict.
          </p>
        </div>
      </div>

      {/* Coin selector */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {symbols.map((s) => (
          <button
            key={s}
            onClick={() => setSymbol(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              s === symbol ? 'bg-fuchsia-500/20 text-fuchsia-300 ring-1 ring-fuchsia-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {s.replace('USDT', '')}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Market verdict — community comments + news/alt-data + Fear&Greed */}
        <div className={`relative overflow-hidden rounded-xl bg-slate-950/50 border border-slate-800 ring-1 ${st.ring} p-4`}>
          <div className={`absolute -top-12 -right-12 w-40 h-40 ${st.glow} rounded-full blur-3xl`} />
          <div className="relative flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Market verdict · {base}</span>
            {insightLoading && <span className="text-[10px] text-slate-600">reading news…</span>}
          </div>
          <div className="relative flex items-baseline gap-3">
            <span className={`text-3xl font-bold ${st.text}`}>{verdict.label}</span>
            <span className="text-slate-500 text-sm tabular-nums">{verdict.score}/100</span>
          </div>
          <div className="relative mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className={`h-full ${st.bar} transition-all duration-500`} style={{ width: `${verdict.score}%` }} />
          </div>
          <p className="relative text-xs text-slate-400 mt-3 leading-relaxed">{verdict.rationale}</p>
          <div className="relative flex flex-wrap gap-1.5 mt-2.5">
            {verdict.parts.community !== null && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-fuchsia-500/10 text-fuchsia-300 ring-1 ring-fuchsia-500/20">💬 Community {verdict.parts.community}</span>
            )}
            {verdict.parts.news !== null && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20">📰 News/alt-data {verdict.parts.news}</span>
            )}
            {verdict.parts.fearGreed !== null && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20">😨 F&G {verdict.parts.fearGreed}</span>
            )}
          </div>
          {verdict.warning && (
            <p className="relative text-xs text-amber-300 mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 leading-relaxed">
              {verdict.warning}
            </p>
          )}
        </div>

        {/* Community mood */}
        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Community sentiment · {base} · 24h</span>
            <span className="text-xs text-slate-600">{pulse.total} takes</span>
          </div>
          <MoodScore pulse={pulse} />
          <div className="mt-4">
            <Bars pulse={pulse} />
          </div>
        </div>

        {/* Composer */}
        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4">
          <label className="text-sm text-slate-400">Post a take on {base}</label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder={`e.g. "${base} looks ready to break out, strong inflows"`}
            className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">{draft.length}/280</span>
              {lastBadge && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  Model scored: <SentimentBadge label={lastBadge} />
                </span>
              )}
            </div>
            <button
              onClick={handlePost}
              disabled={posting || !draft.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-fuchsia-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-fuchsia-400 transition"
            >
              {posting ? 'Scoring…' : 'Post'}
            </button>
          </div>
          {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
          {permissionIssue && (
            <p className="text-[11px] text-amber-300/90 mt-2 leading-relaxed">
              Saved locally only — to persist & share comments, publish the Realtime Database rules in
              <code className="mx-1 text-amber-200">database.rules.json</code>(Firebase console → Realtime Database → Rules).
            </p>
          )}
        </div>

        {/* Inline AI */}
        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4 space-y-2">
          <span className="text-sm text-slate-400">Ask the AI about {base}</span>
          <div className="flex gap-2">
            <input
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askAI(aiQuestion)}
              placeholder={`e.g. "Is now a good time to buy ${base}?"`}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50"
            />
            <button
              onClick={() => askAI(aiQuestion)}
              disabled={adviceLoading}
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-fuchsia-500 text-white disabled:opacity-50 hover:bg-fuchsia-400 transition"
            >
              Ask
            </button>
          </div>
          <button
            onClick={() => askAI()}
            disabled={adviceLoading}
            className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white disabled:opacity-50 hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            🤖 {adviceLoading ? 'AI is reading the community + alt-data…' : 'Analyze market state (community + alt-data)'}
          </button>
          {advice && (
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/30 p-4 text-sm text-violet-100 leading-relaxed whitespace-pre-wrap">
              {advice}
            </div>
          )}
        </div>

        {/* Live feed */}
        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Live takes</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="live" />
          </div>
          {showingSamples && (
            <p className="text-[11px] text-slate-500 mb-3">Showing sample takes — post the first real one above 👆</p>
          )}
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {effectiveFeed.length === 0 && (
              <p className="text-sm text-slate-600 py-8 text-center">No takes yet for {base}.</p>
            )}
            {effectiveFeed.map((p) => (
              <div key={p.id} className="rounded-lg bg-slate-900/70 border border-slate-800 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                    {p.userName}
                    {isSeedPost(p) && <span className="text-[9px] uppercase tracking-wider text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">sample</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    <SentimentBadge label={p.label} />
                    {p.confidence > 0 && (
                      <span className="text-[10px] text-slate-600 tabular-nums" title="NB model confidence">
                        {Math.round(p.confidence * 100)}%
                      </span>
                    )}
                    <span className="text-xs text-slate-600">{timeAgo(p.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-snug">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPulse;
