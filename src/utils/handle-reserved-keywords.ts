import { TypesenseSchema } from "../core/types.js";

export const isReservedKeyword = (value: unknown): value is string =>
  typeof value === "string" && value.toLowerCase() === "now";

export const resolveReservedKeyword = (
  field: string,
  value: unknown,
  typesenseSchema?: TypesenseSchema
): unknown => {
  if (!isReservedKeyword(value)) return value;

  if (typesenseSchema === undefined) return value;

  const tsField = typesenseSchema.fields.find((f) => f.name === field);
  if (tsField === undefined) return value;

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
