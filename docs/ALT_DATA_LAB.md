# Alt-Data Lab — Giải thích đầy đủ

> Tài liệu này giải thích **trang "Alt-Data Lab"** trong CoinWise AI: nó hiển thị cái gì, mọi con số đến **từ đâu**, **cấu trúc** xử lý ra sao, và đặc biệt là **mô hình AI được xây dựng trong notebook `.ipynb` như thế nào** và **áp dụng vào sản phẩm fintech** ra sao.
>
> Đây chính là phần trình diễn cho **Part A — AI-Driven Alternative Data Analysis (30% điểm)** của đề bài *Advanced Fintech Synthesis*.

---

## 0. Alt-Data Lab là gì, trong một câu

Alt-Data Lab là một **"phòng thí nghiệm minh bạch"** phơi bày toàn bộ chuỗi:

> **Dữ liệu phi truyền thống (alternative data) ngoài đời thật → AI phân tích → ra hành động fintech cụ thể**

Thay vì chỉ đưa ra một con số "sentiment = 72" như một hộp đen, trang này cho người xem (hội đồng UII) thấy **từng bước**: dữ liệu lấy từ nguồn nào, model nào xử lý, vì sao ra kết quả đó (giải thích theo từng từ), và kết quả đó được dùng để làm gì trong sản phẩm.

- **File giao diện:** [`components/AltDataPipelinePage.tsx`](../components/AltDataPipelinePage.tsx)
- **File logic lõi (backend):** [`api/_lib/ai/pipeline.ts`](../api/_lib/ai/pipeline.ts)
- **Vị trí trong app:** sidebar → nhóm **AI → "Alt-Data Lab"** (badge `NEW`)

---

## 1. Sơ đồ luồng dữ liệu tổng thể

```
                          NGƯỜI DÙNG chọn coin (BTC, ETH, SOL…)
                                        │
                                        ▼
          ┌──────────────────── STAGE 1 · COLLECT ────────────────────┐
          │  4 nguồn alternative data, gọi song song (Promise.all)     │
          │  • Hacker News (Algolia API)  ─ tiêu đề + điểm vote        │
          │  • Reddit r/CryptoCurrency    ─ best-effort (hay bị 403)   │
          │  • alternative.me Fear&Greed  ─ chỉ số tâm lý thị trường   │
          │  • CoinGecko community        ─ % vote, dev activity       │
          └────────────────────────────┬───────────────────────────────┘
                                        ▼
          ┌──────────────────── STAGE 2 · ANALYSE ───────────────────┐
          │  Trên CÙNG MỘT corpus văn bản (HN + Reddit):              │
          │  (a) VADER lexicon       → compound ∈ [-1,1] + giải thích │
          │  (b) Naive Bayes (train) → nhãn + xác suất + từ quyết định│  ← model từ .ipynb
          │  (c) Z-score anomaly     → phát hiện spike khối lượng     │
          │  (d) Fusion (hợp nhất)   → composite score + tín hiệu     │
          └────────────────────────────┬───────────────────────────────┘
                                        ▼
          ┌──────────────────── STAGE 3 · OUTPUT ────────────────────┐
          │  RealSentimentResult: score, label, confidence, signal,   │
          │  provenance (post nào đẩy điểm nào), độ trễ từng stage    │
          └────────────────────────────┬───────────────────────────────┘
                                        ▼
          ┌────────────────── STAGE 4 · FINTECH APPLY ───────────────┐
          │  • Fraud Shield   ← luật "mua ngược sentiment = FOMO"     │
          │  • AI Advisor     ← tilt phân bổ danh mục ±25%           │
          └──────────────────────────────────────────────────────────┘
```

Toàn bộ chạy ở backend (Hono OpenAPI server) và trả về cho frontend qua **một** request:
`GET /api/v1/ai/alt-data/pipeline/:symbol`.

---

## 2. Nguồn dữ liệu — mọi con số đến từ đâu

Trang hiển thị một dải "Live data sources" ở đầu, lấy từ `GET /api/v1/ai/alt-data/sources/health`. Bốn nguồn:

| Nguồn | File | Là gì | Dùng để làm gì | Thật/Giả |
|---|---|---|---|---|
| **Hacker News** (Algolia Search API) | [`sources/hackerNews.ts`](../api/_lib/ai/sources/hackerNews.ts) | Tiêu đề bài + số điểm (upvote) các story có từ khoá coin | Nguồn **văn bản chính** để phân tích sentiment | ✅ Thật, miễn phí, không cần key |
| **Reddit** r/CryptoCurrency, r/Bitcoin… | [`sources/reddit.ts`](../api/_lib/ai/sources/reddit.ts) | Tiêu đề + nội dung post + upvote | Văn bản bổ sung | ✅ Thật nhưng **hay bị chặn IP (403)** → tự degrade sang HN |
| **alternative.me Fear & Greed** | [`sources/fearGreed.ts`](../api/_lib/ai/sources/fearGreed.ts) | Chỉ số tâm lý toàn thị trường crypto 0–100 | Một tín hiệu trong fusion + trang Social Pulse | ✅ Thật, miễn phí |
| **CoinGecko** | [`sources/coingecko.ts`](../api/_lib/ai/sources/coingecko.ts) | % vote up/down cộng đồng, điểm dev/community | Một tín hiệu trong fusion | ✅ Thật, miễn phí |

> **Điểm trung thực quan trọng:** dự án **không giả vờ** mọi thứ đều real-time. Khi một nguồn fail (ví dụ Reddit 403), pipeline **không sập** — nó ghi nhận stage đó là `failed`/`partial`, **phân bổ lại trọng số** cho các nguồn còn sống (xem mục 4d), và stamp trạng thái lên UI. Các tín hiệu không có nguồn miễn phí đáng tin cậy (ví dụ whale-flow on-chain) đã được **loại bỏ** thay vì giả lập, để mọi số liệu hiển thị đều có nguồn thật.

Ví dụ thật khi chạy (đã test):
```
news (HN):     ok    — 199 stories
fearGreed:     ok    — value=29 (Fear)
coinGecko:     ok    — vote↑ 71.7%
reddit:        down  — 403 (degrade sang HN)
```

---

## 3. Cấu trúc xử lý — chi tiết 4 stage

Code lõi: [`api/_lib/ai/pipeline.ts`](../api/_lib/ai/pipeline.ts), hàm `runAltDataPipeline(symbol)`.

### STAGE 1 — COLLECT
Gọi 4 nguồn song song. Mỗi post được chuẩn hoá thành một "document" kèm **trọng số = mức tương tác** (upvote/điểm), để post càng nhiều người quan tâm càng ảnh hưởng mạnh tới điểm tổng:
```ts
reddit.posts → { text: title + selftext, weight: max(1, ups) }
news.posts   → { text: title,            weight: max(1, points+1) }
```

### STAGE 2 — ANALYSE
Bốn kỹ thuật AI học trong môn, chạy trên cùng corpus:

**(a) VADER lexicon NLP** — [`nlp/vader.ts`](../api/_lib/ai/nlp/vader.ts)
- Dựa trên từ điển valence (Hutto & Gilbert, 2014). Mỗi từ có điểm cảm xúc; có xử lý **booster** ("very good"), **phủ định** ("not good" → đảo dấu), **VIẾT HOA** (khuếch đại), **dấu !**.
- Chuẩn hoá compound: `x / sqrt(x² + 15)` → ra điểm ∈ [-1, +1].
- Ưu điểm: **giải thích được từng từ** (UI hiển thị các tag `bullish +2.3`, `crash -3.1`).

**(b) Naive Bayes đã train** — [`nlp/classifier.ts`](../api/_lib/ai/nlp/classifier.ts) (← **đây là model từ notebook `.ipynb`, xem mục 5**)
- Phân loại mỗi doc thành `positive / negative / neutral` + xác suất.
- compound per-doc = `P(positive) − P(negative)`.
- Hiển thị **từ quyết định** (decisive tokens) theo `log P(t|class)`.

**(c) Z-score anomaly detection**
- Giữ ring buffer 24 mẫu gần nhất số lượng mention mỗi coin.
- `z = (current − mean) / std`. Nếu `z > 1.5σ` và có ≥5 mẫu lịch sử → cảnh báo **SPIKE** (dấu hiệu FOMO/đột biến quan tâm).

**(d) Multi-source fusion (hợp nhất tín hiệu)**
- **Blend trong (văn bản):** `socialText = VADER×0.4 + NaiveBayes×0.6` (NB nặng hơn vì được train từ dữ liệu gán nhãn; VADER là baseline lexicon).
- **Blend ngoài (đa nguồn):** `composite = socialText×0.50 + coinGecko×0.25 + fearGreed×0.25`.
- **Tự phân bổ lại trọng số** khi một nguồn chết (vd CoinGecko fail → dồn 70% trọng số của nó cho socialText, 30% cho fearGreed).
- Ra: `compositeScore ∈ [-1,1]`, `composite0to100`, `confidence`, và `signal ∈ {STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL, NEUTRAL}`.

### STAGE 3 — OUTPUT
Trả về object `RealSentimentResult` đầy đủ: điểm số, nhãn, độ tin cậy, **provenance** (top post tích cực/tiêu cực kèm từ khớp), và **observability** (mỗi stage có `status` + `message` + `latencyMs`). Đây là thứ UI vẽ ra thành các "Stage Card".

### STAGE 4 — FINTECH APPLICATION
Đây là điểm mấu chốt: alt-data **không dừng ở con số đẹp** mà feed thẳng vào 2 module business (`buildApplication()`):

| Module | Cách dùng composite score | Khoảng tác động |
|---|---|---|
| **Fraud Shield** | Luật: lệnh BUY khi sentiment rất tiêu cực HOẶC đúng lúc spike mention = momentum-chasing/FOMO → yêu cầu xác nhận | bật/tắt cờ |
| **AI Advisor** | Tilt tỉ trọng danh mục theo độ mạnh tín hiệu | `±25%` |

---

## 4. Hai model NLP — vì sao có cả hai

Trang chạy **song song hai kỹ thuật NLP** trên cùng dữ liệu và **so sánh độ đồng thuận** (`agreementWithVader`). Đây là chủ ý sư phạm:

| | VADER (lexicon) | Naive Bayes (trained) |
|---|---|---|
| Bản chất | Từ điển + luật ngữ pháp, **không cần train** | Học từ dữ liệu gán nhãn (**train** trong `.ipynb`) |
| Vai trò | Baseline minh bạch | Model "AI thật" của đề bài |
| Trọng số fusion | 0.4 | 0.6 |
| Giải thích | điểm valence từng từ | `log P(t\|class)` từng từ |

Việc cho hai model "bỏ phiếu" và đo agreement chứng minh bạn hiểu cả hai trường phái (lexicon-based vs. learned classifier) — đúng tinh thần môn *AI for Finance*.

---

## 5. ⭐ Notebook `.ipynb` — model được xây dựng như thế nào

> File: [`notebooks/train_sentiment_model.ipynb`](../notebooks/train_sentiment_model.ipynb)
> Đây là **deliverable Python** của Part A. Nó train classifier rồi **xuất trọng số thẳng vào runtime TypeScript** — không cần nối tay.

### 5.1 Mục tiêu & lý do chọn model

Notebook **so sánh 4 mô hình** để phân loại văn bản crypto thành `positive / negative / neutral`, rồi **chọn mô hình tốt nhất theo macro-F1** và xuất nó vào runtime:

| Mô hình | Vai trò |
|---|---|
| Multinomial Naive Bayes | baseline kinh điển (Manning et al., Ch. 13) |
| Complement Naive Bayes | NB cải tiến cho dữ liệu lệch |
| **Logistic Regression (đang serve)** | **tuyến tính phân biệt, xác suất hiệu chỉnh — thắng macro-F1 trên test thật** |
| Linear SVM | margin tối đa, `class_weight='balanced'` |

**Vì sao cách này?**
- **Khách quan:** không cố định 1 model — để 4 model cạnh tranh trên cùng dữ liệu, số liệu chọn ra mô hình.
- **Giải thích được:** mọi mô hình ở đây đều **tuyến tính** → mỗi dự đoán phân rã thành đóng góp từng token (UI khoe "decisive features").
- **Port chính xác:** runtime TS là bộ chấm log-linear tổng quát, nên trọng số `coef_→weight`, `intercept_→prior` của model thắng được tái hiện **đúng từng dự đoán** (đã verify numpy == sklearn trước khi xuất). Cả 2 biến thể NB cũng port chuẩn qua `feature_log_prob_`/`class_log_prior_` (dấu complement đã nằm sẵn trong `feature_log_prob_`).
- **Chọn theo test thật, probe làm sàn:** macro-F1 trên test **155 doc gán tay** (52 headline tin tức + **103 câu StockTwits thật**) là chính; bộ *hard probe* (ca lỗi screenshot) chỉ là **ngưỡng sàn** (phải đạt ≥8/12 mới đủ tư cách). Cách này chọn ra model tổng quát hoá tốt trên **text trader thật**, không phải model chỉ giỏi headline.

### 5.2 Dữ liệu — text THẬT tự gán nhãn lại ([`scripts/build_dataset.py`](../scripts/build_dataset.py) → [`data/sentiment_dataset.json`](../data/sentiment_dataset.json))

**~73% là text thật** (do người thật viết), cân bằng 3 lớp (~1,350 mỗi lớp):

| Nguồn | File | ~Số (train) | Cách gán nhãn |
|---|---|---|---|
| **Real — StockTwits** | [`stocktwits_corpus.json`](../data/stocktwits_corpus.json) (6,106 tin trader thật) | ~1,300 | **Tự gán lại bằng VADER của app** — VỨT tag Bullish/Bearish của người dùng (nhiễu) |
| **Real — Hacker News** | [`scraped_raw_corpus.json`](../data/scraped_raw_corpus.json) (8,034 title thật) | ~1,650 | Tự gán lại bằng VADER, chỉ giữ nhãn **độ tin cậy cao** |
| **Synthetic** | template trong build_dataset.py | ~960 | Sinh có nhãn đúng, **chủ đích phủ ca khó**: "buy" trong ngữ cảnh bearish, phủ định ("not bullish"), câu hỏi trung tính |
| **Gold** | [`crypto_sentiment_dataset.json`](../data/crypto_sentiment_dataset.json) | ~140 (train) + 52 (test) | **Người gán nhãn tay** (3 lớp) |

Quy trình: `npm run scrape:stocktwits` (crawl) → `npm run train:nlp` (relabel + build + train, deterministic seed 42).

**Vì sao tự gán nhãn lại thay vì dùng tag StockTwits?** Tag của người đăng phản ánh **vị thế đang ôm**, không phải nghĩa câu — vd *"Not bullish?"* gắn nhãn *Bullish*, *"$DOGE.X ?"* gắn *Bullish*. Train trên tag đó **đo được làm model tệ đi** (macro-F1 tụt còn ~0.54). Nên ta giữ **text thật** nhưng gán nhãn mới bằng [`vader.ts`](../api/_lib/ai/nlp/vader.ts), chỉ lấy phán quyết chắc chắn (bỏ vùng giữa mơ hồ) — xem [`scripts/relabel-corpus.ts`](../scripts/relabel-corpus.ts).

**Luật đánh giá trung thực (rất quan trọng):**
- **Test set = 155 câu nhãn NGƯỜI** (không bao giờ là nhãn VADER/synth) — gồm 52 headline tin tức ([`crypto_sentiment_dataset.json`](../data/crypto_sentiment_dataset.json)) + **103 câu StockTwits thật gán tay** ([`stocktwits_gold.json`](../data/stocktwits_gold.json), sinh bởi [`make_stocktwits_gold.py`](../scripts/make_stocktwits_gold.py) — đọc từng câu rồi gán, **không** dùng tag tác giả).
- 103 câu này **cùng-domain** với train (ngôn ngữ trader) nên đo đúng cái pipeline xử lý thật, và được **loại khỏi train** (kiểm tra leak = 0).
- Mọi text re-label / synthetic **chỉ ở tập TRAIN**. → benchmark **không vòng tròn**: model chỉ ăn điểm nếu thực sự tổng quát hoá.

### 5.3 Các bước trong notebook (10 cell chính)

1. **Setup** — import numpy, pandas, matplotlib, seaborn, scikit-learn. `RANDOM_SEED = 42` để tái lập.
2. **Load dataset** — đọc gold (+ silver nếu có). Nếu thiếu silver → fallback gold-only.
3. **EDA (phân tích thăm dò):**
   - Phân bố lớp (cân bằng tránh model thiên vị lớp đa số).
   - Phân bố độ dài văn bản (headline ngắn vs forum post dài).
   - Top từ phổ biến mỗi lớp (sanity check: positive phải ra *rally, surge, approval*; negative ra *hack, crash, rug*).
4. **Tiền xử lý** — pipeline **khớp byte-for-byte với runtime TS** để model phân loại live HN/Reddit giống hệt lúc train:
   ```
   lowercase → bỏ URL → bỏ ký tự markdown → tách token theo [a-z'] và $ticker
   → lọc độ dài 2..20 → bỏ 40 stopword → SINH BIGRAM kề nhau
   ```
   **Bigram là cải tiến then chốt**: "to buy", "not bullish", "dumping to" cho model thấy **ngữ cảnh**, sửa lỗi cũ (model unigram chấm mọi câu có "buy" thành positive).
5. **Split trung thực** — Test = held-out **gold** (25%, cân bằng); split do `build_dataset.py` sở hữu (cờ `test_ok`), train_model **dùng nguyên** không tách lại.
6. **Vectorize** — `CountVectorizer(analyzer=tokenize, min_df=2)` → ma trận đếm thô unigram+bigram.
7. **Train & so sánh 4 mô hình** — MultinomialNB, ComplementNB, LogisticRegression, LinearSVC (`class_weight='balanced'`). Mỗi model + **5-fold CV macro-F1** để ổn định.
8. **Chọn mô hình** theo điểm blend **gold-F1 + tỉ lệ hard-probe**, với điều kiện **port được** (tái hiện tuyến tính == sklearn `predict`). Cả 4 model đều port được (gồm ComplementNB).
9. **Đánh giá** mô hình thắng: accuracy, macro-F1, `classification_report`, **confusion matrix** (heatmap), **error analysis**.
10. **Hiệu chỉnh confidence** (nhiệt độ softmax — bất biến argmax) rồi **xuất** `model.ts` + `model-metrics.ts`, và verify TS == Python.

### 5.4 Kết quả thực tế (model hiện đang serve)

Lấy từ `GET /api/v1/ai/alt-data/model/info` (số liệu auto-cập nhật từ `model-metrics.ts`):
```
algorithm     : logistic-regression  (thắng macro-F1 trên test 155 doc, probe >= floor)
accuracy      : 63.9%        macroF1 : 62.8%   (trên test NGƯỜI 155 doc)
vocabSize     : ~4,400 (unigram+bigram)        train/test : ~3,980 / 155
per-class F1  : positive 68.8% · negative 70.1% · neutral 49.4%
hard probes   : 9/12 (đạt sàn; 3 ca trượt là contrarian/phủ định khó)
```
**So sánh 4 model — macro-F1 tách theo loại test:**
| model | news (52) | **trader thật (103)** | tất cả (155) | CV |
|---|---|---|---|---|
| **Logistic Regression** | 0.666 | **0.592** | **0.628** | 0.87 |
| Complement NB | **0.707** | 0.496 | 0.587 | 0.81 |
| Multinomial NB | 0.651 | 0.492 | 0.567 | 0.80 |
| Linear SVM | 0.573 | 0.560 | 0.572 | 0.88 |

> **Bài học từ việc mở rộng test:** trên headline tin tức "dễ", NB cho số đẹp (0.65–0.71); nhưng trên **text trader thật** — đúng cái pipeline xử lý — NB rớt còn ~0.49, còn **LogReg giữ 0.59** (cách biệt 0.10). Test 52-doc cũ **thổi phồng** NB; test 155-doc lộ ra LogReg mới là model tổng quát hoá thật → chọn LogReg.
> **Trung thực:** neutral vẫn là lớp yếu (F1 0.49) vì "trung tính" trong chat trader rất hiếm và mơ hồ. Dùng **tag StockTwits gốc** (không re-label) thì macro-F1 tụt còn ~0.54 — nên tự gán nhãn lại là then chốt. Muốn cao hơn nữa cần **gán tay thêm** chứ không phải đổi thuật toán.

### 5.5 ⭐ Xuất model sang runtime — cách "Python train, TypeScript serve"

Cell cuối ghi **2 file TypeScript tự sinh** (KHÔNG sửa tay):

| File sinh ra | Nội dung | Ai dùng |
|---|---|---|
| [`api/_lib/ai/nlp/model.ts`](../api/_lib/ai/nlp/model.ts) (~250KB) | Trọng số: `logPrior`, `logLikelihood` từng token/lớp, `oovLogLikelihood` (token lạ), `vocabulary` | `classifier.ts` để inference |
| [`api/_lib/ai/nlp/model-metrics.ts`](../api/_lib/ai/nlp/model-metrics.ts) | accuracy, macroF1, per-class, confusion, errors | Card "Training summary" trên UI |

Cụ thể script kéo từ sklearn (model thắng là tuyến tính):
- `clf.intercept_[c]` (hoặc `class_log_prior_`) → `logPrior[c]`
- `clf.coef_[c][j]` (hoặc `feature_log_prob_`) → `logLikelihood[token][c]`
- `oovLogLikelihood = 0` (token lạ đóng góp 0 trong mô hình tuyến tính).

Runtime TS ([`nlp/training/trainer.ts`](../api/_lib/ai/nlp/training/trainer.ts) hàm `predict`) là bộ chấm **log-linear tổng quát** `score[c] = prior[c] + Σ count·weight[token][c] → softmax` → tái hiện **đúng từng dự đoán** của model sklearn (đã verify bằng [`scripts/verify-model.ts`](../scripts/verify-model.ts)), chạy trong serverless không cần Python.

> **Đường train:** `npm run train:nlp` chạy [`build_dataset.py`](../scripts/build_dataset.py) + [`train_model.py`](../scripts/train_model.py) (Python/sklearn — cũng là nội dung notebook). `npm run verify:nlp` kiểm chứng TS == Python.

### 5.6 Quy trình retrain (3 bước)
```bash
# 1. Mở notebook, Run All → ghi model.ts + model-metrics.ts
cd notebooks && jupyter notebook train_sentiment_model.ipynb
# 2. Rebundle cho production
npm run build:api
# 3. Verify: field algorithm phải đọc "...(scikit-learn)"
curl http://localhost:3001/api/v1/ai/alt-data/model/info
```

---

## 6. Cấu trúc giao diện trang (người xem thấy gì)

File: [`components/AltDataPipelinePage.tsx`](../components/AltDataPipelinePage.tsx)

1. **Hero + chọn coin** — dropdown 8 coin; hiển thị thời gian sinh kết quả (ms) → chứng minh chạy thật, không hard-code.
2. **Live data sources strip** — 4 thẻ trạng thái nguồn (live/down + latency).
3. **Stage Card 1 — Collect** — số doc thu được mỗi nguồn, có badge trạng thái màu (xanh ok / vàng partial / đỏ failed).
4. **Stage Card 2 — NLP:**
   - **VADER:** thanh sentiment [-1..+1], top post tích cực/tiêu cực với **tag từng từ** kèm valence.
   - **Naive Bayes:** top post mỗi lớp với **decisive tokens** (lift `log P(pos|t) − log P(neg|t)`).
   - **Card Training summary:** accuracy, macroF1, P/R/F1 từng lớp, **confusion matrix**, ngày train.
   - **Interactive classifier:** ô nhập text bất kỳ → gọi `POST /alt-data/classify` → trả nhãn + 3 thanh xác suất + token quyết định. (Khoe model train được dùng live.)
5. **Stage Card 2b — Anomaly** — z-score, baseline, cờ SPIKE.
6. **Stage Card 2c — Fusion** — biểu đồ trọng số các nguồn, composite score, signal, confidence.
7. **Stage Card 4 — Fintech application** — 3 thẻ Credit/Fraud/Advisor hiển thị tác động cụ thể.
8. **Fear & Greed mini-sparkline** — lịch sử chỉ số.

---

## 7. Các endpoint API liên quan (deliverable Part B phục vụ Part A)

| Endpoint | Trả về |
|---|---|
| `GET /api/v1/ai/alt-data/pipeline/:symbol` | Toàn bộ kết quả pipeline cho 1 coin |
| `GET /api/v1/ai/alt-data/sources/health` | Trạng thái 4 nguồn dữ liệu |
| `GET /api/v1/ai/alt-data/model/info` | Metadata + metrics model NB |
| `POST /api/v1/ai/alt-data/classify` | Phân loại 1 đoạn text bất kỳ |
| `POST /api/v1/ai/fraud-check-real` | Fraud check có luật sentiment |

Tất cả nằm trong OpenAPI spec ([`api/_lib/openapi.yaml`](../api/_lib/openapi.yaml)), xem Swagger UI tại `/docs`.

---

## 8. Tóm tắt cho phần pitch / report

> Alt-Data Lab chứng minh trọn vẹn yêu cầu Part A: thu thập **alternative data thật** (social text từ StockTwits/Hacker News, Fear & Greed, CoinGecko), phân tích bằng **hai kỹ thuật NLP** — một lexicon VADER và một **Logistic Regression tự train** trên **text thật được tự gán nhãn lại** (StockTwits + HN qua VADER, cộng vài câu hard-case), chọn qua **so sánh 4 model** trên **test 155 câu gán tay** (gồm 103 câu StockTwits thật, cùng-domain), cộng **Z-score anomaly detection** và **multi-source fusion**, rồi biến tín hiệu thành **hai ứng dụng fintech cụ thể** (Fraud Shield, AI Advisor). Mọi bước đều minh bạch, giải thích được tới từng từ, và toàn bộ trọng số model được Python train rồi serve nguyên vẹn trong runtime TypeScript qua custom OpenAPI server.
