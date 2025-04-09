import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types.js";
import { resolveMappedField as resolveField } from "../utils/resolve-mapped-field.js";

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

  for (const key in query) {
    if (
      key !== "distance" &&
      Object.prototype.hasOwnProperty.call(query, key)
    ) {
      geoField = key;
      const geoPoint = query[key] as { lat?: number; lon?: number };

      if (typeof geoPoint === "object" && geoPoint !== null) {
        latValue = typeof geoPoint.lat === "number" ? geoPoint.lat : 0;
        lonValue = typeof geoPoint.lon === "number" ? geoPoint.lon : 0;
      }
    }
  }

  if (!geoField) {
    return {
      query: {},
      warnings: ["Invalid geo_distance query: missing geo field"],
    };
  }

  const resolvedField = resolveField(geoField, ctx);
  const filterBy = `${resolvedField}:(${latValue}, ${lonValue}, ${radiusKm} km)`;

  return {
    query: { filter_by: filterBy },
    warnings,
  };
};
