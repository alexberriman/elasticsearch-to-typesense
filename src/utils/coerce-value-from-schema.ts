import { TypesenseSchema } from "../core/types.js";

/**
 * Convert Elasticsearch date format strings to epoch timestamp
 * @param dateString Elasticsearch date format string like "now", "now/d", etc.
 * @returns Timestamp in milliseconds since epoch
 */
const convertElasticDateString = (dateString: string): number => {
  if (typeof dateString !== "string") {
    return dateString;
  }

  const now = Date.now();

  // Handle basic "now" format
  if (dateString === "now") {
    return now;
  }

  // Handle "now/unit" format (floor to unit)
  if (dateString.startsWith("now/")) {
    const unit = dateString.substring(4);
    const date = new Date(now);

    switch (unit) {
      case "d": // Day
        date.setHours(0, 0, 0, 0);
        break;
      case "h": // Hour
        date.setMinutes(0, 0, 0);
        break;
      case "m": // Minute
        date.setSeconds(0, 0);
        break;
      case "s": // Second
        date.setMilliseconds(0);
        break;
      case "M": // Month
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        break;
      case "y": // Year
        date.setMonth(0, 1);
        date.setHours(0, 0, 0, 0);
        break;
      // Add more units as needed
      default:
        return now;
    }
    return date.getTime();
  }

  // For more complex date math expressions like "now+1d/d", we'd need more parsing
  // But for basic "now" functionality this is sufficient

  return now;
};

/**
 * Determine if a field might be a date field based on naming conventions
 */
const isPotentialDateField = (fieldName: string): boolean => {
  const dateFieldPatterns = [
    /_date$/i,
    /_time$/i,
    /date_/i,
    /time_/i,
    /created/i,
    /updated/i,
    /timestamp/i,
    /^date/i,
    /^time/i,
  ];

  return dateFieldPatterns.some((pattern) => pattern.test(fieldName));
};

export const coerceValueFromSchema = (
  field: string,
  value: any,
  schema?: TypesenseSchema
): any => {
  if (schema === undefined) return value;

  const tsField = schema.fields.find((f) => f.name === field);
  if (tsField === undefined) return value;

  const { type } = tsField;

  const isNullish =
    value === null ||
    value === undefined ||
    (typeof value === "string" &&
      (value.trim().toLowerCase() === "null" ||
        value.trim().toLowerCase() === "undefined"));

  if (isNullish) {
    switch (type) {
      case "int32":
      case "int64":
      case "float":
        return 0;
      case "bool":
        return false;
      case "string":
      case "geopoint":
      default:
        return "";
    }
  }

  // Special handling for date fields when they're integers in Typesense but strings in Elasticsearch
  if (
    (type === "int32" || type === "int64") &&
    typeof value === "string" &&
    (value.startsWith("now") || isPotentialDateField(field))
  ) {
    // First check for Elasticsearch date format strings
    if (value.startsWith("now")) {
      return convertElasticDateString(value);
    }

    // Try to parse it as a date if it seems to be a date field
    if (isPotentialDateField(field)) {
      try {
        const dateValue = new Date(value);
        if (!isNaN(dateValue.getTime())) {
          return dateValue.getTime();
        }
      } catch {
        // Fall back to standard parsing
      }
    }
  }

  switch (type) {
    case "int32":
    case "int64":
      return typeof value === "string" ? parseInt(value, 10) : value;
    case "float":
      return typeof value === "string" ? parseFloat(value) : value;
    case "bool":
      if (typeof value === "string") {
        return value.toLowerCase() === "true";
      }
      return Boolean(value);
    case "string":
    case "geopoint":
    default:
      return String(value);
  }
};
