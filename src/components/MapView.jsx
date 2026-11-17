import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Layers, Eye, EyeOff, Navigation, AlertTriangle, Shield, MapPin, Zap } from 'lucide-react';

export default function MapView({
  routes,
  selectedRouteId,
  onSelectRoute,
  safetyData,
  activeLayers,
  simulatedTripPosition,
  simulatedDeviationPosition,
  simulatedOutages = [],
  startCoord,
  endCoord,
  startName,
  endName,
  onMapClickCoord,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routesLayerGroupRef = useRef(null);
  const poiLayerGroupRef = useRef(null);
  const tripMarkerRef = useRef(null);
  const deviationMarkerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double init

    const initialCenter = [12.8680, 74.8530]; // Central Mangalore
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Add standard OSM tile layer with night styling
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'night-tiles',
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Attribution at bottom left
    L.control
      .attribution({
        position: 'bottomleft',
        prefix: '<span class="text-[10px] text-slate-500">Leaflet | © OpenStreetMap contributors</span>',
      })
      .addTo(map);

    // Click handler for user selecting points
    map.on('click', (e) => {
      if (onMapClickCoord) {
        onMapClickCoord([e.latlng.lat, e.latlng.lng]);
      }
    });

    // Create persistent layer groups
    routesLayerGroupRef.current = L.layerGroup().addTo(map);
    poiLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polylines and Start/End Pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routesGroup = routesLayerGroupRef.current;
    if (!map || !routesGroup) return;

    routesGroup.clearLayers();

    // 1. Draw Routes
    if (routes && routes.length > 0) {
      routes.forEach((route) => {
        const isSelected = route.id === selectedRouteId;
        const coords = route.coordinates;
        if (!coords || coords.length < 2) return;

        if (route.isInfeasible) {
          // Closed / infeasible route: dashed red line
          const dashedLine = L.polyline(coords, {
            color: '#ef4444',
            weight: isSelected ? 5 : 3,
            dashArray: '6, 8',
            opacity: isSelected ? 0.9 : 0.45,
          });
          dashedLine.on('click', () => onSelectRoute(route.id));
          dashedLine.bindTooltip(`<b>${route.name}</b><br/><span style="color:#ef4444">Blocked: ${route.infeasibleReason || 'Closed'}</span>`, { sticky: true });
          routesGroup.addLayer(dashedLine);
          return;
        }

        // Selected route: glowing shadow beneath
        if (isSelected) {
          const glow = L.polyline(coords, {
            color: route.color || '#10b981',
            weight: 10,
            opacity: 0.25,
            lineCap: 'round',
            lineJoin: 'round',
          });
          routesGroup.addLayer(glow);
        }

        // Main route line
        const polyline = L.polyline(coords, {
          color: route.color || '#10b981',
          weight: isSelected ? 6 : 4,
          opacity: isSelected ? 0.95 : 0.45,
          lineCap: 'round',
          lineJoin: 'round',
        });

        polyline.on('click', () => onSelectRoute(route.id));

        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <div style="font-weight: 700; color: #f8fafc; font-size: 13px;">${route.name}</div>
            <div style="margin: 4px 0; color: #94a3b8;">${route.summary || ''}</div>
            <div style="display: flex; gap: 8px; margin-top: 6px;">
              <span style="background: rgba(16,185,129,0.2); color: #34d399; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Score: ${route.score}/100</span>
              <span style="background: rgba(56,189,248,0.2); color: #38bdf8; padding: 2px 6px; border-radius: 4px;">${Math.round(route.duration / 60)} min</span>
              <span style="background: rgba(245,158,11,0.2); color: #fbbf24; padding: 2px 6px; border-radius: 4px;">${(route.distance / 1000).toFixed(1)} km</span>
            </div>
          </div>
        `;
        polyline.bindPopup(popupContent);
        routesGroup.addLayer(polyline);
      });
    }

    // 2. Start & End Markers
    if (startCoord) {
      const startIcon = L.divIcon({
        className: 'custom-start-marker',
        html: `
          <div style="background: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 0 12px rgba(16,185,129,0.7);">
            A
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const startMarker = L.marker(startCoord, { icon: startIcon });
      startMarker.bindTooltip(`<b>Start:</b> ${startName || 'Origin'}`, { permanent: false, direction: 'top' });
      routesGroup.addLayer(startMarker);
    }

    if (endCoord) {
      const endIcon = L.divIcon({
        className: 'custom-end-marker',
        html: `
          <div style="background: #ef4444; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 0 12px rgba(239,68,68,0.7);">
            B
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const endMarker = L.marker(endCoord, { icon: endIcon });
      endMarker.bindTooltip(`<b>Destination:</b> ${endName || 'Destination'}`, { permanent: false, direction: 'top' });
      routesGroup.addLayer(endMarker);
    }
  }, [routes, selectedRouteId, startCoord, endCoord, startName, endName, onSelectRoute]);

  // Update POI Layers (Street lights, Open spaces, Help points, Bus stops, Incidents, Closures)
  useEffect(() => {
    const poiGroup = poiLayerGroupRef.current;
    if (!poiGroup || !safetyData) return;

    poiGroup.clearLayers();

    // 1. Street Lights
    if (activeLayers.streetLights && safetyData.streetLights) {
      safetyData.streetLights.forEach((sl) => {
        const isOutage = simulatedOutages.includes(sl.id);
        const color = isOutage ? '#64748b' : '#facc15';
        const opacity = isOutage ? 0.3 : 0.85;

        const circle = L.circleMarker([sl.lat, sl.lng], {
          radius: isOutage ? 4 : 5,
          color: color,
          fillColor: color,
          fillOpacity: opacity,
          weight: 1,
        });

        circle.bindTooltip(
          `<b>Street Light</b><br/>${sl.name}<br/>Status: ${isOutage ? '<span style="color:#ef4444">Simulated Outage</span>' : '<span style="color:#facc15">Lit</span>'}`
        );
        poiGroup.addLayer(circle);
      });
    }

    // 2. Active Spaces (Open shops, 24h pharmacies, petrol pumps)
    if (activeLayers.activeSpaces && safetyData.activeSpaces) {
      safetyData.activeSpaces.forEach((space) => {
        const isPharmacy = space.type === 'pharmacy';
        const isFuel = space.type === 'petrol_pump';
        const bg = isPharmacy ? '#10b981' : isFuel ? '#0284c7' : '#8b5cf6';
        const symbol = isPharmacy ? 'Rx' : isFuel ? '⛽' : '🛒';

        const icon = L.divIcon({
          className: 'custom-active-space',
          html: `
            <div style="background: ${bg}; color: white; width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; border: 1.5px solid rgba(255,255,255,0.7); box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
              ${symbol}
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([space.lat, space.lng], { icon });
        marker.bindPopup(`
          <div style="font-size: 12px;">
            <div style="font-weight: 700; color: #34d399;">${space.name}</div>
            <div style="color: #94a3b8; margin: 3px 0;">${space.desc}</div>
            <div style="font-size: 11px; color: #cbd5e1; font-weight: 600;">
              Hours: ${space.openHour === 0 && space.closeHour === 24 ? 'Open 24/7' : `${space.openHour}:00 - ${space.closeHour}:00`}
            </div>
          </div>
        `);
        poiGroup.addLayer(marker);
      });
    }

    // 3. Help Points (Police stations, Hospitals)
    if (activeLayers.helpPoints && safetyData.helpPoints) {
      safetyData.helpPoints.forEach((hp) => {
        const isHospital = hp.type === 'hospital';
        const bg = isHospital ? '#ef4444' : '#3b82f6';
        const symbol = isHospital ? '✚' : '★';

        const icon = L.divIcon({
          className: 'custom-help-point',
          html: `
            <div style="background: ${bg}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; border: 2px solid white; box-shadow: 0 0 10px ${bg};">
              ${symbol}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([hp.lat, hp.lng], { icon });
        marker.bindPopup(`
          <div style="font-size: 12px;">
            <div style="font-weight: 700; color: #f87171;">${hp.name}</div>
            <div style="color: #94a3b8; margin: 3px 0;">${hp.desc}</div>
            <div style="color: #38bdf8; font-weight: 600; font-size: 11px;">Emergency Call: ${hp.contact}</div>
          </div>
        `);
        poiGroup.addLayer(marker);
      });
    }

    // 4. Public Transport Stops
    if (activeLayers.publicTransport && safetyData.publicTransport) {
      safetyData.publicTransport.forEach((pt) => {
        const icon = L.divIcon({
          className: 'custom-pt-stop',
          html: `
            <div style="background: #0ea5e9; color: white; width: 18px; height: 18px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 1px solid white;">
              🚌
            </div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const marker = L.marker([pt.lat, pt.lng], { icon });
        marker.bindTooltip(`<b>Transit Stop:</b> ${pt.name}`);
        poiGroup.addLayer(marker);
      });
    }

    // 5. Past Incidents (Shown as small faded dots that fade with age, STRICTLY NO red zones or neighborhood shapes)
    if (activeLayers.incidents && safetyData.incidents) {
      safetyData.incidents.forEach((inc) => {
        // Calculate age for opacity fade
        const reportDate = new Date(inc.date);
        const now = new Date('2026-11-15T18:00:00Z');
        const ageDays = (now - reportDate) / (1000 * 60 * 60 * 24);
        const decay = Math.pow(2, -Math.max(0, ageDays) / 30);
        const opacity = Math.max(0.25, Math.min(0.85, decay * (inc.verified ? 0.8 : 0.4)));

        const circle = L.circleMarker([inc.lat, inc.lng], {
          radius: 6,
          color: '#f97316',
          fillColor: '#f97316',
          fillOpacity: opacity,
          weight: 1.5,
        });

        circle.bindPopup(`
          <div style="font-size: 12px; max-width: 200px;">
            <div style="font-weight: 700; color: #fb923c;">${inc.title}</div>
            <div style="color: #94a3b8; font-size: 11px; margin: 3px 0;">${inc.description}</div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #cbd5e1; margin-top: 4px;">
              <span>${inc.verified ? '✓ Verified Police Log' : '○ Citizen Report'}</span>
              <span>Decay: ${Math.round(decay * 100)}%</span>
            </div>
          </div>
        `);
        poiGroup.addLayer(circle);
      });
    }

    // 6. Road Closures
    if (safetyData.roadClosures && safetyData.roadClosures.length > 0) {
      safetyData.roadClosures.forEach((closure) => {
        if (!closure.active) return;

        // Barrier icon
        const icon = L.divIcon({
          className: 'custom-closure-icon',
          html: `
            <div style="background: #dc2626; color: white; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 2px solid #fee2e2; box-shadow: 0 0 14px rgba(220,38,38,0.9); animation: pulse 1.5s infinite;">
              ⛔
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([closure.lat, closure.lng], { icon });
        marker.bindPopup(`
          <div style="font-size: 12px; color: #f87171;">
            <b>Active Road Closure</b><br/>
            ${closure.reason || 'Closed road segment'}<br/>
            <span style="font-size: 10px; color: #fca5a5;">All crossing routes flagged infeasible</span>
          </div>
        `);
        poiGroup.addLayer(marker);

        // Subdued radius ring for closure buffer
        const buffer = L.circle([closure.lat, closure.lng], {
          radius: closure.radiusMeters || 45,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.15,
          weight: 1,
          dashArray: '4, 4',
        });
        poiGroup.addLayer(buffer);
      });
    }
  }, [activeLayers, safetyData, simulatedOutages]);

  // Handle Simulated Trip Marker Movement
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (simulatedTripPosition) {
      const [lat, lng] = simulatedTripPosition;

      if (!tripMarkerRef.current) {
        const icon = L.divIcon({
          className: 'custom-trip-vehicle',
          html: `
            <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
              <div class="pulse-ring" style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(56, 189, 248, 0.4);"></div>
              <div style="position: relative; background: #0284c7; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 0 10px #38bdf8;">
                🚶
              </div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        tripMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);
      } else {
        tripMarkerRef.current.setLatLng([lat, lng]);
      }
    } else {
      if (tripMarkerRef.current) {
        tripMarkerRef.current.remove();
        tripMarkerRef.current = null;
      }
    }
  }, [simulatedTripPosition]);

  // Handle Simulated Deviation Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (simulatedDeviationPosition) {
      const [lat, lng] = simulatedDeviationPosition;
      if (!deviationMarkerRef.current) {
        const icon = L.divIcon({
          className: 'custom-deviation-marker',
          html: `
            <div style="background: #f59e0b; color: black; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 800; border: 2px solid white; box-shadow: 0 0 10px #f59e0b; white-space: nowrap;">
              ⚠️ Deviation >100m
            </div>
          `,
          iconSize: [110, 24],
          iconAnchor: [55, 12],
        });
        deviationMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1200 }).addTo(map);
      } else {
        deviationMarkerRef.current.setLatLng([lat, lng]);
      }
    } else {
      if (deviationMarkerRef.current) {
        deviationMarkerRef.current.remove();
        deviationMarkerRef.current = null;
      }
    }
  }, [simulatedDeviationPosition]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full min-h-[380px] z-10" />

      {/* Map Interactive Hint Badge */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-slate-300">
            Interactive Safety Map • Tap route or markers
          </span>
        </div>
      </div>
    </div>
  );
}
