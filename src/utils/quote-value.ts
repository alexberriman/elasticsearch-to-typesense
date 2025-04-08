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
 * For filter values, string values should NOT be quoted, but special characters
 * should be escaped. For array values, the entire array should be enclosed in square
 * brackets but individual string values should not be quoted.
 */
export const formatTypesenseFilterValue = (value: any): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    // For arrays, format each value and join with commas
    const values = value.map((v) => formatTypesenseFilterValue(v));
    return `[${values.join(",")}]`;
  }

  if (typeof value === "string") {
    // For strings, escape special characters but don't add quotes
    // Typesense doesn't want quotes around string values in filters
    return value.replace(/[\\:&|]/g, "\\$&");
  }

  return `${value}`;
};
