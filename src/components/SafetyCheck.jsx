import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Pause,
  AlertCircle,
  Shield,
  PhoneCall,
  UserCheck,
  CheckCircle,
  Clock,
  Compass,
  AlertTriangle,
  Radio,
  Send,
  X
} from 'lucide-react';

export default function SafetyCheck({
  route,
  isSimulating,
  onStartSimulation,
  onStopSimulation,
  currentCoord,
  onTriggerStop,
  onTriggerDeviation,
  onResetTripAlert,
  tripAlert, // { type: 'stop' | 'deviation' | null, message: string }
  trustedContact,
  setTrustedContact,
}) {
  const [monitorEnabled, setMonitorEnabled] = useState(true);
  const [countdown, setCountdown] = useState(15);
  const [sosSent, setSosSent] = useState(false);
  const [sosMessage, setSosMessage] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const countdownTimerRef = useRef(null);

  // Manage countdown when trip alert triggers
  useEffect(() => {
    if (tripAlert && monitorEnabled) {
      setCountdown(15);
      setSosSent(false);

      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            dispatchSosAlert('Automatic Emergency Trigger: No response received after 15s unexpected stop.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [tripAlert, monitorEnabled]);

  const handleImFine = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    onResetTripAlert();
    setSosSent(false);
  };

  const handleNeedHelp = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    dispatchSosAlert('User initiated SOS help request.');
  };

  const dispatchSosAlert = (reason) => {
    setSosSent(true);
    const locStr = currentCoord
      ? `[${currentCoord[0].toFixed(4)}, ${currentCoord[1].toFixed(4)}]`
      : '[12.8712, 74.8540]';

    setSosMessage(
      `🚨 LIVE SAFETY ALERT: Dispatch sent to ${trustedContact.name} (${trustedContact.phone}). Live GPS location ${locStr} and route track shared via encrypted SMS relay.`
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 shadow-xl">
      {/* Header and Toggle */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-sky-500/10 text-sky-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Trip Safety Monitor
              {monitorEnabled ? (
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  ARMED
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                  STANDBY
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Active anomaly detection for halts & route deviations
            </p>
          </div>
        </div>

        {/* Optional Safety Check Toggle */}
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={monitorEnabled}
              onChange={(e) => setMonitorEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* Trusted Contact Row */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="font-semibold text-slate-200">
              Trusted Contact: <span className="text-emerald-300">{trustedContact.name}</span>
            </div>
            <div className="text-[11px] text-slate-400">{trustedContact.phone} • Automated SOS Relay</div>
          </div>
        </div>

        <button
          onClick={() => setShowContactModal(true)}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded bg-slate-850 hover:bg-slate-800 border border-slate-700/60 transition"
        >
          Edit Contact
        </button>
      </div>

      {/* Trip Simulation Controls */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {!isSimulating ? (
            <button
              onClick={onStartSimulation}
              disabled={route?.isInfeasible}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Trip Simulation</span>
            </button>
          ) : (
            <button
              onClick={onStopSimulation}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>End Trip Simulation</span>
            </button>
          )}

          {isSimulating && (
            <>
              <button
                onClick={onTriggerStop}
                className="px-3 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Simulate sudden unexpected stop > 20s"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Simulate Unexpected Stop</span>
              </button>

              <button
                onClick={onTriggerDeviation}
                className="px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Simulate off-route vehicle movement > 100m"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Simulate Deviation</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Safety Prompt Modal / Notification Card when Stop or Deviation is triggered */}
      {tripAlert && monitorEnabled && (
        <div className="bg-rose-950/90 border-2 border-rose-500 rounded-xl p-4 space-y-3 animate-in fade-in zoom-in-95 shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-full bg-rose-600 text-white animate-bounce">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm">
                  Are you okay?
                </h4>
                <p className="text-xs text-rose-200 mt-0.5">
                  {tripAlert.type === 'deviation'
                    ? 'We noticed your location deviated >100m away from the planned safe corridor.'
                    : 'We noticed an unexpected stop exceeding 20 seconds during your journey.'}
                </p>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="text-right">
              <div className="text-lg font-mono font-extrabold text-rose-300">
                00:{countdown < 10 ? `0${countdown}` : countdown}
              </div>
              <div className="text-[10px] text-rose-400 font-semibold uppercase">Auto-alert in</div>
            </div>
          </div>

          {/* Countdown Progress bar */}
          <div className="w-full h-1.5 bg-rose-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-400 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 15) * 100}%` }}
            />
          </div>

          {/* Buttons: I'm Fine vs I Need Help */}
          {!sosSent ? (
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleImFine}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
              >
                <CheckCircle className="w-4 h-4" />
                <span>I'm Fine (Resume Trip)</span>
              </button>

              <button
                onClick={handleNeedHelp}
                className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
              >
                <PhoneCall className="w-4 h-4" />
                <span>I Need Help (SOS)</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-950 border border-rose-500/60 rounded-lg p-3 text-xs text-rose-200 space-y-2">
              <div className="font-bold flex items-center gap-2 text-white">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Trusted Contact Alert Dispatched</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">{sosMessage}</p>
              <button
                onClick={handleImFine}
                className="mt-2 w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Acknowledge & Clear Alert
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Trusted Safety Contact
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              When an unexpected halt or emergency SOS triggers, your live coordinates and route progress are transmitted to this trusted contact.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Contact Full Name & Relation
                </label>
                <input
                  type="text"
                  value={trustedContact.name}
                  onChange={(e) => setTrustedContact({ ...trustedContact, name: e.target.value })}
                  placeholder="e.g., Priya (Sister)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Mobile Number (SMS Alert Relay)
                </label>
                <input
                  type="tel"
                  value={trustedContact.phone}
                  onChange={(e) => setTrustedContact({ ...trustedContact, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
              >
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
