#!/usr/bin/env python3
"""
Build a ~5000-example labeled crypto-sentiment corpus for training the
production classifier.

Sources (combined, deduped, balanced):
  1. GOLD   — data/crypto_sentiment_dataset.json (211 hand-labeled, 3 classes)
  2. SILVER — data/silver_labeled_corpus.json     (500 VADER-labeled, pos/neg)
  3. REAL   — data/scraped_raw_corpus.json         (8034 real HN titles) labeled
              by a high-precision keyword heuristic (distant supervision)
  4. SYNTH  — template-generated examples that deliberately cover the failure
              modes we observed (the word "buy" in bearish/neutral context,
              negations like "not bullish" / "not a scam", neutral questions),
              so the model learns CONTEXT, not just keyword presence.

Output: data/sentiment_dataset.json  — list of {text, label, source}
The held-out TEST split is drawn ONLY from real, reliably-labeled rows
(gold + strict-keyword scraped) so reported metrics reflect real performance,
never template-fitting. SYNTH rows are train-only.
"""
import json, re, random, os
from collections import Counter

random.seed(42)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')

# ── High-precision sentiment keywords for distant supervision / test labels ──
POS_KW = ['rally', 'rallies', 'surge', 'surges', 'soar', 'soars', 'all-time high',
          'ath', 'bullish', 'breakout', 'adoption', 'approved', 'approval',
          'partnership', 'record high', 'inflows', 'upgrade', 'soaring',
          'pumps', 'green', 'recovers', 'rebound', 'milestone', 'institutional']
NEG_KW = ['crash', 'crashes', 'hack', 'hacked', 'scam', 'rug', 'dump', 'dumps',
          'plunge', 'plunges', 'lawsuit', 'crackdown', 'collapse', 'collapses',
          'bearish', 'rekt', 'liquidation', 'liquidations', 'exploit', 'stolen',
          'ban', 'banned', 'fraud', 'selloff', 'sell-off', 'tumble', 'tumbles',
          'fear', 'phishing', 'breach', 'arrested', 'bankrupt', 'plummet']

def kw_label(text):
    """High-precision label or None when ambiguous."""
    t = text.lower()
    pos = any(k in t for k in POS_KW)
    neg = any(k in t for k in NEG_KW)
    if pos and not neg:
        return 'positive'
    if neg and not pos:
        return 'negative'
    return None  # ambiguous or no strong signal

def load_json(name):
    p = os.path.join(DATA, name)
    with open(p, encoding='utf-8') as f:
        return json.load(f)

# ── 1. GOLD ──
gold = [{'text': d['text'], 'label': d['label'], 'source': 'gold'}
        for d in load_json('crypto_sentiment_dataset.json')
        if d.get('text') and d.get('label') in ('positive', 'negative', 'neutral')]

# ── 2. SILVER ──
silver = [{'text': d['text'], 'label': d['label'], 'source': 'silver'}
          for d in load_json('silver_labeled_corpus.json')
          if d.get('text') and d.get('label') in ('positive', 'negative', 'neutral')]

# ── 3. REAL scraped → distant supervision ──
scraped = load_json('scraped_raw_corpus.json')
real_posneg, real_neutral = [], []
for d in scraped:
    txt = (d.get('text') or '').strip()
    if len(txt) < 15 or len(txt) > 220:
        continue
    lab = kw_label(txt)
    if lab in ('positive', 'negative'):
        real_posneg.append({'text': txt, 'label': lab, 'source': 'scraped-kw'})
    elif lab is None:
        # No strong sentiment word → treat factual HN titles as neutral, but
        # only "statement-like" ones (avoid questions which can be loaded).
        if '?' not in txt:
            real_neutral.append({'text': txt, 'label': 'neutral', 'source': 'scraped-neu'})

random.shuffle(real_posneg)
random.shuffle(real_neutral)
real_neutral = real_neutral[:1400]   # cap neutral so it doesn't dominate

# ── 4. SYNTH templates (train-only) — engineered to teach CONTEXT ──
COINS = ['BTC', 'Bitcoin', '$BTC', 'ETH', 'Ethereum', '$ETH', 'SOL', 'Solana',
         '$SOL', 'BNB', 'XRP', 'Ripple', 'ADA', 'Cardano', 'DOGE', 'AVAX',
         'LINK', 'crypto', 'the market', 'altcoins']
OTHER = ['AI stocks', 'gold', 'tech stocks', 'other coins', 'memecoins', 'Nvidia']
PCT = ['5', '8', '12', '15', '20', '30', '40']
PRICE = ['50k', '60k', '3k', '200', '1.20', '0.45', '80k']

POS_EVENT = ['ETF inflows hit a record', 'a major partnership was announced',
             'the network upgrade went live', 'institutional buying accelerates',
             'spot ETF approval landed', 'adoption hit new highs',
             'fees dropped sharply', 'a big exchange listing went live']
POS_REASON = ['fundamentals are strong', 'volume is exploding',
              'smart money is accumulating', 'the chart looks bullish',
              'support held perfectly', 'momentum is building', 'we are so back']
NEG_EVENT = ['a major exchange got hacked', 'regulators announced a crackdown',
             'a stablecoin collapsed', 'the SEC filed a lawsuit',
             'a whale dumped millions', 'liquidity dried up', 'a hack drained funds']
NEG_REASON = ['the trend is broken', 'support just failed', 'volume is dead',
              'it looks like a bull trap', 'fundamentals are weak',
              'smart money is leaving', 'the chart is ugly', 'this is over']
NEU_EVENT = ['a developer update was posted', 'the team shared a roadmap',
             'a conference is happening', 'an AMA is scheduled',
             'mainnet stats were published']

def T_pos():
    c = random.choice(COINS)
    return random.choice([
        f"{c} surges to a new all-time high as {random.choice(POS_EVENT)}",
        f"{c} rallies hard, up {random.choice(PCT)}% as {random.choice(POS_EVENT)}",
        f"bullish on {c}, {random.choice(POS_REASON)}",
        f"{c} breaking out, {random.choice(POS_REASON)}",
        f"huge news for {c}: {random.choice(POS_EVENT)}, to the moon",
        f"accumulating {c} here, {random.choice(POS_REASON)}",
        f"{c} looking strong, {random.choice(POS_REASON)}",
        f"buying the dip on {c}, {random.choice(POS_REASON)}",
        f"this is not a scam, {c} is a solid project with real adoption",
        f"long {c}, {random.choice(POS_REASON)}",
        f"{c} pump incoming, {random.choice(POS_REASON)}",
        f"loading up on {c}, {random.choice(POS_EVENT)}",
        f"{c} is undervalued, great time to buy",
    ])

def T_neg():
    c = random.choice(COINS)
    o = random.choice(OTHER)
    return random.choice([
        f"{c} crashes {random.choice(PCT)}% as {random.choice(NEG_EVENT)}",
        f"bearish on {c}, {random.choice(NEG_REASON)}",
        f"{c} dumping hard, {random.choice(NEG_REASON)}",
        f"selling my {c}, {random.choice(NEG_REASON)}",
        f"{c} is a scam, {random.choice(NEG_REASON)}",
        f"{random.choice(NEG_EVENT)} hits {c}, panic selling everywhere",
        f"everyone is dumping {c} to buy {o} instead",          # 'buy' but bearish
        f"people are selling {c} to chase {o}",
        f"not bullish on {c} at all, {random.choice(NEG_REASON)}",  # negation
        f"{c} getting rekt, {random.choice(NEG_REASON)}",
        f"rug pull on {c}, investors wiped out",
        f"{c} liquidations spike, longs blown out",
        f"why is anyone still holding {c}, it is dead money",       # 'holding' + neg
        f"avoid {c}, {random.choice(NEG_REASON)}",
        f"dumping to buy {o} instead of {c}, weak hands shaken out",
    ])

def T_neu():
    c = random.choice(COINS)
    return random.choice([
        f"what do you all think about {c} here?",
        f"should I buy or wait on {c}?",                  # 'buy' but neutral question
        f"{c} trading around {random.choice(PRICE)} right now",
        f"anyone have a price target for {c}?",
        f"{c} consolidating, waiting for a clear move",
        f"holding {c}, watching the key levels",
        f"{c} volume is average today, nothing unusual",
        f"is {c} a buy or a sell here?",                  # 'buy'/'sell' but neutral
        f"{c} sideways, no clear direction yet",
        f"thoughts on {c}? not sure where it goes",
        f"{c} at {random.choice(PRICE)}, what is next",
        f"{c} news today: {random.choice(NEU_EVENT)}",
        f"how does {c} staking work?",
        f"any update on the {c} roadmap?",
    ])

synth = []
PER_CLASS_SYNTH = 1500
for gen, lab in ((T_pos, 'positive'), (T_neg, 'negative'), (T_neu, 'neutral')):
    seen = set()
    tries = 0
    while len([s for s in synth if s['label'] == lab]) < PER_CLASS_SYNTH and tries < PER_CLASS_SYNTH * 6:
        tries += 1
        t = gen()
        if t in seen:
            continue
        seen.add(t)
        synth.append({'text': t, 'label': lab, 'source': 'synth'})

# ── Assemble, dedupe, mark test eligibility ──
def norm(t):
    return re.sub(r'\s+', ' ', t.lower()).strip()

all_rows = gold + silver + real_posneg + real_neutral + synth
seen_norm = set()
deduped = []
for r in all_rows:
    n = norm(r['text'])
    if n in seen_norm:
        continue
    seen_norm.add(n)
    # test-eligible = GOLD only — hand-labeled, balanced across all 3 classes,
    # the honest benchmark. scraped-kw is reliable but pos/neg-only and would
    # skew the test, so it stays in TRAIN.
    r['test_ok'] = r['source'] == 'gold'
    deduped.append(r)

random.shuffle(deduped)

# Balance classes by capping the majority (keep all minority).
by_class = {'positive': [], 'negative': [], 'neutral': []}
for r in deduped:
    by_class[r['label']].append(r)
target = min(1700, max(len(v) for v in by_class.values()))
balanced = []
for lab, rows in by_class.items():
    # keep all test-eligible rows; fill remainder with the rest up to target
    rows.sort(key=lambda r: (not r['test_ok']))  # test-eligible first
    balanced.extend(rows[:target])
random.shuffle(balanced)

out = os.path.join(DATA, 'sentiment_dataset.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump(balanced, f, ensure_ascii=False)

print(f"[build_dataset] total rows : {len(balanced)}")
print(f"[build_dataset] by class   : {dict(Counter(r['label'] for r in balanced))}")
print(f"[build_dataset] by source  : {dict(Counter(r['source'] for r in balanced))}")
print(f"[build_dataset] test-eligible (real): {sum(r['test_ok'] for r in balanced)}")
print(f"[build_dataset] written    : {out}")
