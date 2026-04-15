const EARTH_RADIUS_KM = 6371;

/**
 * Converts meters to kilometers, rounded to 1 decimal.
 */
export function metersToKm(meters: number): number {
  return Math.round(meters / 100) / 10;
}

/**
 * Converts kilometers to meters.
 */
export function kmToMeters(km: number): number {
  return km * 1000;
}

/**
 * Formats a distance for UI display.
 * < 1 km → "< 1 km"
 * 1-50 km → "X km away"
 * > 50 km → "50+ km away"
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return "< 1 km away";
  if (distanceKm > 50) return "50+ km away";
  return `${Math.round(distanceKm)} km away`;
}

/**
 * Haversine formula — calculates the great-circle distance between two
 * lat/lng coordinate pairs. Returns distance in kilometers.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
