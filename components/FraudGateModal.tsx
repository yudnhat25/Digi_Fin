import React from 'react';
import { FraudCheck } from '../services/coinwiseApi';

/**
 * Pre-trade fraud gate dialog.
 *
 * Shown by App.handleTrade BEFORE a manual Buy/Sell is executed when the
 * /api/v1/ai/fraud-check verdict is REVIEW or BLOCK:
 *   • REVIEW → warn + require explicit "proceed anyway" consent (onProceed set)
 *   • BLOCK  → hard stop, no proceed button (onProceed undefined)
 */
const FraudGateModal: React.FC<{
  check: FraudCheck;
  onCancel: () => void;
  onProceed?: () => void;
}> = ({ check, onCancel, onProceed }) => {
  const blocked = check.verdict === 'BLOCK';
  const accent = blocked ? 'rose' : 'amber';
  const icon = blocked ? '🚫' : '⚠️';
  const title = blocked ? 'Lệnh bị chặn' : 'Cảnh báo rủi ro';
  const subtitle = blocked
    ? 'AI Fraud Shield đã chặn lệnh này vì mức rủi ro quá cao.'
    : 'AI Fraud Shield phát hiện dấu hiệu bất thường. Vui lòng xác nhận trước khi tiếp tục.';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="text-3xl leading-none">{icon}</div>
          <div className="flex-1">
            <h3 className="text-lg font-black tracking-tight">{title}</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <span
            className={`text-[10px] font-black uppercase tracking-widest border px-2 py-1 rounded ${
              blocked
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            {check.verdict}
          </span>
        </div>

        {/* Risk bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            <span>Risk score</span>
            <span className={blocked ? 'text-rose-400' : 'text-amber-400'}>
              {(check.riskScore * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${blocked ? 'bg-rose-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, check.riskScore * 100)}%` }}
            />
          </div>
        </div>

        {/* Reasons */}
        {check.reasons.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {check.reasons.map((r, i) => (
              <p key={i} className="text-[12px] text-slate-300 flex items-start gap-2">
                <span className={`mt-0.5 ${blocked ? 'text-rose-400' : 'text-amber-400'}`}>•</span>
                <span>{r}</span>
              </p>
            ))}
          </div>
        )}

        {check.altData && (
          <p className="mt-3 text-[11px] text-slate-500">
            Alt-data: <span className="text-slate-300 font-bold">{check.altData.label}</span>
            {check.altData.spike ? ' · mention spike' : ''} (composite {check.altData.compositeScore.toFixed(2)})
          </p>
        )}

        <p className="mt-4 text-[11px] text-slate-500 italic">→ {check.recommendedAction}</p>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[13px] font-bold transition-colors"
          >
            {blocked ? 'Đã hiểu' : 'Hủy lệnh'}
          </button>
          {onProceed && (
            <button
              onClick={onProceed}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 text-[13px] font-black transition-colors"
            >
              Vẫn tiếp tục
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FraudGateModal;
