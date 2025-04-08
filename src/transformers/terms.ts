import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";

export const transformTerms = (
  terms: Record<string, string[]>,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];
  const parts: string[] = [];

  for (const [field, values] of Object.entries(terms)) {
    const mapped = ctx.propertyMapping[field] ?? field;
    if (Array.isArray(values)) {
      parts.push(`${mapped}:=[${values.join(",")}]`);
    } else {
      warnings.push(`Terms clause for "${field}" must be an array`);
    }
  }

  return {
    query: { filter_by: parts.join(" && ") },
    warnings,
  };
};
