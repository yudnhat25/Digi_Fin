import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

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
  type: 'DEPOSIT' | 'WITHDRAW' | 'ARENA_ENTRY' | 'ARENA_PRIZE';
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

const TXN_META: Record<BankTxn['type'], { label: string; color: string }> = {
  DEPOSIT: { label: 'Nạp tiền', color: 'text-emerald-400' },
  WITHDRAW: { label: 'Rút tiền', color: 'text-amber-400' },
  ARENA_ENTRY: { label: 'Phí Arena', color: 'text-rose-400' },
  ARENA_PRIZE: { label: 'Thưởng Arena', color: 'text-emerald-400' },
};

const DEFAULT_ACCOUNT_ID = 'CW-AI-8892-X';
const ACCOUNT_KEY = 'coinwisebank.accountId';
const QUICK_AMOUNTS = [100_000, 500_000, 1_000_000, 5_000_000];

const App: React.FC = () => {
  const [accountId, setAccountId] = useState<string>(
    () => (typeof window !== 'undefined' && localStorage.getItem(ACCOUNT_KEY)) || DEFAULT_ACCOUNT_ID,
  );
  const [loginInput, setLoginInput] = useState(accountId);
  const [account, setAccount] = useState<BankAccountInfo | null>(null);
  const [statement, setStatement] = useState<BankTxn[]>([]);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refresh = useCallback(async (id: string) => {
    setError(null);
    try {
      const [acc, stmt] = await Promise.all([getAccount(id), getStatement(id)]);
      setAccount(acc);
      setStatement(stmt);
    } catch (e) {
      setError((e as Error).message);
      setAccount(null);
    }
  }, []);

  useEffect(() => { refresh(accountId); }, [accountId, refresh]);

  // Poll so Arena entry-fee debits / prize credits made in the other app show
  // up here live.
  useEffect(() => {
    const t = setInterval(() => refresh(accountId), 5000);
    return () => clearInterval(t);
  }, [accountId, refresh]);

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(null), 2500); };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const id = loginInput.trim();
    if (!id) return;
    localStorage.setItem(ACCOUNT_KEY, id);
    setAccountId(id);
  };

  const mutate = async (kind: 'deposit' | 'withdraw') => {
    const amt = Math.round(Number(amount.replace(/[.,\s]/g, '')));
    if (!Number.isFinite(amt) || amt <= 0) { setError('Nhập số tiền hợp lệ (VND)'); return; }
    setBusy(true); setError(null);
    try {
      const acc = kind === 'deposit' ? await deposit(accountId, amt) : await withdraw(accountId, amt);
      setAccount(acc);
      setAmount('');
      await refresh(accountId);
      showFlash(kind === 'deposit' ? `Đã nạp ${fmtVnd(amt)}` : `Đã rút ${fmtVnd(amt)}`);
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
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Ngân hàng số · VND</p>
          </div>
        </div>
        <a href="/" className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition">← CoinWise App</a>
      </header>

      {flash && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-black text-sm px-5 py-2.5 rounded-xl shadow-2xl animate-pulse">
          {flash}
        </div>
      )}

      {/* Balance card */}
      <section className="rounded-3xl bg-gradient-to-br from-bank-card to-slate-900 border border-slate-800 p-7 shadow-2xl mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Số dư khả dụng</p>
        <p className="text-4xl md:text-5xl font-black tabular-nums text-white">
          {account ? fmtVnd(account.balanceVnd) : '—'}
        </p>
        {account && (
          <p className="text-sm text-emerald-400 font-bold mt-1 tabular-nums">≈ {fmtUsd(account.balanceUsd)} <span className="text-slate-500 font-medium">· 1 USD = {account.rate.toLocaleString('vi-VN')} ₫</span></p>
        )}
        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Chủ tài khoản</p>
            <p className="font-bold text-slate-200">{account?.holder || '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Số tài khoản</p>
            <p className="font-mono font-bold text-slate-300 tracking-wider">{account?.bankAccountNo || '—'}</p>
          </div>
        </div>
      </section>

      {/* Login / switch account */}
      <form onSubmit={handleLogin} className="flex gap-2 mb-6">
        <input
          value={loginInput}
          onChange={(e) => setLoginInput(e.target.value)}
          placeholder="Mã tài khoản CoinWise (accountId)"
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button className="bg-slate-800 hover:bg-slate-700 px-5 rounded-xl text-sm font-bold transition">Đăng nhập</button>
      </form>

      {error && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-medium rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Deposit / withdraw */}
      <section className="bg-bank-card border border-slate-800 rounded-3xl p-6 mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Nạp / Rút tiền (VND)</h2>
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
          placeholder="Số tiền (₫)"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-lg font-bold tabular-nums mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="grid grid-cols-2 gap-3">
          <button disabled={busy} onClick={() => mutate('deposit')}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-3.5 rounded-xl transition active:scale-95">
            Nạp tiền
          </button>
          <button disabled={busy} onClick={() => mutate('withdraw')}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 font-black py-3.5 rounded-xl transition active:scale-95">
            Rút tiền
          </button>
        </div>
        <p className="text-[11px] text-slate-600 mt-4 leading-relaxed">
          Tài khoản này dùng để thanh toán phí tham gia <b>Arena</b> bên CoinWise và nhận <b>tiền thưởng</b> khi thắng. Mọi giao dịch đều đi qua OpenAPI server <code className="bg-slate-900 px-1 rounded">/api/v1/bank</code>.
        </p>
      </section>

      {/* Statement */}
      <section className="bg-bank-card border border-slate-800 rounded-3xl p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Lịch sử giao dịch</h2>
        {statement.length === 0 ? (
          <p className="text-slate-600 text-sm italic py-6 text-center">Chưa có giao dịch nào.</p>
        ) : (
          <ul className="divide-y divide-slate-800/60">
            {statement.map((t) => {
              const meta = TXN_META[t.type];
              const positive = t.amountVnd >= 0;
              return (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${meta.color}`}>{meta.label}</p>
                    <p className="text-[11px] text-slate-500 truncate">{t.note}</p>
                    <p className="text-[10px] text-slate-600 font-mono">{fmtTime(t.timestamp)} · {t.ref}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-black tabular-nums ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {positive ? '+' : ''}{fmtVnd(t.amountVnd)}
                    </p>
                    <p className="text-[10px] text-slate-600 tabular-nums">Số dư: {fmtVnd(t.balanceAfterVnd)}</p>
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
