/**
 * Format a value for query strings by adding quotes to string values.
 */
export const quoteValue = (value: any): string => {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "string") {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  return `${value}`;
};

/**
 * Format a value for Typesense filters.
 *
 * Typesense handles string values differently than many other search engines.
 * For filter values, string values should be properly quoted to avoid parsing issues.
 * For array values, the entire array should be enclosed in square brackets with
 * individual string values properly quoted.
 */
export const formatTypesenseFilterValue = (value: any): string => {
  if (value === null || value === undefined) {
    return "null"; // Use null as a string literal for null values
  }

  if (Array.isArray(value)) {
    // For arrays, Typesense uses the IN operator
    // Format is: field IN [value1, value2, value3]
    const values = value.map((v) => formatTypesenseFilterValue(v));
    return `[${values.join(", ")}]`;
  }

  if (typeof value === "string") {
    // Convert string value that look like reserved identifiers in Typesense
    if (value.toLowerCase() === "true") return "true";
    if (value.toLowerCase() === "false") return "false";
    if (value.toLowerCase() === "null") return "null";
    if (value.toLowerCase() === "undefined") return "null";

    // For string values in filters, ALWAYS quote them to avoid parsing issues
    // This is critical since unquoted strings can be confused with field names
    // Double quotes need to be escaped with backslash
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  // Make sure boolean values are properly formatted
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  // Numbers should be returned as-is without quotes
  if (typeof value === "number") {
    return `${value}`;
  }

  // Default case - convert to string
  return `${value}`;
};
