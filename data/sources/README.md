# Data sources (raw + intermediate)

The **dataset the model actually uses is just two files** at `data/`:

| File | What |
|---|---|
| `data/sentiment_train.json` | ~3,984 training rows, balanced 3 classes, each `{text, label, source}` |
| `data/sentiment_test.json` | 155 held-out **human-labeled** test rows |

Everything in this folder is the **provenance** used to regenerate those two files.
You don't train on these directly.

| File | Origin | Used by |
|---|---|---|
| `stocktwits_corpus.json` | 6,106 real StockTwits messages crawled across 32 crypto symbols | `relabel-corpus.ts`, `make_stocktwits_gold.py` |
| `scraped_raw_corpus.json` | 8,034 real Hacker News crypto titles/comments (Algolia API) | `relabel-corpus.ts` |
| `crypto_sentiment_dataset.json` | 211 hand-labeled headlines (the original "gold") | `build_dataset.py` (train + 52 test) |
| `stocktwits_gold.json` | 103 real StockTwits messages **hand-labeled by reading the text** | `build_dataset.py` (test only) |
| `relabeled_corpus.json` | intermediate: StockTwits + HN re-labeled by our VADER, high-confidence only | `build_dataset.py` |
| `silver_labeled_corpus.json` | legacy VADER auto-labels (no longer in the active recipe) | — |

## Regenerate

```bash
npm run scrape:stocktwits   # refresh stocktwits_corpus.json (live crawl)
npm run train:nlp           # relabel-corpus.ts -> build_dataset.py -> train_model.py
npm run verify:nlp          # check the TS runtime reproduces the Python model
```

`make_stocktwits_gold.py` is run once to (re)build `stocktwits_gold.json`; its labels
are hand-assigned, so it is not part of the routine retrain.
