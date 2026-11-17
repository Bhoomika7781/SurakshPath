// Configuration for SurakshitPath prototype
// Designed to keep area, presets, scoring weights and constants in one easily configurable place.

export const CONFIG = {
  areaName: "Central Mangalore",
  regionBounds: {
    north: 12.8850,
    south: 12.8550,
    west: 74.8300,
    east: 74.8750,
  },
  mapCenter: [12.8680, 74.8530],
  defaultZoom: 14,

  // Preset locations for quick navigation selection
  presets: [
    {
      id: "hampankatta",
      name: "Hampankatta (Clock Tower)",
      coordinates: [12.8698, 74.8430], // [lat, lng]
      desc: "City commercial hub & transit junction"
    },
    {
      id: "kankanady",
      name: "Kankanady Bypass (Pumpwell Link)",
      coordinates: [12.8635, 74.8630],
      desc: "Major transit & healthcare hub"
    },
    {
      id: "jyothi",
      name: "Ambedkar Circle (Jyothi)",
      coordinates: [12.8728, 74.8492],
      desc: "University & theater crossroad"
    },
    {
      id: "balmatta",
      name: "Balmatta Collector Gate",
      coordinates: [12.8715, 74.8540],
      desc: "Arterial road with active commerce"
    },
    {
      id: "falnir",
      name: "Falnir Mother Teresa Rd",
      coordinates: [12.8645, 74.8510],
      desc: "Residential & clinic corridor"
    },
    {
      id: "railway_station",
      name: "Mangalore Central Station",
      coordinates: [12.8615, 74.8420],
      desc: "Railway terminus link"
    }
  ],

  defaultStartId: "hampankatta",
  defaultEndId: "kankanady",

  // Factor weights for the multi-factor safety scoring
  defaultWeights: {
    lighting: 0.25,
    activeSpaces: 0.20,
    publicTransport: 0.15,
    helpPoints: 0.20,
    incidents: 0.20,
  },

  // Scoring spatial parameters
  scoring: {
    segmentLengthMeters: 50,       // Split route into ~50m segments
    bufferRadiusMeters: 60,         // Search radius for features around segment midpoint
    incidentHalfLifeDays: 30,       // Incident decay: half-life ~30 days
    maxIncidentPenaltyPerReport: 28,// Single incident cannot exceed this penalty (never dominate)
    unverifiedIncidentDiscount: 0.25,// Unverified reports count for only 25% penalty
    sparseDataThreshold: 2,         // Fewer than 2 detected data points triggers confidence shrinkage
    neutralScore: 50,               // Neutral baseline for shrinkage when confidence is low
  },

  // Slider default
  defaultTradeoffSlider: 0.65, // 0 = Fastest, 1 = Safest (Default leaning towards Safe)

  // Demo simulation default trip settings
  tripSimulation: {
    stepIntervalMs: 500,           // Animation tick
    stopThresholdSeconds: 20,       // 20 sec unexpected stop trigger
    deviationThresholdMeters: 100,  // 100 m off route trigger
    countdownSeconds: 15,           // Countdown to dispatch safety alert
  },

  // Fairness rule statement
  fairnessNote: "Scores describe current conditions on this route, not the people or the area. Dynamic conditions fade over time.",
  disclaimer: "SurakshitPath demo data is simulated for hackathon evaluation and prototype verification."
};
