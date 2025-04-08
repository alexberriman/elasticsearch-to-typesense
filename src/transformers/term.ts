import { resolveMappedField } from "../utils/resolve-mapped-field";
import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";

export const transformTerm = (
  query: any,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const [[field, value]] = Object.entries(query);
  const resolvedField = resolveMappedField(field, ctx);

  if (!resolvedField) {
    return {
      query: {},
      warnings: [`Could not resolve field "${field}" in term clause`],
    };
  }

  // Format value based on type
  let formattedValue: string;
  
  if (typeof value === "string") {
    formattedValue = `"${value}"`; // String values must be quoted
  } else {
    formattedValue = `${value}`; // Numbers and booleans should be unquoted
  }

  return {
    query: {
      filter_by: `${resolvedField}:=${formattedValue}`,
    },
    warnings: [],
  };
};