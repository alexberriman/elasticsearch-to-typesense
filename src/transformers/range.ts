import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types.js";
import { resolveReservedKeyword } from "../utils/handle-reserved-keywords.js";
import { resolveMappedField } from "../utils/resolve-mapped-field.js";
import { formatTypesenseFilterValue } from "../utils/quote-value.js";
import { coerceValueFromSchema } from "../utils/coerce-value-from-schema.js";
import { applyValueTransformer } from "../utils/apply-value-transformer.js";

export const transformRange = (
  range: Record<string, any>,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];
  const parts: Set<string> = new Set();

  for (const [field, conditions] of Object.entries(range)) {
    const mapped = resolveMappedField(field, ctx);
    if (mapped === undefined || mapped === null) {
      warnings.push(`Skipped unmapped field "${field}"`);
      continue;
    }

    if (typeof conditions === "object" && conditions !== null) {
      for (const [op, rawValue] of Object.entries(conditions)) {
        let resolvedValue = resolveReservedKeyword(
          mapped,
          rawValue,
          ctx.typesenseSchema
        );
        resolvedValue = coerceValueFromSchema(
          mapped,
          resolvedValue,
          ctx.typesenseSchema
        );

        // Apply value transformer if provided
        const transformedValue = applyValueTransformer({
          elasticField: field,
          typesenseField: mapped,
          value: resolvedValue,
          ctx,
        });

        let clause: string | null = null;
        const formattedValue = formatTypesenseFilterValue(transformedValue);
        switch (op) {
          case "gte":
            clause = `${mapped}:>= ${formattedValue}`;
            break;
          case "lte":
            clause = `${mapped}:<= ${formattedValue}`;
            break;
          case "gt":
            clause = `${mapped}:> ${formattedValue}`;
            break;
          case "lt":
            clause = `${mapped}:< ${formattedValue}`;
            break;
          default:
            warnings.push(
              `Unsupported range operator "${op}" on field "${field}"`
            );
        }

        if (clause !== null) {
          parts.add(clause);
        }
      }
    } else {
      warnings.push(`Range conditions must be an object for "${field}"`);
    }
  }

  return {
    query: { filter_by: parts.size > 0 ? [...parts].join(" && ") : "" },
    warnings,
  };
};
