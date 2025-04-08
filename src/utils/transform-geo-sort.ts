import { resolveMappedField } from "./resolve-mapped-field";
import { TransformerContext } from "../core/types";

/**
 * Transforms an Elasticsearch _geo_distance sort to a Typesense geo sort.
 * Typesense uses the format: geopoint(lat,lon):order
 * 
 * @param sortOptions The Elasticsearch geo_distance sort options
 * @param ctx The transformer context for field mapping
 * @returns A formatted Typesense geo sort string or null if invalid
 */
export const transformGeoSort = (
  sortOptions: Record<string, any>,
  ctx: TransformerContext
): { sort?: string; warnings: string[] } => {
  const warnings: string[] = [];
  
  // Find the geo field name and coordinates
  // Elasticsearch format: { "field_name": { "lat": number, "lon": number }, "order": "asc"|"desc" }
  const geoFieldEntries = Object.entries(sortOptions).filter(
    ([key, value]) => 
      key !== "order" && 
      key !== "unit" && 
      typeof value === "object" && 
      value !== null
  );
  
  if (geoFieldEntries.length !== 1) {
    warnings.push("Invalid geo_distance sort: expected exactly one field with coordinates");
    return { warnings };
  }
  
  const [fieldName, coordinates] = geoFieldEntries[0];
  
  // Validate coordinates format
  if (!coordinates || typeof coordinates.lat !== "number" || typeof coordinates.lon !== "number") {
    warnings.push(`Invalid geo_distance coordinates for field '${fieldName}'`);
    return { warnings };
  }
  
  // Get the order (default to asc)
  const order = sortOptions.order || "asc";
  if (order !== "asc" && order !== "desc") {
    warnings.push(`Invalid sort order: ${order}. Using 'asc' instead.`);
  }
  
  // Map the field name using the context
  const mappedField = resolveMappedField(fieldName, ctx);
  if (!mappedField) {
    warnings.push(`Unmapped geo field: ${fieldName}`);
    return { warnings };
  }
  
  // Format as Typesense geo sort
  return {
    sort: `${mappedField}(${coordinates.lat},${coordinates.lon}):${order}`,
    warnings
  };
};