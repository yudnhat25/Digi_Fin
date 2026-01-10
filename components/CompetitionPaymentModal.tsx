
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51SmmvXEzg6BsPMWkBairxWMhSg73qqIuwgLtUSxB0kWYbNIVsvaj3TaDz4UokmyRj5HPghfn1QidmzRf3pxdxxzs00OaykiGBJ');

interface CompetitionPaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentForm: React.FC<{ onSuccess: () => void; onClose: () => void }> = ({ onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const cardElement = elements.getElement(CardElement);

    if (cardElement) {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setError(error.message || 'Payment failed');
        setIsProcessing(false);
      } else {
        // Simulation success
        onSuccess();
        if (cardElement) cardElement.clear();
      }
    }

    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
      <div className="bg-white text-slate-900 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">

        {/* Stripe Branded Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-[#635BFF]" viewBox="0 0 40 40" fill="currentColor">
              <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 36.364C10.963 36.364 3.636 29.037 3.636 20S10.963 3.636 20 3.636 36.364 10.963 36.364 20s-7.327 16.364-16.364 16.364z" />
            </svg>
            <span className="font-bold text-2xl tracking-tight text-[#635BFF]">Stripe <span className="text-slate-400 font-medium text-sm">Payment</span></span>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="mb-10 text-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Arena Entry Fee</p>
          <h3 className="text-5xl font-black text-slate-900">$5.00</h3>
          <p className="text-emerald-600 text-xs font-bold mt-2 flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Join the global competition
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider font-bold">Card Details</label>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors">
              <CardElement options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#0f172a',
                    fontFamily: '"Inter", sans-serif',
                    '::placeholder': {
                      color: '#94a3b8',
                    },
                  },
                  invalid: {
                    color: '#ef4444',
                  },
                },
              }} />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
            <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-[10px] text-emerald-800 font-medium leading-relaxed">
              Secure payment processed by Stripe. Entry fee is non-refundable. Winner takes the entire prize pool.
            </p>
          </div>

          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-[#635BFF] hover:bg-[#5851e0] text-white font-black py-5 rounded-[1.25rem] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl shadow-[#635BFF]/30 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing Payment...
              </>
            ) : (
              'Pay $5.00 & Enter Arena'
            )}
          </button>

          <div className="text-center">
            <span className="text-xs text-emerald-500/60 bg-emerald-500/10 px-2 py-1 rounded inline-block">
              Stripe Secure Payment
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

const CompetitionPaymentModal: React.FC<CompetitionPaymentModalProps> = ({ onClose, onSuccess }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm onSuccess={onSuccess} onClose={onClose} />
    </Elements>
  );
};

export default CompetitionPaymentModal;
