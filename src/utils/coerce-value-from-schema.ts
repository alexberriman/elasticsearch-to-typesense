import { TypesenseSchema } from "../core/types";

export const coerceValueFromSchema = (
  field: string,
  value: any,
  schema?: TypesenseSchema
): any => {
  if (!schema) return value;

  const tsField = schema.fields.find((f) => f.name === field);
  if (!tsField) return value;

  switch (tsField.type) {
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
