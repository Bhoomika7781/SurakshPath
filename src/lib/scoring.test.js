import { describe, it, expect } from 'vitest';
import {
  getDistanceMeters,
  segmentRoute,
  isPlaceOpen,
  calculateIncidentDecay,
  scoreSegment,
  scoreRoute,
  rankRoutes
} from './scoring.js';

describe('SurakshitPath Scoring & Fairness Engine', () => {
  it('calculates accurate Haversine distance between two coordinates', () => {
    // Hampankatta to Kankanady is roughly 2.3 - 2.5 km direct line
    const p1 = [12.8698, 74.8430];
    const p2 = [12.8635, 74.8630];
    const dist = getDistanceMeters(p1, p2);
    expect(dist).toBeGreaterThan(2100);
    expect(dist).toBeLessThan(2600);
  });

  it('segments a path into ~50m discrete steps', () => {
    const coords = [
      [12.8698, 74.8430],
      [12.8715, 74.8468],
      [12.8728, 74.8492],
    ];
    const segments = segmentRoute(coords, 50);
    expect(segments.length).toBeGreaterThan(5);
    // Each segment should be roughly 40-60 meters
    segments.forEach(seg => {
      expect(seg.lengthMeters).toBeGreaterThan(20);
      expect(seg.lengthMeters).toBeLessThan(75);
    });
  });

  it('determines venue open hours accurately (24h vs daytime vs overnight)', () => {
    const pharmacy24h = { openHour: 0, closeHour: 24 };
    const cafeDaytime = { openHour: 9, closeHour: 23 };
    const nightDiner = { openHour: 19, closeHour: 4 };

    // At 22:00 (10 PM)
    expect(isPlaceOpen(pharmacy24h, 22)).toBe(true);
    expect(isPlaceOpen(cafeDaytime, 22)).toBe(true);
    expect(isPlaceOpen(nightDiner, 22)).toBe(true);

    // At 01:00 (1 AM)
    expect(isPlaceOpen(pharmacy24h, 1)).toBe(true);
    expect(isPlaceOpen(cafeDaytime, 1)).toBe(false);
    expect(isPlaceOpen(nightDiner, 1)).toBe(true);

    // At 05:00 (5 AM)
    expect(isPlaceOpen(nightDiner, 5)).toBe(false);
  });

  it('decays incident severity by half-life (~30 days) to prevent permanent stigmatization', () => {
    const ref = new Date('2026-11-15T18:00:00Z');
    const todayIncident = '2026-11-15T10:00:00Z';
    const oneMonthOldIncident = '2026-10-16T18:00:00Z';
    const twoMonthsOldIncident = '2026-09-16T18:00:00Z';

    const decayToday = calculateIncidentDecay(todayIncident, ref, 30);
    const decay1Month = calculateIncidentDecay(oneMonthOldIncident, ref, 30);
    const decay2Months = calculateIncidentDecay(twoMonthsOldIncident, ref, 30);

    expect(decayToday).toBeCloseTo(1.0, 1);
    expect(decay1Month).toBeCloseTo(0.5, 1);
    expect(decay2Months).toBeCloseTo(0.25, 1);
  });

  it('applies fairness shrinkage toward neutral 50 when data density is low', () => {
    // Route in empty area with no street lights, shops, or incidents
    const mockRoute = {
      id: 'test-empty',
      coordinates: [
        [12.8900, 74.8900],
        [12.8910, 74.8910],
      ],
      distance: 200,
      duration: 30,
    };
    const emptySafetyData = {
      streetLights: [],
      activeSpaces: [],
      publicTransport: [],
      helpPoints: [],
      incidents: [],
      roadClosures: [],
    };

    const scored = scoreRoute(mockRoute, emptySafetyData);
    expect(scored.confidence).toBe('Low');
    // Rather than 0 or extreme danger, shrinkage pulls score toward neutral baseline 50
    expect(scored.score).toBeGreaterThanOrEqual(30);
    expect(scored.score).toBeLessThanOrEqual(60);
    expect(scored.confidenceNote).toContain('Limited data');
  });

  it('correctly marks route infeasible when a road closure blocks it', () => {
    const mockRoute = {
      id: 'test-blocked',
      coordinates: [
        [12.8698, 74.8430],
        [12.8705, 74.8450],
      ],
      distance: 250,
      duration: 40,
    };
    const safetyDataWithClosure = {
      streetLights: [],
      activeSpaces: [],
      publicTransport: [],
      helpPoints: [],
      incidents: [],
      roadClosures: [
        {
          id: 'closure-1',
          lat: 12.8702,
          lng: 74.8440,
          radiusMeters: 50,
          active: true,
          reason: 'Emergency Water Pipeline Repair',
        },
      ],
    };

    const scored = scoreRoute(mockRoute, safetyDataWithClosure);
    expect(scored.isInfeasible).toBe(true);
    expect(scored.score).toBe(0);
    expect(scored.infeasibleReason).toContain('Pipeline Repair');
  });

  it('ranks routes dynamically based on trade-off slider w (Faster vs Safer)', () => {
    const fastRoute = {
      id: 'fast',
      name: 'Fast Route',
      duration: 300, // 5 min
      score: 60,     // moderate safety
      isInfeasible: false,
    };
    const safeRoute = {
      id: 'safe',
      name: 'Safe Route',
      duration: 500, // 8.3 min
      score: 95,     // very safe
      isInfeasible: false,
    };

    // When w = 0 (Fastest priority)
    const rankedFastest = rankRoutes([fastRoute, safeRoute], 0.0);
    expect(rankedFastest[0].id).toBe('fast');

    // When w = 1 (Safest priority)
    const rankedSafest = rankRoutes([fastRoute, safeRoute], 1.0);
    expect(rankedSafest[0].id).toBe('safe');
  });
});
