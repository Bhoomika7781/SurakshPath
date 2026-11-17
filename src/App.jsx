import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CONFIG } from './config';
import initialSafetyData from './data/mangalore_data.json';
import { fetchRoutes } from './lib/routing';
import { scoreRoute, rankRoutes } from './lib/scoring';

// Components
import Navbar from './components/Navbar';
import PlanBar from './components/PlanBar';
import MapView from './components/MapView';
import RouteCards from './components/RouteCards';
import FactorBreakdown from './components/FactorBreakdown';
import TradeoffSlider from './components/TradeoffSlider';
import DemoControls from './components/DemoControls';
import SafetyCheck from './components/SafetyCheck';
import Banner from './components/Banner';
import InfoModal from './components/InfoModal';

import { Shield, Sparkles, AlertCircle, Info, ExternalLink } from 'lucide-react';

export default function App() {
  // Navigation & Area State
  const [startId, setStartId] = useState(CONFIG.defaultStartId);
  const [endId, setEndId] = useState(CONFIG.defaultEndId);
  const [timeOfDay, setTimeOfDay] = useState(22); // Default 10:00 PM
  const [weights, setWeights] = useState(CONFIG.defaultWeights);
  const [tradeoffSlider, setTradeoffSlider] = useState(CONFIG.defaultTradeoffSlider);

  // Map & Layer Visibility State
  const [activeLayers, setActiveLayers] = useState({
    streetLights: true,
    activeSpaces: true,
    helpPoints: true,
    publicTransport: true,
    incidents: true,
  });

  // Safety Data & Simulations State
  const [safetyData, setSafetyData] = useState(initialSafetyData);
  const [simulatedOutages, setSimulatedOutages] = useState([]);
  const [simulatedState, setSimulatedState] = useState({
    isRoadClosed: false,
    isIncidentAdded: false,
    isOutageActive: false,
  });

  // Route State
  const [rawRoutes, setRawRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Notification Banner
  const [banner, setBanner] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Trip Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedTripPosition, setSimulatedTripPosition] = useState(null);
  const [simulatedDeviationPosition, setSimulatedDeviationPosition] = useState(null);
  const [tripAlert, setTripAlert] = useState(null);
  const [simStepIndex, setSimStepIndex] = useState(0);
  const simIntervalRef = useRef(null);

  // Trusted Contact
  const [trustedContact, setTrustedContact] = useState({
    name: 'Priya (Sister)',
    phone: '+91 98765 43210',
  });

  // Current Origin & Destination Coordinates
  const currentStart = useMemo(
    () => CONFIG.presets.find((p) => p.id === startId) || CONFIG.presets[0],
    [startId]
  );
  const currentEnd = useMemo(
    () => CONFIG.presets.find((p) => p.id === endId) || CONFIG.presets[1],
    [endId]
  );

  // Fetch routes whenever origin or destination changes
  useEffect(() => {
    let isMounted = true;
    async function loadRoutes() {
      const res = await fetchRoutes(currentStart.coordinates, currentEnd.coordinates);
      if (isMounted) {
        setRawRoutes(res.routes);
        setIsOffline(res.isOffline);
        if (res.routes.length > 0) {
          setSelectedRouteId(res.routes[0].id);
        }
      }
    }
    loadRoutes();
    return () => {
      isMounted = false;
    };
  }, [startId, endId]);

  // Compute multi-factor scores and dynamic rankings
  const rankedRoutes = useMemo(() => {
    if (!rawRoutes || rawRoutes.length === 0) return [];

    const scored = rawRoutes.map((r) =>
      scoreRoute(r, safetyData, {
        weights,
        timeOfDayHours: timeOfDay,
        simulatedOutages,
        referenceDate: new Date('2026-11-15T18:00:00Z'),
      })
    );

    return rankRoutes(scored, tradeoffSlider);
  }, [rawRoutes, safetyData, weights, timeOfDay, simulatedOutages, tradeoffSlider]);

  // Keep selected route valid; auto-select recommended if current is infeasible
  useEffect(() => {
    if (rankedRoutes.length === 0) return;

    const currentSelected = rankedRoutes.find((r) => r.id === selectedRouteId);
    if (!currentSelected || currentSelected.isInfeasible) {
      // Find the first feasible route (which is rank 1)
      const topFeasible = rankedRoutes.find((r) => !r.isInfeasible);
      if (topFeasible) {
        setSelectedRouteId(topFeasible.id);
      } else {
        setSelectedRouteId(rankedRoutes[0].id);
      }
    }
  }, [rankedRoutes, selectedRouteId]);

  const activeRoute = useMemo(
    () => rankedRoutes.find((r) => r.id === selectedRouteId) || rankedRoutes[0],
    [rankedRoutes, selectedRouteId]
  );

  const recommendedRoute = useMemo(
    () => rankedRoutes.find((r) => r.isRecommended) || rankedRoutes[0],
    [rankedRoutes]
  );

  // Handlers for Layer Toggles
  const handleToggleLayer = (layerKey) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  // Demo Control 1: Close a Road
  const handleCloseRoad = () => {
    if (simulatedState.isRoadClosed) {
      // Re-open
      setSafetyData((prev) => ({
        ...prev,
        roadClosures: [],
      }));
      setSimulatedState((prev) => ({ ...prev, isRoadClosed: false }));
      setBanner({
        title: 'Road Re-opened',
        message: 'Balmatta corridor road closure cleared. Original routes restored.',
        type: 'success',
        actionNote: 'Unblocked',
      });
    } else {
      // Close segment on Balmatta road [12.8715, 74.8532]
      const newClosure = {
        id: 'closure-balmatta',
        lat: 12.8715,
        lng: 74.8532,
        radiusMeters: 55,
        active: true,
        reason: 'Water main rupture & excavation barrier',
      };
      setSafetyData((prev) => ({
        ...prev,
        roadClosures: [newClosure],
      }));
      setSimulatedState((prev) => ({ ...prev, isRoadClosed: true }));

      // Find alternative route name
      const alternative = rawRoutes.find((r) => r.id !== 'route-a');
      const altName = alternative ? alternative.name : 'Via Falnir Road';

      setBanner({
        title: 'Road Closed on Balmatta Road',
        message: `Rerouted. Route A blocked by excavation barrier. New recommended safe corridor: ${altName}.`,
        type: 'closure',
        actionNote: 'Auto-Rerouted',
      });
    }
  };

  // Demo Control 2: Add Verified Incident
  const handleAddIncident = () => {
    if (simulatedState.isIncidentAdded) {
      // Remove the added incident
      setSafetyData((prev) => ({
        ...prev,
        incidents: prev.incidents.filter((inc) => inc.id !== 'inc-demo-new'),
      }));
      setSimulatedState((prev) => ({ ...prev, isIncidentAdded: false }));
      setBanner({
        title: 'Incident Record Cleared',
        message: 'Demo incident removed from simulation dataset.',
        type: 'info',
        actionNote: 'Reset',
      });
    } else {
      const freshIncident = {
        id: 'inc-demo-new',
        title: 'Poor visibility & suspicious loitering reported',
        lat: 12.8648,
        lng: 74.8515,
        date: new Date().toISOString(),
        severity: 'high',
        verified: true,
        description: 'Verified police distress beacon logged 10 minutes ago near Falnir Ave.',
      };
      setSafetyData((prev) => ({
        ...prev,
        incidents: [freshIncident, ...prev.incidents],
      }));
      setSimulatedState((prev) => ({ ...prev, isIncidentAdded: true }));
      setBanner({
        title: 'Fresh Verified Incident Reported',
        message: 'Localized safety penalty applied near Falnir Avenue. Note: Exponential decay applies (half-life 30 days) to prevent permanent area prejudice.',
        type: 'incident',
        actionNote: 'Decay Active',
      });
    }
  };

  // Demo Control 3: Street Light Outage
  const handleToggleLightOutage = () => {
    if (simulatedState.isOutageActive) {
      setSimulatedOutages([]);
      setSimulatedState((prev) => ({ ...prev, isOutageActive: false }));
      setBanner({
        title: 'Grid Power Restored',
        message: 'Smart LED street lights returned to operational status.',
        type: 'success',
        actionNote: 'Restored',
      });
    } else {
      const outages = ['sl-5', 'sl-6', 'sl-7', 'sl-8'];
      setSimulatedOutages(outages);
      setSimulatedState((prev) => ({ ...prev, isOutageActive: true }));
      setBanner({
        title: 'Street Light Outage Detected',
        message: 'Transformer fault disabled 4 street lights along Balmatta arterial corridor. Lighting score re-evaluated live.',
        type: 'warning',
        actionNote: 'Score Adjusted',
      });
    }
  };

  // Reset All Simulations
  const handleResetSimulations = () => {
    setSafetyData(initialSafetyData);
    setSimulatedOutages([]);
    setSimulatedState({
      isRoadClosed: false,
      isIncidentAdded: false,
      isOutageActive: false,
    });
    setWeights(CONFIG.defaultWeights);
    setTradeoffSlider(CONFIG.defaultTradeoffSlider);
    handleStopTripSimulation();
    setBanner({
      title: 'Demo Environment Reset',
      message: 'Restored all baseline conditions, open venues, and default factor weights for Central Mangalore.',
      type: 'success',
      actionNote: 'Pristine State',
    });
  };

  // Trip Simulation Animation
  const handleStartTripSimulation = () => {
    if (!activeRoute || activeRoute.isInfeasible) return;

    const coords = activeRoute.coordinates;
    if (!coords || coords.length === 0) return;

    setIsSimulating(true);
    setTripAlert(null);
    setSimulatedDeviationPosition(null);
    setSimStepIndex(0);
    setSimulatedTripPosition(coords[0]);

    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    let step = 0;
    simIntervalRef.current = setInterval(() => {
      step++;
      if (step >= coords.length) {
        clearInterval(simIntervalRef.current);
        setIsSimulating(false);
        setBanner({
          title: 'Trip Completed Safely',
          message: `Arrived safely at ${currentEnd.name}. Safe travel tracking concluded.`,
          type: 'success',
          actionNote: 'Destination Reached',
        });
      } else {
        setSimStepIndex(step);
        setSimulatedTripPosition(coords[step]);
      }
    }, 900);
  };

  const handleStopTripSimulation = () => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setIsSimulating(false);
    setSimulatedTripPosition(null);
    setSimulatedDeviationPosition(null);
    setTripAlert(null);
  };

  // Trigger Sudden Unexpected Stop
  const handleTriggerUnexpectedStop = () => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setTripAlert({
      type: 'stop',
      message: 'Unexpected stop exceeding 20 seconds during night travel.',
    });
  };

  // Trigger Route Deviation > 100m
  const handleTriggerDeviation = () => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    const curr = simulatedTripPosition || activeRoute.coordinates[Math.floor(activeRoute.coordinates.length / 2)];
    // Move 140m off route
    const devCoord = [curr[0] + 0.0011, curr[1] + 0.0013];
    setSimulatedTripPosition(devCoord);
    setSimulatedDeviationPosition(devCoord);
    setTripAlert({
      type: 'deviation',
      message: 'Route anomaly: Vehicle deviated >100m away from planned safe corridor.',
    });
  };

  const handleResetTripAlert = () => {
    setTripAlert(null);
    setSimulatedDeviationPosition(null);
    // Resume simulation
    if (isSimulating && activeRoute) {
      const coords = activeRoute.coordinates;
      let step = simStepIndex;
      simIntervalRef.current = setInterval(() => {
        step++;
        if (step >= coords.length) {
          clearInterval(simIntervalRef.current);
          setIsSimulating(false);
        } else {
          setSimStepIndex(step);
          setSimulatedTripPosition(coords[step]);
        }
      }, 900);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        areaName={CONFIG.areaName}
        timeOfDay={timeOfDay}
        setTimeOfDay={setTimeOfDay}
        onOpenInfoModal={() => setIsInfoModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">
        {/* Dynamic Notification Banner */}
        {banner && <Banner banner={banner} onDismiss={() => setBanner(null)} />}

        {/* Route Planning Controls Bar */}
        <PlanBar
          presets={CONFIG.presets}
          selectedStartId={startId}
          selectedEndId={endId}
          onChangeStart={setStartId}
          onChangeEnd={setEndId}
          onSwapPoints={() => {
            const temp = startId;
            setStartId(endId);
            setEndId(temp);
          }}
          activeLayers={activeLayers}
          onToggleLayer={handleToggleLayer}
          isOffline={isOffline}
        />

        {/* Core Layout: Map + Controls Stack (Responsive desktop 2-col, mobile stacked) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Map Column (6 cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="h-[400px] sm:h-[460px] lg:h-[520px] w-full">
              <MapView
                routes={rankedRoutes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={setSelectedRouteId}
                safetyData={safetyData}
                activeLayers={activeLayers}
                simulatedTripPosition={simulatedTripPosition}
                simulatedDeviationPosition={simulatedDeviationPosition}
                simulatedOutages={simulatedOutages}
                startCoord={currentStart.coordinates}
                endCoord={currentEnd.coordinates}
                startName={currentStart.name}
                endName={currentEnd.name}
              />
            </div>

            {/* Faster <-> Safer Trade-off Slider */}
            <TradeoffSlider
              value={tradeoffSlider}
              onChange={setTradeoffSlider}
              recommendedRoute={recommendedRoute}
            />

            {/* Trip Simulation & Optional Safety Monitor */}
            <SafetyCheck
              route={activeRoute}
              isSimulating={isSimulating}
              onStartSimulation={handleStartTripSimulation}
              onStopSimulation={handleStopTripSimulation}
              currentCoord={simulatedTripPosition}
              onTriggerStop={handleTriggerUnexpectedStop}
              onTriggerDeviation={handleTriggerDeviation}
              onResetTripAlert={handleResetTripAlert}
              tripAlert={tripAlert}
              trustedContact={trustedContact}
              setTrustedContact={setTrustedContact}
            />
          </div>

          {/* Analysis & Controls Column (5 cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Hackathon Demo Controls Drawer */}
            <DemoControls
              onCloseRoad={handleCloseRoad}
              onAddIncident={handleAddIncident}
              onToggleLightOutage={handleToggleLightOutage}
              onResetSimulations={handleResetSimulations}
              simulatedState={simulatedState}
            />

            {/* Side-by-Side Route Comparison Cards */}
            <RouteCards
              routes={rankedRoutes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
              tradeoffSliderValue={tradeoffSlider}
            />

            {/* Multi-Factor Safety Breakdown of Active Route */}
            <FactorBreakdown
              route={activeRoute}
              weights={weights}
              onUpdateWeights={setWeights}
              onResetWeights={() => setWeights(CONFIG.defaultWeights)}
              allRoutes={rankedRoutes}
            />
          </div>
        </div>

        {/* Visible Fairness Disclaimer (Required by Hard Requirements) */}
        <footer className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <b>Fairness Commitment:</b> {CONFIG.fairnessNote}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 whitespace-nowrap">
            {CONFIG.disclaimer}
          </div>
        </footer>
      </main>

      {/* Info & Principles Modal */}
      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
    </div>
  );
}
