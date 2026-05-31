/**
 * In-memory account state for the OpenAPI server.
 * In production this would be Firebase Admin / Postgres — for the assignment
 * demo we keep a deterministic, replay-friendly store seeded by accountId.
 */
export interface ServerPosition { symbol: string; amount: number }
export interface ServerTransaction {
  id: string;
  type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW';
  asset: string;
  amount: number;
  price: number;
  total: number;
  timestamp: number;
  currency: 'USD' | 'VND';
  fxRate?: number;
  channel?: string;
}
export interface ServerAccount {
  accountId: string;
  cashUsd: number;
  positions: ServerPosition[];
  transactions: ServerTransaction[];
  createdAt: number;
}

const store = new Map<string, ServerAccount>();

export function getAccount(accountId: string): ServerAccount {
  let acc = store.get(accountId);
  if (!acc) {
    acc = {
      accountId,
      cashUsd: 1_000_000, // starts with $1M paper capital
      positions: [],
      transactions: [],
      createdAt: Date.now(),
    };
    store.set(accountId, acc);
  }
  return acc;
}

export function setAccount(account: ServerAccount): void {
  store.set(account.accountId, account);
}

export function listAccounts(): ServerAccount[] {
  return Array.from(store.values());
}

export function shortId(prefix = 'tx'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ───────────────────────────────────────────────────────────────────────────
// Simulated retail bank ("CoinWise Bank") — VND-denominated.
//
// This is the localized-currency layer required by the assignment: a local
// bank account (think UOB-style) that the standalone bank web reads/writes and
// that the Arena uses to charge entry fees and pay out prizes. The OpenAPI
// server is the single source of truth. As with the paper accounts above, the
// in-memory store resets on Vercel cold start — fine for the demo; production
// would back this with Firebase Admin / Postgres.
// ───────────────────────────────────────────────────────────────────────────
export interface BankTransaction {
  id: string;
  ref: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'ARENA_ENTRY' | 'ARENA_PRIZE';
  amountVnd: number;        // signed: positive = credit, negative = debit
  balanceAfterVnd: number;
  note: string;
  timestamp: number;
}
export interface BankAccount {
  accountId: string;        // links to the CoinWise user accountId
  holder: string;
  bankAccountNo: string;    // human-facing account number
  balanceVnd: number;
  transactions: BankTransaction[];
  openedAt: number;
}

const bankStore = new Map<string, BankAccount>();

// Deterministic 11-digit account number derived from the accountId so the same
// user always sees the same number across cold starts (no Math.random drift).
function deriveAccountNo(accountId: string): string {
  let h = 0;
  for (let i = 0; i < accountId.length; i++) h = (h * 31 + accountId.charCodeAt(i)) >>> 0;
  return (1_0000_000_000 + (h % 9_000_000_000)).toString();
}

// New accounts open with a realistic demo balance so users have funds to join
// the Arena immediately (~50,000,000 VND ≈ $2,000).
const SEED_BALANCE_VND = 50_000_000;

// ───────────────────────────────────────────────────────────────────────────
// Firebase Realtime DB persistence for bank accounts.
//
// Vercel serverless function instances are ephemeral — the in-memory bankStore
// resets on every cold start, AND parallel invocations may land on different
// instances entirely. The Arena pay-entry endpoint would debit on one instance
// while the bank web's GET /bank/:id read a fresh (untouched) seed on another,
// making it look like the entry fee was never charged.
//
// Persisting through Firebase RTDB via its REST API solves this without
// adding a dependency: the same database the frontend already uses becomes
// the single source of truth for bank balances, accessible from both the
// browser and the serverless backend. In-memory cache stays as a hot path
// for repeated reads within the same warm container.
// ───────────────────────────────────────────────────────────────────────────
const FIREBASE_DB_URL = 'https://gen-lang-client-0742583847-default-rtdb.asia-southeast1.firebasedatabase.app';

function bankFirebaseUrl(accountId: string): string {
  return `${FIREBASE_DB_URL}/banks/${encodeURIComponent(accountId)}.json`;
}

async function loadBankFromFirebase(accountId: string): Promise<BankAccount | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(bankFirebaseUrl(accountId), { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as BankAccount | null;
    if (!data || typeof data !== 'object') return null;
    // RTDB drops empty arrays — defensive normalization.
    if (!Array.isArray(data.transactions)) data.transactions = [];
    return data;
  } catch {
    return null;
  }
}

export async function saveBankToFirebase(acc: BankAccount): Promise<void> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    await fetch(bankFirebaseUrl(acc.accountId), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(acc),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
  } catch {
    // Best-effort persist. The in-memory copy stays consistent within this
    // container; we'd rather not crash the response on a Firebase blip.
  }
}

export async function getBankAccount(accountId: string, holder?: string): Promise<BankAccount> {
  // Warm-container fast path: trust the in-memory copy. Even if Firebase has
  // newer data from a concurrent instance, the divergence window is bounded
  // by Vercel's container lifetime (~minutes). The next cold start re-reads
  // from Firebase, and every mutation writes back, so eventual consistency
  // holds.
  let acc = bankStore.get(accountId);
  if (!acc) {
    const remote = await loadBankFromFirebase(accountId);
    if (remote) {
      acc = remote;
    } else {
      acc = {
        accountId,
        holder: holder || 'CoinWise User',
        bankAccountNo: deriveAccountNo(accountId),
        balanceVnd: SEED_BALANCE_VND,
        transactions: [],
        openedAt: Date.now(),
      };
      // Persist immediately so a parallel request hitting another instance
      // sees the same opened account instead of creating a duplicate one
      // with a fresh seed.
      await saveBankToFirebase(acc);
    }
    bankStore.set(accountId, acc);
  }
  if (holder && acc.holder === 'CoinWise User') acc.holder = holder;
  return acc;
}

export function recordBankTxn(
  acc: BankAccount,
  type: BankTransaction['type'],
  amountVnd: number,
  note: string,
): BankTransaction {
  const txn: BankTransaction = {
    id: shortId('bank'),
    ref: shortId(type.toLowerCase()).toUpperCase(),
    type,
    amountVnd,
    balanceAfterVnd: acc.balanceVnd,
    note,
    timestamp: Date.now(),
  };
  acc.transactions.push(txn);
  return txn;
}
