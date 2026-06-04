#!/usr/bin/env python3
"""
Build the training corpus for the production sentiment classifier.

Design (per the "use real text, but re-label it ourselves" decision):
  REAL   — data/relabeled_corpus.json : real StockTwits + Hacker News text whose
           labels were assigned FRESH by our own VADER engine (the noisy author
           Bullish/Bearish self-tags are discarded). High-confidence calls only.
  SYNTH  — a smaller set of engineered sentences that teach CONTEXT on the exact
           failure modes (the word "buy" in a bearish/neutral context, negations
           like "not bullish" / "not a scam", neutral questions). Not 100% real,
           but kept deliberately to make the model understand, not memorize.
  GOLD   — data/crypto_sentiment_dataset.json : 211 hand-labeled headlines.
           Split 25% -> the honest TEST set (human labels, never VADER/synth),
           75% -> train. This keeps the benchmark comparable and non-circular:
           the model can only beat VADER on gold by truly generalizing.

Output: data/sentiment_dataset.json  — list of {text, label, source, test_ok}

Run:  npx tsx scripts/relabel-corpus.ts   # refresh real labels first
      python scripts/build_dataset.py
"""
import json, re, random, os
from collections import Counter

random.seed(42)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')
CLASSES = ('positive', 'negative', 'neutral')
load = lambda n: json.load(open(os.path.join(DATA, n), encoding='utf-8'))
norm = lambda t: re.sub(r'\s+', ' ', t.lower()).strip()

# Per-class caps so the (very neutral-heavy) real distribution stays balanced
# and synth stays a minority "teaching" supplement rather than the bulk.
REAL_CAP = 1400
SYNTH_PER_CLASS = 400

# ── REAL (VADER-relabeled StockTwits + HN) ───────────────────────────────────
real_by = {c: [] for c in CLASSES}
for r in load('relabeled_corpus.json'):
    if r.get('label') in CLASSES and r.get('text'):
        real_by[r['label']].append({'text': r['text'], 'label': r['label'], 'source': r.get('source', 'real')})
for c in CLASSES:
    random.shuffle(real_by[c])
    real_by[c] = real_by[c][:REAL_CAP]

# ── SYNTH (engineered hard-cases, train-only) ────────────────────────────────
COINS = ['BTC', 'Bitcoin', '$BTC', 'ETH', 'Ethereum', '$ETH', 'SOL', 'Solana',
         '$SOL', 'BNB', 'XRP', 'Ripple', 'ADA', 'Cardano', 'DOGE', 'AVAX',
         'LINK', 'crypto', 'the market', 'altcoins']
OTHER = ['AI stocks', 'gold', 'tech stocks', 'other coins', 'memecoins', 'Nvidia']
PRICE = ['50k', '60k', '3k', '200', '1.20', '0.45', '80k']
POS_EVENT = ['ETF inflows hit a record', 'a major partnership was announced',
             'the network upgrade went live', 'institutional buying accelerates',
             'spot ETF approval landed', 'adoption hit new highs', 'fees dropped sharply']
POS_REASON = ['fundamentals are strong', 'volume is exploding', 'smart money is accumulating',
              'the chart looks bullish', 'support held perfectly', 'momentum is building']
NEG_EVENT = ['a major exchange got hacked', 'regulators announced a crackdown',
             'a stablecoin collapsed', 'the SEC filed a lawsuit', 'a whale dumped millions',
             'liquidity dried up', 'a hack drained funds']
NEG_REASON = ['the trend is broken', 'support just failed', 'volume is dead',
              'it looks like a bull trap', 'fundamentals are weak', 'the chart is ugly']
NEU_EVENT = ['a developer update was posted', 'the team shared a roadmap',
             'a conference is happening', 'an AMA is scheduled', 'mainnet stats were published']

def T_pos():
    c = random.choice(COINS)
    return random.choice([
        f"{c} surges to a new all-time high as {random.choice(POS_EVENT)}",
        f"bullish on {c}, {random.choice(POS_REASON)}",
        f"{c} breaking out, {random.choice(POS_REASON)}",
        f"accumulating {c} here, {random.choice(POS_REASON)}",
        f"buying the dip on {c}, {random.choice(POS_REASON)}",
        f"this is not a scam, {c} is a solid project with real adoption",  # negation->pos
        f"{c} is undervalued, great time to buy",
        f"loading up on {c}, {random.choice(POS_EVENT)}",
        f"long {c}, {random.choice(POS_REASON)}",
    ])

def T_neg():
    c = random.choice(COINS); o = random.choice(OTHER)
    return random.choice([
        f"{c} crashes as {random.choice(NEG_EVENT)}",
        f"bearish on {c}, {random.choice(NEG_REASON)}",
        f"selling my {c}, {random.choice(NEG_REASON)}",
        f"everyone is dumping {c} to buy {o} instead",        # 'buy' but bearish
        f"not bullish on {c} at all, {random.choice(NEG_REASON)}",  # negation->neg
        f"{c} getting rekt, {random.choice(NEG_REASON)}",
        f"why is anyone still holding {c}, it is dead money",
        f"dumping to buy {o} instead of {c}, weak hands shaken out",
        f"rug pull on {c}, investors wiped out",
    ])

def T_neu():
    c = random.choice(COINS)
    return random.choice([
        f"what do you all think about {c} here?",
        f"should I buy or wait on {c}?",                  # 'buy' but neutral question
        f"{c} trading around {random.choice(PRICE)} right now",
        f"{c} consolidating, waiting for a clear move",
        f"holding {c}, watching the key levels",
        f"is {c} a buy or a sell here?",                  # 'buy'/'sell' but neutral
        f"{c} sideways, no clear direction yet",
        f"{c} news today: {random.choice(NEU_EVENT)}",
        f"any update on the {c} roadmap?",
    ])

synth = []
for gen, lab in ((T_pos, 'positive'), (T_neg, 'negative'), (T_neu, 'neutral')):
    seen, tries = set(), 0
    while len([s for s in synth if s['label'] == lab]) < SYNTH_PER_CLASS and tries < SYNTH_PER_CLASS * 8:
        tries += 1
        t = gen()
        if t in seen:
            continue
        seen.add(t)
        synth.append({'text': t, 'label': lab, 'source': 'synth'})

# ── GOLD (human-labeled): 25% honest test, 75% train ─────────────────────────
gold_by = {c: [] for c in CLASSES}
for d in load('crypto_sentiment_dataset.json'):
    if d.get('label') in CLASSES and d.get('text'):
        gold_by[d['label']].append({'text': d['text'], 'label': d['label'], 'source': 'gold'})
gold_train, gold_test = [], []
for c in CLASSES:
    rows = gold_by[c][:]; random.shuffle(rows)
    k = max(8, round(len(rows) * 0.25))
    for i, r in enumerate(rows):
        (gold_test if i < k else gold_train).append(r)

# Hand-labeled real StockTwits (scripts/make_stocktwits_gold.py) — TEST ONLY.
# Same trader-domain as training but labeled by careful human reading (not the
# author tag, not VADER, not a template). Excluded from train via test_keys below.
for d in load('stocktwits_gold.json'):
    if d.get('label') in CLASSES and d.get('text'):
        gold_test.append({'text': d['text'], 'label': d['label'], 'source': 'gold-stocktwits'})

# ── Assemble, dedupe (test wins), balance train ──────────────────────────────
test_keys = {norm(r['text']) for r in gold_test}
pool = []
seen = set(test_keys)
for r in [x for c in CLASSES for x in real_by[c]] + synth + gold_train:
    n = norm(r['text'])
    if n in seen:
        continue
    seen.add(n)
    r['test_ok'] = False
    pool.append(r)

train_by = {c: [r for r in pool if r['label'] == c] for c in CLASSES}
target = min(1700, min(len(v) for v in train_by.values()))
train = []
for c in CLASSES:
    rows = train_by[c][:]; random.shuffle(rows)
    train.extend(rows[:target])

for r in gold_test:
    r['test_ok'] = True
out_rows = train + gold_test
random.shuffle(out_rows)

with open(os.path.join(DATA, 'sentiment_dataset.json'), 'w', encoding='utf-8') as f:
    json.dump(out_rows, f, ensure_ascii=False)

tr = [r for r in out_rows if not r['test_ok']]
print(f"[build] total rows  : {len(out_rows)}")
print(f"[build] train       : {len(tr)} (balanced/class={target})")
print(f"[build] train source: {dict(Counter(r['source'] for r in tr))}")
print(f"[build] train class : {dict(Counter(r['label'] for r in tr))}")
real_n = sum(r['source'] in ('stocktwits-vader', 'hn-vader') for r in tr)
print(f"[build] real text   : {real_n} ({100*real_n/len(tr):.0f}%)  synth: {sum(r['source']=='synth' for r in tr)}  gold: {sum(r['source']=='gold' for r in tr)}")
print(f"[build] test total  : {len(gold_test)} {dict(Counter(r['label'] for r in gold_test))}")
print(f"[build] test source : {dict(Counter(r['source'] for r in gold_test))}")
