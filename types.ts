
export interface Asset {
  symbol: string;
  amount: number;
}

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL' | 'DEPOSIT';
  asset: string;
  amount: number;
  price: number;
  total: number;
  timestamp: number;
}

export interface CompetitionStats {
  isCompeting: boolean;
  entryNetWorth: number;
  entryTime: number;
  pnlPercent: number;
  currentRank: number;
  // When the user's joined arena round ends (ms epoch). Once Date.now() crosses
  // this, the frontend auto-restores the pre-arena snapshot.
  roundEndsAt?: number;
  // Snapshot of the user's real portfolio captured at arena entry. On exit
  // the entire snapshot is written back so the arena run leaves no trace on
  // their main account beyond the entry fee.
  preArenaSnapshot?: {
    balance: number;
    assets: Asset[];
    transactions: Transaction[];
  };
}

export type SubscriptionTier = 'STARTER' | 'PRO' | 'ELITE';

export interface StakePosition {
  id: string;
  symbol: string;
  amount: number;
  apy: number;
  startTime: number;
  lockDays: number;
  product: string;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: number;
}

export interface AcademyEnrollment {
  courseId: string;
  enrolledAt: number;
  progress: number;
}

export interface UserState {
  balance: number;
  assets: Asset[];
  transactions: Transaction[];
  name: string;
  accountId: string;
  password?: string;
  competition?: CompetitionStats;
  tier?: SubscriptionTier;
  tierExpiresAt?: number;
  watchlist?: WatchlistItem[];
  stakes?: StakePosition[];
  enrollments?: AcademyEnrollment[];
  referralCode?: string;
  referredBy?: string;
  referralEarnings?: number;
  referralCount?: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  accountId?: string; // Added for matching real users
  pnl: number;
  value: number;
  isUser?: boolean;
}

export interface UsersMap {
  [accountId: string]: UserState;
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
}

export interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}
