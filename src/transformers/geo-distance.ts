import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types.js";
import { resolveMappedField as resolveField } from "../utils/resolve-mapped-field.js";
import { applyValueTransformer } from "../utils/apply-value-transformer.js";

interface GeoDistanceQuery {
  distance: string;
  [field: string]: unknown;
}

const convertDistanceToKm = (distance: string): number => {
  const value = parseFloat(distance);

  if (distance.endsWith("km")) {
    return value;
  } else if (distance.endsWith("m")) {
    return value / 1000;
  } else if (distance.endsWith("mi")) {
    return value * 1.60934; // 1 mile = 1.60934 km
  } else if (distance.endsWith("yd")) {
    return value * 0.0009144; // 1 yard = 0.0009144 km
  } else if (distance.endsWith("ft")) {
    return value * 0.0003048; // 1 foot = 0.0003048 km
  } else {
    return value;
  }
};

export const transformGeoDistance = (
  geoQuery: unknown,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];

  if (typeof geoQuery !== "object" || geoQuery === null) {
    return {
      query: {},
      warnings: ["Invalid geo_distance query: query is not an object"],
    };
  }

  const query = geoQuery as GeoDistanceQuery;

  const distance = typeof query.distance === "string" ? query.distance : "0km";
  const radiusKm = convertDistanceToKm(distance);

  let geoField = "";
  let latValue = 0;
  let lonValue = 0;
  let mappedField = ""; // Store the mapped field name

  for (const key in query) {
    if (
      key !== "distance" &&
      Object.prototype.hasOwnProperty.call(query, key)
    ) {
      geoField = key;
      const geoPoint = query[key] as { lat?: number; lon?: number };

      if (typeof geoPoint === "object" && geoPoint !== null) {
        // Resolve the mapped field name and store it
        const resolved = resolveField(geoField, ctx);
        mappedField =
          resolved !== undefined && resolved !== null ? resolved : "";

        // Get the original values
        const originalLat =
          typeof geoPoint.lat === "number" || typeof geoPoint.lat === "string"
            ? geoPoint.lat
            : 0;
        const originalLon =
          typeof geoPoint.lon === "number" || typeof geoPoint.lon === "string"
            ? geoPoint.lon
            : 0;

        // Transform values if transformer exists
        const transformedLat = applyValueTransformer({
          elasticField: `${geoField}.lat`,
          typesenseField: `${mappedField}.lat`,
          value: originalLat,
          ctx,
        });

        const transformedLon = applyValueTransformer({
          elasticField: `${geoField}.lon`,
          typesenseField: `${mappedField}.lon`,
          value: originalLon,
          ctx,
        });

        // Convert to number
        latValue =
          typeof transformedLat === "number"
            ? transformedLat
            : parseFloat(String(transformedLat)) || 0;

        lonValue =
          typeof transformedLon === "number"
            ? transformedLon
            : parseFloat(String(transformedLon)) || 0;
      }
    }
  }

  if (!geoField) {
    return {
      query: {},
      warnings: ["Invalid geo_distance query: missing geo field"],
    };
  }

  // If no mappedField was set during the loop, try to resolve it now
  if (!mappedField) {
    const resolved = resolveField(geoField, ctx);
    mappedField = resolved !== undefined && resolved !== null ? resolved : "";
  }

  if (mappedField === "") {
    warnings.push(`Skipped unmapped geo-distance field "${geoField}"`);
    return {
      query: {},
      warnings,
    };
  }

  const filterBy = `${mappedField}:(${latValue}, ${lonValue}, ${radiusKm} km)`;

  return {
    query: { filter_by: filterBy },
    warnings,
  };
};
