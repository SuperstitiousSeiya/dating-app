import type { PipelineStage } from "mongoose";

/**
 * Builds a MongoDB $geoNear aggregation stage.
 * Must be the FIRST stage in an aggregation pipeline.
 */
export function buildGeoNearStage(
  lng: number,
  lat: number,
  maxDistanceMeters: number,
  distanceField = "distanceMeters",
): PipelineStage.GeoNear {
  return {
    $geoNear: {
      near: { type: "Point", coordinates: [lng, lat] },
      distanceField,
      maxDistance: maxDistanceMeters,
      spherical: true,
    },
  };
}

/**
 * Converts km to meters for MongoDB geospatial queries.
 */
export function kmToMeters(km: number): number {
  return km * 1000;
}
