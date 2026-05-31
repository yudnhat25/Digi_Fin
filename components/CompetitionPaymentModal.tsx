
import React, { useEffect, useState } from 'react';
import { ENTRY_FEE } from '../constants';
import { apiFxConvert } from '../services/coinwiseApi';
import { useCurrency } from '../services/currency';

interface CompetitionPaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CompetitionPaymentModal: React.FC<CompetitionPaymentModalProps> = ({ onClose, onSuccess }) => {
  const { usdVnd, formatVND } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [fxQuote, setFxQuote] = useState<{ amountVnd: number; rate: number } | null>(null);

  // Stripe simulation collects USD, but the user pays in a Vietnam-first
  // product, so call the CoinWise OpenAPI /fx/convert bridge to surface the
  // equivalent VND charge before they confirm. Falls back to the cached
  // useCurrency rate if the request fails.
  useEffect(() => {
    let alive = true;
    apiFxConvert(ENTRY_FEE, 'USD', 'VND')
      .then((r) => { if (alive) setFxQuote({ amountVnd: r.result, rate: r.rate }); })
      .catch(() => {
        if (!alive) return;
        setFxQuote({ amountVnd: Math.round(ENTRY_FEE * usdVnd), rate: usdVnd });
      });
    return () => { alive = false; };
  }, [usdVnd]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-white text-slate-900 rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-[#635BFF]" viewBox="0 0 40 40" fill="currentColor">
              <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 36.364C10.963 36.364 3.636 29.037 3.636 20S10.963 3.636 20 3.636 36.364 10.963 36.364 20s-7.327 16.364-16.364 16.364z"/>
            </svg>
            <span className="font-bold text-2xl tracking-tight text-[#635BFF]">Stripe <span className="text-slate-400 font-medium text-sm">Competition Entry</span></span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="mb-6 text-center">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-1">Total Due</p>
          <p className="text-4xl font-black text-slate-900 tabular-nums">${ENTRY_FEE.toFixed(2)} <span className="text-slate-400 text-lg font-bold">USD</span></p>
          <p className="text-emerald-600 text-base font-bold tabular-nums mt-1">
            ≈ {fxQuote ? formatVND(fxQuote.amountVnd) : '…'}
          </p>
          {fxQuote && (
            <p className="text-[10px] text-slate-400 mt-1">
              FX bridge · 1 USD = {fxQuote.rate.toLocaleString('vi-VN')} ₫ · sourced from <code>/api/v1/fx/convert</code>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Card Details</label>
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                <input readOnly value="4242 4242 4242 4242" className="bg-transparent border-none p-0 focus:ring-0 text-slate-700 font-medium flex-1" />
              </div>
              <div className="flex justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                   <input readOnly value="12 / 26" className="bg-transparent border-none p-0 focus:ring-0 text-slate-700 font-medium w-full" />
                </div>
                <div className="flex items-center gap-2 w-16">
                   <input readOnly value="CVC" className="bg-transparent border-none p-0 focus:ring-0 text-slate-400 font-medium w-full text-right" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"></path></svg>
            <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">
              Stripe collects USD on its rails. CoinWise's OpenAPI bridge surfaces the equivalent VND so VN users see the real cost. Simulated payment — the $5 fee is deducted from your CoinWise demo balance only.
            </p>
          </div>

          <button
            disabled={isProcessing}
            className="w-full bg-[#635BFF] hover:bg-[#5851e0] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-[#635BFF]/20 disabled:opacity-70"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing Payment...
              </>
            ) : (
              <>Pay ${ENTRY_FEE.toFixed(2)} {fxQuote && <span className="opacity-80 text-sm">· {formatVND(fxQuote.amountVnd)}</span>} &amp; Enter Arena</>
            )}
          </button>

          <p className="text-center text-[10px] text-slate-400 font-medium">
            By paying, you agree to the Competition Terms and PNL Calculation Rules.
          </p>
        </form>
      </div>
    </div>
  );
};

export default CompetitionPaymentModal;
