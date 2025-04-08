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

  return {
    query: {
      filter_by: `${resolvedField}:=${quoteValue(value)}`,
    },
    warnings: [],
  };
};
