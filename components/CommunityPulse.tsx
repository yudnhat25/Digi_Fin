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
} from '../services/community';
import { getGeminiResponse } from '../services/geminiService';
import { apiCoinInsight, CoinInsight } from '../services/coinwiseApi';

interface Props {
  userState: UserState;
  marketData: MarketData[];
  symbol: string; // follows the global asset selector — no internal coin picker
}

const timeAgo = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// News-style left tag, coloured by sentiment.
const tagFor = (l: SentimentLabel) =>
  l === 'positive' ? { t: 'POSITIVE', c: 'emerald' } :
  l === 'negative' ? { t: 'NEGATIVE', c: 'rose' } :
  { t: 'NEUTRAL', c: 'slate' };

// ─── Deterministic verdict: community comments + news/alt-data + Fear&Greed ───
type VerdictTone = 'good' | 'soft-good' | 'neutral' | 'soft-bad' | 'bad';
interface Verdict {
  score: number; tone: VerdictTone; label: string; warning: string | null;
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
    tone === 'good' ? 'Bullish' : tone === 'soft-good' ? 'Leaning bull' :
    tone === 'neutral' ? 'Neutral' : tone === 'soft-bad' ? 'Leaning bear' : 'Bearish';
  let warning: string | null = null;
  const signal = insight?.signal;
  if (community !== null && community >= 60 && (signal === 'SELL' || signal === 'STRONG_SELL')) {
    warning = 'Crowd is bullish but alt-data says SELL — watch for FOMO.';
  } else if (community !== null && community >= 60 && fearGreed !== null && fearGreed >= 75) {
    warning = 'Crowd euphoria during Extreme Greed — reversal risk.';
  } else if (community !== null && community <= 40 && (signal === 'BUY' || signal === 'STRONG_BUY')) {
    warning = 'Crowd is more bearish than the market signal — possible accumulation.';
  }
  return { score, tone, label, warning };
}
const verdictPill = (t: VerdictTone) =>
  t === 'good' || t === 'soft-good' ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' :
  t === 'neutral' ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30' :
  'bg-rose-500/15 text-rose-300 ring-rose-500/30';

const CommunityPulse: React.FC<Props> = ({ userState, marketData, symbol }) => {
  const base = symbol.replace('USDT', '');

  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [localExtra, setLocalExtra] = useState<CommunityPost[]>([]);
  const [permissionIssue, setPermissionIssue] = useState(false);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBadge, setLastBadge] = useState<SentimentLabel | null>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  const [insight, setInsight] = useState<CoinInsight | null>(null);

  // Follow the global asset: re-subscribe + refetch whenever `symbol` changes.
  useEffect(() => {
    setAdvice(null);
    const unsub = subscribeCommunityFeed(symbol, setFeed);
    return () => unsub();
  }, [symbol]);

  useEffect(() => {
    let alive = true;
    setInsight(null);
    apiCoinInsight(symbol).then((r) => { if (alive) setInsight(r); }).catch(() => { if (alive) setInsight(null); });
    return () => { alive = false; };
  }, [symbol]);

  const seeds = useMemo(() => seedPostsFor(symbol), [symbol]);
  const localForSym = useMemo(() => localExtra.filter((p) => p.symbol === symbol), [localExtra, symbol]);
  const effectiveFeed = feed.length > 0 ? feed : [...localForSym, ...seeds];
  const showingSamples = feed.length === 0 && localForSym.length === 0;

  const pulse = useMemo(() => aggregatePulse(effectiveFeed, symbol), [effectiveFeed, symbol]);
  const verdict = useMemo(() => computeVerdict(pulse, insight), [pulse, insight]);

  const handlePost = async () => {
    const text = draft.trim();
    if (!text || posting) return;
    setPosting(true);
    setError(null);
    try {
      const score = await scoreComment(text);
      setLastBadge(score.label);
      const post: Omit<CommunityPost, 'id'> = {
        symbol, text, ...score, userId: userState.accountId, userName: userState.name, createdAt: Date.now(),
      };
      try {
        await persistCommunityPost(post);
        setPermissionIssue(false);
      } catch {
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
        (q ? `User question about ${base}: "${q}"\n\n` : `Assess the current market state of ${base} and give a short verdict.\n\n`) +
        `CoinWise community mood (trained NLP scored ${pulse.total} takes in 24h): ${pulse.score}/100 (${pulse.label}, trend ${pulse.trend}); ` +
        `positive ${pulse.bullishPct}% · neutral ${pulse.neutralPct}% · negative ${pulse.bearishPct}%.` +
        (insightLine ? `\n${insightLine}` : '') +
        `\nCombine community mood with alt-data; if the crowd is bullish but alt-data disagrees, WARN about FOMO. ` +
        `Answer in English, max 4 sentences, and note this is simulated paper trading.`;
      setAdvice(await getGeminiResponse(prompt, userState, marketData));
    } catch {
      setAdvice('⚠️ Could not fetch AI advice (check the Gemini API key / quota).');
    } finally {
      setAdviceLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col">
      {/* Header — mirrors the Market News card */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
          Community Pulse
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="live" />
        </h3>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ring-1 ${verdictPill(verdict.tone)}`}>
          {verdict.label} · {verdict.score}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 mb-4">
        {base} · {pulse.total} takes · {pulse.bullishPct}% bullish · trend {pulse.trend}
      </p>
      {verdict.warning && (
        <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-3 leading-relaxed">
          ⚠️ {verdict.warning}
        </p>
      )}

      {/* ── Live takes (top) ── */}
      {showingSamples && (
        <p className="text-[11px] text-slate-500 mb-2">Showing sample takes — post the first real one below 👇</p>
      )}
      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
        {effectiveFeed.length === 0 ? (
          <p className="text-sm text-slate-600 py-8 text-center">No takes yet for {base}.</p>
        ) : (
          effectiveFeed.map((p) => {
            const tag = tagFor(p.label);
            return (
              <div key={p.id} className="flex gap-3">
                <span className={`text-[9px] font-black uppercase tracking-wide bg-${tag.c}-500/15 text-${tag.c}-400 px-2 py-1 rounded h-fit shrink-0`}>
                  {tag.t}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed text-slate-200">{p.text}</p>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                    {p.userName}
                    {isSeedPost(p) && <span className="text-[8px] uppercase tracking-wider text-slate-600 bg-slate-800 px-1 rounded">sample</span>}
                    <span>· {timeAgo(p.createdAt)}</span>
                    {p.confidence > 0 && <span className="text-slate-600">· {Math.round(p.confidence * 100)}%</span>}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Composer (bottom) ── */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={280}
          rows={2}
          placeholder={`Post a take on ${base}…`}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>{draft.length}/280</span>
            {lastBadge && (
              <span className="text-slate-500">scored: <b className={tagFor(lastBadge).c === 'emerald' ? 'text-emerald-300' : tagFor(lastBadge).c === 'rose' ? 'text-rose-300' : 'text-slate-300'}>{tagFor(lastBadge).t}</b></span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiOpen((v) => !v)}
              className="text-[11px] font-bold text-fuchsia-300 hover:text-fuchsia-200 px-2 py-1.5"
            >
              🤖 Ask AI
            </button>
            <button
              onClick={handlePost}
              disabled={posting || !draft.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-fuchsia-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-fuchsia-400 transition"
            >
              {posting ? 'Scoring…' : 'Post'}
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
        {permissionIssue && (
          <p className="text-[11px] text-amber-300/90 mt-2 leading-relaxed">
            Saved locally only — publish <code className="text-amber-200">database.rules.json</code> in the Firebase console (Realtime Database → Rules) to persist &amp; share comments.
          </p>
        )}

        {/* Inline AI (collapsible) */}
        {aiOpen && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askAI(aiQuestion)}
                placeholder={`Ask about ${base} — e.g. "Is it a good time to buy?"`}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50"
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
              className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white disabled:opacity-50 hover:opacity-90 transition"
            >
              {adviceLoading ? 'AI is reading community + alt-data…' : `Analyze ${base} market state`}
            </button>
            {advice && (
              <div className="rounded-lg bg-violet-500/10 border border-violet-500/30 p-3 text-sm text-violet-100 leading-relaxed whitespace-pre-wrap">
                {advice}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPulse;
