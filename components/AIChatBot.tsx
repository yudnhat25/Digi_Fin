import React, { useState, useRef, useEffect } from 'react';
import { UserState, MarketData } from '../types';
import { getGeminiAgentResponse, AgentToolCall } from '../services/geminiService';
import { apiTrade } from '../services/coinwiseApi';
import { useCurrency } from '../services/currency';

interface AIChatBotProps {
  userState: UserState;
  marketData: MarketData[];
  onTradeExecuted?: (info: { symbol: string; side: 'BUY' | 'SELL'; amountUsd: number; price: number }) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  toolCalls?: AgentToolCall[];
  pendingTrade?: any;
  awaitingConfirm?: boolean;
}

const QUICK_PROMPTS = [
  'Show my balance in VND',
  'Điểm tín dụng của tôi là bao nhiêu?',
  'Sentiment cho BTC và ETH?',
  'Đề xuất danh mục rủi ro thấp',
  'Mua giúp tôi 5 triệu VND BTC',
];

const ToolBadge: React.FC<{ name: string }> = ({ name }) => (
  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 px-1.5 py-0.5 rounded">
    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a1 1 0 011-1h8a1 1 0 011 1v4l-3 3 3 3v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4l3-3-3-3V4z" /></svg>
    {name}
  </span>
);

const ToolCallRow: React.FC<{ call: AgentToolCall }> = ({ call }) => {
  return (
    <details className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-[10px] mt-2 group">
      <summary className="cursor-pointer flex items-center gap-2 text-slate-300 font-bold">
        <ToolBadge name={call.name} />
        <span className="text-slate-500 group-open:hidden">tap to see payload</span>
        <span className="text-slate-500 hidden group-open:inline">close</span>
      </summary>
      <pre className="mt-2 text-[10px] text-slate-400 overflow-x-auto max-h-40">
        {JSON.stringify(call.result, null, 2)}
      </pre>
    </details>
  );
};

const AIChatBot: React.FC<AIChatBotProps> = ({ userState, marketData, onTradeExecuted }) => {
  const { format, currency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      content:
        `Xin chào ${userState.name.split(' ')[0]}! I'm the CoinWise agentic AI. ` +
        `I can fetch your AI credit score, social sentiment, fear & greed, advise allocations, ` +
        `or place trades for you via the custom OpenAPI server. Try one of the quick prompts below 👇`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: Math.random().toString(36).slice(2), role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'ai')
      .slice(-8)
      .map((m) => ({ role: (m.role === 'ai' ? 'model' : 'user') as 'user' | 'model', text: m.content }));

    const resp = await getGeminiAgentResponse(text.trim(), userState, marketData, history);
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        role: 'ai',
        content: resp.text,
        toolCalls: resp.toolCalls,
        pendingTrade: resp.pendingAction?.type === 'placeTrade' ? resp.pendingAction.payload : undefined,
        awaitingConfirm: resp.pendingAction?.type === 'placeTrade',
      },
    ]);
    setIsLoading(false);
  };

  const confirmTrade = async (msgId: string, pending: any) => {
    if (executing) return;
    setExecuting(true);
    try {
      const res: any = await apiTrade(userState.accountId, {
        side: pending.side,
        symbol: pending.symbol,
        amountUsd: pending.amountUsd,
      });
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, awaitingConfirm: false } : m));
      const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
      const execAmount = num(res?.executedAmount);
      const execPrice = num(res?.executedPriceUsd);
      const newBal = num(res?.newBalanceUsd);
      const reasons = Array.isArray(res?.fraudCheck?.reasons) ? res.fraudCheck.reasons : [];
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          role: 'system',
          content: res?.ok
            ? `✅ Trade executed via OpenAPI server — ${String(res.side || pending.side)} ${execAmount.toFixed(6)} ${String(res.symbol || pending.symbol).replace('USDT', '')} @ $${execPrice.toFixed(2)}. New cash balance: ${format(newBal)}.`
            : `🚫 Trade blocked by fraud shield: ${reasons.join(' · ') || 'unknown reason'}`,
        },
      ]);
      if (res?.ok && execPrice > 0) {
        onTradeExecuted?.({
          symbol: String(res.symbol || pending.symbol),
          side: (res.side || pending.side) as 'BUY' | 'SELL',
          amountUsd: num(pending.amountUsd),
          price: execPrice,
        });
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: Math.random().toString(36).slice(2), role: 'system', content: `Execution failed: ${(e as Error).message}` },
      ]);
    } finally {
      setExecuting(false);
    }
  };

  const cancelTrade = (msgId: string) => {
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, awaitingConfirm: false } : m));
    setMessages((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), role: 'system', content: 'Trade cancelled. Nothing was executed.' },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-fuchsia-500 text-slate-900 rounded-full shadow-2xl shadow-fuchsia-500/40 flex items-center justify-center hover:scale-110 transition-all active:scale-95"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <div className="relative">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[360px] md:w-[420px] h-[640px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 bg-gradient-to-br from-fuchsia-500/20 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 bg-fuchsia-500 rounded-lg flex items-center justify-center font-black text-slate-950 text-xs">AI</div>
            <div className="flex-1">
              <h5 className="font-black text-sm">CoinWise Agentic AI</h5>
              <p className="text-[10px] text-fuchsia-300 font-bold">Function-calling · Gemini · OpenAPI</p>
            </div>
            <span className="text-[9px] font-black text-fuchsia-300 bg-fuchsia-500/10 px-2 py-1 rounded uppercase tracking-widest">
              {currency}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : m.role === 'system'
                      ? 'bg-slate-950 border border-slate-700 text-slate-300 italic text-xs'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                  }`}
                >
                  {m.content}
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-fuchsia-300">Tools used</p>
                      {m.toolCalls.map((c, i) => <ToolCallRow key={i} call={c} />)}
                    </div>
                  )}
                  {m.awaitingConfirm && m.pendingTrade && (() => {
                    const pt = m.pendingTrade;
                    const n = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
                    const side = String(pt.side || 'BUY');
                    const symbol = String(pt.symbol || '');
                    const base = symbol.replace('USDT', '');
                    const baseAmount = n(pt.baseAmount);
                    const amountUsd = n(pt.amountUsd);
                    const amountVnd = n(pt.amountVnd);
                    const priceUsd = n(pt.priceUsd);
                    const verdict = pt.fraudCheck?.verdict || 'REVIEW';
                    const risk = n(pt.fraudCheck?.riskScore);
                    const canConfirm = priceUsd > 0 && baseAmount > 0 && verdict !== 'BLOCK';
                    return (
                      <div className="mt-3 bg-slate-950 border border-amber-500/30 rounded-xl p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-300 mb-2">⚠️ Confirm trade</p>
                        <p className="text-xs text-slate-200 mb-1">
                          {side} <b>{baseAmount.toFixed(6)} {base}</b>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          ≈ ${amountUsd.toFixed(2)} / {amountVnd.toLocaleString('vi-VN')} ₫ @ ${priceUsd.toFixed(2)}
                        </p>
                        <p className={`text-[10px] mt-1 font-black ${verdict === 'SAFE' ? 'text-emerald-400' : verdict === 'REVIEW' ? 'text-amber-400' : 'text-rose-400'}`}>
                          Risk: {verdict} ({(risk * 100).toFixed(0)}%)
                        </p>
                        {priceUsd <= 0 && (
                          <p className="text-[10px] text-rose-400 mt-1">⚠️ Price unavailable — quote may be stale. Try again.</p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button
                            disabled={executing || !canConfirm}
                            onClick={() => confirmTrade(m.id, pt)}
                            className="flex-1 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg disabled:opacity-40"
                          >
                            {executing ? 'Executing…' : 'Confirm'}
                          </button>
                          <button
                            disabled={executing}
                            onClick={() => cancelTrade(m.id)}
                            className="flex-1 bg-slate-800 text-slate-300 font-black text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-200 p-3 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="text-[10px] font-bold whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-lg transition"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-slate-800 bg-slate-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send(input)}
                placeholder="Ask anything — ‘mua 5 triệu VND BTC’, ‘credit score’…"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
              <button
                onClick={() => send(input)}
                disabled={isLoading}
                className="bg-fuchsia-500 text-slate-950 p-2 rounded-xl hover:bg-fuchsia-400 disabled:opacity-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatBot;
