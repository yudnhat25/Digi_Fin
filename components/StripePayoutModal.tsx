import React, { useEffect, useState } from 'react';
import { apiFxConvert } from '../services/coinwiseApi';
import { useCurrency } from '../services/currency';

/**
 * Reusable Stripe-styled payout screen — the same UX the Arena uses to pay out
 * a prize, reused for claiming referral rewards. The actual money movement is
 * delegated to `onConfirm` (the parent credits the CoinWise Bank), so this
 * component only owns the Stripe UI + the live USD→VND FX quote.
 */
type PayoutRegion = 'US' | 'VN';

const VN_BANKS = ['Vietcombank', 'Techcombank', 'BIDV', 'VietinBank', 'MB Bank', 'ACB', 'VPBank', 'Sacombank'];

interface StripePayoutModalProps {
  amountUsd: number;
  holder: string;
  heading?: string;
  blurb?: React.ReactNode;
  onClose: () => void;
  onConfirm: () => Promise<void>;  // performs the bank credit; throws on failure
}

const StripePayoutModal: React.FC<StripePayoutModalProps> = ({
  amountUsd, holder, heading = 'Set up your payout', blurb, onClose, onConfirm,
}) => {
  const { formatVND, usdVnd } = useCurrency();
  const [region, setRegion] = useState<PayoutRegion>('VN');
  const [fxQuote, setFxQuote] = useState<{ amountVnd: number; rate: number; asOf: string } | null>(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let alive = true;
    setFxLoading(true);
    apiFxConvert(amountUsd, 'USD', 'VND')
      .then((r) => { if (alive) setFxQuote({ amountVnd: r.result, rate: r.rate, asOf: new Date().toISOString() }); })
      .catch(() => { if (alive) setFxQuote({ amountVnd: Math.round(amountUsd * usdVnd), rate: usdVnd, asOf: new Date().toISOString() }); })
      .finally(() => { if (alive) setFxLoading(false); });
    return () => { alive = false; };
  }, [amountUsd, usdVnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      alert(`Payout failed: ${(err as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-white animate-in slide-in-from-right duration-500 overflow-y-auto">
      <div className="max-w-2xl w-full text-slate-900 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <svg className="w-10 h-10 text-[#635BFF]" viewBox="0 0 40 40" fill="currentColor"><path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 36.364C10.963 36.364 3.636 29.037 3.636 20S10.963 3.636 20 3.636 36.364 10.963 36.364 20s-7.327 16.364-16.364 16.364z"/></svg>
            <span className="text-3xl font-bold tracking-tight text-[#635BFF]">Stripe <span className="text-slate-400 font-medium">Payouts</span></span>
            <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">+ CoinWise FX</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{heading}</h1>
            <p className="text-slate-500 text-base">
              {blurb || <>Stripe Payouts settle in USD by default. CoinWise's OpenAPI <code className="text-[12px] bg-slate-100 px-1.5 py-0.5 rounded">/api/v1/fx/convert</code> bridges the gap and converts your reward to <b>VND</b> on the fly.</>}
            </p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transfer Amount</p>
            <p className="text-2xl font-bold text-[#635BFF] tabular-nums">${amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</p>
            {region === 'VN' && (
              <p className="text-sm text-emerald-700 font-semibold tabular-nums mt-1">
                ≈ {fxLoading ? '…' : (fxQuote ? formatVND(fxQuote.amountVnd) : '—')}
              </p>
            )}
          </div>
        </div>

        <div className="bg-slate-100 p-1 rounded-2xl inline-flex mb-6">
          <button type="button" onClick={() => setRegion('VN')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition ${region === 'VN' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
            🇻🇳 Vietnam bank (VND)
          </button>
          <button type="button" onClick={() => setRegion('US')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition ${region === 'US' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
            🇺🇸 US bank (USD)
          </button>
        </div>

        {region === 'VN' && fxQuote && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 text-sm text-emerald-900">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <div className="flex-1">
                <p className="font-bold">FX bridge active</p>
                <p className="text-emerald-800 mt-1">
                  Rate: <b>1 USD = {fxQuote.rate.toLocaleString('vi-VN')} ₫</b> · Quote ID: <code className="text-[11px] bg-white px-1.5 py-0.5 rounded">fx-{new Date(fxQuote.asOf).getTime().toString(36)}</code>
                </p>
                <p className="text-emerald-700 text-[12px] mt-1">
                  Sourced from <code>GET /api/v1/fx/rates</code> (live USD→VND, cached 10 min). Stripe receives USD on its rails; the converted VND amount is credited to your VN bank.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Legal Name</label>
            <input required type="text" defaultValue={holder} className="w-full border-slate-200 border-2 rounded-xl px-4 py-3.5 text-lg focus:border-[#635BFF] focus:outline-none" />
          </div>

          {region === 'VN' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Bank</label>
                  <select required defaultValue="Vietcombank" className="w-full border-slate-200 border-2 rounded-xl px-4 py-3.5 text-lg bg-white focus:border-[#635BFF] focus:outline-none">
                    {VN_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Account No.</label>
                  <input required type="text" placeholder="1020 1234 5678" className="w-full border-slate-200 border-2 rounded-xl px-4 py-3.5 text-lg focus:border-[#635BFF] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Account Holder</label>
                <input required type="text" placeholder="NGUYEN VAN A" defaultValue={holder.toUpperCase()} className="w-full border-slate-200 border-2 rounded-xl px-4 py-3.5 text-lg uppercase focus:border-[#635BFF] focus:outline-none" />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Routing Number</label>
                <input required type="text" placeholder="110000000" maxLength={9} className="w-full border-slate-200 border-2 rounded-xl px-4 py-3.5 text-lg focus:border-[#635BFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Account Number</label>
                <input required type="text" placeholder="000123456789" className="w-full border-slate-200 border-2 rounded-xl px-4 py-3.5 text-lg focus:border-[#635BFF] focus:outline-none" />
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-5 rounded-2xl flex gap-4 border border-blue-100">
            <svg className="w-6 h-6 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-sm text-blue-800 leading-relaxed">
              {region === 'VN'
                ? <>Stripe will send <b>${amountUsd.toFixed(2)} USD</b> through the CoinWise FX bridge, and your VN bank receives <b>{fxQuote ? formatVND(fxQuote.amountVnd) : '—'}</b>. Funds arrive within 1-2 business days.</>
                : <>By clicking confirm, you authorize Stripe to send a direct deposit of <b>${amountUsd.toFixed(2)} USD</b> to the bank account listed above. Funds usually arrive in 1-2 business days.</>}
            </p>
          </div>

          <button
            disabled={processing || (region === 'VN' && !fxQuote)}
            className="w-full bg-[#635BFF] hover:bg-[#5851e0] text-white font-bold py-5 rounded-2xl text-xl flex items-center justify-center gap-4 transition-all disabled:opacity-50"
          >
            {processing ? (
              <>
                <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing Transfer...
              </>
            ) : region === 'VN'
              ? `Confirm & receive ${fxQuote ? formatVND(fxQuote.amountVnd) : '...'}`
              : `Confirm and Payout $${amountUsd.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StripePayoutModal;
