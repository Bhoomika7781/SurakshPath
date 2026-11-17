import React from 'react';
import { ShieldCheck, Clock, Navigation, AlertOctagon, CheckCircle2, AlertTriangle, Sparkles, AlertCircle } from 'lucide-react';

export default function RouteCards({
  routes,
  selectedRouteId,
  onSelectRoute,
  tradeoffSliderValue,
}) {
  if (!routes || routes.length === 0) {
    return (
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400 text-sm">
        Calculating safe corridors...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Route Comparisons ({routes.length})
        </h2>
        <span className="text-xs text-slate-400">
          Ranked by: {tradeoffSliderValue > 0.5 ? 'Safety Priority' : 'Travel Time Priority'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isBlocked = route.isInfeasible;
          const minutes = Math.round(route.duration / 60);
          const km = (route.distance / 1000).toFixed(1);

          // Score styling
          let scoreBadgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
          if (route.score < 50) {
            scoreBadgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
          } else if (route.score < 75) {
            scoreBadgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
          }

          // Confidence color
          const confidenceColor =
            route.confidence === 'High'
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : route.confidence === 'Medium'
              ? 'text-sky-400 bg-sky-500/10 border-sky-500/20'
              : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`relative rounded-xl p-3.5 transition-all cursor-pointer border text-left ${
                isBlocked
                  ? 'bg-red-950/20 border-red-900/50 opacity-90'
                  : isSelected
                  ? 'bg-slate-850 bg-slate-800/90 border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-xl'
                  : 'bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 border-slate-800/80'
              }`}
            >
              {/* Header Badges: Rank & Recommended */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {route.isRecommended && !isBlocked && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30">
                      ★ Recommended
                    </span>
                  )}
                  {isBlocked && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">
                      <AlertOctagon className="w-3 h-3" /> Road Infeasible
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-300">
                    {route.label || route.name}
                  </span>
                </div>

                {/* Safety Score Out of 100 */}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs ${
                      isBlocked ? 'bg-red-900/40 text-red-300 border-red-700' : scoreBadgeBg
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isBlocked ? '0 / 100' : `${route.score} / 100`}</span>
                  </div>
                </div>
              </div>

              {/* Travel Time & Distance & Confidence */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mb-2.5">
                <span className="flex items-center gap-1 font-semibold text-slate-200">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {minutes} mins
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Navigation className="w-3.5 h-3.5 text-slate-400" />
                  {km} km
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${confidenceColor}`}
                  title={route.confidenceNote}
                >
                  {route.confidence} Confidence
                </span>
              </div>

              {/* Infeasible Reason Message */}
              {isBlocked && (
                <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded p-2 mb-2 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <b>Blocked Segment:</b> {route.infeasibleReason || 'Active road closure detected'}.
                  </span>
                </div>
              )}

              {/* Top Plain-Text Explanations (Helping & Hurting factors) */}
              {!isBlocked && route.explanations && (
                <div className="space-y-1 text-xs pt-2 border-t border-slate-800/80">
                  {route.explanations.positives && route.explanations.positives.slice(0, 2).map((pos, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-emerald-300/90 leading-tight">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pos}</span>
                    </div>
                  ))}

                  {route.explanations.negatives && route.explanations.negatives.length > 0 && (
                    <div className="flex items-start gap-1.5 text-amber-300/90 leading-tight">
                      <AlertCircle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                      <span>{route.explanations.negatives[0]}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tap to inspect indicator */}
              <div className="mt-2 text-[11px] text-right text-slate-400">
                {isSelected ? (
                  <span className="text-emerald-400 font-semibold">Active route • Details shown below ↓</span>
                ) : (
                  <span className="hover:text-slate-300">Tap to inspect factor breakdown →</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
