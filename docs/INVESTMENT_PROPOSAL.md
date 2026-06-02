# CoinWise AI — Incubator Investment Proposal

**AI-native, VND-localized fintech for Vietnam's retail crypto & investing market.**
Prepared for: UII Incubator / Dr. Ho's Incubator · Demo Day
Stage: Working MVP (deployed) · Pre-seed

> Figures marked *(target)* or *(assumption)* are pre-launch projections to be validated, not realized traction. Everything marked *(built)* is live in the current prototype and demonstrable on Demo Day.

---

## 1. Executive Summary

**CoinWise AI** is an AI-native investing platform built for the Vietnamese market. It combines (1) a **proprietary alternative-data intelligence engine** that turns scraped social/news text into actionable financial signals, (2) a **custom VND-localized OpenAPI backend** that fixes the currency and integration gaps global sandboxes (Stripe/Plaid) leave open, and (3) an **agentic AI assistant** that executes account actions through natural language.

Today the product is a **risk-free paper-trading MVP** (1,000,000 USDT virtual capital) where users learn, compete, and interact with real AI signals — the on-ramp to a regulated, real-money brokerage/neobank for Vietnam.

**Why now:** Vietnam is one of the world's highest crypto-adoption markets (Chainalysis Global Adoption Index top-ranked for years; ~20% population ownership *publicly reported, to verify*), yet retail tools are English-first, USD-first, and offer generic charts with no localized intelligence. CoinWise AI is built **Vietnamese-first, VND-first, AI-first**.

**The moat:** a **data flywheel** — every user comment and interaction is scored by our own trained NLP model and folded back into sharper signals, a proprietary dataset no global incumbent has for this market.

**The ask:** incubation + pre-seed to convert the MVP into a licensed, real-money product (see §10).

---

## 2. Problem & Market

### 2.1 The problem
Vietnamese retail investors face three structural gaps:
1. **Tooling is not localized.** Mainstream apps are USD-denominated and English-first; payment/KYC rails built for global sandboxes (Stripe, Plaid) **don't handle VND or local banking natively**.
2. **Intelligence is generic.** Retail users get price charts but **no decision support** — no synthesis of sentiment, news, and risk into "should I act, and why".
3. **High adoption, low literacy.** Massive crypto participation but high exposure to scams, FOMO, and over-leverage — a real consumer-protection and education gap.

### 2.2 Market (Vietnam) — *publicly reported / to verify*
- ~100M population, mobile-first, median age ~33.
- Consistently **top-ranked in global crypto adoption** (Chainalysis).
- ~17–20M estimated crypto holders; rapidly growing fintech/e-wallet penetration (MoMo, ZaloPay).

| Sizing *(assumption — to validate)* | Definition | Estimate |
|---|---|---|
| **TAM** | VN adults using crypto / online investing | ~17–20M users |
| **SAM** | Mobile-first 18–40, urban, willing to pay for tools | ~3–4M users |
| **SOM (3-yr)** | Realistic capture with localized AI product | ~150k–300k users *(target)* |

> **Rubric link (Incubation Viability):** the wedge is a clearly underserved, large, fast-growing local market with a localization + intelligence gap incumbents structurally don't fill.

---

## 3. Solution & Data Moat *(Rubric: Proprietary Intelligence & Data Moat — 30%)*

### 3.1 Alternative-data intelligence engine *(built)*
We don't rely on price/transaction history alone. Our **Alt-Data pipeline** scrapes and analyzes **non-traditional data** in real time:

- **Sources (live, no paid keys):** Hacker News, Reddit, CoinGecko community signals, alternative.me Fear & Greed Index. *(built)*
- **Two NLP techniques run in parallel and cross-validate:**
  - **VADER lexicon** (rule-based, explainable per token). *(built)*
  - **Multinomial Naive Bayes** trained by us via **distant supervision** (289 hand-labeled "gold" + 500 auto-labeled "silver" docs), **accuracy ~73.6%, macro-F1 ~73.9%, vocab 2,268** — trained in a reproducible notebook and served inside the TypeScript runtime. *(built — see `notebooks/train_sentiment_model.ipynb`, `docs/ALT_DATA_LAB.md`)*
- **Z-score anomaly detection** (mention-volume spikes = retail-attention/FOMO) + **multi-source fusion** → a single composite signal with confidence. *(built)*
- **Graceful degradation:** if a source is blocked (e.g., Reddit IP-blocks), the pipeline falls back (Hacker News) and stamps provenance (LIVE / HYBRID / DEMO) on every datapoint — production-honest, not a black box. *(built)*

### 3.2 Risk & personalization utility *(built)*
Insights are translated into concrete product advantages:
- **AI Credit Score** — blends behavior with an alt-data factor (`/ai/credit-score-real`).
- **Fraud Shield** — flags momentum-chasing/FOMO trades (e.g., buying into extreme-negative sentiment or attention spikes) (`/ai/fraud-check-real`).
- **AI Advisor** — risk-profiled allocation tilt driven by the composite signal.

### 3.3 The moat: a proprietary data flywheel *(built foundation)*
**Community Pulse** lets users post takes on any coin; each comment is **scored live by our trained model** and aggregated into a per-coin community sentiment that feeds the AI verdict. The more users engage, the larger our **first-party, Vietnam-specific labeled dataset** grows — continuously improving the model.

```
Users post takes ─▶ our NLP model scores them ─▶ aggregated signal ─▶ better verdicts
        ▲                                                                     │
        └───────────────── more engagement, better product ◀─────────────────┘
```

> **Why it's defensible:** this labeled, localized behavioral dataset compounds over time and cannot be bought off-the-shelf or replicated by a global incumbent without our user base.

---

## 4. Localized Technical Infrastructure *(Rubric: Localized Technical Infrastructure — 30%)*

### 4.1 Solving real market friction *(built)*
Instead of bending a rigid global sandbox, we built our **own OpenAPI server** (Hono), documented with **Swagger UI at `/api/docs`** (`api/_lib/openapi.yaml`):
- **VND-native money layer:** live FX (`/fx/rates`, `/fx/convert`, real rates ~26,300 VND/USD), and **"CoinWise Bank"** — a custom local banking rail (`/bank/...`) that processes deposits, withdrawals, subscription billing, and Arena entry fees **in VND**. This is exactly the "replace global sandbox with a custom local backend" the market needs.
- **Localized transactions & balances** displayed and processed in VND end-to-end.

### 4.2 API architecture: AI data straight to frontend & agents *(built)*
The server systematically exposes endpoints that **deliver AI-processed alternative data** to both the UI and the conversational agent:

| Endpoint | Purpose |
|---|---|
| `GET /ai/alt-data/pipeline/:symbol` | Full alt-data → AI signal pipeline |
| `POST /ai/alt-data/classify` | Score any text with the trained model (NB + VADER OOV fallback) |
| `GET /ai/alt-data/model/info` | Model metadata + eval metrics |
| `POST /ai/insight` | Composite per-coin AI insight |
| `POST /ai/credit-score-real`, `/ai/fraud-check-real` | Alt-data-driven risk |
| `POST /agent/execute` | Tool dispatcher consumed by the AI agent |

Architecture: **React/Vite frontend ↔ custom Hono OpenAPI server (Vercel) ↔ AI pipeline + trained model ↔ Firebase (auth/state) ↔ market data (Binance, RSS)**.

> **Rubric link (Technical Defensibility):** real, documented, currency-correct infrastructure with provenance and graceful degradation — not a thin wrapper over a global API.

---

## 5. Agentic AI & Next-Gen UX *(Rubric: Agentic AI & Next-Gen UX — 20%)*

**Frictionless AI automation *(built)*:** a **Gemini function-calling agent** moves beyond static chat to **actively trigger transactions and call backend APIs** via natural language. It can:
- Place trades with a confirmation card — understands localized intent like **"buy 5,000,000 VND of BTC"**, "sell half my ETH", "all-in".
- Answer account questions (balance, AI credit score), pull sentiment/Fear&Greed, **community pulse**, and advisor allocations — all by calling the OpenAPI server live.

**Conversational logic *(built)*:** smoothly resolves account status, VND/USD calculations, and localized platform actions; every tool call is shown transparently in-chat. Inline AI is also embedded in **Community Pulse** (ask about a coin + automatic market-state verdict).

---

## 6. Business Model & Revenue *(Rubric: Incubation Viability — 20%)*

Multiple revenue lines are **already surfaced in the product** *(built)*; monetization activates as we move to real money.

| Line | Mechanism *(built)* | Pricing | Monetization |
|---|---|---|---|
| **Subscriptions** | Pro Plans: Free / **Pro** / **Elite** | Pro **$19/mo (~500k₫)**, Elite **$99/mo (~2.6M₫)**; yearly discount | Recurring SaaS |
| **Earn / Yield** | Staking products, APY 2.5%–18% | — | Spread on yield |
| **Arena (skill competitions)** | Paid tournaments, prize pools | Entry $5–$500, caps $500–$50k | Rake on entry fees |
| **Referral** | Built-in referral program | — | CAC reduction / growth loop |
| **Future** | Brokerage spread/fees, premium data API, B2B signals | — | Transaction + data revenue |

**Revenue model logic:** land users free (paper-trading + AI), convert to **Pro/Elite** for deeper AI tools and higher Earn APY, monetize engagement via **Arena** rake, and (post-license) capture **brokerage/transaction** revenue on real money.

### Illustrative unit economics *(assumption — to validate)*
- Free→paid conversion: **3–5%**; blended ARPU (paid): **~$30/mo**.
- CAC reduced via referral flywheel + organic (localized, viral Community/Arena).
- Target LTV/CAC **> 3x** within 18 months of real-money launch.

> These are pre-launch assumptions; validating conversion and ARPU is an explicit incubation milestone (§9).

---

## 7. Traction & Status

- **Deployed MVP** *(built)*: full app — Terminal (live charts + exchange-grade indicators MA/EMA/BOLL/VOL/MACD/RSI, order book, trade tape), Markets, Social Pulse, Alt-Data Lab, Credit Score, AI Advisor, Fraud Shield, Community Pulse, Arena, Earn, Academy, Referral, agentic chatbot.
- **Real integrations** *(built)*: Binance (prices/klines/WS), live FX, RSS market news, Firebase auth/state, Gemini agent.
- **Stage:** pre-revenue; paper-trading validates engagement and AI value before handling real funds.

> **Honest framing for investors:** we deliberately validate AI value + engagement in a risk-free environment first, de-risking the regulated launch.

---

## 8. Technical Defensibility & Compliance *(Rubric: Technical Defensibility — 20%)*

- **Data moat:** proprietary, compounding, Vietnam-specific labeled dataset (§3.3) — the hardest asset to copy.
- **Resilient architecture:** provenance stamping, graceful source degradation, cached pipelines, typed OpenAPI contract — designed to fail safe, not silently.
- **Compliance roadmap (to build with incubator support):**
  - **KYC/AML** onboarding (eKYC via local providers) before real money.
  - Alignment with **SBV / Vietnamese regulatory** direction on digital assets; start with **education + paper-trading** (low regulatory surface), then licensed brokerage/payments.
  - **Real banking integration** (e.g., VietQR/Napas/UOB-style local enterprise API) replacing the current in-house "CoinWise Bank" simulation.
- **Production hardening (roadmap):** move in-memory/demo state to durable stores, add rate-limiting, audit logging, and secrets management.

---

## 9. Commercial Scaling Roadmap

| Phase | Timeline *(target)* | Milestones |
|---|---|---|
| **0 — Now** | Done | Deployed AI MVP, custom VND OpenAPI server, agentic AI, data-flywheel foundation |
| **1 — Incubation (0–6 mo)** | With UII | eKYC + compliance design; validate conversion/ARPU; expand alt-data sources (on-chain, app-usage); harden infra |
| **2 — Real-money beta (6–12 mo)** | | Integrate local banking rail (VietQR/Napas); licensed/partnered brokerage; paid subscriptions live |
| **3 — Scale (12–24 mo)** | | Grow to SOM target; B2B data/signal API; expand asset classes; regional expansion (SEA) |

> **Rubric link (Incubation Focus):** roadmap is framed as active incubation readiness, not a generic "future" section — each phase has a concrete, fundable milestone.

---

## 10. Team & The Ask

- **Team:** [founder(s) & roles — fill in]. Builders who shipped a full, integrated AI fintech MVP solo/lean (evidence of execution velocity).
- **Ask:** acceptance into **UII Incubator** + pre-seed to fund: (1) compliance/eKYC, (2) real banking integration, (3) data/ML expansion, (4) go-to-market for the first 10k paying users.
- **Use of funds (indicative):** ~40% engineering/ML, ~25% compliance/licensing, ~25% growth, ~10% ops.

---

## Appendix A — How this maps to the competition rubric

| Criterion | Weight | Evidence in CoinWise AI |
|---|---|---|
| **Proprietary Intelligence & Data Moat** | 30% | Real alt-data pipeline (HN/Reddit/CoinGecko/F&G) + **own trained NB model** (notebook, distant supervision) + Community Pulse **data flywheel**; insights drive Credit/Fraud/Advisor *(built)* |
| **Localized Technical Infrastructure** | 30% | Custom **Hono OpenAPI server** + Swagger; **VND-native** FX + CoinWise Bank rail; endpoints serving AI alt-data to frontend & agent *(built)* |
| **Agentic AI & Next-Gen UX** | 20% | **Gemini function-calling agent** executes trades & calls APIs via natural language ("buy 5,000,000 VND BTC"); inline AI in Community Pulse *(built)* |
| **Incubation Target Readiness** | 20% | This proposal: market, revenue model *(built surfaces)*, unit economics, defensibility, compliance + scaling roadmap for UII |

## Appendix B — Demo Day script
1. Alt-Data Lab: scrape → VADER + trained NB → composite signal (show provenance + model metrics).
2. Apply: Credit Score / Fraud Shield / AI Advisor driven by that signal.
3. Community Pulse: post a take → scored live → AI verdict (data flywheel).
4. Agentic chatbot: "buy 5,000,000 VND BTC" → quote → confirm → executed via OpenAPI server in VND.
5. Close on the moat + incubation ask.

*Document length target: ≤10 pages when exported to PDF.*
