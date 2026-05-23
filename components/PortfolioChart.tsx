import React, { useMemo, useState } from 'react';

/**
 * PortfolioChart — area sparkline with structured trader controls.
 *
 * Built as a single SVG with:
 *   • Catmull-Rom → Bezier smoothing for the value line
 *   • A deterministic random walk that ends exactly at `totalValue`, so the
 *     chart visually agrees with the headline number.
 *   • Range selector (1D / 1W / 1M / 3M / 1Y / ALL) that reshapes the walk.
 *   • Latest-value dot + horizontal guideline.
 *   • Peak label that fades out for very flat series so it never crowds 0% PnL.
 *   • Time-axis ticks aligned to the chosen range.
 *
 * Keep this component dependency-free so it stays cheap and predictable.
 */

type Range = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

interface Props {
  totalValueUsd: number;
  initialValueUsd?: number;
  /** Currency-aware formatter; usually `useCurrency().format`. */
  format: (usd: number, opts?: { decimals?: number; compact?: boolean }) => string;
}

const RANGES: Range[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

const POINTS_BY_RANGE: Record<Range, number> = {
  '1D':  48,   // 30-min candles
  '1W':  56,   // 3-hour candles
  '1M':  60,   // 12-hour candles
  '3M':  90,   // daily
  '1Y':  78,   // weekly-ish
  'ALL': 120,  // mixed
};

const X_LABELS: Record<Range, string[]> = {
  '1D':  ['24h', '18h', '12h', '6h', '3h', 'now'],
  '1W':  ['7d', '5d', '4d', '3d', '2d', '1d', 'now'],
  '1M':  ['4w', '3w', '2w', '1w', '3d', 'now'],
  '3M':  ['90d', '60d', '30d', '14d', '7d', 'now'],
  '1Y':  ['12mo', '9mo', '6mo', '3mo', '1mo', 'now'],
  'ALL': ['inception', '−2y', '−1y', '−6mo', '−1mo', 'now'],
};

function seededRandom(seed: string) {
  let s = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    s ^= seed.charCodeAt(i);
    s = Math.imul(s, 16777619);
  }
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function generateSeries(totalValue: number, baseline: number, n: number, range: Range): number[] {
  const rnd = seededRandom(`${range}:${baseline.toFixed(0)}:${totalValue.toFixed(0)}`);
  const out: number[] = [];
  const drift = (totalValue - baseline) / n;
  // Scale volatility by the range — short ranges look noisier, long ranges smoother.
  const volBase = baseline * (range === '1D' ? 0.004 : range === '1W' ? 0.006 : range === '1M' ? 0.008 : range === '3M' ? 0.012 : range === '1Y' ? 0.018 : 0.024);
  let v = baseline;
  for (let i = 0; i < n; i++) {
    // Mean-reversion toward expected drift line so series doesn't run off rails.
    const expected = baseline + drift * i;
    const pull = (expected - v) * 0.08;
    v += drift + pull + (rnd() - 0.5) * volBase;
    out.push(v);
  }
  // Anchor the endpoint exactly at totalValue so the visual matches the headline.
  out[n - 1] = totalValue;
  return out;
}

function smoothPath(pts: { x: number; y: number }[], tension = 0.5): string {
  if (pts.length < 2) return '';
  const out: string[] = [`M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) * tension / 6;
    const cp1y = p1.y + (p2.y - p0.y) * tension / 6;
    const cp2x = p2.x - (p3.x - p1.x) * tension / 6;
    const cp2y = p2.y - (p3.y - p1.y) * tension / 6;
    out.push(`C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`);
  }
  return out.join(' ');
}

const PortfolioChart: React.FC<Props> = ({ totalValueUsd, initialValueUsd = 1_000_000, format }) => {
  const [range, setRange] = useState<Range>('1M');
  const [hover, setHover] = useState<{ x: number; y: number; value: number; idx: number } | null>(null);

  const series = useMemo(
    () => generateSeries(totalValueUsd, initialValueUsd, POINTS_BY_RANGE[range], range),
    [totalValueUsd, initialValueUsd, range],
  );

  const isGain = totalValueUsd >= initialValueUsd;
  const strokeColor = isGain ? '#34d399' : '#fb7185';     // emerald-400 / rose-400
  const gradTop = isGain ? 'rgba(52,211,153,0.32)' : 'rgba(251,113,133,0.28)';
  const gradMid = isGain ? 'rgba(52,211,153,0.08)' : 'rgba(251,113,133,0.06)';
  const dotGlow = isGain ? 'rgba(52,211,153,0.45)' : 'rgba(251,113,133,0.45)';

  // SVG coordinate system: 0..1000 wide, 0..280 tall (viewBox), preserveAspectRatio=none.
  const W = 1000;
  const H = 280;
  const PAD_TOP = 28;
  const PAD_BOTTOM = 8;
  const PAD_RIGHT = 60; // reserve space for the latest-value pill
  const PAD_LEFT = 4;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const valueRange = Math.max(1, max - min);
  // Expand the range slightly so peaks don't hug the top edge.
  const yMin = min - valueRange * 0.10;
  const yMax = max + valueRange * 0.18;

  const toX = (i: number) =>
    PAD_LEFT + (i / Math.max(1, series.length - 1)) * (W - PAD_LEFT - PAD_RIGHT);
  const toY = (v: number) =>
    PAD_TOP + (1 - (v - yMin) / Math.max(1, yMax - yMin)) * (H - PAD_TOP - PAD_BOTTOM);

  const points = series.map((v, i) => ({ x: toX(i), y: toY(v) }));
  const line = smoothPath(points, 0.55);
  const area = `${line} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  const lastIdx = series.length - 1;
  const lastPoint = points[lastIdx];
  const peakIdx = series.indexOf(max);
  const peakPoint = points[peakIdx];

  // Avoid the peak label crashing into the latest-value pill.
  const showPeak = Math.abs(peakIdx - lastIdx) > Math.floor(series.length * 0.08) && valueRange > initialValueUsd * 0.005;

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(xPct * (series.length - 1));
    if (idx >= 0 && idx < series.length) {
      setHover({ x: points[idx].x, y: points[idx].y, value: series[idx], idx });
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Range selector */}
      <div className="flex items-center justify-end gap-0.5">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`text-[10.5px] font-semibold tracking-wide px-2 py-1 rounded transition-colors ${
              range === r
                ? 'text-emerald-300 bg-emerald-500/10'
                : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative flex-1 min-h-[180px]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-full"
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="pf-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradTop} />
              <stop offset="65%" stopColor={gradMid} />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
          </defs>

          {/* baseline at midpoint — subtle, gives the eye a reference */}
          <line
            x1={PAD_LEFT}
            x2={W - PAD_RIGHT}
            y1={toY((yMin + yMax) / 2)}
            y2={toY((yMin + yMax) / 2)}
            stroke="rgba(148,163,184,0.06)"
            strokeWidth={1}
          />

          {/* area fill */}
          <path d={area} fill="url(#pf-area)" />

          {/* main line */}
          <path
            d={line}
            stroke={strokeColor}
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* horizontal guide at latest value */}
          <line
            x1={PAD_LEFT}
            x2={lastPoint.x}
            y1={lastPoint.y}
            y2={lastPoint.y}
            stroke={strokeColor}
            strokeOpacity={0.18}
            strokeWidth={1}
            strokeDasharray="3 6"
          />

          {/* peak marker */}
          {showPeak && (
            <g>
              <circle cx={peakPoint.x} cy={peakPoint.y} r={3} fill={strokeColor} fillOpacity={0.9} />
              <line
                x1={peakPoint.x}
                x2={peakPoint.x}
                y1={peakPoint.y + 4}
                y2={peakPoint.y + 14}
                stroke="rgba(148,163,184,0.4)"
                strokeWidth={1}
              />
            </g>
          )}

          {/* crosshair on hover */}
          {hover && (
            <g>
              <line
                x1={hover.x}
                x2={hover.x}
                y1={PAD_TOP}
                y2={H - PAD_BOTTOM}
                stroke="rgba(148,163,184,0.25)"
                strokeWidth={1}
                strokeDasharray="2 4"
              />
              <circle cx={hover.x} cy={hover.y} r={3.5} fill={strokeColor} stroke="#0a0f1c" strokeWidth={1.5} />
            </g>
          )}

          {/* latest value pulse */}
          <circle cx={lastPoint.x} cy={lastPoint.y} r={9} fill={dotGlow}>
            <animate attributeName="r" values="6;12;6" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.05;0.6" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={strokeColor} stroke="#0a0f1c" strokeWidth={2} />
        </svg>

        {/* Latest-value pill (positioned in HTML space so text doesn't squish under preserveAspectRatio=none) */}
        <div
          className="pointer-events-none absolute"
          style={{
            top: `${(lastPoint.y / H) * 100}%`,
            right: `${PAD_RIGHT * 0.1}%`,
            transform: 'translateY(-50%)',
          }}
        >
          <div
            className="px-2 py-1 rounded-md font-semibold text-[11px] tabular-nums whitespace-nowrap"
            style={{
              backgroundColor: isGain ? 'rgba(16,185,129,0.18)' : 'rgba(244,63,94,0.18)',
              color: strokeColor,
              border: `1px solid ${strokeColor}55`,
            }}
          >
            {format(series[lastIdx], { compact: true })}
          </div>
        </div>

        {/* Peak label */}
        {showPeak && (
          <div
            className="pointer-events-none absolute text-[10px] tabular-nums text-slate-500"
            style={{
              left: `${(peakPoint.x / W) * 100}%`,
              top: `${(peakPoint.y / H) * 100}%`,
              transform: 'translate(-50%, calc(-100% - 6px))',
            }}
          >
            peak <span className="text-slate-300 font-medium">{format(max, { compact: true })}</span>
          </div>
        )}

        {/* Hover tooltip */}
        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full mb-2 rounded-md border border-white/[0.08] bg-[#0a0f1c]/95 backdrop-blur px-2.5 py-1.5 text-[11px] tabular-nums"
            style={{
              left: `${(hover.x / W) * 100}%`,
              top: `${(hover.y / H) * 100}%`,
            }}
          >
            <div className="text-slate-100 font-semibold">{format(hover.value)}</div>
            <div className="text-[9.5px] text-slate-500 uppercase tracking-wider">
              {X_LABELS[range][Math.round((hover.idx / (series.length - 1)) * (X_LABELS[range].length - 1))]}
            </div>
          </div>
        )}
      </div>

      {/* x-axis ticks */}
      <div className="flex justify-between text-[9.5px] text-slate-600 px-1 -mt-1">
        {X_LABELS[range].map((l) => (
          <span key={l} className="tabular-nums">{l}</span>
        ))}
      </div>
    </div>
  );
};

export default PortfolioChart;
