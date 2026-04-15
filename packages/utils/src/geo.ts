/**
 * Converts a distance in km to approximate lat/lng degrees delta.
 * Used to build bounding boxes for cheap pre-filtering before exact geo queries.
 */
export function kmToDegrees(km: number): number {
  return km / 111.32;
}

/**
 * Builds a GeoJSON bounding box [minLng, minLat, maxLng, maxLat]
 * around a center coordinate within `radiusKm`.
 */
export function getBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number,
): [number, number, number, number] {
  const latDelta = kmToDegrees(radiusKm);
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  return [lng - lngDelta, lat - latDelta, lng + lngDelta, lat + latDelta];
}

/**
 * Validates that a coordinate pair is within valid ranges.
 * [lng, lat] — GeoJSON order.
 */
export function isValidCoordinates(lng: number, lat: number): boolean {
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}

/**
 * Creates a GeoJSON Point object.
 */
export function toGeoPoint(lng: number, lat: number): { type: "Point"; coordinates: [number, number] } {
  if (!isValidCoordinates(lng, lat)) {
    throw new RangeError(`Invalid coordinates: [${lng}, ${lat}]`);
  }
  return { type: "Point", coordinates: [lng, lat] };
}
