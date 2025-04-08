import { TypesenseSchema } from "../core/types";

export const isReservedKeyword = (value: unknown): value is string =>
  typeof value === "string" && value.toLowerCase() === "now";

export const resolveReservedKeyword = (
  field: string,
  value: unknown,
  typesenseSchema?: TypesenseSchema
): unknown => {
  if (!isReservedKeyword(value)) return value;

  if (!typesenseSchema) return value;

  const tsField = typesenseSchema.fields.find((f) => f.name === field);
  if (!tsField) return value;

  switch (tsField.type) {
    case "int32":
    case "int64":
      return Date.now();
    case "float":
      return Date.now() * 1.0;
    default:
      return new Date().toISOString();
  }
};
