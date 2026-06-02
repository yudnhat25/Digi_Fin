import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, LineData, HistogramData, Time } from 'lightweight-charts';

export interface IndicatorFlags {
  ma?: boolean;    // MA 7/25/99 overlay
  ema?: boolean;   // EMA 21 overlay
  boll?: boolean;  // Bollinger Bands 20,2 overlay
  vol?: boolean;   // Volume sub-pane
  macd?: boolean;  // MACD 12/26/9 sub-pane
  rsi?: boolean;   // RSI 6/12/24 sub-pane
}

interface Props {
  symbol: string;
  timeframe: string;
  indicators?: IndicatorFlags;
}

const TIMEFRAME_TO_BINANCE: Record<string, string> = {
  '1m': '1m', '15m': '15m', '1h': '1h', '4h': '4h', '1D': '1d',
};

interface Bar { time: Time; open: number; high: number; low: number; close: number; volume: number }

// ─────────── indicator math (all return arrays aligned to the input) ───────────
function sma(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

// EMA that tolerates leading NaN (needed for MACD's signal line over DIF).
function emaSeries(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  const k = 2 / (period + 1);
  let prev: number | null = null;
  let count = 0, seed = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isNaN(v)) continue;
    if (prev === null) {
      count++; seed += v;
      if (count === period) { prev = seed / period; out[i] = prev; }
    } else {
      prev = v * k + prev * (1 - k);
      out[i] = prev;
    }
  }
  return out;
}

function computeRSI(values: number[], period = 14): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  if (values.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgGain = gain / period, avgLoss = loss / period;
  out[period] = 100 - 100 / (1 + (avgLoss === 0 ? 100 : avgGain / avgLoss));
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d < 0 ? -d : 0)) / period;
    out[i] = 100 - 100 / (1 + (avgLoss === 0 ? 100 : avgGain / avgLoss));
  }
  return out;
}

function computeBOLL(closes: number[], period = 20, mult = 2) {
  const mid = sma(closes, period);
  const up: number[] = new Array(closes.length).fill(NaN);
  const low: number[] = new Array(closes.length).fill(NaN);
  for (let i = period - 1; i < closes.length; i++) {
    const m = mid[i];
    let varSum = 0;
    for (let j = i - period + 1; j <= i; j++) varSum += (closes[j] - m) ** 2;
    const sd = Math.sqrt(varSum / period);
    up[i] = m + mult * sd;
    low[i] = m - mult * sd;
  }
  return { mid, up, low };
}

function computeMACD(closes: number[], fast = 12, slow = 26, signal = 9) {
  const ef = emaSeries(closes, fast);
  const es = emaSeries(closes, slow);
  const dif = closes.map((_, i) => (Number.isNaN(ef[i]) || Number.isNaN(es[i]) ? NaN : ef[i] - es[i]));
  const dea = emaSeries(dif, signal);
  const hist = dif.map((v, i) => (Number.isNaN(v) || Number.isNaN(dea[i]) ? NaN : v - dea[i]));
  return { dif, dea, hist };
}

const toLine = (bars: Bar[], vals: number[]): LineData[] =>
  bars.map((b, i) => ({ time: b.time, value: vals[i] })).filter((p) => !Number.isNaN(p.value)) as LineData[];

const UP = '#34d399', DOWN = '#fb7185';
const lastVal = (a: number[]) => { for (let i = a.length - 1; i >= 0; i--) if (!Number.isNaN(a[i])) return a[i]; return NaN; };

const LiveCandlestickChart: React.FC<Props> = ({ symbol, timeframe, indicators = {} }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const seriesMap = useRef<Record<string, ISeriesApi<'Line'> | ISeriesApi<'Histogram'>>>({});
  const barsRef = useRef<Bar[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'loading' | 'streaming' | 'reconnecting' | 'error'>('loading');
  const [livePrice, setLivePrice] = useState<{ p: number; c: number } | null>(null);
  const [legend, setLegend] = useState<Record<string, string>>({});

  const ind = indicators;
  const flagKey = (['ma', 'ema', 'boll', 'vol', 'macd', 'rsi'] as const).filter((k) => ind[k]).join(',');

  // ── Init chart once ──
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.05)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.05)' },
      },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: 'rgba(148, 163, 184, 0.1)' },
      rightPriceScale: { borderColor: 'rgba(148, 163, 184, 0.1)' },
      crosshair: { mode: 1 },
    });
    chartRef.current = chart;
    candleSeriesRef.current = (chart as any).addCandlestickSeries({
      upColor: UP, downColor: DOWN, borderUpColor: UP, borderDownColor: DOWN,
      wickUpColor: UP, wickDownColor: DOWN, priceLineColor: UP, priceLineStyle: 2,
    });
    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      seriesMap.current = {};
    };
  }, []);

  // ── Allocate vertical bands so active sub-panes never overlap ──
  function applyLayout(activePanes: string[]) {
    const chart = chartRef.current, candle = candleSeriesRef.current;
    if (!chart || !candle) return;
    const n = activePanes.length;
    if (n === 0) { candle.priceScale().applyOptions({ scaleMargins: { top: 0.06, bottom: 0.08 } }); return; }
    const bottomRegion = Math.min(0.66, n * 0.22);
    candle.priceScale().applyOptions({ scaleMargins: { top: 0.05, bottom: bottomRegion + 0.04 } });
    const paneH = bottomRegion / n;
    activePanes.forEach((id, k) => {
      const top = (1 - bottomRegion) + k * paneH;
      chart.priceScale(id).applyOptions({
        scaleMargins: { top, bottom: Math.max(0, 1 - (top + paneH)) },
        borderColor: 'rgba(148, 163, 184, 0.1)',
      });
    });
  }

  // ── Build indicator series + data whenever symbol / timeframe / indicator set changes ──
  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setLivePrice(null);
    const interval = TIMEFRAME_TO_BINANCE[timeframe] || '15m';

    // Wipe any previously-created indicator series (candles persist).
    const chart = chartRef.current;
    if (chart) {
      Object.values(seriesMap.current).forEach((s) => { try { chart.removeSeries(s as any); } catch { /* noop */ } });
    }
    seriesMap.current = {};
    setLegend({});

    const add = (id: string, kind: 'line' | 'hist', opts: any) => {
      if (!chart) return;
      const s = kind === 'line' ? (chart as any).addLineSeries(opts) : (chart as any).addHistogramSeries(opts);
      seriesMap.current[id] = s;
      return s;
    };

    const activePanes: string[] = [];
    if (ind.vol) activePanes.push('vol');
    if (ind.macd) activePanes.push('macd');
    if (ind.rsi) activePanes.push('rsi');

    // Create overlay series (share the price scale).
    if (ind.ma) {
      add('ma7', 'line', { color: '#f0b90b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      add('ma25', 'line', { color: '#ec4899', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      add('ma99', 'line', { color: '#8b5cf6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    }
    if (ind.ema) add('ema21', 'line', { color: '#60a5fa', lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false });
    if (ind.boll) {
      add('bollMid', 'line', { color: '#f59e0b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      add('bollUp', 'line', { color: 'rgba(148,163,184,0.7)', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
      add('bollLow', 'line', { color: 'rgba(148,163,184,0.7)', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
    }
    // Sub-pane series.
    if (ind.vol) {
      add('volBar', 'hist', { priceScaleId: 'vol', priceFormat: { type: 'volume' }, priceLineVisible: false, lastValueVisible: false });
      add('volMa5', 'line', { priceScaleId: 'vol', color: '#f0b90b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      add('volMa10', 'line', { priceScaleId: 'vol', color: '#8b5cf6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    }
    if (ind.macd) {
      add('macdHist', 'hist', { priceScaleId: 'macd', priceLineVisible: false, lastValueVisible: false });
      add('macdDif', 'line', { priceScaleId: 'macd', color: '#f0b90b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      add('macdDea', 'line', { priceScaleId: 'macd', color: '#8b5cf6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    }
    if (ind.rsi) {
      const rsi6 = add('rsi6', 'line', { priceScaleId: 'rsi', color: '#f0b90b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false }) as ISeriesApi<'Line'>;
      add('rsi12', 'line', { priceScaleId: 'rsi', color: '#ec4899', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      add('rsi24', 'line', { priceScaleId: 'rsi', color: '#8b5cf6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      rsi6?.createPriceLine({ price: 70, color: 'rgba(251,113,133,0.3)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '70' });
      rsi6?.createPriceLine({ price: 30, color: 'rgba(52,211,153,0.3)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '30' });
    }
    applyLayout(activePanes);

    function paint() {
      const bars = barsRef.current;
      if (!bars.length) return;
      const closes = bars.map((b) => b.close);
      const vols = bars.map((b) => b.volume);
      const lg: Record<string, string> = {};

      if (ind.ma) {
        const m7 = sma(closes, 7), m25 = sma(closes, 25), m99 = sma(closes, 99);
        (seriesMap.current.ma7 as ISeriesApi<'Line'>)?.setData(toLine(bars, m7));
        (seriesMap.current.ma25 as ISeriesApi<'Line'>)?.setData(toLine(bars, m25));
        (seriesMap.current.ma99 as ISeriesApi<'Line'>)?.setData(toLine(bars, m99));
        lg.MA = `MA7 ${lastVal(m7).toFixed(0)} · MA25 ${lastVal(m25).toFixed(0)} · MA99 ${lastVal(m99).toFixed(0)}`;
      }
      if (ind.ema) {
        const e = emaSeries(closes, 21);
        (seriesMap.current.ema21 as ISeriesApi<'Line'>)?.setData(toLine(bars, e));
        lg.EMA = `EMA21 ${lastVal(e).toFixed(0)}`;
      }
      if (ind.boll) {
        const { mid, up, low } = computeBOLL(closes, 20, 2);
        (seriesMap.current.bollMid as ISeriesApi<'Line'>)?.setData(toLine(bars, mid));
        (seriesMap.current.bollUp as ISeriesApi<'Line'>)?.setData(toLine(bars, up));
        (seriesMap.current.bollLow as ISeriesApi<'Line'>)?.setData(toLine(bars, low));
        lg.BOLL = `BOLL(20,2)`;
      }
      if (ind.vol) {
        const volData: HistogramData[] = bars.map((b) => ({
          time: b.time, value: b.volume,
          color: b.close >= b.open ? 'rgba(52,211,153,0.5)' : 'rgba(251,113,133,0.5)',
        }));
        (seriesMap.current.volBar as ISeriesApi<'Histogram'>)?.setData(volData);
        (seriesMap.current.volMa5 as ISeriesApi<'Line'>)?.setData(toLine(bars, sma(vols, 5)));
        (seriesMap.current.volMa10 as ISeriesApi<'Line'>)?.setData(toLine(bars, sma(vols, 10)));
        lg.VOL = `VOL ${lastVal(vols).toFixed(0)}`;
      }
      if (ind.macd) {
        const { dif, dea, hist } = computeMACD(closes);
        const histData: HistogramData[] = bars
          .map((b, i) => ({ time: b.time, value: hist[i], color: hist[i] >= 0 ? 'rgba(52,211,153,0.5)' : 'rgba(251,113,133,0.5)' }))
          .filter((p) => !Number.isNaN(p.value)) as HistogramData[];
        (seriesMap.current.macdHist as ISeriesApi<'Histogram'>)?.setData(histData);
        (seriesMap.current.macdDif as ISeriesApi<'Line'>)?.setData(toLine(bars, dif));
        (seriesMap.current.macdDea as ISeriesApi<'Line'>)?.setData(toLine(bars, dea));
        lg.MACD = `DIF ${lastVal(dif).toFixed(1)} · DEA ${lastVal(dea).toFixed(1)} · MACD ${lastVal(hist).toFixed(1)}`;
      }
      if (ind.rsi) {
        const r6 = computeRSI(closes, 6), r12 = computeRSI(closes, 12), r24 = computeRSI(closes, 24);
        (seriesMap.current.rsi6 as ISeriesApi<'Line'>)?.setData(toLine(bars, r6));
        (seriesMap.current.rsi12 as ISeriesApi<'Line'>)?.setData(toLine(bars, r12));
        (seriesMap.current.rsi24 as ISeriesApi<'Line'>)?.setData(toLine(bars, r24));
        lg.RSI = `RSI6 ${lastVal(r6).toFixed(1)} · RSI12 ${lastVal(r12).toFixed(1)} · RSI24 ${lastVal(r24).toFixed(1)}`;
      }
      if (alive) setLegend(lg);
    }

    // 1) Initial history via REST.
    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=400`)
      .then((r) => r.json())
      .then((rows: any[]) => {
        if (!alive || !candleSeriesRef.current) return;
        const bars: Bar[] = rows.map((r) => ({
          time: Math.floor(r[0] / 1000) as Time,
          open: Number(r[1]), high: Number(r[2]), low: Number(r[3]), close: Number(r[4]), volume: Number(r[5]),
        }));
        barsRef.current = bars;
        candleSeriesRef.current.setData(bars.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })) as CandlestickData[]);
        paint();
        chartRef.current?.timeScale().fitContent();
        setStatus('streaming');
        openWebSocket();
      })
      .catch(() => { if (alive) setStatus('error'); });

    let retryTimer: number | null = null;
    function openWebSocket() {
      const stream = `${symbol.toLowerCase()}@kline_${interval}`;
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        if (!alive || !candleSeriesRef.current) return;
        try {
          const payload = JSON.parse(event.data) as {
            k: { t: number; o: string; c: string; h: string; l: string; v: string; x: boolean };
          };
          const k = payload.k;
          if (!k) return;
          const time = Math.floor(k.t / 1000) as Time;
          const bar: Bar = { time, open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v };
          candleSeriesRef.current.update({ time, open: bar.open, high: bar.high, low: bar.low, close: bar.close });
          setLivePrice({ p: bar.close, c: ((bar.close - bar.open) / bar.open) * 100 });

          const bars = barsRef.current;
          if (bars.length && bars[bars.length - 1].time === time) bars[bars.length - 1] = bar;
          else { bars.push(bar); if (bars.length > 600) bars.shift(); }
          paint(); // recompute indicators on the live bar (≤600 bars → cheap)
        } catch { /* ignore malformed frame */ }
      };
      ws.onopen = () => { if (alive) setStatus('streaming'); };
      ws.onclose = () => {
        if (!alive) return;
        setStatus('reconnecting');
        retryTimer = window.setTimeout(() => alive && openWebSocket(), 3000);
      };
    }

    return () => {
      alive = false;
      if (retryTimer) window.clearTimeout(retryTimer);
      if (wsRef.current) { try { wsRef.current.close(); } catch { /* noop */ } wsRef.current = null; }
    };
  }, [symbol, timeframe, flagKey]);

  const legendOrder = ['MA', 'EMA', 'BOLL', 'VOL', 'MACD', 'RSI'];
  const legendColor: Record<string, string> = {
    MA: 'text-amber-300', EMA: 'text-blue-300', BOLL: 'text-amber-300',
    VOL: 'text-slate-300', MACD: 'text-amber-300', RSI: 'text-amber-300',
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />

      {/* live status pill */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 text-[10.5px] font-medium">
        {status === 'streaming' && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <span className="relative inline-flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" />
            </span>
            live
          </span>
        )}
        {status === 'loading' && <span className="px-2 py-0.5 rounded-md bg-slate-700/40 text-slate-400">loading…</span>}
        {status === 'reconnecting' && <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300">reconnecting…</span>}
        {status === 'error' && <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300">data error</span>}
        {livePrice && (
          <span className={`px-2 py-0.5 rounded-md font-bold tabular-nums ${livePrice.c >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            ${livePrice.p.toLocaleString()} ({livePrice.c >= 0 ? '+' : ''}{livePrice.c.toFixed(2)}%)
          </span>
        )}
      </div>

      {/* indicator legend */}
      {Object.keys(legend).length > 0 && (
        <div className="absolute top-9 left-2 z-10 flex flex-col gap-0.5 text-[10px] font-mono pointer-events-none">
          {legendOrder.filter((k) => legend[k]).map((k) => (
            <span key={k} className={legendColor[k]}>{legend[k]}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveCandlestickChart;
