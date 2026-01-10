# CoinWise - Crypto Paper Trading Platform

A modern crypto paper trading platform with AI-powered chatbot assistance.

## 🚀 Live Demo

[Visit CoinWise](https://your-app.vercel.app) *(Update after deployment)*

## ✨ Features

- 📊 Real-time crypto price tracking (Binance API)
- 💹 Paper trading with BTC, ETH, BNB, SOL, XRP
- 🏆 Global competition arena
- 🤖 AI chatbot powered by Google Gemini
- 💳 Stripe payment integration (test mode)
- 📈 Portfolio analytics with pie chart
- 📜 Transaction history tracking

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** TailwindCSS
- **APIs:** Binance, Stripe, Google Gemini
- **Auth:** Firebase Authentication
- **Database:** Firestore
- **Deployment:** Vercel

## 🔧 Local Development

1. Clone the repository:
```bash
git clone https://github.com/your-username/coinwise.git
cd coinwise
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
Get your API key from: https://aistudio.google.com/app/apikey

4. Run development server:
```bash
npm run dev
```

## 🌐 Deployment

### Deploy to Vercel:

1. Push code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variable:
   - `VITE_GEMINI_API_KEY` = your Gemini API key
4. Deploy!

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key for chatbot | Yes |

## 🤖 AI Chatbot

The AI assistant can:
- Answer questions about your balance and holdings
- Explain crypto trading concepts
- Provide guidance on using the platform
- Give market insights based on real-time data

## 📄 License

MIT License

## 👨‍💻 Author

Your Name
