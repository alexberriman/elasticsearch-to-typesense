import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";

export const transformMatch = (
  match: Record<string, string | number | boolean>,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];
  const parts: string[] = [];

  for (const [field, value] of Object.entries(match)) {
    const mapped = ctx.propertyMapping[field] ?? field;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      parts.push(`${mapped}:=${value}`);
    } else {
      warnings.push(`Unsupported match value type for "${field}"`);
    }
  }

  return {
    query: { filter_by: parts.join(" && ") },
    warnings,
  };
};
