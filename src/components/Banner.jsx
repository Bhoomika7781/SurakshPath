import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X, Zap, Shield } from 'lucide-react';

export default function Banner({ banner, onDismiss }) {
  if (!banner) return null;

  const { title, message, type = 'info', actionNote } = banner;

  let bgStyles = 'bg-slate-900 border-slate-700 text-slate-100';
  let icon = <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />;

  if (type === 'warning' || type === 'closure') {
    bgStyles = 'bg-rose-950/95 border-rose-500/80 text-rose-100 shadow-xl shadow-rose-950/50';
    icon = <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />;
  } else if (type === 'incident') {
    bgStyles = 'bg-amber-950/95 border-amber-500/80 text-amber-100 shadow-xl shadow-amber-950/50';
    icon = <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
  } else if (type === 'success') {
    bgStyles = 'bg-emerald-950/95 border-emerald-500/80 text-emerald-100 shadow-xl shadow-emerald-950/50';
    icon = <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
  }

  return (
    <div className={`border rounded-xl p-3.5 flex items-start justify-between gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${bgStyles}`}>
      <div className="flex items-start gap-3">
        {icon}
        <div className="space-y-1">
          <div className="font-extrabold text-sm tracking-tight flex items-center gap-2">
            <span>{title}</span>
            {actionNote && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/40 border border-white/20">
                {actionNote}
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed opacity-90">{message}</p>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition shrink-0"
        title="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
