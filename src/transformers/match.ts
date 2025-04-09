import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types.js";
import { resolveMappedField } from "../utils/resolve-mapped-field.js";
import { formatTypesenseFilterValue } from "../utils/quote-value.js";
import { applyValueTransformer } from "../utils/apply-value-transformer.js";

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

    // Apply value transformer if provided
    const transformedValue = applyValueTransformer({
      elasticField: field,
      typesenseField: mapped,
      value,
      ctx,
    });

    // Use the proper Typesense filter syntax (field:=value) for exact matches
    filters.push(`${mapped}:= ${formatTypesenseFilterValue(transformedValue)}`);
  }

  return {
    query: {
      filter_by: filters.length ? filters.join(" && ") : "",
    },
    warnings,
  };
};
