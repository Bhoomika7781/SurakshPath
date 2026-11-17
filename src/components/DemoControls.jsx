import React from 'react';
import {
  Wrench,
  AlertOctagon,
  ShieldAlert,
  LightbulbOff,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle
} from 'lucide-react';

export default function DemoControls({
  onCloseRoad,
  onAddIncident,
  onToggleLightOutage,
  onResetSimulations,
  simulatedState,
}) {
  const { isRoadClosed, isIncidentAdded, isOutageActive } = simulatedState;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-500/10 text-amber-400">
            <Wrench className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            Hackathon Demo Controls
            <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
              Live Interactive
            </span>
          </h3>
        </div>

        <button
          onClick={onResetSimulations}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
          title="Reset simulated road closures, outages, and incidents"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All</span>
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Simulate dynamic real-time night events to observe live re-scoring and transparent rerouting.
      </p>

      {/* Grid of Simulation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        {/* 1. Road Closure Simulation */}
        <button
          onClick={onCloseRoad}
          className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition ${
            isRoadClosed
              ? 'bg-rose-950/60 border-rose-500/80 text-rose-200'
              : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="flex items-center gap-1.5 text-xs font-bold">
              <AlertOctagon className={`w-3.5 h-3.5 ${isRoadClosed ? 'text-rose-400' : 'text-slate-400'}`} />
              Close a Road
            </span>
            {isRoadClosed && (
              <span className="text-[10px] bg-rose-500/30 text-rose-300 px-1 rounded font-bold">
                ACTIVE
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 leading-tight">
            {isRoadClosed ? 'Segment blocked on Balmatta Road. Auto-rerouting active.' : 'Simulates pipeline leak blocking Route A segment.'}
          </span>
        </button>

        {/* 2. Add Verified Incident */}
        <button
          onClick={onAddIncident}
          className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition ${
            isIncidentAdded
              ? 'bg-amber-950/60 border-amber-500/80 text-amber-200'
              : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="flex items-center gap-1.5 text-xs font-bold">
              <ShieldAlert className={`w-3.5 h-3.5 ${isIncidentAdded ? 'text-amber-400' : 'text-slate-400'}`} />
              Add Verified Incident
            </span>
            {isIncidentAdded && (
              <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1 rounded font-bold">
                ADDED
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 leading-tight">
            {isIncidentAdded ? 'Verified incident added. Local penalty applied with decay.' : 'Simulates fresh verified alert on Falnir avenue.'}
          </span>
        </button>

        {/* 3. Street Light Outage */}
        <button
          onClick={onToggleLightOutage}
          className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition ${
            isOutageActive
              ? 'bg-indigo-950/60 border-indigo-500/80 text-indigo-200'
              : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="flex items-center gap-1.5 text-xs font-bold">
              <LightbulbOff className={`w-3.5 h-3.5 ${isOutageActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              Street Light Outage
            </span>
            {isOutageActive && (
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1 rounded font-bold">
                OUTAGE
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 leading-tight">
            {isOutageActive ? 'Grid fault: 4 street lights dark on arterial corridor.' : 'Simulates transformer outage affecting lighting.'}
          </span>
        </button>
      </div>
    </div>
  );
}
