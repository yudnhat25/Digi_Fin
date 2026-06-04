#!/usr/bin/env python3
"""
Crawl REAL, human-labeled crypto sentiment from StockTwits.

Why StockTwits: every message can be SELF-TAGGED by its author as Bullish or
Bearish. That is a human ground-truth label sitting on real trader text -- far
stronger distant supervision than the keyword rules we used before. We only
keep self-tagged messages, so the (text, label) pairs are genuinely real.

Endpoint: https://api.stocktwits.com/api/2/streams/symbol/{TICKER}.json
  - public, no key, ~200 req/hour/IP -> we sleep between calls and stop on 429
  - paginate backwards with ?max=<cursor.max>
  - 30 messages/page, ~55-60% carry a Bullish/Bearish tag

Output: data/stocktwits_corpus.json
  [{ id, text, label: 'positive'|'negative', symbol, created_at, likes }, ...]
Re-runs MERGE with the existing file (dedup by id) so coverage accumulates.

Usage:  python scripts/scrape_stocktwits.py [pages_per_symbol] [delay_seconds]
"""
import json, os, sys, time, html, urllib.request, urllib.error
from collections import Counter

OUT = 'data/stocktwits_corpus.json'

# Broad crypto coverage -> more volume + label balance. `.X` is StockTwits' crypto suffix.
SYMBOLS = [
    'BTC.X', 'ETH.X', 'SOL.X', 'BNB.X', 'XRP.X', 'DOGE.X', 'ADA.X', 'AVAX.X',
    'LINK.X', 'DOT.X', 'SHIB.X', 'NEAR.X', 'ARB.X', 'OP.X', 'PEPE.X', 'INJ.X',
    'TIA.X', 'WIF.X', 'LTC.X', 'MATIC.X', 'UNI.X', 'AAVE.X', 'ATOM.X', 'FIL.X',
    'APT.X', 'SUI.X', 'RNDR.X', 'FTM.X', 'ALGO.X', 'XLM.X', 'BCH.X', 'ETC.X',
]

UA = 'Mozilla/5.0 (compatible; CoinWiseAI/1.0; +https://coinwise.ai)'
TAG2LABEL = {'Bullish': 'positive', 'Bearish': 'negative'}

# For NEUTRAL we keep UNtagged StockTwits messages (same trader-domain text, so
# the model can't cheat on writing style) that carry no obvious directional word.
# This is weak supervision, but the text is real and in-domain.
SENT_WORDS = (
    'bull', 'bear', 'moon', 'pump', 'dump', 'crash', 'scam', 'rug', 'rekt',
    'long', 'short', 'buy', 'sell', 'sold', 'bought', 'rally', 'surge', 'soar',
    'plunge', 'tank', 'breakout', 'breakdown', 'ath', 'dip', 'send it', 'lfg',
    'hodl', 'gem', 'rip', 'dead', 'top', 'bottom', 'puke', 'fomo', 'fud',
)
NEUTRAL_PER_SYMBOL = 45  # cap so neutral doesn't flood from any one stream


def is_neutral_text(t):
    low = t.lower()
    if any(w in low for w in SENT_WORDS):
        return False
    return 12 <= len(t) <= 220


def fetch(ticker, max_id=None, timeout=25):
    url = f'https://api.stocktwits.com/api/2/streams/symbol/{ticker}.json'
    if max_id:
        url += f'?max={max_id}'
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def clean(body):
    # Decode HTML entities, collapse whitespace. Keep cashtags/text as-is otherwise.
    return ' '.join(html.unescape(body).split())


def main():
    pages = int(sys.argv[1]) if len(sys.argv) > 1 else 8
    delay = float(sys.argv[2]) if len(sys.argv) > 2 else 1.3

    existing = {}
    if os.path.exists(OUT):
        for r in json.load(open(OUT, encoding='utf-8')):
            existing[r['id']] = r
    start_n = len(existing)
    print(f'[scrape] starting with {start_n} cached messages; '
          f'{len(SYMBOLS)} symbols x {pages} pages, {delay}s delay', flush=True)

    stopped = False
    for sym in SYMBOLS:
        if stopped:
            break
        max_id = None
        added = 0
        neu_here = 0
        for p in range(pages):
            try:
                j = fetch(sym, max_id)
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    print(f'[scrape] 429 rate-limited on {sym} p{p}; stopping crawl early', flush=True)
                    stopped = True
                    break
                print(f'[scrape] {sym} p{p} HTTP {e.code}; skip symbol', flush=True)
                break
            except Exception as e:
                print(f'[scrape] {sym} p{p} error {e}; skip symbol', flush=True)
                break
            msgs = j.get('messages', [])
            for m in msgs:
                ent = m.get('entities') or {}
                sent = ent.get('sentiment') or {}
                label = TAG2LABEL.get(sent.get('basic'))
                mid = f"st:{m['id']}"
                if mid in existing:
                    continue
                body = clean(m.get('body', ''))
                if not label:
                    # No author tag -> candidate NEUTRAL if it has no directional word.
                    if neu_here < NEUTRAL_PER_SYMBOL and is_neutral_text(body):
                        existing[mid] = {
                            'id': mid, 'text': body, 'label': 'neutral', 'symbol': sym,
                            'created_at': m.get('created_at'),
                            'likes': int((m.get('likes') or {}).get('total') or 0),
                        }
                        neu_here += 1
                        added += 1
                    continue
                if len(body) < 8:
                    continue
                existing[mid] = {
                    'id': mid,
                    'text': body,
                    'label': label,
                    'symbol': sym,
                    'created_at': m.get('created_at'),
                    'likes': int((m.get('likes') or {}).get('total') or 0),
                }
                added += 1
            cur = j.get('cursor') or {}
            max_id = cur.get('max')
            if not cur.get('more') or not max_id:
                break
            time.sleep(delay)
        print(f'[scrape] {sym}: +{added} tagged (total {len(existing)})', flush=True)
        time.sleep(delay)

    rows = list(existing.values())
    json.dump(rows, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    lab = Counter(r['label'] for r in rows)
    print(f'[scrape] wrote {OUT}: {len(rows)} total (+{len(rows)-start_n} new) | '
          f"positive={lab['positive']} negative={lab['negative']} neutral={lab['neutral']}", flush=True)


if __name__ == '__main__':
    main()
