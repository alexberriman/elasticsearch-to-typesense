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
  const parts: Set<string> = new Set();

  for (const [field, conditions] of Object.entries(range)) {
    const mapped = resolveMappedField(field, ctx);
    if (!mapped) {
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

        let clause: string | null = null;
        switch (op) {
          case "gte":
            clause = `${mapped}:>=${quoteValue(resolvedValue)}`;
            break;
          case "lte":
            clause = `${mapped}:<=${quoteValue(resolvedValue)}`;
            break;
          case "gt":
            clause = `${mapped}:>${quoteValue(resolvedValue)}`;
            break;
          case "lt":
            clause = `${mapped}:<${quoteValue(resolvedValue)}`;
            break;
          default:
            warnings.push(
              `Unsupported range operator "${op}" on field "${field}"`
            );
        }

        if (clause) {
          parts.add(clause);
        }
      }
    } else {
      warnings.push(`Range conditions must be an object for "${field}"`);
    }
  }

  return {
    query: { filter_by: [...parts].join(" && ") },
    warnings,
  };
};
