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
export type BankPurchaseType =
  | 'PREMIUM_UPGRADE'    // tier upgrade (PRO / ELITE)
  | 'COURSE_PURCHASE'    // Academy course enrollment
  | 'STAKE_LOCK'         // Earn product stake lock-in
  | 'ACCOUNT_TOPUP';     // paper-trading USD top-up
export interface BankTransaction {
  id: string;
  ref: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'ARENA_ENTRY' | 'ARENA_PRIZE' | BankPurchaseType;
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
// Vercel serverless function instances are ephemeral and parallel invocations
// may land on different instances entirely. Persisting through Firebase RTDB
// REST makes Firebase the single source of truth — accessible from both the
// browser (bank web polls) and the serverless backend (every mutation).
//
// We deliberately do NOT cache bank accounts in memory between requests.
// Earlier code did, and a Firebase blip during cold-start loading would
// short-circuit to "create new seed 50M + PUT", clobbering the user's real
// balance. By always reading fresh from Firebase, we sacrifice ~200ms per
// request for a state model that's correct under any Vercel routing.
// ───────────────────────────────────────────────────────────────────────────
const FIREBASE_DB_URL = 'https://gen-lang-client-0742583847-default-rtdb.asia-southeast1.firebasedatabase.app';

// Firebase RTDB rejects '.', '#', '$', '[', ']', '/' in path keys. Real
// accountIds in this app are often email addresses (e.g. "c@gmail.com")
// because they come from Firebase Auth. Map illegal characters to '_' so the
// path is well-formed; the original accountId is still stored inside the
// account body and is what every API surfaces.
function bankPathKey(accountId: string): string {
  return accountId.replace(/[.#$/\[\]]/g, '_');
}

function bankFirebaseUrl(accountId: string): string {
  return `${FIREBASE_DB_URL}/banks/${encodeURIComponent(bankPathKey(accountId))}.json`;
}

/**
 * Reads the account from Firebase. Returns the parsed account on success, or
 * `null` when Firebase responds 200 with a null body (i.e. the account
 * legitimately doesn't exist yet). Throws on every other failure mode —
 * network error, HTTP non-2xx, malformed JSON — so the caller MUST NOT
 * confuse "Firebase had a hiccup" with "this user is new" and create a
 * seed-50M account that would overwrite the real balance in Firebase.
 */
async function loadBankFromFirebase(accountId: string): Promise<BankAccount | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4500);
  let res: Response;
  try {
    res = await fetch(bankFirebaseUrl(accountId), { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new Error(`Bank storage unreachable (HTTP ${res.status})`);
  }
  const data = (await res.json()) as BankAccount | null;
  // Firebase returns null for non-existent paths under read-permitted nodes.
  // That's the ONE case where we're allowed to seed a fresh account.
  if (!data || typeof data !== 'object') return null;
  if (!Array.isArray(data.transactions)) data.transactions = [];
  return data;
}

export async function saveBankToFirebase(acc: BankAccount): Promise<void> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4500);
  let res: Response;
  try {
    res = await fetch(bankFirebaseUrl(acc.accountId), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(acc),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new Error(`Failed to persist bank account (HTTP ${res.status})`);
  }
}

export async function getBankAccount(accountId: string, holder?: string): Promise<BankAccount> {
  const remote = await loadBankFromFirebase(accountId);
  if (remote) {
    // Lazy holder backfill: the modal passes the user's name on first touch.
    // Upgrade the placeholder once we have a real name.
    if (holder && remote.holder === 'CoinWise User') {
      remote.holder = holder;
      // Persist the upgrade so the next reader sees it too.
      await saveBankToFirebase(remote).catch(() => { /* non-critical */ });
    }
    return remote;
  }
  // Legitimately new account (Firebase 200 + null body). Seed + persist so
  // any concurrent reader on another instance sees the same opened account
  // instead of inventing a duplicate.
  const acc: BankAccount = {
    accountId,
    holder: holder || 'CoinWise User',
    bankAccountNo: deriveAccountNo(accountId),
    balanceVnd: SEED_BALANCE_VND,
    transactions: [],
    openedAt: Date.now(),
  };
  await saveBankToFirebase(acc);
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
