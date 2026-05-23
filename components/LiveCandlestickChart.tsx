import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, LineData, Time } from 'lightweight-charts';

interface Props {
  symbol: string;
  timeframe: string;
  showEMA?: boolean;
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

const LiveCandlestickChart: React.FC<Props> = ({ symbol, timeframe, showEMA }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: '#94a3b8',
      },
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
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderUpColor: '#10b981',
      borderDownColor: '#f43f5e',
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });
    candleSeriesRef.current = candleSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      emaSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    const interval = TIMEFRAME_TO_BINANCE[timeframe] || '15m';
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=200`;
    fetch(url)
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

        if (showEMA && chartRef.current) {
          const closes = candles.map((c) => c.close);
          const ema = computeEMA(closes, 21);
          const lineData: LineData[] = candles
            .map((c, i) => ({ time: c.time, value: ema[i] }))
            .filter((p) => !Number.isNaN(p.value));
          if (!emaSeriesRef.current) {
            emaSeriesRef.current = (chartRef.current as any).addLineSeries({
              color: '#3b82f6', lineWidth: 2, lineStyle: 2, priceLineVisible: false,
            });
          }
          emaSeriesRef.current!.setData(lineData);
        } else if (emaSeriesRef.current && chartRef.current) {
          chartRef.current.removeSeries(emaSeriesRef.current);
          emaSeriesRef.current = null;
        }
        chartRef.current?.timeScale().fitContent();
        setStatus('ready');
      })
      .catch(() => { if (alive) setStatus('error'); });
    return () => { alive = false; };
  }, [symbol, timeframe, showEMA]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs animate-pulse pointer-events-none">
          Loading {symbol} {timeframe} candles…
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center text-rose-400 text-xs">
          Chart failed to load — Binance API unavailable.
        </div>
      )}
    </div>
  );
};

export default LiveCandlestickChart;
