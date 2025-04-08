import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";
import { resolveReservedKeyword } from "../utils/handle-reserved-keywords";
import { resolveMappedField } from "../utils/resolve-mapped-field";
import { quoteValue } from "../utils/quote-value";
import { coerceValueFromSchema } from "../utils/coerce-value-from-schema";

export const transformRange = (
  range: Record<string, any>,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];
  const parts: string[] = [];

  for (const [field, conditions] of Object.entries(range)) {
    const mapped = resolveMappedField(field, ctx);
    if (!mapped) {
      warnings.push(`Skipped unmapped field "${field}"`);
      continue;
    }

    const filters: string[] = [];

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

        switch (op) {
          case "gte":
            filters.push(`${mapped}:>=${quoteValue(resolvedValue)}`);
            break;
          case "lte":
            filters.push(`${mapped}:<=${quoteValue(resolvedValue)}`);
            break;
          case "gt":
            filters.push(`${mapped}:>${quoteValue(resolvedValue)}`);
            break;
          case "lt":
            filters.push(`${mapped}:<${quoteValue(resolvedValue)}`);
            break;
          default:
            warnings.push(
              `Unsupported range operator "${op}" on field "${field}"`
            );
        }
      }
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
