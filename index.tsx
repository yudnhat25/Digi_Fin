
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CurrencyProvider } from './services/currency';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Visible diagnostic — show progress in boot fallback before React mounts.
const bootStatus = document.getElementById('boot-status');
if (bootStatus) bootStatus.textContent = 'Mounting React…';

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <CurrencyProvider>
          <App />
        </CurrencyProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (e) {
  rootElement.innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;font-family:Inter,sans-serif;color:#f8fafc;background:#020617;">' +
    '<div style="max-width:640px;background:#0f172a;border:1px solid rgba(244,63,94,0.4);border-radius:24px;padding:32px;">' +
    '<div style="color:#fda4af;font-size:11px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:8px;">Mount failed</div>' +
    '<div style="font-size:24px;font-weight:900;margin-bottom:12px;">' + (e as Error).name + '</div>' +
    '<div style="font-size:14px;color:#cbd5e1;margin-bottom:16px;">' + (e as Error).message + '</div>' +
    '<pre style="font-size:11px;background:#020617;border:1px solid #1e293b;border-radius:12px;padding:16px;overflow:auto;max-height:300px;color:#94a3b8;">' + ((e as Error).stack || '') + '</pre>' +
    '</div></div>';
  // eslint-disable-next-line no-console
  console.error('Mount failed:', e);
}
