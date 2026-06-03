import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import TransactionSuccessModal, { TxnSuccessData } from '../components/TransactionSuccessModal';

/**
 * CoinWise Bank — standalone simulated VND retail bank web.
 *
 * A separate front-end (its own URL: /bank.html) that talks to the same
 * CoinWise OpenAPI server which is the single source of truth. Users top up a
 * VND balance here; the Arena debits entry fees and credits prizes against the
 * very same bank account, so the two apps share one money rail.
 */

// ───── API client (same base-URL resolution as services/coinwiseApi.ts) ─────
function resolveBase(): string {
  const env = (import.meta as any).env || {};
  if (env.VITE_COINWISE_API_URL) return env.VITE_COINWISE_API_URL;
  if (env.PROD) return typeof window !== 'undefined' ? window.location.origin : '';
  return 'http://localhost:3001';
}
const API = resolveBase();

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data as T;
}

interface BankAccountInfo {
  accountId: string; holder: string; bankAccountNo: string;
  balanceVnd: number; balanceUsd: number; rate: number; openedAt: number;
}
interface BankTxn {
  id: string; ref: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'ARENA_ENTRY' | 'ARENA_PRIZE'
      | 'PREMIUM_UPGRADE' | 'COURSE_PURCHASE' | 'STAKE_LOCK' | 'ACCOUNT_TOPUP';
  amountVnd: number; balanceAfterVnd: number; note: string; timestamp: number;
}

const getAccount = (id: string) => call<BankAccountInfo>(`/api/v1/bank/${encodeURIComponent(id)}`);
const getStatement = (id: string) => call<BankTxn[]>(`/api/v1/bank/${encodeURIComponent(id)}/statement`);
const deposit = (id: string, amountVnd: number) =>
  call<BankAccountInfo>(`/api/v1/bank/${encodeURIComponent(id)}/deposit`, { method: 'POST', body: JSON.stringify({ amountVnd }) });
const withdraw = (id: string, amountVnd: number) =>
  call<BankAccountInfo>(`/api/v1/bank/${encodeURIComponent(id)}/withdraw`, { method: 'POST', body: JSON.stringify({ amountVnd }) });

// ───── helpers ─────
const fmtVnd = (v: number) => `${Math.round(v).toLocaleString('vi-VN')} ₫`;
const fmtUsd = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtTime = (t: number) => new Date(t).toLocaleString('vi-VN');

const TXN_META: Record<BankTxn['type'], { label: string; color: string; icon: string }> = {
  DEPOSIT:         { label: 'Deposit',           color: 'text-emerald-400', icon: '↓' },
  WITHDRAW:        { label: 'Withdrawal',        color: 'text-amber-400',   icon: '↑' },
  ARENA_ENTRY:     { label: 'Arena Fee',         color: 'text-rose-400',    icon: '⚔' },
  ARENA_PRIZE:     { label: 'Arena Prize',       color: 'text-emerald-400', icon: '🏆' },
  PREMIUM_UPGRADE: { label: 'Membership Plan',   color: 'text-violet-400',  icon: '★' },
  COURSE_PURCHASE: { label: 'Academy Course',    color: 'text-blue-400',    icon: '📘' },
  STAKE_LOCK:      { label: 'Earn Lock-up',      color: 'text-cyan-400',    icon: '🔒' },
  ACCOUNT_TOPUP:   { label: 'Trading Top-up',    color: 'text-teal-400',    icon: '↻' },
};

const FALLBACK_ACCOUNT_ID = 'CW-AI-8892-X';
const ACCOUNT_KEY = 'coinwisebank.accountId';
const MAIN_SESSION_KEY = 'coinwise_session';
const QUICK_AMOUNTS = [100_000, 500_000, 1_000_000, 5_000_000];

/**
 * Resolve the accountId the bank app should default to. Priority:
 *   1. The accountId of whoever is signed in to the main CoinWise app
 *      (shared via localStorage 'coinwise_session'). This is the authoritative
 *      current user — any prize the Arena pays will land on THIS accountId,
 *      so the bank web must default to viewing it.
 *   2. A stale override from the bank's own login form, used only when the
 *      user isn't signed in to the main app at all (anonymous demo).
 *   3. Hard-coded demo id 'CW-AI-8892-X' as a final fallback.
 *
 * Prior implementation had 1 and 2 swapped, which meant a user who once typed
 * a different accountId into the bank login form would FOREVER see that
 * account, even after signing in as someone else in the main app — leading to
 * "I won the Arena but the prize didn't show up" because the prize went to
 * the session accountId but the bank web was still pinned to the override.
 */
function resolveDefaultAccountId(): { id: string; holderHint?: string; sessionId?: string } {
  if (typeof window === 'undefined') return { id: FALLBACK_ACCOUNT_ID };
  let sessionId: string | undefined;
  let holderHint: string | undefined;
  try {
    const raw = localStorage.getItem(MAIN_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { accountId?: string; name?: string };
      if (parsed?.accountId) {
        sessionId = parsed.accountId;
        holderHint = parsed.name;
      }
    }
  } catch { /* malformed session */ }
  if (sessionId) {
    // Defensive cleanup: if a stale override doesn't match the current
    // session, drop it so a future logout doesn't resurrect another user's
    // accountId as the default.
    try {
      const override = localStorage.getItem(ACCOUNT_KEY);
      if (override && override !== sessionId) localStorage.removeItem(ACCOUNT_KEY);
    } catch { /* ignore */ }
    return { id: sessionId, holderHint, sessionId };
  }
  try {
    const override = localStorage.getItem(ACCOUNT_KEY);
    if (override) return { id: override };
  } catch { /* SecurityError */ }
  return { id: FALLBACK_ACCOUNT_ID };
}

const App: React.FC = () => {
  const [{ id: initialId, holderHint }] = useState(resolveDefaultAccountId);
  const [accountId, setAccountId] = useState<string>(initialId);
  const [loginInput, setLoginInput] = useState(accountId);
  const [account, setAccount] = useState<BankAccountInfo | null>(null);
  const [statement, setStatement] = useState<BankTxn[]>([]);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<TxnSuccessData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (id: string) => {
    setError(null);
    try {
      const [acc, stmt] = await Promise.all([getAccount(id), getStatement(id)]);
      setAccount(acc);
      setStatement(stmt);
    } catch (e) {
      // Don't blank out account on transient errors — the previous payload is
      // still the best display we have. Surface the error in the banner so the
      // user knows the data is stale.
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(accountId); }, [accountId, refresh]);

  // Poll so Arena entry-fee debits / prize credits made in the other app show
  // up here live.
  useEffect(() => {
    const t = setInterval(() => refresh(accountId), 5000);
    return () => clearInterval(t);
  }, [accountId, refresh]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const id = loginInput.trim();
    if (!id) return;
    localStorage.setItem(ACCOUNT_KEY, id);
    setAccountId(id);
  };

  const mutate = async (kind: 'deposit' | 'withdraw') => {
    const amt = Math.round(Number(amount.replace(/[.,\s]/g, '')));
    if (!Number.isFinite(amt) || amt <= 0) { setError('Enter a valid amount (VND)'); return; }
    setBusy(true); setError(null);
    try {
      const acc = kind === 'deposit' ? await deposit(accountId, amt) : await withdraw(accountId, amt);
      setAccount(acc);
      setAmount('');
      await refresh(accountId);
      setSuccess({
        title: kind === 'deposit' ? 'Deposit Successful' : 'Withdrawal Successful',
        subtitle: kind === 'deposit'
          ? 'Funds have been added to your CoinWise Bank account.'
          : 'Funds have been sent from your CoinWise Bank account.',
        amount: `${kind === 'deposit' ? '+ ' : '- '}${fmtVnd(amt)}`,
        direction: kind === 'deposit' ? 'in' : 'out',
        rows: [
          { label: 'Account', value: acc.bankAccountNo || accountId },
          { label: 'New balance', value: fmtVnd(acc.balanceVnd) },
        ],
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">₫</div>
          <div>
            <h1 className="text-xl font-black tracking-tight">CoinWise Bank</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Digital Bank · VND</p>
          </div>
        </div>
        <a href="/" className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition">← CoinWise App</a>
      </header>

      <TransactionSuccessModal data={success} onClose={() => setSuccess(null)} />


      {/* Account-id banner — makes it unmissable WHICH account is loaded so
          users don't end up debiting one and checking the balance on another. */}
      <div className="mb-3 flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">Viewing</span>
          <code className="text-xs font-mono text-emerald-300 truncate">{accountId}</code>
        </div>
        {holderHint && accountId === initialId && (
          <span className="text-[10px] font-bold text-slate-500 shrink-0">synced from CoinWise App</span>
        )}
      </div>

      {/* Balance card */}
      <section className="rounded-3xl bg-gradient-to-br from-bank-card to-slate-900 border border-slate-800 p-7 shadow-2xl mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Available Balance</p>
        <p className="text-4xl md:text-5xl font-black tabular-nums text-white">
          {loading ? '—' : account ? fmtVnd(account.balanceVnd) : '—'}
        </p>
        {account && (
          <p className="text-sm text-emerald-400 font-bold mt-1 tabular-nums">≈ {fmtUsd(account.balanceUsd)} <span className="text-slate-500 font-medium">· 1 USD = {account.rate.toLocaleString('vi-VN')} ₫</span></p>
        )}
        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Account Holder</p>
            <p className="font-bold text-slate-200">{account?.holder || holderHint || '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Account Number</p>
            <p className="font-mono font-bold text-slate-300 tracking-wider">{account?.bankAccountNo || '—'}</p>
          </div>
        </div>
      </section>

      {/* Login / switch account */}
      <form onSubmit={handleLogin} className="flex gap-2 mb-3">
        <input
          value={loginInput}
          onChange={(e) => setLoginInput(e.target.value)}
          placeholder="Switch to another accountId…"
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button className="bg-slate-800 hover:bg-slate-700 px-5 rounded-xl text-sm font-bold transition">Switch</button>
      </form>
      <p className="text-[10px] text-slate-600 mb-6 leading-relaxed">
        💡 Defaults to the accountId you're signed in with on the CoinWise App. Only change it if you want to view another user's bank.
      </p>

      {error && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-medium rounded-xl px-4 py-3">
          <p className="font-black mb-0.5">Couldn't load bank data</p>
          <p className="text-xs opacity-90 break-all">{error}</p>
        </div>
      )}

      {/* Deposit / withdraw */}
      <section className="bg-bank-card border border-slate-800 rounded-3xl p-6 mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Deposit / Withdraw (VND)</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_AMOUNTS.map((a) => (
            <button key={a} type="button" onClick={() => setAmount(String(a))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold transition">
              +{a.toLocaleString('vi-VN')}
            </button>
          ))}
        </div>
        <input
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (₫)"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-lg font-bold tabular-nums mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="grid grid-cols-2 gap-3">
          <button disabled={busy} onClick={() => mutate('deposit')}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-3.5 rounded-xl transition active:scale-95">
            Deposit
          </button>
          <button disabled={busy} onClick={() => mutate('withdraw')}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 font-black py-3.5 rounded-xl transition active:scale-95">
            Withdraw
          </button>
        </div>
        <p className="text-[11px] text-slate-600 mt-4 leading-relaxed">
          This account pays the entry fee for the CoinWise <b>Arena</b> and receives <b>prize money</b> when you win. Every transaction goes through the OpenAPI server <code className="bg-slate-900 px-1 rounded">/api/v1/bank</code>.
        </p>
      </section>

      {/* Statement */}
      <section className="bg-bank-card border border-slate-800 rounded-3xl p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Transaction History</h2>
        {statement.length === 0 ? (
          <p className="text-slate-600 text-sm italic py-6 text-center">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-800/60">
            {statement.map((t) => {
              const meta = TXN_META[t.type];
              const positive = t.amountVnd >= 0;
              return (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${meta.color}`}>
                      <span className="mr-1.5">{meta.icon}</span>{meta.label}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{t.note}</p>
                    <p className="text-[10px] text-slate-600 font-mono">{fmtTime(t.timestamp)} · {t.ref}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-black tabular-nums ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {positive ? '+' : ''}{fmtVnd(t.amountVnd)}
                    </p>
                    <p className="text-[10px] text-slate-600 tabular-nums">Balance: {fmtVnd(t.balanceAfterVnd)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="text-center text-[10px] text-slate-700 mt-8 font-medium">
        CoinWise Bank · simulated VND bank for the Advanced Fintech assignment · powered by the CoinWise OpenAPI server
      </footer>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('bank-root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
