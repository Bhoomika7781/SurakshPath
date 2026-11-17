import React from 'react';
import {
  MapPin,
  ArrowRightLeft,
  Layers,
  Lightbulb,
  Store,
  Shield,
  Bus,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export default function PlanBar({
  presets,
  selectedStartId,
  selectedEndId,
  onChangeStart,
  onChangeEnd,
  onSwapPoints,
  activeLayers,
  onToggleLayer,
  isOffline,
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
      {/* Start / End Preset Place Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
        {/* Origin */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="text-[10px] text-slate-400 font-semibold block uppercase">
              Start Origin
            </label>
            <select
              value={selectedStartId}
              onChange={(e) => onChangeStart(e.target.value)}
              className="bg-transparent text-slate-100 font-bold text-xs w-full focus:outline-none cursor-pointer truncate"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Destination */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="text-[10px] text-slate-400 font-semibold block uppercase">
              Destination
            </label>
            <select
              value={selectedEndId}
              onChange={(e) => onChangeEnd(e.target.value)}
              className="bg-transparent text-slate-100 font-bold text-xs w-full focus:outline-none cursor-pointer truncate"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Layer Toggles Floating Chips */}
      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden xs:inline">Map Layers:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Street Lights */}
          <button
            onClick={() => onToggleLayer('streetLights')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition border ${
              activeLayers.streetLights
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-3 h-3" />
            <span>Lights</span>
          </button>

          {/* Active Spaces */}
          <button
            onClick={() => onToggleLayer('activeSpaces')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition border ${
              activeLayers.activeSpaces
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Store className="w-3 h-3" />
            <span>Shops & Rx</span>
          </button>

          {/* Help Points */}
          <button
            onClick={() => onToggleLayer('helpPoints')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition border ${
              activeLayers.helpPoints
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Help Points</span>
          </button>

          {/* Bus Stops */}
          <button
            onClick={() => onToggleLayer('publicTransport')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition border ${
              activeLayers.publicTransport
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Bus className="w-3 h-3" />
            <span>Transit</span>
          </button>

          {/* Incidents (Shown as small dots with decay, never red zones) */}
          <button
            onClick={() => onToggleLayer('incidents')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition border ${
              activeLayers.incidents
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Incidents (Dots)</span>
          </button>
        </div>
      </div>

      {/* Offline Demo Status note */}
      {isOffline && (
        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
          <span>⚡ Using bundled offline demo routes (Central Mangalore)</span>
          <span className="text-emerald-400">Offline Ready</span>
        </div>
      )}
    </div>
  );
}
