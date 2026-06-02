import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, LineData, Time } from 'lightweight-charts';

interface Props {
  symbol: string;
  timeframe: string;
  showEMA?: boolean;
  showRSI?: boolean;
}

const TIMEFRAME_TO_BINANCE: Record<string, string> = {
  '1m': '1m', '15m': '15m', '1h': '1h', '4h': '4h', '1D': '1d',
};

function computeEMA(values: number[], period = 21): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { out.push(NaN); continue; }
    if (prev == null) {
      const slice = values.slice(0, period);
      prev = slice.reduce((s, v) => s + v, 0) / period;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out.push(prev);
  }
  return out;
}

// Wilder's RSI (0-100). Returns NaN until enough history accumulates.
function computeRSI(values: number[], period = 14): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  if (values.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = 100 - 100 / (1 + (avgLoss === 0 ? 100 : avgGain / avgLoss));
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out[i] = 100 - 100 / (1 + rs);
  }
  return out;
}

const LiveCandlestickChart: React.FC<Props> = ({ symbol, timeframe, showEMA, showRSI }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const closesRef = useRef<number[]>([]); // kept in sync for live EMA recomputation
  const [status, setStatus] = useState<'loading' | 'streaming' | 'reconnecting' | 'error'>('loading');
  const [livePrice, setLivePrice] = useState<{ p: number; c: number } | null>(null); // p=price, c=change vs candle open

  // -------- Init chart once --------
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.05)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.05)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(148, 163, 184, 0.1)',
      },
      rightPriceScale: { borderColor: 'rgba(148, 163, 184, 0.1)' },
      crosshair: { mode: 1 },
    });
    chartRef.current = chart;
    const candleSeries = (chart as any).addCandlestickSeries({
      upColor: '#34d399',
      downColor: '#fb7185',
      borderUpColor: '#34d399',
      borderDownColor: '#fb7185',
      wickUpColor: '#34d399',
      wickDownColor: '#fb7185',
      priceLineColor: '#34d399',
      priceLineStyle: 2,
    });
    candleSeriesRef.current = candleSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      emaSeriesRef.current = null;
      rsiSeriesRef.current = null;
    };
  }, []);

  // -------- Refresh data + open WebSocket when symbol/timeframe changes --------
  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setLivePrice(null);
    const interval = TIMEFRAME_TO_BINANCE[timeframe] || '15m';

    // 1) Initial history via REST
    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=300`)
      .then((r) => r.json())
      .then((rows: any[]) => {
        if (!alive || !candleSeriesRef.current) return;
        const candles: CandlestickData[] = rows.map((r) => ({
          time: Math.floor(r[0] / 1000) as Time,
          open: Number(r[1]),
          high: Number(r[2]),
          low: Number(r[3]),
          close: Number(r[4]),
        }));
        candleSeriesRef.current.setData(candles);
        closesRef.current = candles.map((c) => c.close);

        if (showEMA && chartRef.current) {
          const ema = computeEMA(closesRef.current, 21);
          const lineData: LineData[] = candles
            .map((c, i) => ({ time: c.time, value: ema[i] }))
            .filter((p) => !Number.isNaN(p.value));
          if (!emaSeriesRef.current) {
            emaSeriesRef.current = (chartRef.current as any).addLineSeries({
              color: '#60a5fa', lineWidth: 1.5, lineStyle: 0, priceLineVisible: false,
            });
          }
          emaSeriesRef.current!.setData(lineData);
        } else if (emaSeriesRef.current && chartRef.current) {
          chartRef.current.removeSeries(emaSeriesRef.current);
          emaSeriesRef.current = null;
        }

        // RSI(14) in a bottom sub-pane with 30/70 reference lines.
        if (showRSI && chartRef.current) {
          const rsi = computeRSI(closesRef.current, 14);
          const rsiData: LineData[] = candles
            .map((c, i) => ({ time: c.time, value: rsi[i] }))
            .filter((p) => !Number.isNaN(p.value));
          if (!rsiSeriesRef.current) {
            rsiSeriesRef.current = (chartRef.current as any).addLineSeries({
              priceScaleId: 'rsi', color: '#a78bfa', lineWidth: 1.5,
              priceLineVisible: false, lastValueVisible: true,
            });
            chartRef.current.priceScale('rsi').applyOptions({
              scaleMargins: { top: 0.74, bottom: 0.02 },
              borderColor: 'rgba(148, 163, 184, 0.1)',
            });
            rsiSeriesRef.current!.createPriceLine({ price: 70, color: 'rgba(251,113,133,0.35)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '70' });
            rsiSeriesRef.current!.createPriceLine({ price: 30, color: 'rgba(52,211,153,0.35)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '30' });
          }
          // Shrink the candles to the top so the RSI pane has room.
          candleSeriesRef.current!.priceScale().applyOptions({ scaleMargins: { top: 0.05, bottom: 0.32 } });
          rsiSeriesRef.current!.setData(rsiData);
        } else if (rsiSeriesRef.current && chartRef.current) {
          chartRef.current.removeSeries(rsiSeriesRef.current);
          rsiSeriesRef.current = null;
          candleSeriesRef.current?.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } });
        }

        chartRef.current?.timeScale().fitContent();
        setStatus('streaming');

        // 2) Open Binance WS for live kline updates
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
            k: { t: number; o: string; c: string; h: string; l: string; x: boolean };
          };
          const k = payload.k;
          if (!k) return;
          const time = Math.floor(k.t / 1000) as Time;
          const open = Number(k.o);
          const close = Number(k.c);
          const high = Number(k.h);
          const low = Number(k.l);

          candleSeriesRef.current.update({ time, open, high, low, close });
          setLivePrice({ p: close, c: ((close - open) / open) * 100 });

          // Maintain the close buffer for live EMA update on closed candles.
          const closes = closesRef.current;
          if (k.x) {
            // Candle closed — append.
            closes.push(close);
            if (closes.length > 600) closes.shift();
          } else if (closes.length) {
            // Update last close in buffer for in-progress candle.
            closes[closes.length - 1] = close;
          }
          // Lightweight EMA recompute only when we have an EMA series.
          if (showEMA && emaSeriesRef.current && closes.length >= 21) {
            const lastEma = computeEMA(closes.slice(-60), 21);
            const val = lastEma[lastEma.length - 1];
            if (!Number.isNaN(val)) {
              emaSeriesRef.current.update({ time, value: val });
            }
          }
          // Live RSI update on the current candle.
          if (showRSI && rsiSeriesRef.current && closes.length >= 15) {
            const rsiArr = computeRSI(closes.slice(-200), 14);
            const val = rsiArr[rsiArr.length - 1];
            if (!Number.isNaN(val)) {
              rsiSeriesRef.current.update({ time, value: val });
            }
          }
        } catch { /* ignore malformed frame */ }
      };

      ws.onopen = () => { if (alive) setStatus('streaming'); };
      ws.onerror = () => { /* onclose handles retry */ };
      ws.onclose = () => {
        if (!alive) return;
        setStatus('reconnecting');
        retryTimer = window.setTimeout(() => alive && openWebSocket(), 3000);
      };
    }

    return () => {
      alive = false;
      if (retryTimer) window.clearTimeout(retryTimer);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { /* noop */ }
        wsRef.current = null;
      }
    };
  }, [symbol, timeframe, showEMA, showRSI]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />

      {/* live status pill */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 text-[10.5px] font-medium">
        {status === 'streaming' && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <span className="relative inline-flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
              <span className="relative rounded-full w-1.5 h-1.5 bg-emerald-400" />
            </span>
            LIVE
          </span>
        )}
        {status === 'loading' && (
          <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-400">
            Loading {symbol} {timeframe}…
          </span>
        )}
        {status === 'reconnecting' && (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
            Reconnecting…
          </span>
        )}
        {status === 'error' && (
          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300">
            Stream error
          </span>
        )}
        {livePrice && status === 'streaming' && (
          <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-200 tabular-nums">
            ${livePrice.p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className={`ml-1.5 ${livePrice.c >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {livePrice.c >= 0 ? '+' : ''}{livePrice.c.toFixed(2)}%
            </span>
          </span>
        )}
      </div>
    </div>
  );
};

export default LiveCandlestickChart;
