/**
 * Crypto-tuned sentiment lexicon for VADER-style NLP analysis.
 *
 * Each entry maps a lowercase token → polarity score ∈ [-4, +4].
 * Mirrors the VADER (Hutto & Gilbert, 2014) approach used widely in
 * fintech sentiment courses, but with crypto-native terms that the
 * generic English VADER lexicon doesn't cover ("moon", "rug", "ATH",
 * "HODL", "rekt", "FUD", ...). Hand-curated based on r/CryptoCurrency
 * vernacular.
 */

export const LEXICON: Record<string, number> = {
  // ─── Strongly bullish (+3 to +4) ───
  moon: 3.5, mooning: 3.5, mooned: 3.0, moonshot: 3.0,
  ath: 3.0, 'all-time-high': 3.0, breakout: 2.8, breakouts: 2.8,
  rally: 2.5, rallying: 2.5, rallied: 2.5, surge: 2.8, surging: 2.8, surged: 2.8,
  pump: 2.5, pumping: 2.0, pumped: 2.0, // careful — pump can mean manipulation
  bullish: 3.0, bull: 2.5, bulls: 2.0, 'bull-run': 3.5,
  parabolic: 3.5, vertical: 2.5, exploding: 3.0, explode: 2.8,
  rocket: 3.0, rockets: 2.5, '🚀': 3.0,
  diamond: 1.5, 'diamond-hands': 2.5, '💎': 1.5,
  green: 1.5, greens: 1.5, 'in-the-green': 2.0,
  gain: 2.0, gains: 2.0, gained: 1.8, gaining: 1.8,
  profit: 2.0, profits: 2.0, profitable: 2.0,
  win: 1.5, winning: 1.8, wins: 1.5, winner: 2.0,
  buy: 1.5, buying: 1.5, accumulate: 2.0, accumulating: 2.0, accumulation: 2.0,
  long: 1.0, longs: 1.0, longing: 1.5,
  adoption: 2.0, adopting: 1.8, mainstream: 1.5,
  approved: 1.8, approval: 1.8, listed: 1.5, listing: 1.5,
  partnership: 1.8, partnerships: 1.8, upgrade: 1.5, upgraded: 1.5,
  innovation: 1.5, milestone: 1.8, launch: 1.0, launched: 1.2,

  // ─── Mildly positive (+1 to +2) ───
  hodl: 1.5, holding: 1.0, hold: 0.8,
  stable: 1.0, steady: 1.0, recovery: 1.8, recovering: 1.5, recover: 1.5,
  bounce: 1.5, bouncing: 1.5, bounced: 1.5, rebound: 2.0,
  support: 1.0, supports: 1.0, supported: 1.0,
  good: 1.5, great: 2.5, excellent: 2.8, amazing: 2.8, awesome: 2.5,
  optimistic: 2.0, hopeful: 1.5, confident: 1.8, strong: 1.5,
  outperform: 2.0, outperforming: 2.0, beat: 1.5,
  upside: 1.5,

  // ─── Strongly bearish (-3 to -4) ───
  crash: -3.5, crashing: -3.5, crashed: -3.5, crashes: -3.0,
  dump: -2.8, dumping: -2.8, dumped: -2.8, dumps: -2.5,
  rug: -3.5, rugged: -3.5, 'rug-pull': -4.0, rugpull: -4.0,
  scam: -3.5, scams: -3.0, scammer: -3.5, scammers: -3.5, scammed: -3.0,
  fraud: -3.5, fraudulent: -3.5,
  rekt: -3.0, liquidated: -2.5, liquidation: -2.5, liquidations: -2.5,
  bearish: -3.0, bear: -2.5, bears: -2.0, 'bear-market': -3.0,
  capitulation: -3.0, capitulate: -2.8,
  bloodbath: -3.5, bloodbaths: -3.5,
  hack: -3.0, hacked: -3.0, hackers: -2.5, exploit: -2.8, exploited: -3.0,
  ban: -2.5, banned: -2.5, banning: -2.0, illegal: -2.5,
  collapse: -3.0, collapsing: -3.0, collapsed: -3.0,
  bankrupt: -3.5, bankruptcy: -3.5, insolvent: -3.0,
  fud: -2.0, ponzi: -3.5, shitcoin: -2.5,
  worthless: -3.5, dead: -2.0, dying: -2.5,
  // Note: 'bubble' is bearish in crypto context (warning of correction)
  bubble: -2.0, overvalued: -2.0, overbought: -1.5,

  // ─── Mildly negative (-1 to -2) ───
  down: -1.0, downtrend: -2.0, decline: -1.8, declining: -1.8, declined: -1.5,
  drop: -1.8, dropping: -1.5, dropped: -1.5, drops: -1.5,
  fall: -1.5, falling: -1.5, fell: -1.5, falls: -1.2,
  loss: -2.0, losses: -2.0, losing: -1.8, lose: -1.8, lost: -1.8,
  sell: -1.5, selling: -1.5, sold: -1.0, sells: -1.0,
  short: -1.0, shorts: -1.0, shorting: -1.5,
  red: -1.5, reds: -1.5, 'in-the-red': -2.0,
  weak: -1.5, weakness: -1.8, struggle: -1.5, struggling: -1.5,
  concern: -1.5, concerns: -1.5, concerned: -1.5, worried: -1.8, worry: -1.5,
  fear: -2.0, scared: -1.8, panic: -2.5, panicking: -2.5, panicked: -2.5,
  bad: -1.8, terrible: -2.8, awful: -2.5, horrible: -2.8,
  pessimistic: -2.0, doom: -2.5, doomed: -2.5,
  risk: -0.8, risky: -1.5, dangerous: -1.8,
  uncertain: -1.0, uncertainty: -1.2,
  reject: -1.5, rejected: -1.5, rejection: -1.5,
  resistance: -0.5, // technical: resistance level slows price
  correction: -1.5, corrections: -1.5, pullback: -1.0,

  // ─── Regulatory / negative news ───
  sec: -0.5, sue: -1.5, sued: -1.5, lawsuit: -2.0, lawsuits: -2.0,
  investigation: -1.5, fine: -1.5, fines: -1.5, fined: -1.5,

  // ─── Generic finance / news verbs (expanded for distant-supervision labeling) ───
  // Positive finance verbs
  soar: 3.0, soars: 3.0, soared: 2.8, soaring: 2.8,
  skyrocket: 3.0, skyrockets: 3.0, skyrocketed: 3.0,
  jumps: 1.8, jumped: 1.8, jumping: 1.5,
  rises: 1.5, rising: 1.5, rose: 1.2,
  climbs: 1.5, climbing: 1.5, climbed: 1.2,
  boom: 2.5, booming: 2.5, boomed: 2.0,
  thrives: 2.0, thriving: 2.0, flourishing: 2.2,
  successful: 1.8, success: 1.5, succeeds: 1.8,
  record: 1.0, milestones: 1.8,
  achievement: 1.8, achieved: 1.5, beats: 1.5,
  launches: 1.2, launching: 1.0,
  passes: 0.8, passed: 0.8, expand: 1.0, expanding: 1.0, expansion: 1.2,
  revolutionary: 2.0, innovative: 1.8, breakthrough: 2.5,
  legalized: 2.0, legalize: 1.5, legitimate: 1.5,
  raises: 1.0, raised: 1.0, funded: 1.0, funding: 0.5,
  beating: 1.5, outperformed: 2.0,
  // Negative finance verbs
  plunge: -3.0, plunges: -3.0, plunged: -3.0, plunging: -3.0,
  plummet: -3.0, plummets: -3.0, plummeted: -3.0, plummeting: -3.0,
  tumbles: -2.5, tumbled: -2.5, tumbling: -2.5,
  sinks: -2.5, sank: -2.5, sinking: -2.5,
  slips: -1.5, slipped: -1.5, slipping: -1.5,
  slumps: -2.5, slumped: -2.5,
  tanks: -2.5, tanked: -2.5, tanking: -2.5,
  freezes: -2.0, frozen: -2.0, freezing: -1.8,
  halt: -2.0, halts: -2.0, halted: -2.0, halting: -2.0,
  shuts: -1.8, 'shut-down': -2.0, shutdown: -2.0, shutting: -1.8,
  outage: -2.0, outages: -2.0, downtime: -1.8,
  controversy: -1.8, controversial: -1.5, controversies: -1.8,
  problem: -1.5, problems: -1.5, problematic: -1.8,
  issue: -1.0, issues: -1.0,
  warning: -1.5, warned: -1.5, warns: -1.5, warnings: -1.5,
  threat: -2.0, threats: -2.0, threatening: -2.0, threatened: -1.8,
  delays: -1.5, delayed: -1.5, delaying: -1.5, delay: -1.2,
  suspends: -2.0, suspended: -2.0, suspension: -2.0,
  cancels: -1.8, cancelled: -1.8, canceled: -1.8,
  closes: -0.8, closed: -0.8, closing: -0.8,
  layoffs: -2.5, fired: -1.8, firing: -1.5, terminated: -1.8,
  failure: -2.5, failed: -2.0, failing: -2.0, fails: -2.0,
  fallen: -1.5,
  shocks: -2.0, shocked: -1.8, shocking: -2.0,
  blow: -1.5, blows: -1.5, hurt: -1.8, hurting: -1.8,
  steal: -2.5, stolen: -2.5, stealing: -2.5, theft: -2.8, thefts: -2.8,
  blackmail: -3.0, ransom: -2.5, ransomware: -3.0,
  unprecedented: 0.5, sweeping: 0.0,
  emergency: -1.8, crisis: -2.5, urgent: -1.5,
  arrested: -2.2, arrest: -2.0, charges: -1.5, charged: -1.5,
  guilty: -2.2, convicted: -2.5, prison: -2.5, jailed: -2.5,
  seized: -2.0, seize: -1.8, raid: -2.0, raided: -2.0,
};

/**
 * Negation words — when present within `NEGATION_WINDOW` tokens before a
 * sentiment word, flip its sign and dampen magnitude to 0.74× (VADER paper).
 */
export const NEGATIONS = new Set([
  "not", "no", "never", "none", "nobody", "nothing", "neither", "nor",
  "n't", "cannot", "cant", "can't", "wont", "won't", "shouldn't", "shouldnt",
  "wouldn't", "wouldnt", "isn't", "isnt", "aren't", "arent", "ain't", "aint",
  "doesn't", "doesnt", "don't", "dont", "didn't", "didnt", "without",
]);
export const NEGATION_WINDOW = 3;
export const NEGATION_DAMP = 0.74;

/**
 * Booster / dampener words. Multiplier applied to the next sentiment-bearing
 * token. >1 amplifies, <1 softens. (VADER's BOOSTER_DICT, trimmed.)
 */
export const BOOSTERS: Record<string, number> = {
  absolutely: 1.3, completely: 1.25, extremely: 1.3, fully: 1.2, hugely: 1.3,
  incredibly: 1.3, really: 1.25, very: 1.25, super: 1.3, totally: 1.25,
  utterly: 1.3, massively: 1.3, fucking: 1.4, fkn: 1.3,
  somewhat: 0.85, kind: 0.85, slightly: 0.8, sort: 0.85, little: 0.85,
  marginally: 0.8, barely: 0.7, hardly: 0.7, scarcely: 0.7,
};

/**
 * Tokenize a line of text into normalized tokens. Lowercases, strips URLs &
 * markdown, preserves emoji codepoints (rocket/diamond used in crypto).
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  const cleaned = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[*_`>#~]/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

  // Match words, hyphenated compounds, and rocket/diamond emojis.
  const tokens = cleaned.match(/[a-zA-Z']+(?:-[a-zA-Z']+)*|🚀|💎/g) || [];
  return tokens;
}
