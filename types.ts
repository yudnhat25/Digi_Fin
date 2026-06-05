
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
  // When the user's joined arena round STARTS (ms epoch). Registration is only
  // open during the 30-second break window, so this is always >= now at entry
  // time. While Date.now() < roundStartsAt the user is "queued" — trading and
  // the live leaderboard view are hidden behind a countdown.
  roundStartsAt?: number;
  // When the user's joined arena round ENDS (ms epoch). Once Date.now() crosses
  // this, the frontend auto-restores the pre-arena snapshot.
  roundEndsAt?: number;
  // Snapshot of the user's real portfolio captured at arena entry. On exit
  // the entire snapshot is written back so the arena run leaves no trace on
  // their main account beyond the entry fee.
  preArenaSnapshot?: {
    balance: number;
    assets: Asset[];
    transactions: Transaction[];
    // Earn stakes are snapshotted + cleared on entry too: their value counts
    // toward net worth, so leaving them in would leak real staked value into
    // the $1M arena baseline as phantom PNL. Optional for legacy snapshots.
    stakes?: StakePosition[];
  };
}

export type SubscriptionTier = 'STARTER' | 'PRO' | 'ELITE';

export interface StakePosition {
  id: string;
  symbol: string;        // product asset: USDT | BTC | ETH | SOL | BNB
  amount: number;        // principal in COIN units (e.g. 2 = 2 ETH). USDT product = USD.
  entryPrice?: number;   // coin price (USD) at stake time, for value / P&L display
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
  referralEarnings?: number;   // claimable (pending) referral balance in USD
  referralClaimed?: number;    // lifetime referral rewards already moved to bank
  referralCount?: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  accountId?: string; // Added for matching real users
  pnl: number;
  value: number;
  isUser?: boolean;
  // When this competitor's joined round ends (ms epoch). Used to evict stale
  // entries from the leaderboard once their round is over, even if that player
  // never logs back in to remove themselves.
  roundEndsAt?: number;
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
