import React, { useState } from 'react';
import { Shield, Moon, Clock, Info, ExternalLink, Sparkles, Navigation } from 'lucide-react';

export default function Navbar({ areaName, timeOfDay, setTimeOfDay, onOpenInfoModal }) {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-ping" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                SurakshitPath
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                  Night Plan
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Transparent Safe-Route Planning • <span className="text-slate-300 font-medium">{areaName}</span>
            </p>
          </div>
        </div>

        {/* Night Time Calibrator & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Time Picker */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 hidden xs:inline">Night Time:</span>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(Number(e.target.value))}
              className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value={20} className="bg-slate-900 text-slate-100">8:00 PM (Evening)</option>
              <option value={22} className="bg-slate-900 text-slate-100">10:00 PM (Default Night)</option>
              <option value={23.5} className="bg-slate-900 text-slate-100">11:30 PM (Late Night)</option>
              <option value={1} className="bg-slate-900 text-slate-100">1:00 AM (Deep Night)</option>
              <option value={3} className="bg-slate-900 text-slate-100">3:00 AM (Early Hours)</option>
            </select>
          </div>

          {/* Info Modal Button */}
          <button
            onClick={onOpenInfoModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition font-medium"
            title="About SurakshitPath transparency & fairness principles"
          >
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">How It Works</span>
          </button>
        </div>
      </div>
    </header>
  );
}
