import React, { useState } from 'react';
import { Gauge, HelpCircle, Zap, Shield, ArrowRight } from 'lucide-react';

export default function TradeoffSlider({ value, onChange, recommendedRoute }) {
  const [showFormula, setShowFormula] = useState(false);

  // value is between 0.0 (Fastest) and 1.0 (Safest)
  const percentageSafe = Math.round(value * 100);
  const percentageTime = 100 - percentageSafe;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
      {/* Title & How it is calculated toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-100">
            Routing Priority Trade-off
          </h3>
        </div>

        <button
          onClick={() => setShowFormula(!showFormula)}
          className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>How is this calculated?</span>
        </button>
      </div>

      {/* Slider Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className={`flex items-center gap-1 transition ${value < 0.4 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
            <Zap className="w-3.5 h-3.5" />
            Faster Route ({percentageTime}%)
          </span>
          <span className={`flex items-center gap-1 transition ${value >= 0.6 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
            <Shield className="w-3.5 h-3.5" />
            Safer Route ({percentageSafe}%)
          </span>
        </div>

        <div className="relative py-1">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          {/* Subtle tick markers for 0, 0.5, 1 */}
          <div className="flex justify-between text-[10px] text-slate-500 px-1 mt-1 font-mono">
            <span>0% (Fastest)</span>
            <span>Balanced (50%)</span>
            <span>100% (Safest)</span>
          </div>
        </div>
      </div>

      {/* Live Recommended Outcome */}
      {recommendedRoute && !recommendedRoute.isInfeasible && (
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
          <span className="text-slate-400">Current Recommended Selection:</span>
          <span className="font-bold text-emerald-400 flex items-center gap-1">
            {recommendedRoute.name} ({Math.round(recommendedRoute.duration / 60)} min • Score {recommendedRoute.score}/100)
          </span>
        </div>
      )}

      {/* "How is this calculated?" Explanatory Dropdown */}
      {showFormula && (
        <div className="bg-slate-950 border border-slate-700/80 rounded-lg p-3 text-xs text-slate-300 space-y-2 animate-in fade-in">
          <div className="font-bold text-slate-100 flex items-center gap-1.5">
            Mathematical Trade-off Formula
          </div>
          <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-emerald-300 overflow-x-auto">
            Combined Cost = (1 - w) × normalisedTime + w × normalisedRisk
          </div>
          <div className="space-y-1 text-slate-400 text-[11px] leading-relaxed">
            <p>
              • <b>w = {value.toFixed(2)}</b> is your current slider position.
            </p>
            <p>
              • <b>normalisedTime</b> scales travel duration relative to all available options (0 = fastest option, 1 = slowest).
            </p>
            <p>
              • <b>normalisedRisk = (100 - SafetyScore) / 100</b> measures the residual risk factor.
            </p>
            <p>
              • The route with the <b>lowest combined cost</b> is automatically designated as the top recommended path.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
