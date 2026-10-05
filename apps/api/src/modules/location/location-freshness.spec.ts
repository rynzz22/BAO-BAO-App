import { TrackingSource } from '@bao-bao/shared';
import {
  calculateLocationFreshness,
  LIVE_APP_FRESHNESS_THRESHOLD_SEC,
  MAP_VISIBILITY_EXPIRY_SEC,
} from './location-freshness';

describe('calculateLocationFreshness', () => {
  const baseNow = new Date('2026-10-05T12:00:00Z');

  it('keeps LIVE_APP when ping is 30 seconds old', () => {
    const pingTime = new Date(baseNow.getTime() - 30 * 1000);
    const result = calculateLocationFreshness(TrackingSource.LIVE_APP, pingTime, baseNow);

    expect(result.effectiveSource).toBe(TrackingSource.LIVE_APP);
    expect(result.ageSeconds).toBe(30);
    expect(result.isHidden).toBe(false);
  });

  it('downgrades LIVE_APP to LAST_REPORTED when older than 2 minutes (121 seconds)', () => {
    const pingTime = new Date(baseNow.getTime() - (LIVE_APP_FRESHNESS_THRESHOLD_SEC + 1) * 1000);
    const result = calculateLocationFreshness(TrackingSource.LIVE_APP, pingTime, baseNow);

    expect(result.effectiveSource).toBe(TrackingSource.LAST_REPORTED);
    expect(result.ageSeconds).toBe(121);
    expect(result.isHidden).toBe(false);
  });

  it('marks location as isHidden when older than 30 minutes (1801 seconds)', () => {
    const pingTime = new Date(baseNow.getTime() - (MAP_VISIBILITY_EXPIRY_SEC + 1) * 1000);
    const result = calculateLocationFreshness(TrackingSource.LIVE_APP, pingTime, baseNow);

    expect(result.effectiveSource).toBe(TrackingSource.LAST_REPORTED);
    expect(result.isHidden).toBe(true);
  });

  it('retains TERMINAL tracking source across time', () => {
    const checkInTime = new Date(baseNow.getTime() - 10 * 60 * 1000); // 10 minutes ago
    const result = calculateLocationFreshness(TrackingSource.TERMINAL, checkInTime, baseNow);

    expect(result.effectiveSource).toBe(TrackingSource.TERMINAL);
    expect(result.isHidden).toBe(false);
  });

  it('retains GPS_TRACKER tracking source within visibility window', () => {
    const trackerPing = new Date(baseNow.getTime() - 60 * 1000);
    const result = calculateLocationFreshness(TrackingSource.GPS_TRACKER, trackerPing, baseNow);

    expect(result.effectiveSource).toBe(TrackingSource.GPS_TRACKER);
    expect(result.isHidden).toBe(false);
  });
});
