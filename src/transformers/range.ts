import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";

export const transformRange = (
  range: Record<string, any>,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];
  const parts: string[] = [];

  for (const [field, conditions] of Object.entries(range)) {
    const mapped = ctx.propertyMapping[field] ?? field;
    const filters: string[] = [];

    if (typeof conditions === "object") {
      if ("gte" in conditions) filters.push(`${mapped}:>=${conditions.gte}`);
      if ("lte" in conditions) filters.push(`${mapped}:<=${conditions.lte}`);
    } else {
      warnings.push(`Range conditions must be an object for "${field}"`);
    }

    parts.push(...filters);
  }

  return {
    query: { filter_by: parts.join(" && ") },
    warnings,
  };
};
