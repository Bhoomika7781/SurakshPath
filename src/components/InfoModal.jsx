import React from 'react';
import { X, Shield, Scale, Lightbulb, RefreshCw, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { CONFIG } from '../config';

export default function InfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl my-8 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                SurakshitPath Architecture & Fairness Rules
              </h3>
              <p className="text-xs text-slate-400">
                Transparent night routing without black-boxes or area bias
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Principles */}
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-1">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              1. Non-Stigmatizing Route Segmenting (Fairness Rule)
            </div>
            <p className="text-slate-400">
              Navigation models that color whole postal codes or neighbourhoods as "red zones" harm communities and reinforce prejudice. SurakshitPath analyzes routes in granular <b>~50-metre segments</b> strictly assessing current physical variables: street light coverage, open retail spaces, bus stops, and emergency casualty wards.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-sky-500/30 rounded-xl space-y-1">
            <div className="font-bold text-sky-400 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" />
              2. Half-Life Incident Decay (~30 Days)
            </div>
            <p className="text-slate-400">
              Historical incidents exponentially decay following a 30-day half-life. A report from months ago does not permanently brand a street. Unverified reports carry a 75% penalty discount and single reports can never dominate route scores.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              3. Sparse Data Shrinkage & Confidence Tags
            </div>
            <p className="text-slate-400">
              Absence of sensor data is not presumed to mean danger. Where digital landmark density is low, confidence is flagged as <b>Low</b> and scores are mathematically pulled toward a neutral baseline (50) to prevent unfair penalization of less digitalized streets.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-indigo-500/30 rounded-xl space-y-1">
            <div className="font-bold text-indigo-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              4. Complete User Agency (Faster ↔ Safer Trade-off)
            </div>
            <p className="text-slate-400">
              The user determines how much extra travel time they are willing to exchange for increased safety using the dynamic ranking formula:
              <br />
              <code className="text-emerald-300 font-mono text-[11px] block mt-1">
                Combined Score = (1 - w) × normalisedTime + w × normalisedRisk
              </code>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Prototype configured for Central Mangalore • Demo Data
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
