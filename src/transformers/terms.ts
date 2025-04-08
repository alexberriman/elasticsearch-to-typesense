import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";
import { resolveMappedField } from "../utils/resolve-mapped-field";

// Type should be correctly defined as Record<string, Array<string|number|boolean>>
// to match the actual usage in tests
export const transformTerms = (
  terms: Record<string, Array<string | number | boolean>>,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];
  const parts: string[] = [];

  for (const [field, values] of Object.entries(terms)) {
    const mapped = resolveMappedField(field, ctx);
    if (mapped === undefined || mapped === null) {
      warnings.push(`Skipped unmapped field "${field}"`);
      continue;
    }

    if (Array.isArray(values)) {
      const cleaned = values.map(String).join(",");
      parts.push(`${mapped}:=[${cleaned}]`);
    } else {
      warnings.push(`Terms clause for "${field}" must be an array`);
    }
  }

  return {
    query: { filter_by: parts.length > 0 ? parts.join(" && ") : "" },
    warnings,
  };
};
