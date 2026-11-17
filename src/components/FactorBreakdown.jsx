import React, { useState } from 'react';
import {
  Lightbulb,
  Store,
  Bus,
  ShieldAlert,
  Clock,
  Sliders,
  RotateCcw,
  Info,
  ShieldCheck,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function FactorBreakdown({
  route,
  weights,
  onUpdateWeights,
  onResetWeights,
  allRoutes = [],
}) {
  const [showAdvancedWeights, setShowAdvancedWeights] = useState(false);

  if (!route) {
    return (
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-500 text-sm">
        Select a route to view its transparent safety factor breakdown.
      </div>
    );
  }

  const factors = route.factorAverages || {
    lighting: 0,
    activeSpaces: 0,
    publicTransport: 0,
    helpPoints: 0,
    incidents: 0,
  };

  // Compare against alternative route if available to generate rich plain-words narrative
  const otherRoute = allRoutes.find((r) => r.id !== route.id && !r.isInfeasible);

  let narrativeComparison = '';
  if (route.isInfeasible) {
    narrativeComparison = `This route is currently impassable due to an active road obstruction (${route.infeasibleReason || 'Closure'}). An alternative route must be taken.`;
  } else if (otherRoute) {
    const diff = route.score - otherRoute.score;
    if (diff > 5) {
      narrativeComparison = `${route.name} scores ${diff} points higher than ${otherRoute.name} primarily because ${factors.lighting}% of it is well-lit and it maintains closer proximity to active evening shops and emergency help stations.`;
    } else if (diff < -5) {
      narrativeComparison = `${route.name} scores ${Math.abs(diff)} points lower than ${otherRoute.name} due to lower continuous lighting coverage (${factors.lighting}%) and reduced late-night commercial activity along this stretch.`;
    } else {
      narrativeComparison = `${route.name} offers safety conditions closely comparable to ${otherRoute.name}, balancing good lighting (${factors.lighting}%) with reliable transit connectivity (${factors.publicTransport}%).`;
    }
  } else {
    narrativeComparison = `${route.name} achieves an overall safety rating of ${route.score}/100 based on evaluated street light coverage, open retail spaces, and emergency point proximity.`;
  }

  const factorConfigs = [
    {
      key: 'lighting',
      label: 'Continuous Street Lighting',
      desc: 'Proximity and density of active overhead street lights within 60m buffer',
      icon: Lightbulb,
      value: factors.lighting,
      weight: weights.lighting,
      color: 'bg-amber-400',
      badgeColor: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
    },
    {
      key: 'activeSpaces',
      label: 'Active Public Spaces',
      desc: 'Open shops, 24x7 pharmacies, and illuminated petrol pumps at selected hour',
      icon: Store,
      value: factors.activeSpaces,
      weight: weights.activeSpaces,
      color: 'bg-emerald-400',
      badgeColor: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      key: 'helpPoints',
      label: 'Verified Help Points',
      desc: 'Immediate distance to 24/7 hospital ER casualty docks & police beat posts',
      icon: ShieldCheck,
      value: factors.helpPoints,
      weight: weights.helpPoints,
      color: 'bg-blue-400',
      badgeColor: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
    },
    {
      key: 'publicTransport',
      label: 'Public Transit Proximity',
      desc: 'Access to active bus stops, terminals, and well-trafficked transit bays',
      icon: Bus,
      value: factors.publicTransport,
      weight: weights.publicTransport,
      color: 'bg-sky-400',
      badgeColor: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
    },
    {
      key: 'incidents',
      label: 'Safety Incident Resilience',
      desc: 'Absence of recent verified incidents (aged reports exponentially decayed)',
      icon: ShieldAlert,
      value: factors.incidents,
      weight: weights.incidents,
      color: 'bg-rose-400',
      badgeColor: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-100 text-sm">
              Factor Breakdown: <span className="text-emerald-400">{route.name}</span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent breakdown of individual segment factors (0–100 scale)
          </p>
        </div>

        <button
          onClick={() => setShowAdvancedWeights(!showAdvancedWeights)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span>{showAdvancedWeights ? 'Hide Weights' : 'Advanced Weights'}</span>
        </button>
      </div>

      {/* Plain Words Narrative Explanation */}
      <div className="bg-slate-950/60 border border-slate-800/90 rounded-lg p-3 text-xs leading-relaxed text-slate-300">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">Why this score: </span>
            {narrativeComparison}
          </div>
        </div>

        {/* Confidence note if sparse data */}
        {route.confidence !== 'High' && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>
              <b>Fairness rule applied:</b> {route.confidenceNote}. Score is moderated toward neutral 50 to avoid unfairly penalizing areas with fewer digital sensors.
            </span>
          </div>
        )}
      </div>

      {/* Factor Bars */}
      <div className="space-y-3">
        {factorConfigs.map((f) => (
          <div key={f.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-200">
                <f.icon className="w-3.5 h-3.5 text-slate-400" />
                {f.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">
                  Weight: {Math.round(f.weight * 100)}%
                </span>
                <span className={`px-1.5 py-0.5 rounded border text-[11px] font-mono font-bold ${f.badgeColor}`}>
                  {f.value} / 100
                </span>
              </div>
            </div>

            {/* Bar Track */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${f.color} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.max(0, f.value))}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Advanced Factor Weights Customizer Drawer */}
      {showAdvancedWeights && (
        <div className="pt-3 border-t border-slate-800 space-y-3 bg-slate-950/80 p-3 rounded-lg border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Customize Factor Weights
            </span>
            <button
              onClick={onResetWeights}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Reset Defaults
            </button>
          </div>

          <div className="space-y-2">
            {Object.keys(weights).map((key) => {
              const titles = {
                lighting: 'Lighting Weight',
                activeSpaces: 'Active Spaces Weight',
                publicTransport: 'Public Transport Weight',
                helpPoints: 'Help Points Weight',
                incidents: 'Incident Penalty Weight',
              };
              return (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 capitalize">{titles[key] || key}</span>
                  <div className="flex items-center gap-2 w-36">
                    <input
                      type="range"
                      min="0.05"
                      max="0.50"
                      step="0.05"
                      value={weights[key]}
                      onChange={(e) =>
                        onUpdateWeights({
                          ...weights,
                          [key]: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-emerald-500"
                    />
                    <span className="font-mono text-[11px] text-slate-300 w-8 text-right">
                      {Math.round(weights[key] * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fairness Rule Statement */}
      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
        <span>
          <b>Fairness Principle:</b> Scores describe current physical conditions on this specific route, not the people or the neighbourhood. Old incidents automatically decay and never permanently label any street.
        </span>
      </div>
    </div>
  );
}
