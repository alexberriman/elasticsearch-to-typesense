export const quoteValue = (value: unknown): string => {
  if (typeof value === "string") {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return String(value);
};
