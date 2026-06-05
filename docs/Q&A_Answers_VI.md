# CoinWise AI — Giải đáp Q&A (7 câu)

> Trả lời cho [docs/Q&A.pdf](./Q&A.pdf) — mỗi câu bám đúng ảnh chụp màn hình của nó và đối chiếu trực tiếp với code thật trong repo (pipeline fusion, metrics train model, spec OpenAPI).
>
> Mạch logic toàn hệ thống: **Collect** (web thật) → **Analyse** (VADER + model train + Z-score) → **Fuse** (composite 4 nguồn) → **Apply** (Fraud Shield, AI Advisor/Allocation, Agentic chatbot) → expose qua **OpenAPI**.

---

## Câu 1 — Ảnh: thẻ **AI ALT-DATA INSIGHT** (BTC · SELL · Sentiment −20 · Market Mood 12 · Confidence 92%)

> *"Nguồn, đóng góp là gì, sử dụng gì để đánh giá"*

Thẻ này là **đầu ra hợp nhất (composite)** của cả pipeline alt-data. Một con số duy nhất (`-20/100`, signal `SELL`) được trộn từ **4 nguồn dữ liệu thật**, mỗi nguồn đóng góp một trọng số:

| Nguồn | Lấy từ đâu (thật) | Đóng góp vào điểm | Trọng số gốc |
|---|---|---|---|
| **Social-text** (mood đám đông) | StockTwits crypto, fallback Hacker News/Reddit — text thật cào về | Tâm lý người nói trên mạng | **0.30** |
| **News tone** (sự kiện) | RSS tin crypto (Cointelegraph…), có timestamp | Giọng điệu tin tức/sự kiện | **0.20** |
| **CoinGecko** | Tỷ lệ vote up/down của cộng đồng CoinGecko | Bình chọn cộng đồng | **0.25** |
| **Fear & Greed** | API Alternative.me | Tâm lý thị trường vĩ mô | **0.25** |

**Cách đánh giá (2 tầng trộn):**
1. **Tầng trong (inner blend)** — với text (social + news): mỗi câu được chấm điểm bằng **VADER (40%) + mô hình tự train (60%)**. VADER là baseline từ điển; mô hình train có trọng số cao hơn vì học từ dữ liệu gán nhãn.
2. **Tầng ngoài (outer blend)** — trộn 4 nguồn theo trọng số trên. **Kênh nào chết (API lỗi) thì trọng số về 0 và phần còn lại được chuẩn hóa lại** cho tổng = 1 → đó là lý do banner *"Live sources degraded — some values shown are heuristic"* xuất hiện khi 1 nguồn down.

**Kết quả:** `composite ∈ [-1,1]` → quy về thang 0–100 (ở ảnh là 40/100 → hiển thị −20 lệch tâm "Bearish"). Confidence 92% được cộng dồn theo số kênh còn sống (mỗi kênh thật đóng góp một phần confidence). Signal map: `≤ -0.5 STRONG_SELL`, `≤ -0.15 SELL`, `±0.15 NEUTRAL`, `≥ 0.15 BUY`, `≥ 0.5 STRONG_BUY`.

→ **Tóm lại:** thẻ này không phải 1 API đơn lẻ, mà là **bằng chứng hợp nhất 4 nguồn alt-data thật**, dùng để cảnh báo nhanh "nên thận trọng/mua/bán" và là input cho Fraud Shield + AI Advisor.

---

## Câu 2 — Ảnh: **CoinWise Agentic AI** (Function-calling · Gemini · OpenAPI)

> *"AI trong này đọc được những dữ liệu gì, cách đánh giá và đưa ra tư vấn, sử dụng dữ liệu nào trong app để đánh giá"*

Đây là **chatbot agentic** (gọi hàm), không phải chatbot trả lời suông. Cơ chế:

**1. AI đọc được gì** — qua **function-calling**, Gemini gọi các endpoint OpenAPI thật của app (dispatcher `/api/v1/agent/execute`). Nó truy cập được:
- **Số dư & danh mục** của người dùng (`/accounts/{id}/balance`)
- **Sentiment** từng coin (`/market/{symbol}/sentiment`) — chính là composite ở Câu 1
- **Fear & Greed** (`/market/fear-greed`)
- **Giá thị trường live** (`/market/prices`, proxy Binance)
- **Social pulse** (`/market/social-pulse`)
- Và **đặt lệnh paper-trade** (`/accounts/{id}/trade`), kể cả lệnh bằng VND ("buy 5,000,000 VND of BTC").

**2. Cách đánh giá & tư vấn:** người dùng hỏi tiếng tự nhiên → Gemini quyết định gọi tool nào → app trả JSON thật → Gemini tổng hợp thành câu trả lời. Tức **mọi tư vấn đều dựa trên số liệu thật trong app tại thời điểm hỏi**, không bịa. Ví dụ "Sentiment for BTC and ETH?" → nó gọi 2 lần sentiment endpoint rồi giải thích.

**3. Khác biệt cốt lõi:** đây là **AI có hành động** (đọc state + thực thi giao dịch qua OpenAPI), không chỉ chat. Badge "VND" ở góc = nó hiểu và xử lý nội tệ.

---

## Câu 3 — Ảnh: **Fear & Greed Index** (12 · Extreme Fear, có Historical Data)

> *"Nguồn dữ liệu, đóng góp"*

**Nguồn:** API công khai **Alternative.me Fear & Greed Index** (`/api/v1/market/fear-greed`), phủ một lớp AI overlay nhẹ để mô tả. Đây là **dữ liệu thật, real-time**, không phải tự bịa.

**Dữ liệu trong ảnh:**
- Chỉ số hiện tại **12 = Extreme Fear**, `+1 pts (24h)`.
- **Historical Data**: Hôm qua 11 (Extreme Fear), tuần trước 22, tháng trước 50 (Neutral), năm trước 57 (Greed).
- **Yearly High/Low**: cao nhất 79 (Extreme Greed, 2025/07/12), thấp nhất 5 (Extreme Fear, 2026/02/12).

**Đóng góp vào app:** chỉ số này là **1 trong 4 nguồn của composite** (trọng số gốc 0.25 — Câu 1). Nó được "căn tâm" về [-1,1] bằng công thức `(value − 50)/50`: 12 → ≈ −0.76 (rất bearish), kéo composite xuống. Ý nghĩa: đây là **tâm lý vĩ mô toàn thị trường**, bổ sung cho social-text (vốn chỉ là mood đám đông về 1 coin).

---

## Câu 4 — Ảnh: **trang Alt-Data Lab** (Technique 1 VADER + Technique 2 Logistic Regression + Training Summary)

> *"Nguồn dữ liệu và đóng góp của từng phần của trang alt-data"* + *"giải thích rõ từng chỉ số train model, các bước train, lấy model tốt nhất, cấu hình model"*

### A) Nguồn & đóng góp từng phần của trang Alt-Data

| Phần | Nội dung | Nguồn | Đóng góp |
|---|---|---|---|
| **0 · Collect** | "fetch alternative data from live web" | StockTwits (30 docs SOL), Fear&Greed, CoinGecko | Thu thập thô |
| **1 · VADER lexicon analyzer** | điểm −0.17, Bearish, 28/35 docs có lexicon term | Từ điển VADER + luật negation/intensifier/ALL-CAPS | Baseline chấm điểm, **40%** trong inner blend |
| **2 · Logistic Regression (trained from scratch)** | điểm 0.06, Positive, vocab 4454 | Mô hình **tự train** trên ~5.000 doc gán nhãn | Bộ não chính, **60%** trong inner blend |

VADER và mô hình train **chấm cùng một corpus** rồi trộn — VADER bắt được sắc thái ngôn ngữ (mỉa, viết hoa), mô hình bắt được pattern học từ dữ liệu. Hai cái bù nhau.

### B) Giải thích từng chỉ số train model (ảnh Training Summary)

**Các chỉ số trong ảnh:**
- **Accuracy 63.9%** — % dự đoán đúng trên **155 câu test do người gán nhãn tay** (không dùng VADER/synthetic để tránh "tự chấm tự đúng").
- **Macro F1 62.6%** — trung bình F1 của 3 lớp, **không trọng số** → phạt nặng nếu model bỏ bê lớp ít mẫu (neutral). Đây là chỉ số **chọn model chính**, vì accuracy dễ bị lớp đông kéo lên.
- **Vocab 4454** — số token (unigram + bigram) trong từ vựng.
- **Train/Test 3984/155** — 3.984 câu train, 155 câu test, **leak = 0** (test tách hoàn toàn).
- **Per-class P / R / F1:**
  - Positive: P69 R68 **F1 68.2%**
  - Negative: P85 R61 **F1 71.4%** (precision cao — model nói "tiêu cực" thì rất đáng tin)
  - Neutral: P40 R61 **F1 48.2%** (yếu nhất — neutral khó vì ranh giới mờ)
- **Confusion Matrix** (hàng = thật, cột = dự đoán):
  - positive: 44 đúng / 4 → neg / 17 → neutral (65)
  - negative: 9 → pos / 35 đúng / 13 → neutral (57)
  - neutral: 11 → pos / 2 → neg / 20 đúng (33)
  - → Lỗi chính là **nhầm sang neutral** (17 và 13 câu), đúng như F1 neutral thấp.

**Các bước train (pipeline `npm run train:nlp`):**
1. **relabel** — cào StockTwits text thật → **vứt nhãn tự gán của người đăng** (nhiễu, phản ánh vị thế chứ không phải sắc thái) → **gán nhãn lại** bằng engine VADER độ tin cao.
2. **build dataset** — gộp relabeled + một ít câu synthetic "hard-case" + gold → **2 file**: `sentiment_train.json` (~3.984) và `sentiment_test.json` (155).
3. **train + chọn model** — train **4 thuật toán** (Logistic Regression, Linear SVM, Multinomial NB, Complement NB) trên cùng feature TF unigram+bigram, lọc qua `PROBE_FLOOR`, rồi **chọn macro-F1 cao nhất**.
4. **export** — model thắng được port sang TypeScript (`model.ts` + `model-metrics.ts`) để chạy thẳng trong backend.

**Lấy model tốt nhất & cấu hình:** thắng cuộc là **logistic-regression** (macro-F1 62.6%, train 6/5/2026). Port sang TS theo dạng **log-linear**: `argmax(prior + X·coef)` rồi softmax → bất kỳ model tuyến tính sklearn nào cũng port chính xác (đã verify recon-agree=1.000). Khung "Try the trained classifier" cho gõ câu bất kỳ (model **chưa từng thấy lúc train**) để kiểm chứng trực tiếp.

---

## Câu 5 — Ảnh: **Technique 3 (Z-score)** + **Technique 4 (Multi-source fusion)** + **Smart Allocation Studio**

> *"Nguồn và chức năng áp dụng cho app"* + *"Dữ liệu tính toán như nào, kết quả giúp gì"* + *"Phương pháp tạo, lấy dữ liệu từ đâu để phân bổ"*

### Technique 3 — Z-score on mention volume
- **Nguồn:** đếm số mention của coin theo thời gian, lưu **rolling window bền trong Firebase RTDB** (sống sót qua cold-start).
- **Tính:** `z = (current − μ) / σ`. Nếu `z > 1.5σ` qua `≥ 5 mẫu` → đánh dấu **SPIKE** (sóng chú ý retail).
- **Ứng dụng:** spike là tín hiệu FOMO → đẩy vào Fraud Shield và làm cờ cảnh báo. (Ảnh đang `n=0 samples, NORMAL` vì baseline mới warm-up — cần vài lần load.)

### Technique 4 — Multi-source signal fusion (chính là Câu 1, hiển thị chi tiết)
- Inner blend **VADER 40% + model 60%**, outer blend **social 40% / news 20% / CoinGecko / Fear&Greed** → **Composite −0.420 / 1.00 → SELL, BEARISH, CONF 80%**.
- Dòng *"NEWS DRIVING THE TONE"* cho thấy đúng tin nào kéo điểm (−0.30 "CFTC follows SEC in scrapping 'no-deny' policy").

### Smart Allocation Studio (phân bổ danh mục)
- **Phương pháp:** AI Advisor **nghiêng (tilt) tỷ trọng mục tiêu** theo hồ sơ rủi ro (Conservative / Balanced / Growth / Aggressive).
- **Lấy dữ liệu từ đâu:** chính là **composite sentiment model** (VADER + model trên StockTwits/news live) + **CoinGecko vote** + **Fear & Greed**, phủ thêm **momentum giá 24h từ Binance**. Nguồn endpoint: `/api/v1/ai/advisor`.
- **Cách phân bổ:** lấy allocation nền theo khẩu vị rủi ro → tilt mỗi coin theo điểm sentiment (sentiment dương → tăng tỷ trọng, capitulation → giảm), kèm cash-buffer 10–15% cho dip-buy. Mọi đề xuất đều có "rationale" giải thích vì sao.

→ **Kết quả giúp app:** biến tín hiệu alt-data thô thành **hành động đầu tư cụ thể** (nên giữ bao nhiêu % mỗi coin), thay vì chỉ hiển thị điểm số.

---

## Câu 6 — Ảnh: **Anomaly & Fraud Detection** (Fraud Shield: Avg Risk 15%, Safe 15, Review 0, Blocked 0)

> *"Phương pháp để tạo ra, áp dụng để làm gì cho app"*

**Phương pháp tạo:** endpoint `/api/v1/ai/fraud-check` là một **bộ phát hiện bất thường hành vi (behavioral anomaly detector)** trộn 2 lớp:
1. **Luật trên account-data:** velocity (tần suất giao dịch), notional (giá trị lệnh quá lớn), cash-burst (rút/đốt tiền đột biến), off-hours (giao dịch giờ bất thường).
2. **Live alt-data:** sentiment VADER + CoinGecko + **mention-spike Reddit** (chính là Z-score Câu 5).

**Logic kích hoạt** (trong code): `fraudTriggered = composite < -0.4` **HOẶC** `(spike && composite < 0)` — tức là **mua đúng lúc đám đông cực kỳ tiêu cực, hoặc có spike chú ý kèm sentiment xấu** → cờ "contra-FOMO".

**Áp dụng cho app:** mỗi giao dịch (ảnh: *BUY ETH 24,077,250,292 ₫*) chạy qua fraud-check, gán **risk score** + nhãn `SAFE / REVIEW / BLOCKED`. Mục tiêu: chặn người dùng đu đỉnh theo FOMO và cảnh báo lệnh bất thường — đây là phần "defensive AI" của app.

---

## Câu 7 — Ảnh: **CoinWise OpenAPI Documentation** (Endpoint Inventory 15)

> *"Tạo bảng tổng quan về chức năng của các api, phương thức tạo"*

**Phương thức tạo:** backend **Hono + OpenAPI**, spec ở [api/_lib/openapi.yaml](../api/_lib/openapi.yaml), bundle thành `api/dispatch.js` (esbuild, `npm run build:api`), deploy Vercel (live `digi-fin.vercel.app`), có **Swagger UI** tại `/docs` và YAML tại `/openapi.yaml`. Đây là **OpenAPI thật, chạy được**, cũng là lớp tool cho chatbot agentic (Câu 2).

**Bảng tổng quan chức năng (theo spec thật):**

| Nhóm | Method · Endpoint | Chức năng |
|---|---|---|
| **Health** | `GET /api/v1/health` | Liveness probe |
| **FX (VND)** | `GET /api/v1/fx/rates` | Tỷ giá USD/VND/EUR/JPY (base USD) |
| | `POST /api/v1/fx/convert` | Quy đổi tiền tệ (xử lý độ chính xác VND) |
| **Market** | `GET /api/v1/market/prices` | Giá live (proxy Binance + giá trị VND) |
| **AI / Alt-Data** | `GET /api/v1/market/{symbol}/sentiment` | Sentiment social (composite) theo coin |
| | `GET /api/v1/market/fear-greed` | Fear & Greed (Alternative.me + overlay) |
| | `GET /api/v1/market/social-pulse` | Bảng xếp hạng social, mood shift |
| | `POST /api/v1/ai/fraud-check` | Chấm rủi ro gian lận giao dịch |
| | `POST /api/v1/ai/advisor` | Tư vấn phân bổ danh mục cá nhân hóa |
| | `POST /api/v1/ai/insight` | Tổng hợp insight 1 coin (gộp mọi alt-data) |
| **Earn** | `GET /api/v1/earn/yields` | APY/coin (median pool DefiLlama, cache 30m) |
| **Accounts** | `GET /api/v1/accounts/{id}/balance` | Số dư + holdings (USD & VND) |
| | `POST /api/v1/accounts/{id}/deposit-vnd` | Nạp VND → tự đổi sang USD nội bộ |
| | `POST /api/v1/accounts/{id}/trade` | Đặt paper-trade (VND hoặc USD) |
| **Agent** | `POST /api/v1/agent/execute` | Dispatcher cho chatbot Gemini gọi tool |
| **Bank (VND)** | `GET /api/v1/bank/{id}` | Thông tin tài khoản ngân hàng VND |
| | `GET /api/v1/bank/{id}/statement` | Sao kê (nạp/rút/arena) |
| | `POST /api/v1/bank/{id}/deposit` · `…/withdraw` | Nạp / rút VND |
| | `POST /api/v1/bank/arena/pay-entry` · `…/payout` | Trừ phí / trả thưởng Arena |

> Ảnh hiển thị "Inventory (15)" là tập **core** show ra UI; spec đầy đủ có **21 endpoint** (gồm cả nhóm Bank/Arena). Tất cả đều có **VND localization** và test được trực tiếp trong Swagger.

---

## Phụ lục — Community Pulse đóng góp gì

> Cần phân biệt: **Community Pulse ≠ social-text trong pipeline alt-data**. Social-text cào từ web ngoài (StockTwits/Reddit/HN của người lạ); Community Pulse là **nội dung do chính người dùng CoinWise đăng trong app** (first-party), lưu ở `community/posts` trên Firebase RTDB.

1. **Bằng chứng sống cho model NLP tự train chạy real-time:** mỗi take được chấm server-side bằng chính model đã train (`apiNbClassify`), gắn nhãn `POSITIVE/NEGATIVE/NEUTRAL` + confidence ngay khi Post, **không tốn quota Gemini**.
2. **Tín hiệu sentiment first-party:** `aggregatePulse` gộp post 24h → score 0–100, % bullish/bearish/neutral, trend rising/falling.
3. **Verdict kết hợp 3 nguồn** (riêng của panel): Community **0.50** + News/alt-data **0.35** + Fear & Greed **0.15**.
4. **Cảnh báo FOMO / phân kỳ:** khi đám đông app bullish nhưng alt-data nói SELL → warning *"Crowd is bullish but alt-data says SELL — watch for FOMO"*.
5. **Tool cho chatbot agentic:** `getCommunityPulse()` cho chatbot đọc mood cộng đồng và blend với alt-data khi tư vấn.

**Lưu ý quan trọng:** Community Pulse **không** phải 1 trong 4 chân của composite alt-data (Câu 1) — nói rõ để không bị bắt lỗi trùng nguồn.

---

## Phụ lục — VADER là gì, tại sao chọn, ứng dụng

> Code thật: [api/_lib/ai/nlp/vader.ts](../api/_lib/ai/nlp/vader.ts) + [lexicon.ts](../api/_lib/ai/nlp/lexicon.ts).

### 1. VADER là gì
**VADER = Valence Aware Dictionary and sEntiment Reasoner** (Hutto & Gilbert, 2014) — một kỹ thuật phân tích cảm xúc (sentiment) dạng **từ điển + luật ngữ pháp** (lexicon + rule-based), **không cần huấn luyện**. Cách hoạt động trong dự án:

1. **Tách từ (tokenize)** câu thành các token.
2. Với mỗi token có trong **từ điển valence** (mỗi từ gắn sẵn 1 điểm cảm xúc, vd "moon" +, "rug" −):
   - **Booster:** nhân hệ số theo 1–2 từ đứng trước (*"very" / "extremely"* khuếch đại, *"slightly"* giảm).
   - **Negation:** đảo dấu nếu có từ phủ định trong 3 từ trước (*"not good"* → âm).
   - **ALL-CAPS:** viết HOA toàn bộ → tăng cường độ (+0.733).
3. **Cộng tất cả valence** → điểm thô (compound raw).
4. **Chuẩn hóa** về [−1, 1] bằng công thức VADER: `x / √(x² + 15)`.

Khác biệt cốt lõi: VADER **đọc được sắc thái mạng xã hội** mà mô hình bag-of-words thường bỏ lỡ — viết hoa, phủ định, từ tăng cường, dấu câu. Trong dự án, từ điển đã được **tinh chỉnh cho crypto** (thêm slang: "HODL", "rug", "moon", "FUD"...).

### 2. Tại sao chọn VADER làm 1 trọng số (40%)
Trong tầng trộn social/news, điểm = **VADER 40% + mô hình tự train 60%**. Lý do giữ VADER bên cạnh mô hình:

| Lý do | Giải thích |
|---|---|
| **Không cần nhãn, chạy ngay (zero-shot)** | VADER hoạt động trên *bất kỳ* câu nào kể cả từ chưa từng thấy lúc train — phủ vùng mà mô hình (giới hạn bởi vocab 4,454) bị "out-of-vocabulary". |
| **Bắt sắc thái ngữ pháp** | Mô hình tuyến tính bag-of-words coi *"not good"* ≈ *"good"*; VADER xử lý phủ định, ALL-CAPS, intensifier — đúng kiểu ngôn ngữ Twitter/StockTwits. |
| **Giải thích được (explainable)** | Trả về `matchedTerms` (từ nào đóng góp bao nhiêu) → minh bạch, hợp tiêu chí "honest evaluation". |
| **Ổn định, làm sàn an toàn (baseline)** | Khi mô hình train sai/thiếu tự tin, VADER kéo điểm về mức hợp lý. Hai cái **bù lỗi cho nhau** → robust hơn dùng riêng. |
| **Trọng số 40% < 60%** | Mô hình train (học từ dữ liệu gán nhãn) vẫn là chính; VADER là lớp phủ ngữ pháp + an toàn, nên nhẹ hơn. |

→ Đây là **ensemble lexicon + ML**: lexicon mạnh ở luật ngôn ngữ, ML mạnh ở pattern học được. Trộn lại đáng tin hơn từng cái đơn lẻ.

### 3. Ứng dụng của VADER trong app
1. **Chấm điểm social-text & news** (Alt-Data Lab "Technique 1") — đầu vào cho composite signal (Câu 1/4).
2. **Re-label dữ liệu train:** dùng VADER độ tin cao để **gán nhãn lại** text StockTwits thật (vứt nhãn nhiễu của người đăng) → tạo tập train (gold-plus-silver, Câu 4).
3. **Fraud Shield:** sentiment VADER là 1 input để bắt "mua lúc tâm lý cực xấu" (contra-FOMO).
4. **AI Advisor / Smart Allocation:** điểm sentiment (gồm VADER) nghiêng tỷ trọng danh mục (Câu 5).
5. **Explainability cho UI:** hiện đúng từ nào kéo điểm lên/xuống trên thẻ phân tích.

**Một câu để trả lời khi bảo vệ:** *VADER là bộ chấm cảm xúc từ-điển-+-luật, không cần train, bắt được phủ định/viết-hoa/từ-tăng-cường mà bag-of-words bỏ lỡ; chọn nó làm baseline 40% để phủ từ lạ, giải thích được và bù lỗi cho mô hình ML 60% — ensemble đáng tin hơn dùng riêng.*
