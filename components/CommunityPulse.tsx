import React, { useEffect, useMemo, useState } from 'react';
import { UserState, MarketData } from '../types';
import {
  CommunityPost,
  CommunityPulse as Pulse,
  SentimentLabel,
  postCommunityComment,
  subscribeCommunityFeed,
  aggregatePulse,
  labelToVi,
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
      {labelToVi(label)}
    </span>
  );
};

const MoodScore: React.FC<{ pulse: Pulse }> = ({ pulse }) => {
  const tone = pulse.score >= 60 ? 'text-emerald-400' : pulse.score <= 40 ? 'text-rose-400' : 'text-amber-400';
  const trendIcon = pulse.trend === 'rising' ? '↗' : pulse.trend === 'falling' ? '↘' : '→';
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-4xl font-bold tabular-nums ${tone}`}>{pulse.score}</span>
      <span className="text-slate-500 text-sm">/100</span>
      <span className={`ml-1 text-sm ${tone}`}>{trendIcon} {pulse.trend === 'rising' ? 'đang tăng' : pulse.trend === 'falling' ? 'đang giảm' : 'ổn định'}</span>
    </div>
  );
};

const Bars: React.FC<{ pulse: Pulse }> = ({ pulse }) => (
  <div className="space-y-2">
    {([
      ['Tích cực', pulse.bullishPct, 'bg-emerald-500'],
      ['Trung lập', pulse.neutralPct, 'bg-slate-500'],
      ['Tiêu cực', pulse.bearishPct, 'bg-rose-500'],
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
  label: string;          // Vietnamese verdict
  rationale: string;
  warning: string | null; // divergence / FOMO caution
  parts: { community: number | null; news: number | null; fearGreed: number | null };
}

function computeVerdict(pulse: Pulse, insight: CoinInsight | null): Verdict {
  // Community: mood score 0-100 only meaningful when there are posts.
  const community = pulse.total > 0 ? pulse.score : null;
  // News / alt-data sentiment: pipeline composite ∈ [-1,1] → 0-100.
  const news = insight?.sentiment ? Math.round((insight.sentiment.score + 1) * 50) : null;
  const fearGreed = insight?.fearGreed ? insight.fearGreed.value : null;

  // Weighted blend; redistribute when a source is missing.
  const parts: { v: number; w: number }[] = [];
  if (community !== null) parts.push({ v: community, w: 0.5 });
  if (news !== null) parts.push({ v: news, w: 0.35 });
  if (fearGreed !== null) parts.push({ v: fearGreed, w: 0.15 });
  const wSum = parts.reduce((s, p) => s + p.w, 0) || 1;
  const score = Math.round(parts.reduce((s, p) => s + p.v * p.w, 0) / wSum) || 50;

  const tone: VerdictTone =
    score >= 66 ? 'good' : score >= 55 ? 'soft-good' : score >= 45 ? 'neutral' : score >= 35 ? 'soft-bad' : 'bad';
  const label =
    tone === 'good' ? 'Tích cực' : tone === 'soft-good' ? 'Khá tốt' :
    tone === 'neutral' ? 'Trung lập' : tone === 'soft-bad' ? 'Khá tiêu cực' : 'Tiêu cực';

  const bits: string[] = [];
  if (community !== null) bits.push(`cộng đồng ${community}/100 (${pulse.total} nhận định)`);
  if (news !== null) bits.push(`tin tức/alt-data ${news}/100`);
  if (fearGreed !== null) bits.push(`Fear & Greed ${fearGreed}`);
  const rationale = bits.length
    ? `Tổng hợp ${bits.join(' · ')}.`
    : 'Chưa đủ dữ liệu cộng đồng và alt-data.';

  // Divergence: crowd bullish but market data contradicts → FOMO caution.
  let warning: string | null = null;
  const signal = insight?.signal;
  if (community !== null && community >= 60 && (signal === 'SELL' || signal === 'STRONG_SELL')) {
    warning = '⚠️ Cộng đồng lạc quan nhưng tín hiệu alt-data đang BÁN — coi chừng FOMO.';
  } else if (community !== null && community >= 60 && fearGreed !== null && fearGreed >= 75) {
    warning = '⚠️ Cộng đồng hưng phấn giữa vùng Extreme Greed — rủi ro đảo chiều cao.';
  } else if (community !== null && community <= 40 && (signal === 'BUY' || signal === 'STRONG_BUY')) {
    warning = 'ℹ️ Cộng đồng bi quan hơn tín hiệu thị trường — có thể là vùng tích lũy.';
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
    const merged = Array.from(new Set([...DEFAULT_SYMBOLS, ...fromMarket]));
    return merged.slice(0, 6);
  }, [marketData]);

  const [symbol, setSymbol] = useState(symbols[0] || 'BTCUSDT');
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBadge, setLastBadge] = useState<SentimentLabel | null>(null);

  // AI advice card
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

  const pulse = useMemo(() => aggregatePulse(feed, symbol), [feed, symbol]);
  const verdict = useMemo(() => computeVerdict(pulse, insight), [pulse, insight]);
  const base = symbol.replace('USDT', '');

  const handlePost = async () => {
    const text = draft.trim();
    if (!text || posting) return;
    setPosting(true);
    setError(null);
    try {
      const created = await postCommunityComment({
        symbol,
        text,
        userId: userState.accountId,
        userName: userState.name,
      });
      setLastBadge(created.label);
      setDraft('');
      setTimeout(() => setLastBadge(null), 4000);
    } catch (e) {
      setError((e as Error).message || 'Không gửi được, thử lại.');
    } finally {
      setPosting(false);
    }
  };

  const askAI = async () => {
    if (adviceLoading) return;
    setAdviceLoading(true);
    setAdvice(null);
    try {
      // Pull live alt-data so the model blends community mood vs on-chain/F&G.
      let insightLine = '';
      try {
        const ins = await apiCoinInsight(symbol);
        insightLine = `Alt-data ${base}: sentiment ${ins?.sentiment?.label ?? 'n/a'} (${ins?.sentiment?.score ?? '?'}), ` +
          `whale net flow 24h ${ins?.whale?.netFlow24hUsd ?? '?'} USD, Fear&Greed ${ins?.fearGreed?.value ?? '?'} (${ins?.fearGreed?.classification ?? '?'}), tín hiệu ${ins?.signal ?? '?'}.`;
      } catch { /* alt-data optional */ }

      const prompt =
        `Phân tích "trạng thái thị trường" của ${base} bằng cách KẾT HỢP tâm lý cộng đồng và alt-data, rồi đưa lời khuyên ngắn gọn.\n\n` +
        `Tâm lý cộng đồng CoinWise (mô hình NLP chấm ${pulse.total} nhận định trong 24h):\n` +
        `- Điểm tâm lý: ${pulse.score}/100 (${pulse.label}, xu hướng ${pulse.trend}).\n` +
        `- Tích cực ${pulse.bullishPct}% · Trung lập ${pulse.neutralPct}% · Tiêu cực ${pulse.bearishPct}%.\n` +
        (insightLine ? `\n${insightLine}\n` : '') +
        `\nNếu cộng đồng lạc quan nhưng alt-data/whale trái chiều thì CẢNH BÁO rủi ro FOMO. ` +
        `Trả lời tối đa 4 câu, tiếng Việt, kèm nhắc đây là paper-trading mô phỏng.`;

      const text = await getGeminiResponse(prompt, userState, marketData);
      setAdvice(text);
    } catch (e) {
      setAdvice('⚠️ Chưa lấy được tư vấn AI (kiểm tra Gemini API key / quota).');
    } finally {
      setAdviceLoading(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-fuchsia-400">💬</span> Community Pulse
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhận định của cộng đồng, chấm tự động bằng mô hình NLP đã train — gộp thành tín hiệu tâm lý theo coin.
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {symbols.map((s) => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                s === symbol ? 'bg-fuchsia-500/20 text-fuchsia-300 ring-1 ring-fuchsia-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {s.replace('USDT', '')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* ── Left: aggregate + composer ── */}
        <div className="space-y-4">
          {/* Market verdict — community comments + news/alt-data + Fear&Greed */}
          {(() => {
            const st = verdictStyle(verdict.tone);
            return (
              <div className={`relative overflow-hidden rounded-xl bg-slate-950/50 border border-slate-800 ring-1 ${st.ring} p-4`}>
                <div className={`absolute -top-12 -right-12 w-40 h-40 ${st.glow} rounded-full blur-3xl`} />
                <div className="relative flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Đánh giá thị trường · {base}</span>
                  {insightLoading && <span className="text-[10px] text-slate-600">đang đọc tin tức…</span>}
                </div>
                <div className="relative flex items-baseline gap-3">
                  <span className={`text-3xl font-bold ${st.text}`}>{verdict.label}</span>
                  <span className="text-slate-500 text-sm tabular-nums">{verdict.score}/100</span>
                </div>
                <div className="relative mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full ${st.bar} transition-all duration-500`} style={{ width: `${verdict.score}%` }} />
                </div>
                <p className="relative text-xs text-slate-400 mt-3 leading-relaxed">{verdict.rationale}</p>
                {/* component chips */}
                <div className="relative flex flex-wrap gap-1.5 mt-2.5">
                  {verdict.parts.community !== null && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-fuchsia-500/10 text-fuchsia-300 ring-1 ring-fuchsia-500/20">💬 Cộng đồng {verdict.parts.community}</span>
                  )}
                  {verdict.parts.news !== null && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20">📰 Tin tức/alt-data {verdict.parts.news}</span>
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
            );
          })()}

          <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Tâm lý cộng đồng · {base} · 24h</span>
              <span className="text-xs text-slate-600">{pulse.total} nhận định</span>
            </div>
            <MoodScore pulse={pulse} />
            <div className="mt-4">
              <Bars pulse={pulse} />
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4">
            <label className="text-sm text-slate-400">Đăng nhận định về {base}</label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder={`VD: "${base} sắp breakout, dòng tiền vào mạnh"`}
              className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">{draft.length}/280</span>
                {lastBadge && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    Mô hình chấm: <SentimentBadge label={lastBadge} />
                  </span>
                )}
              </div>
              <button
                onClick={handlePost}
                disabled={posting || !draft.trim()}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-fuchsia-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-fuchsia-400 transition"
              >
                {posting ? 'Đang chấm…' : 'Đăng'}
              </button>
            </div>
            {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
          </div>

          <button
            onClick={askAI}
            disabled={adviceLoading}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white disabled:opacity-50 hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            🤖 {adviceLoading ? 'AI đang đọc cộng đồng…' : 'AI đọc cộng đồng + alt-data → tư vấn'}
          </button>
          {advice && (
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/30 p-4 text-sm text-violet-100 leading-relaxed whitespace-pre-wrap">
              {advice}
            </div>
          )}
        </div>

        {/* ── Right: live feed ── */}
        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Dòng nhận định trực tiếp</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="live" />
          </div>
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {feed.length === 0 && (
              <p className="text-sm text-slate-600 py-8 text-center">
                Chưa có nhận định nào cho {base}. Hãy là người đầu tiên 👆
              </p>
            )}
            {feed.map((p) => (
              <div key={p.id} className="rounded-lg bg-slate-900/70 border border-slate-800 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-200">{p.userName}</span>
                  <div className="flex items-center gap-2">
                    <SentimentBadge label={p.label} />
                    {p.confidence > 0 && (
                      <span className="text-[10px] text-slate-600 tabular-nums" title="Độ tin cậy mô hình NB">
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
    </section>
  );
};

export default CommunityPulse;
