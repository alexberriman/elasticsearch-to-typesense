export function isNumeric(value: unknown): boolean {
  if (typeof value === "number") {
    return isFinite(value);
  }

  if (typeof value !== "string") {
    return false;
  }

  if (value.trim() === "") {
    return false;
  }

  const numericRegex = /^-?\d+(\.\d+)?(e[-+]?\d+)?$/i;
  if (!numericRegex.test(value)) {
    return false;
  }

  const parsedValue = Number(value);

  return !isNaN(parsedValue) && isFinite(parsedValue);
}
