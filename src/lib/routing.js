// Routing service with OSRM public demo server and robust offline fallback

import fallbackData from '../data/fallback_routes.json';

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Fetch routes from OSRM with alternatives=true.
 * If network fails or times out, seamlessly falls back to bundled pre-saved routes.
 *
 * @param {Array<number>} startCoord - [lat, lng]
 * @param {Array<number>} endCoord - [lat, lng]
 * @returns {Promise<{ routes: Array<Object>, isOffline: boolean, message?: string }>}
 */
export async function fetchRoutes(startCoord, endCoord) {
  const [startLat, startLng] = startCoord;
  const [endLat, endLng] = endCoord;

  // Format for OSRM URL: {lng},{lat};{lng},{lat}
  const url = `${OSRM_BASE_URL}/${startLng},${startLat};${endLng},${endLat}?alternatives=true&geometries=geojson&overview=full&steps=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM status ${response.status}`);
    }

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes returned from OSRM');
    }

    const colors = ['#10b981', '#38bdf8', '#f59e0b', '#a855f7'];

    const formattedRoutes = data.routes.map((r, idx) => {
      // OSRM GeoJSON gives [lng, lat]; convert to [lat, lng] for Leaflet
      const leafletCoords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

      const routeNames = [
        'Corridor Alpha (Primary Arterial)',
        'Corridor Beta (Mid-Link Avenue)',
        'Corridor Gamma (Secondary Bypass)',
        'Corridor Delta (Outer Ring)',
      ];

      return {
        id: `osrm-route-${idx + 1}`,
        name: routeNames[idx] || `Route Option ${idx + 1}`,
        label: idx === 0 ? 'Primary Option' : `Alternative ${idx}`,
        summary: `Navigated via public transit corridors (${Math.round(r.distance / 1000 * 10) / 10} km)`,
        distance: Math.round(r.distance),
        duration: Math.round(r.duration),
        color: colors[idx % colors.length],
        coordinates: leafletCoords,
      };
    });

    return {
      routes: formattedRoutes,
      isOffline: false,
      message: 'Live OSRM routes loaded',
    };
  } catch (err) {
    // Graceful offline fallback
    console.warn('OSRM request unsuccessful, falling back to bundled offline routes:', err.message);

    return {
      routes: fallbackData.routes.map((r) => ({ ...r })),
      isOffline: true,
      message: 'Using bundled offline demo routes (Central Mangalore)',
    };
  }
}
