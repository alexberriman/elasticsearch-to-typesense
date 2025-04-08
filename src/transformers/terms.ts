import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";
import { resolveMappedField } from "../utils/resolve-mapped-field";
import { quoteValue } from "../utils/quote-value";
import { coerceValueFromSchema } from "../utils/coerce-value-from-schema";

export const transformTerms = (
  terms: Record<string, string[]>,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];
  const parts: string[] = [];

  for (const [field, values] of Object.entries(terms)) {
    const mapped = resolveMappedField(field, ctx);
    if (!mapped) {
      warnings.push(`Skipped unmapped field "${field}"`);
      continue;
    }

    if (Array.isArray(values)) {
      const quoted = values
        .map((v) =>
          quoteValue(coerceValueFromSchema(mapped, v, ctx.typesenseSchema))
        )
        .join(",");
      parts.push(`${mapped}:=[${quoted}]`);
    } else {
      warnings.push(`Terms clause for "${field}" must be an array`);
    }
  }

  return {
    query: { filter_by: parts.join(" && ") },
    warnings,
  };
};
