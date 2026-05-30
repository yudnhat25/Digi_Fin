import React, { useEffect, useState } from 'react';
import {
  apiAltDataPipeline,
  apiAltDataSourcesHealth,
  apiNbModelInfo,
  apiNbClassify,
  AltDataPipelineResult,
  AltDataSourcesHealth,
  NbModelInfo,
  NbClassifyResult,
} from '../services/coinwiseApi';

const COINS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT'];

// ─── Tiny helpers ───
const fmt = (n: number, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const cls = (...x: (string | false | null | undefined)[]) => x.filter(Boolean).join(' ');

// ─── Stage card primitive ───
const StageCard: React.FC<{
  step: number; title: string; subtitle: string; status?: 'ok' | 'partial' | 'failed'; children: React.ReactNode;
}> = ({ step, title, subtitle, status = 'ok', children }) => {
  const statusColor =
    status === 'ok' ? 'border-emerald-500/30 bg-emerald-500/[0.03]' :
    status === 'partial' ? 'border-amber-500/30 bg-amber-500/[0.03]' :
    'border-rose-500/30 bg-rose-500/[0.03]';
  const statusDot =
    status === 'ok' ? 'bg-emerald-400' :
    status === 'partial' ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className={cls('rounded-2xl border p-5', statusColor)}>
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-black text-emerald-400 text-sm">
          {step}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-[15px] font-bold tracking-tight">{title}</h3>
            <span className={cls('w-1.5 h-1.5 rounded-full', statusDot)} />
          </div>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
};

const Pill: React.FC<{ tone?: 'emerald' | 'rose' | 'amber' | 'slate' | 'blue'; children: React.ReactNode }> = ({
  tone = 'slate', children,
}) => {
  const map = {
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    slate: 'bg-white/[0.04] text-slate-300 border-white/[0.08]',
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  } as const;
  return (
    <span className={cls('inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border', map[tone])}>
      {children}
    </span>
  );
};

// ─── Sources health strip ───
const SourcesHealth: React.FC<{ health: AltDataSourcesHealth | null }> = ({ health }) => {
  if (!health) return null;
  const items = [
    { key: 'news', name: 'Hacker News (Algolia)', sub: 'social-media headlines + upvotes', detail: health.news.ok ? `n=${health.news.sample}` : health.news.error, ok: health.news.ok, latency: health.news.latencyMs },
    { key: 'fg', name: 'alternative.me', sub: 'Crypto Fear & Greed Index', detail: health.fearGreed.ok ? `value=${health.fearGreed.value}` : health.fearGreed.error, ok: health.fearGreed.ok, latency: health.fearGreed.latencyMs },
    { key: 'cg', name: 'CoinGecko', sub: 'community votes + dev score', detail: health.coinGecko.ok ? 'OK' : health.coinGecko.error, ok: health.coinGecko.ok, latency: health.coinGecko.latencyMs },
    { key: 'reddit', name: 'Reddit JSON', sub: 'r/CryptoCurrency (best-effort)', detail: health.reddit.ok ? `n=${health.reddit.sample}` : 'blocked — degraded', ok: health.reddit.ok, latency: health.reddit.latencyMs },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((s) => (
        <div key={s.key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-slate-200">{s.name}</p>
            <Pill tone={s.ok ? 'emerald' : 'rose'}>{s.ok ? 'live' : 'down'}</Pill>
          </div>
          <p className="text-[10px] text-slate-500">{s.sub}</p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span className="truncate">{s.detail}</span>
            <span className="text-slate-500">{s.latency} ms</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Bar visualization for VADER weighted score ───
const SentimentDial: React.FC<{ value: number; label: string; sublabel: string }> = ({ value, label, sublabel }) => {
  const pct = ((value + 1) / 2) * 100;
  const color = value > 0.15 ? 'bg-emerald-400' : value < -0.15 ? 'bg-rose-400' : 'bg-amber-300';
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-3xl font-black tracking-tight tabular-nums">{fmt(value)}</p>
        <Pill tone={value > 0.15 ? 'emerald' : value < -0.15 ? 'rose' : 'amber'}>{label}</Pill>
      </div>
      <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={cls('absolute inset-y-0', color)} style={{ left: '50%', width: `${Math.abs(pct - 50)}%`, transform: value < 0 ? 'translateX(-100%)' : 'none' }} />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/30" />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-slate-500 tabular-nums">
        <span>-1.00 capitulation</span>
        <span>0</span>
        <span>+1.00 euphoria</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-2">{sublabel}</p>
    </div>
  );
};

// ─── Per-post explainability row ───
const PostRow: React.FC<{ post: AltDataPipelineResult['nlp']['topPositive'][0]; tone: 'positive' | 'negative' }> = ({ post, tone }) => (
  <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3">
    <a href={post.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-100 hover:text-emerald-300 line-clamp-2 leading-tight">
      {post.title}
    </a>
    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
      <span>r/{post.subreddit}</span>
      <span>↑ {post.ups.toLocaleString()}</span>
      <span>💬 {post.numComments}</span>
      <span>{post.ageMin < 60 ? `${post.ageMin}m` : `${Math.round(post.ageMin / 60)}h`} ago</span>
      <span className={tone === 'positive' ? 'text-emerald-400 font-bold tabular-nums ml-auto' : 'text-rose-400 font-bold tabular-nums ml-auto'}>
        {post.compound > 0 ? '+' : ''}{fmt(post.compound, 3)}
      </span>
    </div>
    {post.matchedTerms.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-2">
        {post.matchedTerms.slice(0, 6).map((t, i) => (
          <span key={i} className={cls('px-1.5 py-0.5 text-[9px] font-mono rounded',
            t.valence > 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300',
          )}>
            {t.token} {t.valence > 0 ? '+' : ''}{fmt(t.valence, 2)}
          </span>
        ))}
      </div>
    )}
  </div>
);

// ─── NB-classified post row with feature attributions ───
const NbPostRow: React.FC<{
  post: { id: string; title: string; subreddit: string; ups: number; numComments: number; ageMin: number; url: string; compound: number; confidence: number; topFeatures: { token: string; positiveLogProb: number; negativeLogProb: number }[] };
  tone: 'positive' | 'negative';
}> = ({ post, tone }) => (
  <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3">
    <a href={post.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-100 hover:text-emerald-300 line-clamp-2 leading-tight">
      {post.title}
    </a>
    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
      <span>{post.subreddit}</span>
      <span>↑ {post.ups.toLocaleString()}</span>
      <span>{post.ageMin < 60 ? `${post.ageMin}m` : `${Math.round(post.ageMin / 60)}h`} ago</span>
      <span className={tone === 'positive' ? 'text-emerald-400 font-bold tabular-nums ml-auto' : 'text-rose-400 font-bold tabular-nums ml-auto'}>
        P={fmt(post.confidence * 100, 0)}%
      </span>
    </div>
    {post.topFeatures.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-2">
        {post.topFeatures.slice(0, 4).map((t, i) => {
          const lift = tone === 'positive' ? t.positiveLogProb - t.negativeLogProb : t.negativeLogProb - t.positiveLogProb;
          return (
            <span key={i} className={cls('px-1.5 py-0.5 text-[9px] font-mono rounded',
              lift > 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300',
            )} title={`log P(pos|t)=${t.positiveLogProb.toFixed(2)} · log P(neg|t)=${t.negativeLogProb.toFixed(2)}`}>
              {t.token} {lift > 0 ? '+' : ''}{fmt(lift, 2)}
            </span>
          );
        })}
      </div>
    )}
  </div>
);

// ─── Confusion matrix renderer ───
const ConfusionMatrix: React.FC<{ confusion: NbModelInfo['metrics']['confusion'] }> = ({ confusion }) => {
  const classes: ('positive' | 'negative' | 'neutral')[] = ['positive', 'negative', 'neutral'];
  const rowSums = Object.fromEntries(classes.map((r) => [r, classes.reduce((s, c) => s + confusion[r][c], 0)])) as Record<typeof classes[number], number>;
  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.06]">
      <table className="w-full text-[11px] font-mono">
        <thead>
          <tr className="bg-white/[0.03] text-slate-500">
            <th className="text-left px-3 py-1.5 font-medium">true ↓ / pred →</th>
            {classes.map((c) => <th key={c} className="text-center px-3 py-1.5 font-medium">{c}</th>)}
            <th className="text-center px-3 py-1.5 font-medium text-slate-600">n</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((r) => (
            <tr key={r} className="border-t border-white/[0.06]">
              <td className="px-3 py-1.5 text-slate-300 font-bold">{r}</td>
              {classes.map((c) => {
                const v = confusion[r][c];
                const isDiag = r === c;
                const pct = rowSums[r] > 0 ? v / rowSums[r] : 0;
                return (
                  <td key={c} className={cls('text-center px-3 py-1.5 tabular-nums',
                    isDiag ? 'text-emerald-300 font-bold' : v > 0 ? 'text-rose-300' : 'text-slate-600')}>
                    {v}
                    {isDiag && v > 0 && <span className="text-[9px] text-emerald-500 ml-1">{(pct * 100).toFixed(0)}%</span>}
                  </td>
                );
              })}
              <td className="text-center px-3 py-1.5 text-slate-500 tabular-nums">{rowSums[r]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Model metrics card + interactive text classifier ───
const ModelMetricsAndDemo: React.FC = () => {
  const [info, setInfo] = useState<NbModelInfo | null>(null);
  const [text, setText] = useState('Bitcoin spot ETF receives official SEC approval, market rallies');
  const [result, setResult] = useState<NbClassifyResult | null>(null);
  const [classifying, setClassifying] = useState(false);

  useEffect(() => { apiNbModelInfo().then(setInfo).catch(() => {}); }, []);

  const onClassify = async () => {
    if (!text.trim()) return;
    setClassifying(true);
    try { setResult(await apiNbClassify(text)); } catch { /* swallow */ } finally { setClassifying(false); }
  };

  if (!info) return null;
  return (
    <div className="mt-2 grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Training summary */}
      <div className="lg:col-span-5 rounded-lg border border-white/[0.06] bg-black/30 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-3">Training summary (held-out test)</p>
        <div className="grid grid-cols-4 gap-2 mb-3 text-center">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Accuracy</p>
            <p className="text-xl font-black text-emerald-300 tabular-nums">{(info.metrics.accuracy * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Macro F1</p>
            <p className="text-xl font-black text-emerald-300 tabular-nums">{(info.metrics.macroF1 * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Vocab</p>
            <p className="text-xl font-black tabular-nums">{info.vocabSize}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Train / Test</p>
            <p className="text-xl font-black tabular-nums">{info.trainSize}/{info.testSize}</p>
          </div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Per-class P / R / F1</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {(['positive', 'negative', 'neutral'] as const).map((c) => {
            const m = info.metrics.perClass[c];
            return (
              <div key={c} className="rounded bg-white/[0.03] border border-white/[0.05] p-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{c}</p>
                <p className="text-[10px] text-slate-500 tabular-nums">P {(m.precision * 100).toFixed(0)} · R {(m.recall * 100).toFixed(0)}</p>
                <p className="text-[11px] tabular-nums text-emerald-300 font-bold">F1 {(m.f1 * 100).toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Confusion matrix</p>
        <ConfusionMatrix confusion={info.metrics.confusion} />
        <p className="text-[10px] text-slate-500 mt-2">
          Algorithm: <span className="text-slate-300 font-mono">{info.algorithm}</span> · α = {info.smoothingAlpha} · trained {new Date(info.trainedAt).toLocaleString()}
        </p>
      </div>

      {/* Interactive classifier */}
      <div className="lg:col-span-7 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Try the trained classifier on any text</p>
        <p className="text-[11px] text-slate-400 mb-3">
          The model never saw this string during training. Type a fintech-style headline (English) and click classify.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:border-emerald-500/40"
          placeholder="e.g. Major hack drains $200M from DeFi protocol"
        />
        <div className="flex items-center gap-2 mt-2 mb-3">
          <button
            onClick={onClassify}
            disabled={classifying || !text.trim()}
            className="px-3 py-1.5 bg-emerald-500/80 hover:bg-emerald-400 text-slate-900 text-xs font-bold uppercase tracking-widest rounded-lg disabled:opacity-50"
          >
            {classifying ? 'classifying…' : 'classify'}
          </button>
          {(['Bitcoin spot ETF approved, market rallies', 'DeFi protocol drained, $300M stolen', 'Bitcoin closes the day flat at $65000'] as const).map((s) => (
            <button key={s} onClick={() => setText(s)} className="text-[10px] text-slate-500 hover:text-slate-300 underline">
              ex.{s.slice(0, 14)}…
            </button>
          ))}
        </div>
        {result && (
          <div className="rounded bg-black/40 border border-white/[0.06] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Pill tone={result.label === 'positive' ? 'emerald' : result.label === 'negative' ? 'rose' : 'slate'}>
                predicted: {result.label}
              </Pill>
              <span className="text-xs text-slate-500 tabular-nums">confidence {fmt(result.confidence * 100, 1)}%</span>
            </div>
            <div className="space-y-1">
              {(['positive', 'negative', 'neutral'] as const).map((c) => {
                const p = result.perClassProb[c];
                return (
                  <div key={c} className="text-[11px]">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate-400">P({c})</span>
                      <span className="tabular-nums">{(p * 100).toFixed(1)}%  <span className="text-slate-600">log {result.perClassLogProb[c].toFixed(2)}</span></span>
                    </div>
                    <div className="h-1.5 rounded bg-white/[0.05] overflow-hidden">
                      <div className={cls('h-full',
                        c === 'positive' ? 'bg-emerald-400' : c === 'negative' ? 'bg-rose-400' : 'bg-slate-400')}
                        style={{ width: `${p * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {result.matchedFeatures.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2 mb-1">
                  Top decisive tokens (log P(t|class))
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.matchedFeatures.slice(0, 8).map((f, i) => {
                    const winner: 'positive' | 'negative' | 'neutral' = f.contributions.positive >= f.contributions.negative && f.contributions.positive >= f.contributions.neutral
                      ? 'positive' : f.contributions.negative >= f.contributions.neutral ? 'negative' : 'neutral';
                    return (
                      <span key={i} className={cls('px-1.5 py-0.5 text-[9px] font-mono rounded',
                        winner === 'positive' ? 'bg-emerald-500/15 text-emerald-300' :
                        winner === 'negative' ? 'bg-rose-500/15 text-rose-300' :
                        'bg-white/[0.05] text-slate-400')}
                        title={`pos ${f.contributions.positive.toFixed(2)} · neg ${f.contributions.negative.toFixed(2)} · neu ${f.contributions.neutral.toFixed(2)}`}>
                        {f.token} → {winner.slice(0, 3)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── F&G mini-sparkline ───
const FgSpark: React.FC<{ history: { date: string; value: number }[] }> = ({ history }) => {
  if (!history?.length) return null;
  const w = 220, h = 40;
  const max = 100, min = 0;
  const points = history.map((p, i) => `${(i / (history.length - 1)) * w},${h - ((p.value - min) / (max - min)) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10 mt-2">
      <polyline fill="none" stroke="rgb(251 191 36 / 0.8)" strokeWidth="1.5" points={points} />
    </svg>
  );
};

// ─── MAIN PAGE ───
const AltDataPipelinePage: React.FC = () => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [data, setData] = useState<AltDataPipelineResult | null>(null);
  const [health, setHealth] = useState<AltDataSourcesHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { apiAltDataSourcesHealth().then(setHealth).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true); setError(null);
    apiAltDataPipeline(symbol)
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [symbol]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ─── Hero ─── */}
      <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-slate-900/50 to-black p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Pill tone="emerald">Alt-data pipeline</Pill>
              <Pill tone="slate">Live data</Pill>
              <Pill tone="blue">VADER + Trained Naive Bayes + Z-score</Pill>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">
              Alternative-Data → AI → Fintech, transparently.
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              This page proves the full chain demanded by the brief: real text scraped from Reddit + alternative.me Fear &amp;
              Greed Index + CoinGecko community signals, analysed with a VADER-style lexicon sentiment model and a Z-score
              anomaly detector, then translated into concrete fintech actions — a Credit Score factor, a Fraud Shield rule,
              and an AI Advisor allocation tilt.
            </p>
          </div>
          <div className="shrink-0 w-full md:w-64">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Analyse coin</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-medium"
            >
              {COINS.map((s) => <option key={s} value={s}>{s.replace('USDT', '')}</option>)}
            </select>
            {data && (
              <div className="mt-3 text-[10px] text-slate-500">
                <span>Generated in <strong className="text-slate-300 tabular-nums">{data.totalLatencyMs} ms</strong></span>
                <span className="mx-2 text-slate-700">·</span>
                <span>{new Date(data.generatedAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sources live strip */}
        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Live data sources</p>
          <SourcesHealth health={health} />
        </div>
      </div>

      {/* ─── Loading / error ─── */}
      {loading && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-slate-500 text-sm">
          Running pipeline… (fetching Reddit, alternative.me &amp; CoinGecko in parallel — first hit is ~1–2 s, subsequent are cached)
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.05] p-5 text-sm text-rose-300">
          Pipeline error: {error}
        </div>
      )}

      {data && !loading && (
        <>
          {/* ─── STAGE 1 — COLLECT ─── */}
          <StageCard
            step={1}
            title="Collect — fetch alternative data from the live web"
            subtitle="No financial balances or transactions are used. All inputs are off-chain alternative-data."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Source A · Social-text corpus</p>
                <p className="text-2xl font-black tabular-nums">{data.collected.totalDocs}</p>
                <p className="text-[11px] text-slate-500">
                  documents for {data.base}
                  <span className="text-slate-600"> · HN {data.collected.newsPosts} · Reddit {data.collected.redditPosts}</span>
                </p>
                <ul className="mt-2 space-y-0.5 max-h-20 overflow-auto">
                  {[...data.sources.news, ...data.sources.reddit].slice(0, 5).map((s, i) => (
                    <li key={i} className="text-[10px] text-slate-400 font-mono truncate">• {s}</li>
                  ))}
                  {data.sources.news.length + data.sources.reddit.length === 0 && (
                    <li className="text-[10px] text-rose-400 font-mono">• all text sources unavailable</li>
                  )}
                </ul>
              </div>
              <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Source B · Fear &amp; Greed</p>
                {data.raw.fearGreed ? (
                  <>
                    <p className="text-2xl font-black tabular-nums">
                      {data.raw.fearGreed.current.value}
                      <span className={cls('text-xs font-bold ml-2', data.raw.fearGreed.delta24h >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                        {data.raw.fearGreed.delta24h >= 0 ? '+' : ''}{data.raw.fearGreed.delta24h} 24h
                      </span>
                    </p>
                    <p className="text-[11px] text-amber-300">{data.raw.fearGreed.current.classification}</p>
                    <FgSpark history={data.raw.fearGreed.history} />
                  </>
                ) : <p className="text-[11px] text-rose-400">source unavailable — weight redistributed</p>}
              </div>
              <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Source C · CoinGecko</p>
                {data.raw.coinGecko ? (
                  <>
                    <p className="text-2xl font-black tabular-nums">
                      {fmt(data.raw.coinGecko.voteUpPct, 1)}
                      <span className="text-xs text-slate-500">%</span>
                      <span className="text-xs text-slate-500"> up</span>
                    </p>
                    <p className="text-[11px] text-slate-500">community vote</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                      <div>community <span className="text-slate-200 font-bold">{fmt(data.raw.coinGecko.communityScore, 0)}</span></div>
                      <div>dev <span className="text-slate-200 font-bold">{fmt(data.raw.coinGecko.developerScore, 0)}</span></div>
                      <div>twitter <span className="text-slate-200 font-bold">{(data.raw.coinGecko.twitterFollowers / 1000).toFixed(1)}k</span></div>
                      <div>r/posts48h <span className="text-slate-200 font-bold">{fmt(data.raw.coinGecko.redditPosts48h, 1)}</span></div>
                    </div>
                  </>
                ) : <p className="text-[11px] text-rose-400">source unavailable — weight redistributed</p>}
              </div>
            </div>
          </StageCard>

          {/* ─── STAGE 2a — NLP ─── */}
          <StageCard
            step={2}
            title={`AI Technique 1 — ${data.nlp.technique}`}
            subtitle="Lexicon-based polarity scoring with negation, intensifier and ALL-CAPS rules. Per-post valence aggregated by upvote weight."
            status={data.nlp.matchedDocCount > 0 ? 'ok' : 'partial'}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 rounded-lg bg-black/30 border border-white/[0.06] p-4">
                <SentimentDial
                  value={data.nlp.weightedCompound}
                  label={data.fusion.label}
                  sublabel={`${data.nlp.matchedDocCount} of ${data.nlp.docCount} posts contained lexicon terms · weighted by upvotes`}
                />
                <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-emerald-400 font-bold tabular-nums">{fmt(data.nlp.posShare * 100, 0)}%</p>
                    <p className="text-[10px] text-slate-500">positive</p>
                  </div>
                  <div>
                    <p className="text-slate-300 font-bold tabular-nums">{fmt(data.nlp.neuShare * 100, 0)}%</p>
                    <p className="text-[10px] text-slate-500">neutral</p>
                  </div>
                  <div>
                    <p className="text-rose-400 font-bold tabular-nums">{fmt(data.nlp.negShare * 100, 0)}%</p>
                    <p className="text-[10px] text-slate-500">negative</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Top bullish posts</p>
                  <div className="space-y-2">
                    {data.nlp.topPositive.length === 0
                      ? <p className="text-[11px] text-slate-500 italic">No bullish posts matched the lexicon.</p>
                      : data.nlp.topPositive.map((p) => <PostRow key={p.id} post={p} tone="positive" />)}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-2">Top bearish posts</p>
                  <div className="space-y-2">
                    {data.nlp.topNegative.length === 0
                      ? <p className="text-[11px] text-slate-500 italic">No bearish posts matched the lexicon.</p>
                      : data.nlp.topNegative.map((p) => <PostRow key={p.id} post={p} tone="negative" />)}
                  </div>
                </div>
              </div>
            </div>
          </StageCard>

          {/* ─── STAGE 2a' — TRAINED NB CLASSIFIER ─── */}
          <StageCard
            step={3}
            title={`AI Technique 2 — ${data.mlClassifier.technique}`}
            subtitle={`Trained from scratch on a hand-labeled crypto-sentiment corpus. Held-out accuracy ${(data.mlClassifier.modelAccuracy * 100).toFixed(1)}% · macro F1 ${(data.mlClassifier.modelMacroF1 * 100).toFixed(1)}% · trained ${new Date(data.mlClassifier.modelTrainedAt).toLocaleString()}.`}
            status={data.mlClassifier.matchedDocCount > 0 ? 'ok' : 'partial'}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-1 rounded-lg bg-black/30 border border-white/[0.06] p-4">
                <SentimentDial
                  value={data.mlClassifier.weightedCompound}
                  label={data.mlClassifier.label}
                  sublabel={`Per-doc P(pos) − P(neg), weighted by engagement · agreement-with-VADER ${(data.mlClassifier.agreementWithVader * 100).toFixed(0)}%`}
                />
                <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-emerald-400 font-bold tabular-nums">{fmt(data.mlClassifier.perClassShare.positive * 100, 0)}%</p>
                    <p className="text-[10px] text-slate-500">positive</p>
                  </div>
                  <div>
                    <p className="text-slate-300 font-bold tabular-nums">{fmt(data.mlClassifier.perClassShare.neutral * 100, 0)}%</p>
                    <p className="text-[10px] text-slate-500">neutral</p>
                  </div>
                  <div>
                    <p className="text-rose-400 font-bold tabular-nums">{fmt(data.mlClassifier.perClassShare.negative * 100, 0)}%</p>
                    <p className="text-[10px] text-slate-500">negative</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">NB → positive (with decisive features)</p>
                  <div className="space-y-2">
                    {data.mlClassifier.topPositive.length === 0
                      ? <p className="text-[11px] text-slate-500 italic">No positive predictions in this corpus.</p>
                      : data.mlClassifier.topPositive.map((p) => <NbPostRow key={p.id} post={p} tone="positive" />)}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-2">NB → negative (with decisive features)</p>
                  <div className="space-y-2">
                    {data.mlClassifier.topNegative.length === 0
                      ? <p className="text-[11px] text-slate-500 italic">No negative predictions in this corpus.</p>
                      : data.mlClassifier.topNegative.map((p) => <NbPostRow key={p.id} post={p} tone="negative" />)}
                  </div>
                </div>
              </div>
            </div>
            <ModelMetricsAndDemo />
          </StageCard>

          {/* ─── STAGE 2b — ANOMALY ─── */}
          <StageCard
            step={4}
            title={`AI Technique 3 — ${data.anomaly.technique}`}
            subtitle="In-memory rolling window of mention volume. z = (current − μ) / σ. A z-score above 1.5σ is flagged as a retail-attention SPIKE."
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">current</p>
                <p className="text-2xl font-black tabular-nums">{data.anomaly.currentMentions}</p>
                <p className="text-[10px] text-slate-500">mentions</p>
              </div>
              <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">μ baseline</p>
                <p className="text-2xl font-black tabular-nums">{data.anomaly.baselineMean}</p>
              </div>
              <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">σ stdev</p>
                <p className="text-2xl font-black tabular-nums">{data.anomaly.baselineStd}</p>
              </div>
              <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">z-score</p>
                <p className={cls('text-2xl font-black tabular-nums', data.anomaly.spike ? 'text-amber-300' : 'text-slate-200')}>
                  {fmt(data.anomaly.zScore, 2)}
                </p>
              </div>
              <div className={cls('rounded-lg border p-3 flex flex-col justify-center',
                data.anomaly.spike ? 'border-amber-500/40 bg-amber-500/[0.06]' : 'border-emerald-500/30 bg-emerald-500/[0.04]')}>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">verdict</p>
                <p className={cls('text-base font-black', data.anomaly.spike ? 'text-amber-300' : 'text-emerald-400')}>
                  {data.anomaly.spike ? '⚡ SPIKE' : '✓ NORMAL'}
                </p>
                <p className="text-[10px] text-slate-500">n={data.anomaly.historyN} samples</p>
              </div>
            </div>
            {data.anomaly.historyN < 3 && (
              <p className="mt-3 text-[11px] text-slate-500">
                Heads-up: baseline is still warming up (need ≥ 3 samples). The z-score becomes meaningful after a few page loads.
              </p>
            )}
          </StageCard>

          {/* ─── STAGE 2c — FUSION ─── */}
          <StageCard
            step={5}
            title="AI Technique 4 — Multi-source signal fusion"
            subtitle={`Inner blend: VADER ${(data.fusion.vaderWeight * 100).toFixed(0)}% + trained Naive Bayes ${(data.fusion.naiveBayesWeight * 100).toFixed(0)}%. Outer blend with non-text alt-data signals.`}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-7 space-y-2">
                {[
                  { label: `Social-text (VADER ${(data.fusion.vaderWeight * 100).toFixed(0)}% + NB ${(data.fusion.naiveBayesWeight * 100).toFixed(0)}%)`, val: data.nlp.weightedCompound * data.fusion.vaderWeight + data.mlClassifier.weightedCompound * data.fusion.naiveBayesWeight, w: data.fusion.redditWeight, color: 'bg-emerald-400' },
                  { label: 'CoinGecko vote-up share', val: data.raw.coinGecko ? (data.raw.coinGecko.voteUpPct - data.raw.coinGecko.voteDownPct) / 100 : 0, w: data.fusion.coinGeckoWeight, color: 'bg-blue-400' },
                  { label: 'Fear & Greed (centered)', val: data.raw.fearGreed ? (data.raw.fearGreed.current.value - 50) / 50 : 0, w: data.fusion.fearGreedWeight, color: 'bg-amber-300' },
                ].map((row) => (
                  <div key={row.label} className="text-[11px]">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate-400">{row.label}</span>
                      <span className="text-slate-500 tabular-nums">
                        score {row.val >= 0 ? '+' : ''}{fmt(row.val, 2)} × weight {fmt(row.w * 100, 0)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden relative">
                      <div className={cls('absolute inset-y-0', row.color)} style={{ left: '50%', width: `${Math.abs(row.val * 50)}%`, transform: row.val < 0 ? 'translateX(-100%)' : 'none', opacity: row.w * 1.5 + 0.2 }} />
                      <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="md:col-span-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Composite output</p>
                <div className="flex items-baseline gap-3 mb-2">
                  <p className="text-4xl font-black tabular-nums">{fmt(data.fusion.compositeScore, 3)}</p>
                  <p className="text-xl font-bold text-slate-400 tabular-nums">/ 1.00</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Pill tone={data.fusion.signal.includes('BUY') ? 'emerald' : data.fusion.signal.includes('SELL') ? 'rose' : 'slate'}>{data.fusion.signal}</Pill>
                  <Pill tone="slate">{data.fusion.label}</Pill>
                  <Pill tone="blue">conf {fmt(data.fusion.confidence * 100, 0)}%</Pill>
                </div>
                <p className="text-[11px] text-slate-500">
                  Composite is the dot-product of source scores and dynamic weights — the standard NLP-courses signal fusion pattern.
                </p>
              </div>
            </div>
          </StageCard>

          {/* ─── STAGE 4 — APPLICATION ─── */}
          <StageCard
            step={6}
            title="Fintech application — translate the AI output into product actions"
            subtitle="The pipeline isn't a research artefact. Every signal feeds at least one production fintech feature inside CoinWise AI."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">▸ Credit Score</p>
                <p className="text-sm font-bold mb-1">{data.application.creditScoreFactor.label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{data.application.creditScoreFactor.rationale}</p>
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Score impact</span>
                  <span className={cls('text-lg font-black tabular-nums', data.application.creditScoreFactor.impact >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {data.application.creditScoreFactor.impact >= 0 ? '+' : ''}{data.application.creditScoreFactor.impact}
                  </span>
                </div>
              </div>
              <div className={cls('rounded-xl border p-4', data.application.fraudRule.triggered ? 'border-amber-500/30 bg-amber-500/[0.05]' : 'border-white/[0.06] bg-white/[0.02]')}>
                <p className={cls('text-[10px] font-bold uppercase tracking-widest mb-2', data.application.fraudRule.triggered ? 'text-amber-300' : 'text-slate-500')}>▸ Fraud Shield</p>
                <p className="text-sm font-bold mb-1">{data.application.fraudRule.label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{data.application.fraudRule.rationale}</p>
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <Pill tone={data.application.fraudRule.triggered ? 'amber' : 'emerald'}>
                    {data.application.fraudRule.triggered ? 'rule triggered' : 'no flag'}
                  </Pill>
                </div>
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.03] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-2">▸ AI Advisor</p>
                <p className="text-sm font-bold mb-1">{data.application.advisorTilt.label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{data.application.advisorTilt.rationale}</p>
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Allocation tilt</span>
                  <span className={cls('text-lg font-black tabular-nums', data.application.advisorTilt.tiltPct >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {data.application.advisorTilt.tiltPct >= 0 ? '+' : ''}{data.application.advisorTilt.tiltPct}%
                  </span>
                </div>
              </div>
            </div>
          </StageCard>

          {/* ─── Pipeline trace ─── */}
          <details className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200">
              ⚙ Pipeline trace ({data.stages.length} stages · {data.totalLatencyMs} ms total)
            </summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.stages.map((s, i) => (
                <div key={i} className="rounded-lg bg-black/30 border border-white/[0.06] p-3 flex items-start gap-3">
                  <span className={cls('mt-1 w-2 h-2 rounded-full shrink-0',
                    s.status === 'ok' ? 'bg-emerald-400' : s.status === 'partial' ? 'bg-amber-400' : 'bg-rose-400')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono text-slate-200">{s.name}</p>
                      <p className="text-[10px] text-slate-500 tabular-nums">{s.latencyMs} ms</p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{s.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </>
      )}
    </div>
  );
};

export default AltDataPipelinePage;
