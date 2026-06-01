import React, { useEffect, useRef, useState } from 'react';

/**
 * Live Order Book + Recent Trades (Time & Sales) for the selected pair.
 *
 * Streams directly from Binance public WebSockets — the same approach used by
 * LiveCandlestickChart — so it needs no API key and updates in real time:
 *   • <symbol>@depth20@100ms — top-20 bids/asks snapshot every 100ms
 *   • <symbol>@aggTrade      — live trade tape
 *
 * A REST snapshot fills the panels instantly before the socket warms up.
 */

interface Level { price: number; qty: number }
interface Trade { id: number; price: number; qty: number; time: number; isSell: boolean }

const BINANCE_REST = 'https://api.binance.com/api/v3';
const BINANCE_WS = 'wss://stream.binance.com:9443/ws';
const BOOK_ROWS = 11;
const MAX_TRADES = 24;

// Adaptive price formatting — BTC ($72k) vs SOL ($81) vs DOGE ($0.16).
function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return p.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}
function fmtQty(q: number): string {
  if (q >= 1000) return `${(q / 1000).toFixed(2)}K`;
  if (q >= 1) return q.toFixed(3);
  return q.toFixed(4);
}
function fmtTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString('en-GB', { hour12: false });
}

const OrderBookPanel: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [asks, setAsks] = useState<Level[]>([]);
  const [bids, setBids] = useState<Level[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [status, setStatus] = useState<'loading' | 'live' | 'reconnecting'>('loading');
  const tradeSeq = useRef(0);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setAsks([]); setBids([]); setTrades([]);
    const lower = symbol.toLowerCase();
    let depthWs: WebSocket | null = null;
    let tradeWs: WebSocket | null = null;
    let retry: number | null = null;

    // ── REST snapshot for instant fill ──
    fetch(`${BINANCE_REST}/depth?symbol=${symbol}&limit=${BOOK_ROWS}`)
      .then((r) => r.json())
      .then((d: { bids: [string, string][]; asks: [string, string][] }) => {
        if (!alive || !d.bids) return;
        setBids(d.bids.map(([p, q]) => ({ price: +p, qty: +q })));
        setAsks(d.asks.map(([p, q]) => ({ price: +p, qty: +q })));
      })
      .catch(() => {});

    fetch(`${BINANCE_REST}/trades?symbol=${symbol}&limit=${MAX_TRADES}`)
      .then((r) => r.json())
      .then((rows: { id: number; price: string; qty: string; time: number; isBuyerMaker: boolean }[]) => {
        if (!alive || !Array.isArray(rows)) return;
        setTrades(rows.reverse().map((t) => ({
          id: t.id, price: +t.price, qty: +t.qty, time: t.time, isSell: t.isBuyerMaker,
        })));
      })
      .catch(() => {});

    function openSockets() {
      // Order book — partial depth stream returns full top-N snapshot each tick.
      depthWs = new WebSocket(`${BINANCE_WS}/${lower}@depth20@100ms`);
      depthWs.onmessage = (e) => {
        if (!alive) return;
        try {
          const m = JSON.parse(e.data) as { bids: [string, string][]; asks: [string, string][] };
          if (m.bids) setBids(m.bids.slice(0, BOOK_ROWS).map(([p, q]) => ({ price: +p, qty: +q })));
          if (m.asks) setAsks(m.asks.slice(0, BOOK_ROWS).map(([p, q]) => ({ price: +p, qty: +q })));
        } catch { /* ignore */ }
      };
      depthWs.onopen = () => alive && setStatus('live');
      depthWs.onclose = () => {
        if (!alive) return;
        setStatus('reconnecting');
        retry = window.setTimeout(() => alive && openSockets(), 3000);
      };

      // Trade tape.
      tradeWs = new WebSocket(`${BINANCE_WS}/${lower}@aggTrade`);
      tradeWs.onmessage = (e) => {
        if (!alive) return;
        try {
          const m = JSON.parse(e.data) as { p: string; q: string; T: number; m: boolean };
          const t: Trade = { id: tradeSeq.current++, price: +m.p, qty: +m.q, time: m.T, isSell: m.m };
          setTrades((prev) => [t, ...prev].slice(0, MAX_TRADES));
        } catch { /* ignore */ }
      };
    }
    openSockets();

    return () => {
      alive = false;
      if (retry) window.clearTimeout(retry);
      try { depthWs?.close(); } catch { /* noop */ }
      try { tradeWs?.close(); } catch { /* noop */ }
    };
  }, [symbol]);

  const base = symbol.replace('USDT', '');
  const bestAsk = asks[0]?.price;
  const bestBid = bids[0]?.price;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;
  const spreadPct = bestAsk && bestBid ? (spread / bestAsk) * 100 : 0;
  const maxQty = Math.max(
    1e-9,
    ...asks.slice(0, BOOK_ROWS).map((l) => l.qty),
    ...bids.slice(0, BOOK_ROWS).map((l) => l.qty),
  );

  const StatusDot = (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
      {status === 'live' ? (
        <><span className="relative inline-flex w-1.5 h-1.5"><span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" /><span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" /></span><span className="text-emerald-400">Live</span></>
      ) : status === 'reconnecting' ? (
        <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /><span className="text-amber-400">Reconnect</span></>
      ) : (
        <><span className="w-1.5 h-1.5 rounded-full bg-slate-500" /><span className="text-slate-500">Loading</span></>
      )}
    </span>
  );

  const Row: React.FC<{ level: Level; side: 'ask' | 'bid' }> = ({ level, side }) => {
    const w = Math.min(100, (level.qty / maxQty) * 100);
    const isAsk = side === 'ask';
    return (
      <div className="relative grid grid-cols-2 px-3 py-[3px] text-[11px] font-mono tabular-nums">
        <div
          className={`absolute inset-y-0 right-0 ${isAsk ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}
          style={{ width: `${w}%` }}
        />
        <span className={`relative z-10 ${isAsk ? 'text-rose-400' : 'text-emerald-400'}`}>{fmtPrice(level.price)}</span>
        <span className="relative z-10 text-right text-slate-400">{fmtQty(level.qty)}</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ─── Order Book ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-sm uppercase tracking-widest">Order Book · {base}</h3>
          {StatusDot}
        </div>
        <div className="grid grid-cols-2 px-3 pb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
          <span>Price (USDT)</span><span className="text-right">Amount ({base})</span>
        </div>

        {/* Asks (reversed: lowest ask nearest the spread) */}
        <div className="flex flex-col-reverse">
          {asks.slice(0, BOOK_ROWS).map((l, i) => <Row key={`a${i}`} level={l} side="ask" />)}
        </div>

        {/* Spread */}
        <div className="flex items-center justify-between px-3 py-2 my-1 rounded-lg bg-slate-950/60 border border-slate-800/60">
          <span className="text-base font-black tabular-nums text-white">{bestBid ? fmtPrice((bestAsk! + bestBid) / 2) : '—'}</span>
          <span className="text-[10px] font-mono text-slate-500">
            spread {spread ? fmtPrice(spread) : '—'} ({spreadPct.toFixed(3)}%)
          </span>
        </div>

        {/* Bids */}
        <div>
          {bids.slice(0, BOOK_ROWS).map((l, i) => <Row key={`b${i}`} level={l} side="bid" />)}
        </div>
      </div>

      {/* ─── Recent Trades ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-sm uppercase tracking-widest">Recent Trades</h3>
          {StatusDot}
        </div>
        <div className="grid grid-cols-3 px-3 pb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
          <span>Price</span><span className="text-right">Amount</span><span className="text-right">Time</span>
        </div>
        <div className="space-y-px">
          {trades.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-600 italic">Waiting for trades…</div>
          ) : (
            trades.map((t) => (
              <div key={t.id} className="grid grid-cols-3 px-3 py-[3px] text-[11px] font-mono tabular-nums">
                <span className={t.isSell ? 'text-rose-400' : 'text-emerald-400'}>{fmtPrice(t.price)}</span>
                <span className="text-right text-slate-300">{fmtQty(t.qty)}</span>
                <span className="text-right text-slate-500">{fmtTime(t.time)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderBookPanel;
