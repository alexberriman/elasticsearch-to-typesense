import { TypesenseSchema } from "../core/types";

export const coerceValueFromSchema = (
  field: string,
  value: any,
  schema?: TypesenseSchema
): any => {
  if (!schema) return value;

  const tsField = schema.fields.find((f) => f.name === field);
  if (!tsField) return value;

  const { type } = tsField;

  // Normalize "null"/"undefined" string values
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

  // Coerce based on schema type
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
