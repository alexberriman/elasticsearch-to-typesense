import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";
import { resolveMappedField } from "../utils/resolve-mapped-field";
import { formatTypesenseFilterValue } from "../utils/quote-value";

export const transformMatch = (
  match: Record<string, any>,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const filters: string[] = [];
  const warnings: string[] = [];

  for (const [field, value] of Object.entries(match)) {
    const mapped = resolveMappedField(field, ctx);
    if (mapped === undefined || mapped === null) {
      warnings.push(`Skipped unmapped field "${field}"`);
      continue;
    }

    // Use the proper Typesense filter syntax (field:=value) for exact matches
    filters.push(`${mapped}:= ${formatTypesenseFilterValue(value)}`);
  }

  return {
    query: {
      filter_by: filters.length ? filters.join(" && ") : "",
    },
    warnings,
  };
};
