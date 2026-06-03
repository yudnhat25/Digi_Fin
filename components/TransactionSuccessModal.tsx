import React, { useEffect } from 'react';

/**
 * TransactionSuccessModal — a prominent, centered "Transaction Successful"
 * pop-up fired whenever money is moved (sent / received / deposited / withdrawn)
 * across the CoinWise app AND the CoinWise Bank web. It is intentionally
 * self-contained (no context/provider) so the standalone bank bundle
 * (bank/main.tsx) can import the exact same component.
 */

export interface TxnSuccessData {
  /** Heading. Defaults to "Transaction Successful". */
  title?: string;
  /** One-line description under the title. */
  subtitle?: string;
  /** Hero amount, already formatted, e.g. "+ $1,000.00" or "5,000,000 ₫". */
  amount?: string;
  /** Tints the amount + sign: money in (green) vs money out (rose). */
  direction?: 'in' | 'out';
  /** Optional detail rows (Type, Recipient, New balance…). */
  rows?: { label: string; value: string }[];
  /** Optional transaction reference / id. */
  reference?: string;
}

interface Props {
  data: TxnSuccessData | null;
  onClose: () => void;
  /** Auto-dismiss after N ms. Pass 0 to disable. Default 5000. */
  autoCloseMs?: number;
}

const TransactionSuccessModal: React.FC<Props> = ({ data, onClose, autoCloseMs = 5000 }) => {
  useEffect(() => {
    if (!data) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const t = autoCloseMs > 0 ? setTimeout(onClose, autoCloseMs) : undefined;
    return () => {
      window.removeEventListener('keydown', onKey);
      if (t) clearTimeout(t);
    };
  }, [data, autoCloseMs, onClose]);

  if (!data) return null;

  const amountColor = data.direction === 'out' ? 'text-rose-300' : 'text-emerald-300';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 p-8 text-center animate-in zoom-in-95 fade-in duration-300"
      >
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Animated success check */}
        <div className="relative mx-auto mb-5 w-20 h-20">
          <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <svg className="w-10 h-10 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" className="cw-check-path" />
            </svg>
          </div>
        </div>

        <h3 className="text-xl font-black text-white">{data.title || 'Transaction Successful'}</h3>
        {data.subtitle && <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{data.subtitle}</p>}
        {data.amount && (
          <p className={`text-3xl font-black tabular-nums mt-4 ${amountColor}`}>{data.amount}</p>
        )}

        {(data.rows?.length || data.reference) && (
          <div className="mt-5 rounded-2xl bg-slate-900/60 border border-slate-800 divide-y divide-slate-800 text-left">
            {data.rows?.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-xs font-medium text-slate-500 shrink-0">{r.label}</span>
                <span className="text-xs font-bold text-slate-200 tabular-nums text-right break-all">{r.value}</span>
              </div>
            ))}
            {data.reference && (
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-xs font-medium text-slate-500 shrink-0">Reference</span>
                <span className="text-xs font-mono text-emerald-300 break-all">{data.reference}</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition active:scale-95"
        >
          Done
        </button>
        <p className="text-[10px] text-slate-600 mt-3">Secured by CoinWise · this window closes automatically</p>
      </div>

      <style>{`
        @keyframes cwCheckDraw { from { stroke-dashoffset: 30; } to { stroke-dashoffset: 0; } }
        .cw-check-path { stroke-dasharray: 30; stroke-dashoffset: 30; animation: cwCheckDraw .45s ease-out .15s forwards; }
      `}</style>
    </div>
  );
};

export default TransactionSuccessModal;
