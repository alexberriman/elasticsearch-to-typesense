import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";
import { resolveMappedField } from "../utils/resolve-mapped-field";
import { quoteValue } from "../utils/quote-value";

export const transformMatch = (
  match: Record<string, any>,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const filters: string[] = [];
  const warnings: string[] = [];

  for (const [field, value] of Object.entries(match)) {
    const mapped = resolveMappedField(field, ctx);
    if (!mapped) {
      warnings.push(`Skipped unmapped field "${field}"`);
      continue;
    }

    filters.push(`${mapped}:=${quoteValue(value)}`);
  }

  return {
    query: {
      filter_by: filters.length ? filters.join(" && ") : "",
    },
    warnings,
  };
};
