# Crypto Sentiment NLP Model — Training Notebook

This is the Python deliverable for the "AI Alternative Data" portion of the
Advanced Fintech Synthesis assignment.

The notebook **trains a Multinomial Naive Bayes classifier** on a
hand-labeled crypto sentiment dataset and **exports the trained weights** back
into the CoinWise AI TypeScript runtime. The same MVP serves predictions from
the model you train here — no extra wiring needed.

## What it does

```
data/crypto_sentiment_dataset.json   ─┐
                                       │
                                       ▼
                  ┌──── EDA ────┬── preprocess ──┬── train/test split ──┐
                  │             │                │                       │
                  │             │                │                       ▼
                  │             │                │    scikit-learn MultinomialNB
                  │             │                │                       │
                  │             │                │                       ▼
                  │             │                │             classification_report
                  │             │                │             confusion matrix heatmap
                  │             │                │             top features per class
                  │             │                │             error analysis
                  │             │                │             vs Logistic Regression baseline
                  │             │                │                       │
                  └─────────────┴────────────────┴───────────────────────┘
                                                                         │
                                                                         ▼
                                              ──► api/_lib/ai/nlp/model.ts
                                                  api/_lib/ai/nlp/model-metrics.ts
                                                  (consumed by the live MVP)
```

## Setup

```bash
cd notebooks
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
jupyter notebook train_sentiment_model.ipynb
```

## Workflow

1. Run all cells top to bottom. Final cell writes `../api/_lib/ai/nlp/model.ts`.
2. Back in the project root, rebundle for production:
   ```bash
   npm run build:api
   ```
3. The live MVP (`Alt-Data Lab` tab) now serves predictions from the
   sklearn-trained model. Verify on http://localhost:3001/api/v1/ai/alt-data/model/info
   that `algorithm` reads `multinomial-naive-bayes (scikit-learn)`.

## Dataset

`../data/crypto_sentiment_dataset.json` — 211 docs (≈80 positive / 81 negative
/ 50 neutral), hand-annotated, mirroring the social-text feeds the pipeline
collects from Hacker News, Reddit, and CryptoCompare.

To grow the dataset, edit `api/_lib/ai/nlp/training/dataset.ts` (the canonical
TS source), then run `npm run dataset:export` to regenerate the JSON.

## Two training paths

The MVP supports **two equivalent training paths** so the same trained-model
runtime works regardless of which you prefer:

| Path | Command | When to use |
|---|---|---|
| **Notebook (Python, sklearn)** | open this notebook, run all cells | assignment deliverable, ML coursework artefact, richer plots/metrics |
| **TS script (Node)** | `npm run train:nlp` | quick re-train in CI, no Python required |

Both produce the **same `api/_lib/ai/nlp/model.ts`** module that the TS runtime
imports.
