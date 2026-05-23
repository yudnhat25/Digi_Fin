import React from 'react';
import { COINWISE_API_BASE } from '../services/coinwiseApi';

const ENDPOINTS = [
  { method: 'GET', path: '/api/v1/health', tag: 'Health' },
  { method: 'GET', path: '/api/v1/fx/rates', tag: 'FX' },
  { method: 'POST', path: '/api/v1/fx/convert', tag: 'FX' },
  { method: 'GET', path: '/api/v1/market/prices', tag: 'Market' },
  { method: 'GET', path: '/api/v1/market/{symbol}/sentiment', tag: 'Alt Data' },
  { method: 'GET', path: '/api/v1/market/{symbol}/whale-flow', tag: 'Alt Data' },
  { method: 'GET', path: '/api/v1/market/fear-greed', tag: 'Alt Data' },
  { method: 'GET', path: '/api/v1/market/social-pulse', tag: 'Alt Data' },
  { method: 'POST', path: '/api/v1/ai/credit-score', tag: 'AI' },
  { method: 'POST', path: '/api/v1/ai/fraud-check', tag: 'AI' },
  { method: 'POST', path: '/api/v1/ai/advisor', tag: 'AI' },
  { method: 'POST', path: '/api/v1/ai/insight', tag: 'AI' },
  { method: 'GET', path: '/api/v1/accounts/{id}/balance', tag: 'Accounts' },
  { method: 'POST', path: '/api/v1/accounts/{id}/deposit-vnd', tag: 'Accounts' },
  { method: 'POST', path: '/api/v1/accounts/{id}/trade', tag: 'Accounts' },
  { method: 'POST', path: '/api/v1/agent/execute', tag: 'Agent' },
];

const methodColor: Record<string, string> = {
  GET: 'text-emerald-400 bg-emerald-500/10',
  POST: 'text-blue-400 bg-blue-500/10',
};

const tagColor: Record<string, string> = {
  Health: 'bg-slate-500/10 text-slate-300',
  FX: 'bg-rose-500/10 text-rose-300',
  Market: 'bg-cyan-500/10 text-cyan-300',
  'Alt Data': 'bg-fuchsia-500/10 text-fuchsia-300',
  AI: 'bg-fuchsia-500/10 text-fuchsia-300',
  Accounts: 'bg-amber-500/10 text-amber-300',
  Agent: 'bg-violet-500/10 text-violet-300',
};

const ApiDocsPage: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full text-fuchsia-300 text-[10px] font-black uppercase tracking-widest mb-3">
          Custom OpenAPI Infrastructure
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">CoinWise OpenAPI Documentation</h1>
        <p className="text-slate-400 text-sm max-w-3xl">
          Our proprietary backend resolves the gaps left by Stripe / Plaid — first-class
          <span className="text-rose-300 font-bold"> VND localization</span>, AI alternative-data endpoints, and a
          function-calling dispatcher used by the agentic chatbot.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Base URL</p>
          <p className="font-mono text-sm font-black break-all">{COINWISE_API_BASE}</p>
        </div>
        <a
          href={`${COINWISE_API_BASE}/docs`}
          target="_blank"
          rel="noreferrer"
          className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 transition group"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Live Swagger UI</p>
          <p className="font-mono text-sm font-black break-all group-hover:translate-x-1 transition-transform">
            {COINWISE_API_BASE}/docs ↗
          </p>
        </a>
        <a
          href={`${COINWISE_API_BASE}/openapi.yaml`}
          target="_blank"
          rel="noreferrer"
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl p-4 transition group"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">OpenAPI YAML spec</p>
          <p className="font-mono text-sm font-black break-all group-hover:translate-x-1 transition-transform">
            /openapi.yaml ↗
          </p>
        </a>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black">Endpoint Inventory ({ENDPOINTS.length})</h3>
          <a
            href={`${COINWISE_API_BASE}/docs`}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-black uppercase tracking-widest text-emerald-300 hover:text-emerald-200"
          >
            Try them live in Swagger UI →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ENDPOINTS.map((e) => (
            <div key={e.method + e.path} className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
              <span className={`text-[10px] font-black px-2 py-1 rounded ${methodColor[e.method] || 'bg-slate-700 text-slate-300'}`}>
                {e.method}
              </span>
              <code className="text-xs text-slate-200 flex-1 truncate">{e.path}</code>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${tagColor[e.tag] || 'bg-slate-700 text-slate-300'}`}>
                {e.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black">Live Swagger UI (embedded)</h3>
          <span className="text-[10px] text-slate-500 font-bold">If empty, ensure the API server is running on {COINWISE_API_BASE}</span>
        </div>
        <iframe
          src={`${COINWISE_API_BASE}/docs`}
          title="CoinWise OpenAPI"
          className="w-full h-[800px] bg-white"
        />
      </div>
    </div>
  );
};

export default ApiDocsPage;
