import React from 'react';

interface State { error: Error | null }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('App crash:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
          <div className="max-w-2xl w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-300 mb-2">Runtime error</p>
            <h1 className="text-2xl font-black mb-3">{this.state.error.name}</h1>
            <p className="text-sm text-slate-300 mb-4">{this.state.error.message}</p>
            <pre className="text-[11px] bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-auto max-h-72 text-slate-400">
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => location.reload()}
              className="mt-5 bg-rose-500 text-slate-950 font-black uppercase tracking-widest text-xs px-4 py-2.5 rounded-xl"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
