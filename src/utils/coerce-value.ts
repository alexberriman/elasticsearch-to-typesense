import { TypesenseSchema } from "../core/types";

export const coerceValue = (
  field: string,
  value: unknown,
  typesenseSchema?: TypesenseSchema
): unknown => {
  if (!typesenseSchema) return value;

  const tsField = typesenseSchema.fields.find((f) => f.name === field);
  if (!tsField) return value;

  switch (tsField.type) {
    case "int32":
    case "int64":
      return parseInt(value as string);
    case "float":
      return parseFloat(value as string);
    case "bool":
      return value === "true" || value === true;
    default:
      return value;
  }
};
