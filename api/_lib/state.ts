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
