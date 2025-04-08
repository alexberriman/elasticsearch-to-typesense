export const quoteValue = (value: any): string => {
  if (typeof value === "string") {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return `${value}`;
};
