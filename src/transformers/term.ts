import { quoteValue } from "../utils/quote-value";
import { resolveMappedField } from "../utils/resolve-mapped-field";
import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";

export const transformTerm = (
  query: any, // e.g., { activity_age_from: 0 }
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const [[field, value]] = Object.entries(query); // no `.term`
  const resolvedField = resolveMappedField(field, ctx);

  if (!resolvedField) {
    return {
      query: {},
      warnings: [`Could not resolve field "${field}" in term clause`],
    };
  }

  const isBoolean = typeof value === "boolean";
  const isNumber = typeof value === "number";
  const safeValue = isBoolean || isNumber ? value : quoteValue(value);

  return {
    query: {
      filter_by: `${resolvedField}:=${safeValue}`,
    },
    warnings: [],
  };
};
