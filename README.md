<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# CoinWise AI — Advanced Fintech Synthesis

**AI-driven, alternative-data crypto fintech for the Vietnamese market.**
Built for the *Advanced Fintech Synthesis – AI Integration & API Refinement* assignment.

</div>

---

## What this is

CoinWise AI is a paper-trading + financial-intelligence platform that combines three things which traditional global APIs (Stripe, Plaid) can't deliver in Vietnam:

1. **AI-driven Alternative Data** — social sentiment, on-chain whale flow, fear & greed, mobile-usage proxies → fed into AI Credit Scoring, AI Portfolio Advisor, and Fraud Detection.
2. **A proprietary OpenAPI server** — first-class **VND localization**, custom AI analytics endpoints, and an agentic tool-dispatcher (see `server/openapi.yaml`).
3. **An agentic chatbot** — Gemini function-calling that actually *does* things: pulls credit scores, quotes trades, deposits VND — all through the custom OpenAPI server.

See [`REQUIREMENTS_ANALYSIS.md`](REQUIREMENTS_ANALYSIS.md) for the full requirements mapping.

---

## Architecture

```
React (Vite) ─► CoinWise OpenAPI server (Hono, port 3001) ─► Binance / Gemini
                │
                ├── /api/v1/fx/*          VND localization
                ├── /api/v1/market/*      enriched market data + alt-data
                ├── /api/v1/ai/*          credit score, fraud, advisor, insight
                ├── /api/v1/accounts/*    paper-account state (USD + VND)
                ├── /api/v1/agent/execute agentic tool dispatcher
                ├── /docs                 Swagger UI
                └── /openapi.yaml         OpenAPI 3.0 spec
```

## Run locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Add your Gemini API key in `.env.local`:
   ```
   GEMINI_API_KEY=...your key...
   ```
3. Run both the frontend (Vite, port 3000) **and** the OpenAPI server (Hono, port 3001) together:
   ```bash
   npm run dev:all
   ```
   Or run them in separate terminals:
   ```bash
   npm run dev:api    # OpenAPI server on http://localhost:3001
   npm run dev        # React app on http://localhost:3000
   ```
4. Open:
   - App: <http://localhost:3000>
   - Swagger UI: <http://localhost:3001/docs>
   - OpenAPI spec: <http://localhost:3001/openapi.yaml>

## Feature map

| Tab | What it shows |
|---|---|
| **Terminal** | Live candlestick chart (lightweight-charts) + AI Insight card combining sentiment + whale flow + fear & greed |
| **Markets** | Enriched market list with AI signals + VND prices |
| **Arena** | Trading competition with realtime leaderboard (Firebase) |
| **Social Pulse** | AI alt-data leaderboard, fear & greed dial, mood history |
| **Credit Score** | 0–1000 AI credit score from alternative data + lending eligibility in VND |
| **AI Advisor** | Risk-profile-tilted allocation powered by alt-data signals |
| **Fraud Shield** | Live anomaly detection on user transactions |
| **API Docs** | Embedded Swagger UI for the proprietary OpenAPI server |
| **Earn / Academy / Referral / Pro** | Original MVP modules (kept) |

## Currency localization

A global toggle in the sidebar switches the UI between **🇺🇸 USD** and **🇻🇳 VND**. All amounts re-render via the `CurrencyProvider` context, and the rate is fetched live from `/api/v1/fx/rates`.

## Agentic chatbot

Click the fuchsia robot button in the lower-right. Try:
- *"Show my balance in VND"*
- *"Điểm tín dụng của tôi là bao nhiêu?"*
- *"Sentiment cho BTC và ETH?"*
- *"Mua giúp tôi 5 triệu VND BTC"* — the bot will quote the trade and ask you to confirm.

## Deploy lên Vercel

Project đã được cấu hình sẵn để deploy 1 lần (frontend + backend cùng domain).

### Cách 1 — Deploy bằng Vercel CLI (nhanh nhất)

```bash
npm i -g vercel          # cài CLI (1 lần)
vercel login             # đăng nhập
vercel                   # deploy preview (làm theo prompt)
vercel --prod            # deploy production
```

Khi prompt hỏi:
- **Set up and deploy?** → `Y`
- **Which scope?** → chọn account của bạn
- **Link to existing project?** → `N` (lần đầu)
- **Project name** → giữ mặc định hoặc đặt `coinwise-ai`
- **In which directory is your code located?** → `./`
- **Framework Preset** → tự detect `Vite`. Giữ nguyên.

Sau khi deploy xong nhớ **thêm Environment Variable** trong Vercel Dashboard → Settings → Environment Variables:
| Tên | Giá trị | Scope |
|---|---|---|
| `GEMINI_API_KEY` | API key Gemini của bạn | All Environments |

Sau đó `vercel --prod` lại 1 lần để áp dụng env mới.

### Cách 2 — Deploy bằng Git push (recommended cho update sau)

1. Push repo lên GitHub.
2. Vào https://vercel.com/new → Import repo.
3. Vercel tự detect Vite → click **Deploy**.
4. Vào Settings → Environment Variables, add `GEMINI_API_KEY` như trên.
5. Mỗi lần `git push main`, Vercel sẽ auto-deploy lại.

### Cấu trúc deploy

- `dist/` (Vite build) → static site, served ở root domain.
- `api/[[...path]].ts` → Vercel Node serverless function chứa **toàn bộ Hono app**.
- `vercel.json` rewrites `/api/*`, `/docs`, `/openapi.yaml` → catch-all function.
- `includeFiles: "server/openapi.yaml"` bảo đảm spec YAML đi kèm bundle function.
- Frontend tự switch base URL theo môi trường (xem `services/coinwiseApi.ts`):
  - Dev → `http://localhost:3001`
  - Prod (Vercel) → same-origin `/api`

### Sau khi deploy thành công

- App: `https://<your-project>.vercel.app/`
- Swagger UI: `https://<your-project>.vercel.app/docs`
- OpenAPI spec: `https://<your-project>.vercel.app/openapi.yaml`

### ⚠️ Lưu ý quan trọng

In-memory paper-account state trong `server/state.ts` **không persistent qua các serverless invocation** (mỗi cold-start là 1 process mới). Đây là demo-grade — đủ cho UII pitch. Nếu cần persistent thật, thay `Map<>` bằng Vercel KV / Upstash Redis trong file đó.

## Deliverables checklist

- [x] OpenAPI spec (`server/openapi.yaml`) + Swagger UI (`/docs`)
- [x] Backend implementation (Hono, in `server/`)
- [x] AI analytics serving endpoints (`/api/v1/ai/*`, `/api/v1/market/*`)
- [x] VND localization end-to-end
- [x] Agentic chatbot with function-calling
- [x] Live candlestick chart
- [x] Project report — see [`REQUIREMENTS_ANALYSIS.md`](REQUIREMENTS_ANALYSIS.md)
