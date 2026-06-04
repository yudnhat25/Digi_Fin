#!/usr/bin/env python3
"""
Build data/stocktwits_gold.json — a HAND-LABELED, same-domain test set.

These are real StockTwits messages whose sentiment was labeled by careful human
reading of the TEXT (not the author's noisy Bullish/Bearish tag, not VADER, not a
template). They exist to make the honest test set bigger and in-domain with the
training data (trader language), instead of only the 52 news-style gold headlines.

The label map below was produced by reading each candidate; ambiguous / spam /
off-topic / political / gibberish messages were dropped. These texts are used as
TEST ONLY and are excluded from training in build_dataset.py.

Run once: python scripts/make_stocktwits_gold.py
"""
import json, re, random, os
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')


def clean(t):
    t = re.sub(r'https?://\S+', ' ', t)
    t = re.sub(r'^(?:[$@][A-Za-z0-9.\-]+\s+){3,}', '', t)
    return ' '.join(t.split())


# Reproduce the exact candidate ordering the labels refer to.
st = json.load(open(os.path.join(DATA, 'stocktwits_corpus.json'), encoding='utf-8'))
seen, cand = set(), []
for r in st:
    t = clean(r['text'])
    words = re.findall(r"[a-zA-Z']{2,}", t)
    if not (8 <= len(words) <= 40):
        continue
    if sum(c.isalpha() for c in t) < 25:
        continue
    k = t.lower()
    if k in seen:
        continue
    seen.add(k)
    cand.append(t)
random.Random(11).shuffle(cand)
sel = cand[:170]

# Hand labels (index -> sentiment toward the coin/market in the TEXT).
POS = {2, 3, 5, 9, 11, 13, 14, 22, 23, 46, 48, 50, 52, 53, 54, 57, 59, 61, 66, 74,
       77, 78, 79, 80, 83, 86, 87, 91, 96, 97, 103, 111, 112, 113, 114, 116, 118,
       125, 126, 128, 132, 133, 142, 148, 157}
NEG = {1, 4, 6, 8, 19, 20, 25, 35, 42, 43, 45, 56, 71, 72, 73, 81, 84, 89, 90, 94,
       95, 99, 101, 104, 108, 120, 121, 122, 123, 124, 127, 130, 134, 144, 149, 155, 161}
NEU = {0, 10, 15, 21, 24, 41, 49, 60, 63, 82, 92, 100, 102, 107, 109, 115, 129, 154, 162, 165, 168}

rows = []
for idx, lab in [(POS, 'positive'), (NEG, 'negative'), (NEU, 'neutral')]:
    for i in sorted(idx):
        rows.append({'text': sel[i], 'label': lab, 'source': 'gold-stocktwits'})

out = os.path.join(DATA, 'stocktwits_gold.json')
json.dump(rows, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(f"[st-gold] wrote {out}: {len(rows)} hand-labeled rows {dict(Counter(r['label'] for r in rows))}")
