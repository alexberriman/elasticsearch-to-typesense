import { resolveMappedField } from "./resolve-mapped-field.js";
import { TransformerContext } from "../core/types.js";
import { isNumeric } from "./is-numeric.js";

export const transformGeoSort = (
  sortOptions: Record<string, any>,
  ctx: TransformerContext
): { sort?: string; warnings: string[] } => {
  const warnings: string[] = [];

  const geoFieldEntries = Object.entries(sortOptions).filter(
    ([key, value]) =>
      key !== "order" &&
      key !== "unit" &&
      typeof value === "object" &&
      value !== null
  );

  if (geoFieldEntries.length !== 1) {
    warnings.push(
      "Invalid geo_distance sort: expected exactly one field with coordinates"
    );
    return { warnings };
  }

  const [fieldName, coordinates] = geoFieldEntries[0];

  if (
    coordinates === undefined ||
    coordinates === null ||
    !isNumeric(coordinates.lat) ||
    !isNumeric(coordinates.lon)
  ) {
    warnings.push(`Invalid geo_distance coordinates for field '${fieldName}'`);
    return { warnings };
  }

  const order = sortOptions.order !== undefined ? sortOptions.order : "asc";
  if (order !== "asc" && order !== "desc") {
    warnings.push(`Invalid sort order: ${order}. Using 'asc' instead.`);
  }

  const mappedField = resolveMappedField(fieldName, ctx);
  if (mappedField === undefined || mappedField === null) {
    warnings.push(`Unmapped geo field: ${fieldName}`);
    return { warnings };
  }

  return {
    sort: `${mappedField}(${coordinates.lat},${coordinates.lon}):${order}`,
    warnings,
  };
};
