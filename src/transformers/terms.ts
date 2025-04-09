import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types.js";
import { resolveMappedField } from "../utils/resolve-mapped-field.js";
import { formatTypesenseFilterValue } from "../utils/quote-value.js";

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
      if (values.length === 0) {
        // Still create an empty filter but add a warning
        parts.push(`${mapped}:= []`);
        warnings.push(`Empty array for field "${field}" in terms clause`);
        continue;
      }

      // Use the formatTypesenseFilterValue utility directly on the array
      // This will properly format each element according to its type
      const formattedValues = formatTypesenseFilterValue(values);

      // Proper Typesense format for IN operator
      parts.push(`${mapped}:= ${formattedValues}`);
    } else {
      warnings.push(`Terms clause for "${field}" must be an array`);
    }
  }

  return {
    query: { filter_by: parts.length > 0 ? parts.join(" && ") : "" },
    warnings,
  };
};
