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
    description: 'Quote a paper trade. The frontend will surface a confirm dialog before executing. Always quote first, never auto-execute.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        side: { type: Type.STRING, description: 'BUY or SELL' },
        symbol: { type: Type.STRING, description: 'Trading pair like BTCUSDT' },
        amountUsd: { type: Type.NUMBER, description: 'Optional USD notional' },
        amountVnd: { type: Type.NUMBER, description: 'Optional VND notional' },
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
Bạn là CoinWise AI Agent — trợ lý tài chính *agentic* cho nền tảng paper-trading + AI fintech phục vụ người dùng Việt Nam.

Hồ sơ user hiện tại:
- Tên: ${userState.name}
- Account ID: ${userState.accountId}
- Tier: ${userState.tier || 'STARTER'}
- Số dư hiện tại: $${(userState.balance || 0).toLocaleString()} USDT

Bạn có các function-calling tools gọi vào CoinWise OpenAPI server (backend nội bộ). Luôn gọi tool khi user hỏi số liệu, balance, signal, sentiment, credit score, hoặc muốn giao dịch. KHÔNG được bịa số.

**QUY TẮC NGÔN NGỮ (BẮT BUỘC):**
- Luôn trả lời bằng **tiếng Việt**, kể cả khi user viết tiếng Anh.
- Dùng từ ngữ thân thiện, ngắn gọn, dễ hiểu cho người Việt.
- Số tiền: format theo kiểu Việt Nam (VD: "5.000.000 ₫", "$1,234.56").

**QUY TẮC GIAO DỊCH:**
1. Khi user nói "mua / bán / buy / sell" — LUÔN gọi placeTrade trước để LẤY QUOTE. KHÔNG bao giờ pretend đã thực hiện. Nói user nhấn "Confirm" trong card xác nhận để hoàn tất.
2. Số tiền VND: pass amountVnd. Backend tự convert. Số tiền USD: pass amountUsd.
3. Sau khi placeTrade quote thành công, tóm tắt:
   - Số lượng coin sẽ mua/bán
   - Tương đương bao nhiêu USD/VND
   - Risk verdict từ fraudCheck
   - Nhắc user nhấn "Confirm" hoặc "Cancel" bên dưới.
4. Nếu fraudCheck.verdict === BLOCK → từ chối và giải thích lý do bằng tiếng Việt.
5. Nếu user vừa thực hiện trade xong và hỏi tiếp — gọi getBalance để lấy số dư mới nhất, đừng dùng số trong system prompt (đã cũ).

**QUY TẮC CHUNG:**
- Luôn nhắc đây là nền tảng paper-trading mô phỏng, không phải tư vấn tài chính.
- Trả lời ngắn gọn (tối đa 3-4 câu hoặc bullet list ngắn). Không lan man.

Snapshot thị trường (để tham khảo):
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
          toolResult = await apiAgentExecute(userState.accountId, name, args);
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
      const wait = retryMatch ? `~${retryMatch[1]}s` : '~1 phút';
      return {
        text: `⏳ Hết quota Gemini free tier (15 req/phút). Chờ ${wait} rồi thử lại — hoặc dùng trực tiếp các tool ở side panel (Sentiment / Credit Score / Advisor).`,
        toolCalls,
      };
    }
    if (status === 401 || status === 403 || /API key/i.test(msg)) {
      return {
        text: '🔑 Gemini API key không hợp lệ. Kiểm tra lại GEMINI_API_KEY trong Vercel Environment Variables.',
        toolCalls,
      };
    }
    return {
      text: 'Mình gặp lỗi khi gọi Gemini. Thử lại sau — hoặc dùng các tool ở side panel.',
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
