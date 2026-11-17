// Pure scoring engine for SurakshitPath
// Transparent, multi-factor safety evaluation for night travel

/**
 * Calculates great-circle distance between two coordinates in meters using the Haversine formula.
 */
export function getDistanceMeters(coord1, coord2) {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Splits a route coordinate array into ~50m discrete segments for granular localized analysis.
 * Avoids any whole-neighborhood labeling.
 */
export function segmentRoute(coordinates, targetSegmentLength = 50) {
  if (!coordinates || coordinates.length < 2) return [];

  const segments = [];
  let currentSegment = [];
  let currentAccumulatedDist = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    const legDist = getDistanceMeters(p1, p2);

    if (legDist <= 0) continue;

    // If leg is longer than segment length, interpolate sub-points
    const steps = Math.max(1, Math.round(legDist / targetSegmentLength));
    for (let s = 0; s < steps; s++) {
      const fracStart = s / steps;
      const fracEnd = (s + 1) / steps;

      const subStart = [
        p1[0] + (p2[0] - p1[0]) * fracStart,
        p1[1] + (p2[1] - p1[1]) * fracStart,
      ];
      const subEnd = [
        p1[0] + (p2[0] - p1[0]) * fracEnd,
        p1[1] + (p2[1] - p1[1]) * fracEnd,
      ];

      const mid = [
        (subStart[0] + subEnd[0]) / 2,
        (subStart[1] + subEnd[1]) / 2,
      ];

      const segLength = getDistanceMeters(subStart, subEnd);

      segments.push({
        id: `seg-${segments.length + 1}`,
        start: subStart,
        end: subEnd,
        midpoint: mid,
        lengthMeters: segLength,
      });
    }
  }

  return segments;
}

/**
 * Checks whether an active space is currently open at a specific time of night.
 * @param {Object} place - Active space object with openHour and closeHour (e.g., 0-24, or 18 to 4 next day)
 * @param {number} timeOfDayHours - Current query time (e.g., 22.0 for 10:00 PM)
 */
export function isPlaceOpen(place, timeOfDayHours = 22) {
  const { openHour, closeHour } = place;
  if (openHour === 0 && closeHour === 24) return true; // 24x7

  if (openHour < closeHour) {
    // Standard daytime into night, e.g. 7 to 23.5
    return timeOfDayHours >= openHour && timeOfDayHours <= closeHour;
  } else {
    // Overnight operation spanning midnight, e.g. 18 to 4
    return timeOfDayHours >= openHour || timeOfDayHours <= closeHour;
  }
}

/**
 * Calculates exponential decay factor for incidents based on age.
 * Half-life defaults to 30 days. Old incidents fade toward negligible impact.
 */
export function calculateIncidentDecay(incidentDateStr, referenceDate = new Date('2026-11-15T18:00:00Z'), halfLifeDays = 30) {
  const reportTime = new Date(incidentDateStr).getTime();
  const refTime = new Date(referenceDate).getTime();
  const ageDays = Math.max(0, (refTime - reportTime) / (1000 * 60 * 60 * 24));
  // Decay formula: 2 ^ (-age / halfLife)
  return Math.pow(2, -ageDays / halfLifeDays);
}

/**
 * Evaluates individual factors for a 50m segment.
 * Returns factor scores 0-100 (100 = best/safest), plus data density count for confidence estimation.
 */
export function scoreSegment(segment, safetyData, options = {}) {
  const {
    bufferRadius = 60,
    timeOfDayHours = 22,
    weights = { lighting: 0.25, activeSpaces: 0.20, publicTransport: 0.15, helpPoints: 0.20, incidents: 0.20 },
    simulatedOutages = [],     // array of disabled light IDs
    referenceDate = new Date('2026-11-15T18:00:00Z')
  } = options;

  const mid = segment.midpoint;
  let totalDataPointsSeen = 0;

  // 1. Check for Road Closures directly intersecting or within 35m of this segment
  let isClosed = false;
  let closureReason = null;
  if (safetyData.roadClosures && safetyData.roadClosures.length > 0) {
    for (const closure of safetyData.roadClosures) {
      if (!closure.active) continue;
      const d = getDistanceMeters(mid, [closure.lat, closure.lng]);
      if (d <= (closure.radiusMeters || 45)) {
        isClosed = true;
        closureReason = closure.reason || "Road segment closed";
        break;
      }
    }
  }

  if (isClosed) {
    return {
      isClosed: true,
      closureReason,
      overallScore: 0,
      factors: {
        lighting: 0,
        activeSpaces: 0,
        publicTransport: 0,
        helpPoints: 0,
        incidents: 0
      },
      dataDensity: 0
    };
  }

  // 2. Lighting Score (0 - 100)
  // Street lights nearby (buffer ~60m)
  let lightingNearbyPoints = 0;
  let lightingPowerSum = 0;

  (safetyData.streetLights || []).forEach((sl) => {
    if (!sl.active || simulatedOutages.includes(sl.id)) return;
    const d = getDistanceMeters(mid, [sl.lat, sl.lng]);
    if (d <= bufferRadius) {
      lightingNearbyPoints++;
      const proximityFactor = Math.max(0, 1 - (d / bufferRadius));
      const intensityFactor = sl.intensity === 'high' ? 1.0 : sl.intensity === 'medium' ? 0.75 : 0.5;
      lightingPowerSum += proximityFactor * intensityFactor;
    }
  });
  totalDataPointsSeen += lightingNearbyPoints;
  // Score: 1 high light gives ~70, 2 or more close lights saturate to 100
  const rawLightingScore = Math.min(100, Math.round(lightingPowerSum * 75));

  // 3. Active Public Spaces (0 - 100)
  // Evaluates open shops, 24x7 pharmacies, petrol pumps at the specific night hour
  let activeSpacesNearby = 0;
  let activeSpacesWeight = 0;

  (safetyData.activeSpaces || []).forEach((space) => {
    const d = getDistanceMeters(mid, [space.lat, space.lng]);
    if (d <= bufferRadius + 30) { // Active shops have slightly wider visibility zone (~90m)
      const isOpen = isPlaceOpen(space, timeOfDayHours);
      if (isOpen) {
        activeSpacesNearby++;
        const prox = Math.max(0, 1 - (d / (bufferRadius + 30)));
        // 24x7 pharmacies and fuel stations offer highest night safety reassurance
        const multiplier = space.type === 'pharmacy' ? 1.2 : space.type === 'petrol_pump' ? 1.1 : 0.9;
        activeSpacesWeight += prox * multiplier;
      }
    }
  });
  totalDataPointsSeen += activeSpacesNearby;
  const rawActiveSpacesScore = Math.min(100, Math.round(activeSpacesWeight * 80));

  // 4. Public Transport Distance (0 - 100)
  // Closer to transit stops = higher vigilance, available escape routes
  let minTransportDist = Infinity;
  (safetyData.publicTransport || []).forEach((pt) => {
    const d = getDistanceMeters(mid, [pt.lat, pt.lng]);
    if (d < minTransportDist) {
      minTransportDist = d;
    }
  });

  let rawTransportScore = 20; // baseline presence
  if (minTransportDist !== Infinity) {
    if (minTransportDist <= 60) rawTransportScore = 100;
    else if (minTransportDist <= 150) rawTransportScore = 80;
    else if (minTransportDist <= 300) rawTransportScore = 55;
    else if (minTransportDist <= 500) rawTransportScore = 35;
    else rawTransportScore = 15;
    if (minTransportDist <= 200) totalDataPointsSeen++;
  }

  // 5. Help Points Distance (0 - 100)
  // Distance to nearest hospital ER or police outpost
  let minHelpDist = Infinity;
  let nearestHelp = null;
  (safetyData.helpPoints || []).forEach((hp) => {
    const d = getDistanceMeters(mid, [hp.lat, hp.lng]);
    if (d < minHelpDist) {
      minHelpDist = d;
      nearestHelp = hp;
    }
  });

  let rawHelpScore = 25;
  if (minHelpDist !== Infinity) {
    if (minHelpDist <= 80) rawHelpScore = 100;
    else if (minHelpDist <= 200) rawHelpScore = 85;
    else if (minHelpDist <= 400) rawHelpScore = 65;
    else if (minHelpDist <= 700) rawHelpScore = 45;
    else rawHelpScore = 25;
    if (minHelpDist <= 350) totalDataPointsSeen++;
  }

  // 6. Recent Incidents with Age Decay & Cap (0 - 100, 100 is pristine / no incidents)
  let totalIncidentPenalty = 0;
  (safetyData.incidents || []).forEach((inc) => {
    const d = getDistanceMeters(mid, [inc.lat, inc.lng]);
    // Incident influence radius is ~75m
    if (d <= 75) {
      totalDataPointsSeen++;
      const decay = calculateIncidentDecay(inc.date, referenceDate, 30);
      const distFactor = Math.max(0, 1 - (d / 75));
      const baseSeverityPenalty = inc.severity === 'high' ? 26 : inc.severity === 'medium' ? 18 : 10;
      
      // Fairness rule: Unverified reports have very little weight (discounted by 75%)
      const verificationMultiplier = inc.verified ? 1.0 : 0.25;

      const incidentPenalty = Math.min(28, baseSeverityPenalty * distFactor * decay * verificationMultiplier);
      totalIncidentPenalty += incidentPenalty;
    }
  });

  // Cap total penalty on a single segment so incidents never completely dominate
  totalIncidentPenalty = Math.min(60, totalIncidentPenalty);
  const rawIncidentScore = Math.max(0, Math.round(100 - totalIncidentPenalty));

  // Weighted sum for this segment
  const factors = {
    lighting: rawLightingScore,
    activeSpaces: rawActiveSpacesScore,
    publicTransport: rawTransportScore,
    helpPoints: rawHelpScore,
    incidents: rawIncidentScore,
  };

  const wSum =
    (weights.lighting || 0.25) * factors.lighting +
    (weights.activeSpaces || 0.20) * factors.activeSpaces +
    (weights.publicTransport || 0.15) * factors.publicTransport +
    (weights.helpPoints || 0.20) * factors.helpPoints +
    (weights.incidents || 0.20) * factors.incidents;

  return {
    isClosed: false,
    overallScore: Math.round(wSum),
    factors,
    dataDensity: totalDataPointsSeen,
  };
}

/**
 * Scores an entire route by segmenting it, evaluating all segments, applying fairness shrinkage
 * for sparse areas, and deriving human-readable factor explanations.
 */
export function scoreRoute(route, safetyData, options = {}) {
  const {
    targetSegmentLength = 50,
    weights = { lighting: 0.25, activeSpaces: 0.20, publicTransport: 0.15, helpPoints: 0.20, incidents: 0.20 },
    timeOfDayHours = 22,
    simulatedOutages = [],
    referenceDate = new Date('2026-11-15T18:00:00Z'),
  } = options;

  const segments = segmentRoute(route.coordinates, targetSegmentLength);
  if (segments.length === 0) {
    return {
      routeId: route.id,
      isInfeasible: true,
      infeasibleReason: "No navigable segments",
      score: 0,
      confidence: "Low",
      factorAverages: { lighting: 0, activeSpaces: 0, publicTransport: 0, helpPoints: 0, incidents: 0 },
      explanations: ["Route coordinates are empty or invalid."],
      segments: [],
    };
  }

  let totalScoreSum = 0;
  let factorSums = {
    lighting: 0,
    activeSpaces: 0,
    publicTransport: 0,
    helpPoints: 0,
    incidents: 0,
  };

  let totalDataPointsOnRoute = 0;
  let closedSegmentCount = 0;
  let firstClosureReason = null;
  const scoredSegments = [];

  for (const seg of segments) {
    const scoredSeg = scoreSegment(seg, safetyData, {
      weights,
      timeOfDayHours,
      simulatedOutages,
      referenceDate,
    });

    if (scoredSeg.isClosed) {
      closedSegmentCount++;
      if (!firstClosureReason) firstClosureReason = scoredSeg.closureReason;
    }

    totalScoreSum += scoredSeg.overallScore;
    factorSums.lighting += scoredSeg.factors.lighting;
    factorSums.activeSpaces += scoredSeg.factors.activeSpaces;
    factorSums.publicTransport += scoredSeg.factors.publicTransport;
    factorSums.helpPoints += scoredSeg.factors.helpPoints;
    factorSums.incidents += scoredSeg.factors.incidents;
    totalDataPointsOnRoute += scoredSeg.dataDensity;

    scoredSegments.push({
      ...seg,
      ...scoredSeg,
    });
  }

  // If any segment is closed, the route becomes infeasible
  const isInfeasible = closedSegmentCount > 0;

  const count = segments.length;
  const factorAverages = {
    lighting: Math.round(factorSums.lighting / count),
    activeSpaces: Math.round(factorSums.activeSpaces / count),
    publicTransport: Math.round(factorSums.publicTransport / count),
    helpPoints: Math.round(factorSums.helpPoints / count),
    incidents: Math.round(factorSums.incidents / count),
  };

  const rawRouteScore = Math.round(totalScoreSum / count);

  // Fairness rule: Where data is sparse, show LOW CONFIDENCE and shrink the score toward a neutral value (50)
  // Calculate average data density per segment
  const avgDataDensity = totalDataPointsOnRoute / count;
  let confidence = "High";
  let confidenceNote = "Good sensor and community data density along this corridor";
  let shrinkageFactor = 0; // 0 = no shrinkage (100% data driven)

  if (avgDataDensity < 0.6) {
    confidence = "Low";
    confidenceNote = "Limited data here; score adjusted toward neutral 50";
    shrinkageFactor = 0.35; // shrink 35% towards 50
  } else if (avgDataDensity < 1.3) {
    confidence = "Medium";
    confidenceNote = "Moderate data coverage; verified landmarks used";
    shrinkageFactor = 0.15; // shrink 15% towards 50
  }

  // Shrinkage towards neutral 50
  const neutralScore = 50;
  const finalSafetyScore = isInfeasible
    ? 0
    : Math.round((1 - shrinkageFactor) * rawRouteScore + shrinkageFactor * neutralScore);

  // Generate plain-language explanations (top helping and hurting factors)
  const explanations = generateExplanations(factorAverages, confidence, isInfeasible, firstClosureReason);

  return {
    routeId: route.id,
    name: route.name,
    label: route.label,
    summary: route.summary,
    distance: route.distance,
    duration: route.duration,
    color: route.color,
    coordinates: route.coordinates,
    isInfeasible,
    infeasibleReason: firstClosureReason,
    score: finalSafetyScore,
    rawScore: rawRouteScore,
    confidence,
    confidenceNote,
    factorAverages,
    explanations,
    segments: scoredSegments,
  };
}

/**
 * Creates human-friendly plain text explanations of why a route scored the way it did.
 * Example: "78% of the route has continuous street lighting."
 */
export function generateExplanations(factors, confidence, isInfeasible, closureReason) {
  if (isInfeasible) {
    return {
      summary: `Road blocked: ${closureReason || "Closure active"}. Route infeasible.`,
      positives: [],
      negatives: [`Active road closure detected on this corridor. Reroute required.`],
    };
  }

  const positives = [];
  const negatives = [];

  // Lighting
  if (factors.lighting >= 70) {
    positives.push(`Bright street lighting across ${factors.lighting}% of this arterial path`);
  } else if (factors.lighting < 40) {
    negatives.push(`Low street light coverage (${factors.lighting}%), with extended unlit stretches`);
  }

  // Active Spaces
  if (factors.activeSpaces >= 65) {
    positives.push(`Active commercial activity nearby with open 24x7 pharmacies & lit stations`);
  } else if (factors.activeSpaces < 35) {
    negatives.push(`Very few active commercial venues open at this hour`);
  }

  // Help Points
  if (factors.helpPoints >= 70) {
    positives.push(`Immediate proximity to emergency hubs (police outpost / 24h hospital ER)`);
  } else if (factors.helpPoints < 40) {
    negatives.push(`Longer distance to nearest verified hospital or police station`);
  }

  // Public Transport
  if (factors.publicTransport >= 65) {
    positives.push(`Well-served transit corridor with active bus shelters`);
  } else if (factors.publicTransport < 35) {
    negatives.push(`Isolated from major public transit stops`);
  }

  // Incidents
  if (factors.incidents >= 90) {
    positives.push(`Zero recent verified safety incidents reported on this segment`);
  } else if (factors.incidents < 75) {
    negatives.push(`Contains segments adjacent to past reported safety incidents`);
  }

  // Construct top summary
  let summary = "";
  if (positives.length > 0) {
    summary = positives.slice(0, 2).join(". ") + ".";
  } else {
    summary = "Moderate average safety conditions based on current street data.";
  }

  return {
    summary,
    positives: positives.slice(0, 3),
    negatives: negatives.slice(0, 3),
  };
}

/**
 * Combines Travel Time and Safety Score based on user trade-off slider w.
 * w = 0 -> Fastest route priority
 * w = 1 -> Safest route priority
 *
 * Formula required by problem statement:
 * Combined ranking = (1 - w) * normalisedTime + w * normalisedRisk
 * where:
 * normalisedTime = (duration - minDuration) / (maxDuration - minDuration || 1)
 * normalisedRisk = (100 - score) / 100
 *
 * Lower combined cost is best.
 */
export function rankRoutes(scoredRoutes, tradeoffWeight = 0.65) {
  const feasibleRoutes = scoredRoutes.filter((r) => !r.isInfeasible);
  const infeasibleRoutes = scoredRoutes.filter((r) => r.isInfeasible);

  if (feasibleRoutes.length === 0) {
    return scoredRoutes.map((r, idx) => ({
      ...r,
      rank: idx + 1,
      combinedCost: 9999,
      isRecommended: false,
    }));
  }

  const durations = feasibleRoutes.map((r) => r.duration);
  const minDur = Math.min(...durations);
  const maxDur = Math.max(...durations);
  const durSpan = maxDur - minDur || 1;

  const scoredWithRank = feasibleRoutes.map((route) => {
    // 0 is fastest, 1 is slowest
    const normalisedTime = (route.duration - minDur) / durSpan;

    // normalisedRisk: score 100 -> risk 0, score 0 -> risk 1
    const normalisedRisk = Math.max(0, Math.min(1, (100 - route.score) / 100));

    // Combined cost metric: lower is better
    const combinedCost = (1 - tradeoffWeight) * normalisedTime + tradeoffWeight * normalisedRisk;

    return {
      ...route,
      normalisedTime: Number(normalisedTime.toFixed(3)),
      normalisedRisk: Number(normalisedRisk.toFixed(3)),
      combinedCost: Number(combinedCost.toFixed(3)),
    };
  });

  // Sort by lowest combined cost
  scoredWithRank.sort((a, b) => a.combinedCost - b.combinedCost);

  // Tag recommended route
  const rankedFeasible = scoredWithRank.map((r, idx) => ({
    ...r,
    rank: idx + 1,
    isRecommended: idx === 0,
  }));

  // Append infeasible routes at the end
  const rankedInfeasible = infeasibleRoutes.map((r, idx) => ({
    ...r,
    rank: rankedFeasible.length + idx + 1,
    combinedCost: 999,
    normalisedTime: 1,
    normalisedRisk: 1,
    isRecommended: false,
  }));

  return [...rankedFeasible, ...rankedInfeasible];
}
