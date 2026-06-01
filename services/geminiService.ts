/**
 * Gemini agentic chat service.
 *
 * Uses Gemini function-calling so the chatbot doesn't merely talk — it
 * dispatches tools that hit the CoinWise OpenAPI server to fetch balances,
 * AI credit score, sentiment, fear & greed, or quote trades.
 *
 * The frontend then renders structured tool results in the chat thread.
 */
import { GoogleGenAI, Type } from '@google/genai';
import type { FunctionDeclaration } from '@google/genai';
import { UserState, MarketData } from '../types';
import { apiAgentExecute } from './coinwiseApi';
import { getCommunityPulse } from './community';

const TOOLS: FunctionDeclaration[] = [
  {
    name: 'getBalance',
    description: 'Get the user current cash balance and asset holdings in both USD and VND.',
    parameters: { type: Type.OBJECT, properties: {}, required: [] },
  },
  {
    name: 'getCreditScore',
    description: 'Get the user AI Credit Score (0-1000) computed from alternative data (mobile usage, utility bills, trading footprint, deposit cadence).',
    parameters: { type: Type.OBJECT, properties: {}, required: [] },
  },
  {
    name: 'getSentiment',
    description: 'Get AI-derived social-media sentiment for a crypto asset.',
    parameters: {
      type: Type.OBJECT,
      properties: { symbol: { type: Type.STRING, description: 'Trading pair like BTCUSDT, ETHUSDT.' } },
      required: ['symbol'],
    },
  },
  {
    name: 'getInsight',
    description: 'Get composite AI insight for a coin combining sentiment, on-chain whale flow and fear & greed.',
    parameters: {
      type: Type.OBJECT,
      properties: { symbol: { type: Type.STRING } },
      required: ['symbol'],
    },
  },
  {
    name: 'getFearGreed',
    description: 'Get the current Crypto Fear & Greed market mood index (0-100).',
    parameters: { type: Type.OBJECT, properties: {}, required: [] },
  },
  {
    name: 'getCommunityPulse',
    description: 'Get the CoinWise community sentiment for a coin — aggregated from real user comments scored by the trained NLP model over the last 24h. Returns a 0-100 mood score, bullish/bearish/neutral share, trend, and number of posts. Call this when the user asks what the community thinks, crowd sentiment, or to blend social mood with alt-data before advising.',
    parameters: {
      type: Type.OBJECT,
      properties: { symbol: { type: Type.STRING, description: 'Trading pair like BTCUSDT, ETHUSDT. Omit for the whole community (all coins).' } },
      required: [],
    },
  },
  {
    name: 'getAdvisor',
    description: 'Generate an AI portfolio allocation recommendation tailored to the user risk profile.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        riskProfile: { type: Type.STRING, description: 'CONSERVATIVE | BALANCED | GROWTH | AGGRESSIVE' },
      },
      required: [],
    },
  },
  {
    name: 'convertCurrency',
    description: 'Convert an amount between currencies (supports USD and VND first-class).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER },
        from: { type: Type.STRING, description: 'e.g. USD' },
        to: { type: Type.STRING, description: 'e.g. VND' },
      },
      required: ['amount', 'from', 'to'],
    },
  },
  {
    name: 'placeTrade',
    description: 'Quote a paper trade. The frontend will surface a confirm dialog before executing. Always quote first, never auto-execute. CRITICAL: the symbol MUST match exactly what the user said in their LATEST message — do not infer from chat history or other coins they own.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        side: { type: Type.STRING, description: 'BUY or SELL' },
        symbol: { type: Type.STRING, description: 'Trading pair like BTCUSDT, ETHUSDT — derived from the user latest message only' },
        amountUsd: { type: Type.NUMBER, description: 'USD notional. Omit when sellAll, buyAllCash, sellPercent, or buyPercent is set.' },
        amountVnd: { type: Type.NUMBER, description: 'VND notional. Omit when sellAll, buyAllCash, sellPercent, or buyPercent is set.' },
        sellAll: { type: Type.BOOLEAN, description: 'Set true when the user says "sell all / liquidate / close position". Backend will compute the notional from the user current position.' },
        buyAllCash: { type: Type.BOOLEAN, description: 'Set true when the user says "buy all / use all my cash / all-in / spend all cash". Backend will spend the user entire cash balance (minus fee).' },
        sellPercent: { type: Type.NUMBER, description: 'For SELL only. Percentage of the current position to sell, 0-100. Use when the user says "sell 50% of BTC / sell half my ETH / sell 25 percent of my SOL".' },
        buyPercent: { type: Type.NUMBER, description: 'For BUY only. Percentage of cash to spend, 0-100. Use when the user says "buy 30% BTC / use 50% of my cash to buy ETH".' },
      },
      required: ['side', 'symbol'],
    },
  },
];

export interface AgentToolCall {
  name: string;
  args: Record<string, any>;
  result: any;
}

export interface AgentResponse {
  text: string;
  toolCalls: AgentToolCall[];
  pendingAction?: {
    type: 'placeTrade';
    payload: any;
  };
}

export const getGeminiAgentResponse = async (
  prompt: string,
  userState: UserState,
  marketData: MarketData[],
  history: { role: 'user' | 'model'; text: string }[] = [],
): Promise<AgentResponse> => {
  const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return {
      text: '⚠️ Gemini API key is missing. Set GEMINI_API_KEY in .env.local and restart.',
      toolCalls: [],
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
You are the CoinWise AI Agent — an *agentic* financial assistant for a paper-trading + AI fintech platform.

Current user profile:
- Name: ${userState.name}
- Account ID: ${userState.accountId}
- Tier: ${userState.tier || 'STARTER'}
- Current balance: $${(userState.balance || 0).toLocaleString()} USDT

You have function-calling tools that hit the CoinWise OpenAPI server (internal backend). Always call a tool when the user asks for numbers, balance, signals, sentiment, credit score, or wants to trade. NEVER make up numbers.

**LANGUAGE RULES (MANDATORY):**
- Always reply in **English**.
- Be friendly, concise, and easy to understand.
- Money formatting: USD like "$1,234.56" and VND like "5,000,000 ₫".

**TRADING RULES (VERY IMPORTANT):**
1. When the user says "buy / sell" — ALWAYS call placeTrade first to GET A QUOTE. NEVER pretend it was executed. Tell the user to press "Confirm" in the confirmation card to complete it.
2. **The symbol MUST come from the user's latest message**, do NOT infer it from chat history or from the coin the user holds. "sell ETH" → symbol="ETHUSDT". "buy BTC" → symbol="BTCUSDT". Never switch to a different coin.
3. **"sell all / liquidate / close position"** → pass \`sellAll: true\` to placeTrade, no amountUsd/amountVnd needed. The backend computes it from the user's current position.
4. **"buy all / all-in / use all my cash / spend my remaining cash"** → pass \`buyAllCash: true\`, no amountUsd/amountVnd needed. The backend uses all cash (minus the 0.1% fee).
5. **"sell X% / sell half / sell 50 percent"** → pass \`sellPercent: 50\` (0-100). **"buy with X% cash / use 30% to buy"** → pass \`buyPercent: 30\`. "sell half" = 50, "sell a third" = 33.33, "buy 1/4 with cash" = 25.
6. A specific VND amount (e.g. "buy 5 million of BTC"): pass \`amountVnd: 5000000\`. A specific USD amount: pass \`amountUsd\`.
7. After a successful placeTrade quote, summarize:
   - Side + symbol + coin amount
   - USD/VND equivalent
   - Risk verdict
   - Remind the user to press "Confirm" or "Cancel".
8. If fraudCheck.verdict === BLOCK → decline and explain why.
9. If the user just traded and then asks about their balance — call getBalance for the latest number.

**COMMUNITY PULSE:**
- When the user asks "what does the community think", crowd sentiment, or for advice on a coin → call getCommunityPulse for the community mood (0-100 score + bullish/bearish share).
- To judge the "market state" for good advice: COMBINE getCommunityPulse with getInsight (sentiment + whale flow + Fear & Greed). If the crowd is bullish BUT whale flow is negative or F&G is in Extreme Greed → WARN about FOMO risk; don't just follow the crowd.
- If pulse.total = 0 (no comments yet), say there isn't enough community data and rely on alt-data instead.

**GENERAL RULES:**
- Always remind the user this is a simulated paper-trading platform, not financial advice.
- Keep replies short (max 3-4 sentences or a short bullet list). No rambling.

Market snapshot (for reference):
${marketData.slice(0, 8).map(m => `- ${m.symbol}: $${m.price.toLocaleString()} (${m.change24h.toFixed(2)}%)`).join('\n')}
`;

  const contents = [
    ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: 'user' as const, parts: [{ text: prompt }] },
  ];

  const toolCalls: AgentToolCall[] = [];
  let pendingAction: AgentResponse['pendingAction'];

  const MODEL = 'gemini-3.1-flash-lite';

  try {
    let response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
        tools: [{ functionDeclarations: TOOLS }],
      },
    });

    // Firebase is the source of truth. Pass a snapshot so the backend's
    // in-memory account (which resets on Vercel cold start) reflects what the
    // user actually owns before any tool runs (getBalance, placeTrade, etc.).
    const accountSnapshot = {
      cashUsd: Number.isFinite(userState.balance) ? userState.balance : 0,
      positions: (Array.isArray(userState.assets) ? userState.assets : [])
        .filter((a: any) => a && typeof a.symbol === 'string' && Number.isFinite(a.amount) && a.amount > 0)
        .map((a: any) => ({ symbol: a.symbol, amount: a.amount })),
    };

    for (let hop = 0; hop < 2; hop++) {
      const calls = response.functionCalls || [];
      if (!calls.length) break;

      const responseParts: any[] = [];
      for (const call of calls) {
        const name = call.name as string;
        const args = (call.args || {}) as Record<string, any>;
        // Binance is geo-blocked from Vercel functions — inject the live price
        // we already have on the client so the backend can quote the trade.
        if (name === 'placeTrade') {
          const sym = String(args.symbol || '').toUpperCase();
          const live = marketData.find((m) => m?.symbol === sym);
          if (live && Number.isFinite(live.price) && live.price > 0) {
            args.priceHint = live.price;
          }
        }
        let toolResult: any;
        try {
          if (name === 'getCommunityPulse') {
            // Community data lives in Realtime DB (client-side), not the backend,
            // so resolve this tool here instead of hitting /agent/execute.
            const sym = args.symbol ? String(args.symbol).toUpperCase() : undefined;
            toolResult = await getCommunityPulse(sym);
          } else {
            toolResult = await apiAgentExecute(userState.accountId, name, args, accountSnapshot);
          }
        } catch (err) {
          toolResult = { error: (err as Error).message };
        }
        toolCalls.push({ name, args, result: toolResult });
        if (name === 'placeTrade' && toolResult?.requiresUserConfirm) {
          pendingAction = { type: 'placeTrade', payload: toolResult };
        }
        responseParts.push({
          functionResponse: { name, response: toolResult },
        });
      }

      // Gemini 3.x "thinking" models attach a thought_signature to each
      // functionCall part that MUST be echoed back unchanged to keep the
      // model's reasoning state aligned — stripping it (or rebuilding the
      // model turn from scratch via calls.map(...)) yields a 400
      // INVALID_ARGUMENT "Function call is missing a thought_signature".
      // So pass the original model content through verbatim.
      const modelContent = (response as any).candidates?.[0]?.content
        ?? { role: 'model', parts: calls.map((c) => ({ functionCall: c })) };

      const grounded = await ai.models.generateContent({
        model: MODEL,
        contents: [
          ...contents,
          modelContent,
          { role: 'user', parts: responseParts },
        ],
        config: {
          systemInstruction,
          temperature: 0.4,
          tools: [{ functionDeclarations: TOOLS }],
        },
      });
      response = grounded;
    }

    return {
      text: response.text || '(No response)',
      toolCalls,
      pendingAction,
    };
  } catch (error) {
    console.error('Gemini agent error:', error);
    const msg = String((error as any)?.message || error);
    const status = (error as any)?.status ?? (error as any)?.error?.code;

    if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(msg)) {
      const retryMatch = msg.match(/"retryDelay"\s*:\s*"(\d+)s"/);
      const wait = retryMatch ? `~${retryMatch[1]}s` : '~1 min';
      return {
        text: `⏳ Gemini free-tier quota reached (15 req/min). Wait ${wait} and try again — or use the side-panel tools directly (Sentiment / Credit Score / Advisor).`,
        toolCalls,
      };
    }
    if (status === 401 || status === 403 || /API key/i.test(msg)) {
      return {
        text: '🔑 Invalid Gemini API key. Check GEMINI_API_KEY in your Vercel Environment Variables.',
        toolCalls,
      };
    }
    return {
      text: 'I hit an error calling Gemini. Please try again later — or use the side-panel tools.',
      toolCalls,
    };
  }
};

// Backward-compatibility shim for older import name.
export const getGeminiResponse = async (
  prompt: string,
  userState: UserState,
  marketData: MarketData[],
): Promise<string> => {
  const r = await getGeminiAgentResponse(prompt, userState, marketData);
  return r.text;
};
