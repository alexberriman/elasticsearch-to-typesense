export const quoteValue = (value: any): string => {
  if (typeof value === "string") {
    // Escape quotes and wrap in double quotes
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return `${value}`;
};
