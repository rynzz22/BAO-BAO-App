import { TrackingSource } from '@bao-bao/shared';

export interface FreshnessResult {
  effectiveSource: TrackingSource;
  ageSeconds: number;
  isHidden: boolean;
}

export const LIVE_APP_FRESHNESS_THRESHOLD_SEC = 120; // 2 minutes
export const MAP_VISIBILITY_EXPIRY_SEC = 1800; // 30 minutes

export function calculateLocationFreshness(
  originalSource: TrackingSource,
  locationUpdatedAt: Date | string,
  now: Date = new Date(),
): FreshnessResult {
  const updatedTime = typeof locationUpdatedAt === 'string'
    ? new Date(locationUpdatedAt).getTime()
    : locationUpdatedAt.getTime();
  const currentTime = now.getTime();
  const ageSeconds = Math.max(0, Math.floor((currentTime - updatedTime) / 1000));

  // Beyond 30 minutes, hidden from map
  const isHidden = ageSeconds > MAP_VISIBILITY_EXPIRY_SEC;

  // Honesty downgrade rule: LIVE_APP older than 2 minutes becomes LAST_REPORTED
  let effectiveSource = originalSource;
  if (originalSource === TrackingSource.LIVE_APP && ageSeconds > LIVE_APP_FRESHNESS_THRESHOLD_SEC) {
    effectiveSource = TrackingSource.LAST_REPORTED;
  }

  return {
    effectiveSource,
    ageSeconds,
    isHidden,
  };
}
