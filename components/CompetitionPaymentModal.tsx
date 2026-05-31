
import React, { useEffect, useState } from 'react';
import { ENTRY_FEE } from '../constants';
import { apiFxConvert, apiBankAccount, apiBankPayEntry } from '../services/coinwiseApi';
import { useCurrency } from '../services/currency';

interface CompetitionPaymentModalProps {
  accountId: string;
  holder?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CompetitionPaymentModal: React.FC<CompetitionPaymentModalProps> = ({ accountId, holder, onClose, onSuccess }) => {
  const { usdVnd, formatVND } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [fxQuote, setFxQuote] = useState<{ amountVnd: number; rate: number } | null>(null);
  const [balanceVnd, setBalanceVnd] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quote the entry fee in VND via the OpenAPI /fx bridge, and read the user's
  // live CoinWise Bank balance so they can see whether they can afford it.
  useEffect(() => {
    let alive = true;
    apiFxConvert(ENTRY_FEE, 'USD', 'VND')
      .then((r) => { if (alive) setFxQuote({ amountVnd: r.result, rate: r.rate }); })
      .catch(() => {
        if (!alive) return;
        setFxQuote({ amountVnd: Math.round(ENTRY_FEE * usdVnd), rate: usdVnd });
      });
    apiBankAccount(accountId)
      .then((a) => { if (alive) setBalanceVnd(a.balanceVnd); })
      .catch(() => { /* bank unreachable — let the pay-entry call surface it */ });
    return () => { alive = false; };
  }, [usdVnd, accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    try {
      // Real debit against the CoinWise Bank VND account through the OpenAPI
      // server (single source of truth). Throws on insufficient funds (402).
      const res = await apiBankPayEntry(accountId, ENTRY_FEE, { holder, room: 'BRONZE' });
      setBalanceVnd(res.balanceVnd);
      setIsProcessing(false);
      onSuccess();
    } catch (err) {
      setIsProcessing(false);
      setError((err as Error).message || 'Thanh toán thất bại. Vui lòng thử lại.');
    }
  };

  const insufficient = balanceVnd != null && fxQuote != null && balanceVnd < fxQuote.amountVnd;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-white text-slate-900 rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-black text-white text-lg">₫</div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">CoinWise Bank <span className="text-slate-400 font-medium text-sm">Phí tham gia Arena</span></span>
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thanh toán từ tài khoản</label>
              <span className="text-[10px] font-mono text-slate-400">{accountId}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 font-black">₫</div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">CoinWise Bank · VND</p>
                <p className="text-xs text-slate-500">
                  Số dư: <span className={`font-bold tabular-nums ${insufficient ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {balanceVnd != null ? formatVND(balanceVnd) : '…'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {insufficient ? (
            <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
              <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
                Số dư không đủ. <a href="/bank" target="_blank" rel="noreferrer" className="underline font-bold">Mở CoinWise Bank để nạp tiền →</a>
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"></path></svg>
              <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">
                Phí <b>${ENTRY_FEE.toFixed(2)}</b> được quy đổi qua OpenAPI <code>/fx/convert</code> và trừ trực tiếp bằng VND từ tài khoản CoinWise Bank của bạn. Cần nạp thêm? <a href="/bank" target="_blank" rel="noreferrer" className="underline font-bold">Mở CoinWise Bank →</a>
              </p>
            </div>
          )}

          {error && (
            <p className="text-center text-xs text-rose-600 font-bold">{error}</p>
          )}

          <button
            disabled={isProcessing || insufficient}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Đang xử lý...
              </>
            ) : (
              <>Trả {fxQuote ? formatVND(fxQuote.amountVnd) : `$${ENTRY_FEE.toFixed(2)}`} &amp; vào Arena</>
            )}
          </button>

          <p className="text-center text-[10px] text-slate-400 font-medium">
            Bằng việc thanh toán, bạn đồng ý với Điều khoản Giải đấu và Quy tắc tính PNL.
          </p>
        </form>
      </div>
    </div>
  );
};

export default CompetitionPaymentModal;
