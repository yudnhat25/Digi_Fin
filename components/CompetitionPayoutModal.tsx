
import React, { useState } from 'react';

interface CompetitionPayoutModalProps {
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

const CompetitionPayoutModal: React.FC<CompetitionPayoutModalProps> = ({ amount, onClose, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'review' | 'success'>('review');

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate Stripe Payout processing
    setTimeout(() => {
      setIsProcessing(false);
      setStep('success');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
      <div className="bg-white text-slate-900 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
        
        {step === 'review' ? (
          <>
            {/* Stripe Branded Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <svg className="w-8 h-8 text-[#635BFF]" viewBox="0 0 40 40" fill="currentColor">
                  <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 36.364C10.963 36.364 3.636 29.037 3.636 20S10.963 3.636 20 3.636 36.364 10.963 36.364 20s-7.327 16.364-16.364 16.364z"/>
                </svg>
                <span className="font-bold text-2xl tracking-tight text-[#635BFF]">Stripe <span className="text-slate-400 font-medium text-sm">Connect Payout</span></span>
              </div>
              <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="mb-10 text-center">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Available for Payout</p>
              <h3 className="text-5xl font-black text-slate-900">${amount.toFixed(2)}</h3>
              <p className="text-emerald-600 text-xs font-bold mt-2 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Ready for instant transfer
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Deposit To</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Chase Bank •••• 8812</p>
                    <p className="text-xs text-slate-500">Checking Account</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
                 <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 <p className="text-[10px] text-emerald-800 font-medium leading-relaxed">
                   Stripe Instant Payouts arrive in your account within minutes. No fee applies for Competition Champions.
                 </p>
              </div>

              <button 
                onClick={handleRequestPayout}
                disabled={isProcessing}
                className="w-full bg-[#635BFF] hover:bg-[#5851e0] text-white font-black py-5 rounded-[1.25rem] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl shadow-[#635BFF]/30 disabled:opacity-70"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing Payout...
                  </>
                ) : (
                  'Request Instant Payout'
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">Funds Dispatched</h3>
            <p className="text-slate-500 mb-10 text-sm">Your reward of ${amount.toFixed(2)} has been successfully sent to your bank via Stripe Connect.</p>
            
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 text-left">
               <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <span>Reference ID</span>
                  <span>{Math.random().toString(36).substring(2, 12).toUpperCase()}</span>
               </div>
               <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>Status</span>
                  <span className="text-emerald-600">Succeeded</span>
               </div>
            </div>

            <button 
              onClick={onSuccess}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.25rem] hover:bg-slate-800 transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionPayoutModal;
