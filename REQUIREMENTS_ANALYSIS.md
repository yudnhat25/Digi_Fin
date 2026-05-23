# CoinWise AI — Phân tích yêu cầu Assignment Advanced & Kế hoạch nâng cấp

> File này tổng hợp toàn bộ yêu cầu của Assignment "Advanced Fintech Synthesis – AI Integration & API Refinement" áp dụng cho dự án **CoinWise AI** (React + TS + Vite + Firebase + Gemini hiện có), và đề xuất kế hoạch phát triển tiếp theo theo hướng business thực sự (UII incubator-ready).

---

## 1. Tóm tắt Assignment (bằng tiếng Việt)

Bài tập là phần **tiếp nối** của Fintech Innovation Project học kỳ trước. Mục tiêu: nâng cấp MVP hiện có (CoinWise AI – paper trading + AI chatbot) theo 3 trục:

| Trục | Yêu cầu cốt lõi | Trọng số |
|---|---|---|
| **A. AI & Alternative Data** | Dùng AI phân tích dữ liệu phi truyền thống (social sentiment, web-scrape, mobile usage, satellite, on-chain…) phục vụ credit scoring / fraud / investment advice | **30%** |
| **B. Custom OpenAPI Server** | Tự dựng OpenAPI server proprietary, giải bài toán nội tệ (VND) mà Stripe/Plaid không hỗ trợ tốt + serve AI analytics endpoints | **30%** |
| **C. MVP UX & Agentic AI** | Giao dịch localized (VND), chatbot Gemini thực hiện được action thật qua OpenAPI (function calling, không chỉ chat) | **20%** |
| **D. Technical Documentation** | Report 5 trang + OpenAPI spec (Swagger/YAML) + deployed link | **20%** |

Deliverables:
1. **PDF Report ≤ 5 trang** — AI methodology, server architecture, updated roadmap cho UII.
2. **OpenAPI Spec + Backend code** — Swagger UI hoặc YAML/JSON file, có endpoint serve alternative-data analytics.
3. **Deployed MVP** — link demo chạy được, có AI insights + custom API.

Demo Day: Có đại diện **UII incubator** đến đánh giá khả thi & innovation → pitch chuyên nghiệp.

---

## 2. Hiện trạng dự án CoinWise AI

Stack hiện có:
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind (utility classes inline)
- **Auth + DB**: Firebase Auth + Realtime DB
- **AI**: `@google/genai` (Gemini 3 flash) — chatbot dạng Q&A thuần
- **Market data**: Binance REST API (`/ticker/24hr`, `/klines`) — chỉ USDT pairs
- **Tính năng đã có**:
  - Landing + Auth, Dashboard (chart giả lập), Trading Panel (BUY/SELL paper)
  - Markets, Portfolio Summary, Watchlist
  - Competition (Arena) với leaderboard realtime
  - Subscription tiers (STARTER/PRO/ELITE) + Earn (staking giả lập) + Academy (courses)
  - Referral, Transaction history
  - AIChatBot — chỉ trả lời thông tin, **không gọi action**

**Gap so với Assignment**:
| Gap | Mức độ |
|---|---|
| ❌ Chưa có Alternative Data / AI insights | Critical |
| ❌ Chưa có Custom OpenAPI server (mới chỉ proxy Binance, dùng Firebase RTDB làm storage) | Critical |
| ❌ Không có VND / localized currency | Critical |
| ❌ Chatbot mới chỉ chat, chưa function-calling, chưa trigger giao dịch | Critical |
| ❌ Không có OpenAPI/Swagger spec | Critical |
| ⚠️ Trading chart đang random (mock candles) | Nên nâng cấp |
| ⚠️ News widget mock | Nên thật |

---

## 3. Cụ thể hóa từng yêu cầu

### Part A — AI-Driven Alternative Data Analysis (30%)

**Câu hỏi nguồn dữ liệu**: dùng alternative data gì?

Lựa chọn khả thi (không cần API trả phí thật, có thể mock thông minh + Gemini phân tích thực):

| Nguồn | Khả thi | Use-case fintech | Đề xuất |
|---|---|---|---|
| **Crypto Social Sentiment** (Twitter/X mentions, Reddit /r/cryptocurrency) | Dễ — có thể dùng mock dataset hoặc free API như CryptoPanic | Sentiment score → buy/sell signal, market mood | ✅ **Bắt buộc** |
| **On-chain Whale Activity** | Binance/Etherscan public — có endpoint free | Detect smart money flow → trade signal, anti-manipulation alert | ✅ **Bắt buộc** |
| **Fear & Greed Index** (Alternative.me free API) | Rất dễ | Risk gauge, portfolio rebalance suggestion | ✅ **Bắt buộc** |
| **News Sentiment** (CryptoPanic free API hoặc RSS) | Dễ | Real-time news scoring | ✅ |
| **Mobile usage / utilities bill** | Mock dataset (giả lập user data) | Credit score cho user fintech VN | ✅ Cho module Credit Score |
| **Web-scraped retail trends** | Mock dataset DeFi/NFT trending | Personalized investment advice | ⏩ Optional |
| **Satellite imagery** | Quá phức tạp cho timeline | — | ❌ Skip |

**Output AI Analytics** (đây là điểm bán hàng):
1. **AI Credit Score 0-1000** — kết hợp on-chain history + utility/mobile usage giả lập + sentiment exposure → ra điểm tín dụng tài chính cho user (use-case quan trọng ở VN — bank không có)
2. **Sentiment-Augmented Signals** — mỗi coin có Sentiment Score + AI Buy/Hold/Sell rating có giải thích
3. **Fraud Detection** — flag giao dịch bất thường (giá lệch, volume spike, sentiment trái chiều)
4. **Personalized Investment Advice** — dựa trên risk profile + alternative data, AI đề xuất danh mục mẫu

→ Tất cả expose qua **Custom OpenAPI server** để Chatbot + UI cùng đọc được.

### Part B — Custom OpenAPI Server (30%)

**Tech stack đề xuất**:
- **Hono + TypeScript** chạy trên Node (lightweight, fast) hoặc **Express** truyền thống
- Tích hợp **swagger-ui-express** hoặc serve `openapi.yaml` static
- Storage: file JSON + in-memory cache, hoặc Firebase Admin SDK (dùng lại RTDB)
- Triển khai: chạy local + có thể deploy Render/Fly/Railway free tier (hoặc Vercel serverless function)

**Endpoints tối thiểu** (đầy đủ Swagger spec):

```
GET    /api/v1/health
GET    /api/v1/fx/rates              # USD↔VND, BTC↔VND v.v…
POST   /api/v1/fx/convert            # body {amount, from, to}

GET    /api/v1/market/prices         # proxy Binance + thêm price-in-VND
GET    /api/v1/market/{symbol}/sentiment
GET    /api/v1/market/{symbol}/whale-flow
GET    /api/v1/market/fear-greed

POST   /api/v1/ai/credit-score       # {userId} → 0..1000 + explanation
POST   /api/v1/ai/fraud-check        # {transaction} → risk score
POST   /api/v1/ai/advisor            # {userId, riskProfile} → portfolio gợi ý
POST   /api/v1/ai/insight            # tổng hợp insight cho 1 coin

# Account / transactions (localized VND)
GET    /api/v1/accounts/{id}/balance        # trả USD + VND
POST   /api/v1/accounts/{id}/deposit-vnd    # input VND, convert ra USD nội bộ
POST   /api/v1/accounts/{id}/withdraw-vnd
POST   /api/v1/accounts/{id}/trade          # BUY/SELL symbol (cross-currency safe)
GET    /api/v1/accounts/{id}/transactions

# Agentic actions (chatbot dùng)
POST   /api/v1/agent/execute         # tool dispatcher cho function-calling
```

→ Hai vấn đề "non-Vietnamese currency" mà Stripe không xử lý:
- Nạp/rút bằng VND (giá trị nhỏ, fx động)
- Hiển thị giá crypto/portfolio bằng VND cùng lúc USD
- Tính phí (fee) đúng theo TT/quy định nội địa giả lập

### Part C — MVP Functional Refinements (20%)

#### C1. Localized Transactions (VND)
- Toggle **USD ↔ VND** ở Header & PortfolioSummary
- Giá hiển thị đa tệ (BTC: $43,250 / 1.05B ₫)
- Nạp/rút mô phỏng VND (form nhập VND, hệ thống quy đổi)
- Format số kiểu Việt Nam (1.234.567 ₫)
- Lưu preference vào userState

#### C2. Advanced Agentic Chatbot
- Chuyển sang Gemini **function calling** (`@google/genai` Type system)
- Tools đăng ký:
  - `getPortfolio()` — đọc từ OpenAPI server
  - `getCreditScore()`
  - `getSentiment(symbol)`
  - `getFraudReport(txId)`
  - `placeTrade(symbol, side, amountUSD)` — yêu cầu confirm UI
  - `convertCurrency(amount, from, to)`
  - `getAIInsight(symbol)`
- Chatbot có thể: *"Mua giúp tôi 100$ BTC nếu sentiment > 60"* → AI gọi tool, hỏi user confirm, rồi execute qua OpenAPI server
- Hiển thị "đang gọi tool…" trong khi chạy (UX agentic)

---

## 4. Tính năng business mới đề xuất (để khác biệt với MVP cũ)

Để pitch UII incubator thuyết phục, web nên có thêm các **module business-oriented** sau (đều khả thi trong scope):

| Module | Giá trị business | Độ phức tạp |
|---|---|---|
| 🇻🇳 **AI Credit Score VN** (alternative data → 0-1000 score) | Use-case cực nóng ở VN, ngân hàng + ví điện tử đều thiếu | Medium |
| 📊 **Smart Portfolio Advisor** | Dùng AI gợi ý rebalance định kỳ → upsell Pro/Elite | Medium |
| 🚨 **Fraud Shield** | AI rà mỗi giao dịch lớn, cảnh báo bất thường, KYC-lite | Medium |
| 🌐 **Social Pulse Dashboard** | Trang riêng — top coin theo sentiment, mood index, whale alert feed | Medium |
| 💱 **Multi-currency Wallet (VND/USD)** | Khắc phục đúng pain-point assignment nói | Medium |
| 🏦 **Open Banking Sandbox tab** (mô phỏng UOB OpenAPI) | Đúng gợi ý đề bài (UOB Local) | Low |
| 🎯 **AI Trade Copilot side-panel** | Inline AI bên cạnh chart, gọi insight nhanh | Medium |
| 📈 **Live Candlestick chart (thay mock)** | Dùng `lightweight-charts` của TradingView (free) | Low |
| 🔔 **Smart Alerts** (sentiment shift, whale move) | Web push / in-app, giữ user quay lại | Low |
| 📰 **Real news feed** (CryptoPanic free API) | Bỏ widget mock | Low |

---

## 5. Kiến trúc đề xuất sau nâng cấp

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                │
│  • Dashboard, Markets, Portfolio, Arena, Academy, Earn  │
│  • + Social Pulse, Credit Score, AI Advisor, Fraud      │
│  • + VND/USD toggle, Live chart, Smart Alerts           │
│  • Agentic Chatbot (Gemini function-calling)            │
└──────────────┬──────────────────────────────────────────┘
               │ HTTPS / fetch
               ▼
┌─────────────────────────────────────────────────────────┐
│  Custom OpenAPI Server  (Node + Hono)                   │
│  • /api/v1/fx   — VND localized                         │
│  • /api/v1/market   — Binance proxy + enriched          │
│  • /api/v1/ai/*  — Credit/Fraud/Sentiment/Advisor       │
│  • /api/v1/accounts/* — paper-account + localized tx    │
│  • /api/v1/agent/execute — tool dispatcher              │
│  • /docs  — Swagger UI                                  │
│  • /openapi.yaml  — spec                                │
└──────┬─────────────────────────────┬────────────────────┘
       │                             │
       ▼                             ▼
  ┌──────────┐                ┌──────────────┐
  │ External │                │  Gemini API  │
  │  • Binance                │  (alternative│
  │  • CryptoPanic            │   data eval) │
  │  • Alternative.me F&G     └──────────────┘
  └──────────┘                
       │
       ▼
  ┌──────────────────────┐
  │  Firebase RTDB / file│
  │  (user state, txs,   │
  │   audit log)         │
  └──────────────────────┘
```

---

## 6. Lựa chọn kỹ thuật (đã quyết)

| Quyết định | Lý do |
|---|---|
| OpenAPI server = **Hono + TS** (Node) | Nhanh, type-safe, OpenAPI plugin sẵn, single-process dễ deploy |
| Chạy local cùng `npm run dev:api` ở cổng **3001**, FE giữ **3000** | Đơn giản dev, có thể proxy |
| Swagger UI bundle qua `@hono/swagger-ui` | Đề bài yêu cầu rõ |
| Alternative data: **Fear&Greed + sentiment mock + on-chain mock**, Gemini làm reasoning layer | Free, ổn định, đủ chứng minh AI methodology |
| VND tỷ giá: **mock realistic 24,500-25,500 VND/USD** với jitter + endpoint `/fx/rates` | Không phụ thuộc API trả phí |
| Chatbot: chuyển sang **Gemini function calling** với `Type.OBJECT` schema | Đáp ứng agentic requirement |
| Live chart: **lightweight-charts** (TradingView free) thay candle mock | UX professional cho demo day |

---

## 7. Roadmap thực thi (sequencing)

1. **Backend foundation**: Tạo `/server` folder, Hono + OpenAPI spec, mock data sources, endpoints + Swagger UI. Dev script.
2. **AI Analytics layer**: Module `server/ai/` — credit-score, fraud, sentiment, advisor, fear-greed wrapper. Gemini integration cho reasoning.
3. **Frontend service layer**: `services/coinwiseApi.ts` thay/bổ sung cho `api.ts`, expose typed client gọi backend mới.
4. **VND localization**: Currency context + toggle + helpers `formatVND`, `formatUSD`. Update PortfolioSummary, TradingPanel, Markets.
5. **New pages**: `SocialPulsePage`, `CreditScorePage`, `AIAdvisorPage`, `FraudShieldPage`. Add tabs trong Layout.
6. **Live chart**: Replace mock chart với `lightweight-charts`, kéo data từ OpenAPI server (proxy klines).
7. **Agentic chatbot**: Refactor `geminiService.ts` → tool definitions + dispatcher gọi backend.
8. **Polish + Smart Alerts**: in-app notification feed, AI-generated daily brief.
9. **Documentation**: README architecture, generate `openapi.yaml`, prepare pitch slide outline.

---

## 8. Tiêu chí "Done" cho từng deliverable

- [ ] `/server/openapi.yaml` mở được trong Swagger UI tại `http://localhost:3001/docs`
- [ ] Có ≥ 12 endpoint, ít nhất 4 endpoint phục vụ AI alternative data
- [ ] FE hiển thị Credit Score, Sentiment Dashboard, Fraud alerts, AI advisor, VND toggle
- [ ] Chatbot có thể: kiểm tra số dư, hỏi credit score, đặt lệnh mua bằng câu tiếng Việt
- [ ] Tất cả persistence (paper-account state) đi qua OpenAPI server (server là source of truth)
- [ ] Build & run pass, screenshot demo cho từng tính năng

---

## 9. Câu hỏi mở (auto-mode → tự quyết)

> Vì đang ở Auto Mode, các quyết định sau sẽ tự đưa ra theo hướng "tối ưu UII pitch":

- ✅ Giữ Firebase Auth (đã hoạt động) — chỉ thay data layer qua OpenAPI
- ✅ Backend chạy chung process với Vite dev qua middleware-style hoặc separate port 3001
- ✅ Mock alternative data → đủ realistic + Gemini reasoning lên trên = "AI-driven" thực sự
- ✅ Ưu tiên tốc độ giao hàng > hoàn hảo: scaffold đầy đủ, mỗi module có 1 endpoint thật hoạt động

---

*File này là kim chỉ nam. Bắt đầu thực thi theo Section 7.*
