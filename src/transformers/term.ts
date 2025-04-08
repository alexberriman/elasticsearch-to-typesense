import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";
import { resolveMappedField } from "../utils/resolve-mapped-field";
import { formatTypesenseFilterValue } from "../utils/quote-value";

/**
 * Interface for Elasticsearch term query
 */
export interface TermQuery {
  [field: string]:
    | string
    | number
    | boolean
    | {
        value: string | number | boolean;
        boost?: number;
      };
}

/**
 * Transforms an Elasticsearch term query to a Typesense filter
 *
 * A term query in Elasticsearch looks for exact matches of a term.
 * In Typesense, this is done with a filter condition using exact equality.
 *
 * @param term - The Elasticsearch term query
 * @param ctx - The transformer context with field mappings
 * @returns TransformResult with the filter expression
 */
export const transformTerm = (
  term: TermQuery,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];
  const parts: string[] = [];

  for (const [field, termValue] of Object.entries(term)) {
    const mapped = resolveMappedField(field, ctx);
    if (mapped === undefined || mapped === null) {
      warnings.push(`Skipped unmapped field "${field}"`);
      continue;
    }

    let value;
    if (
      typeof termValue === "object" &&
      termValue !== null &&
      "value" in termValue
    ) {
      // Handle {field: {value: "something", boost: 2}} format
      value = termValue.value;
      // Note: Typesense doesn't support boost in filter expressions, so we ignore boost here
    } else {
      // Handle {field: "something"} format
      value = termValue;
    }

    // Format the value properly for Typesense filter syntax
    const formattedValue = formatTypesenseFilterValue(value);
    parts.push(`${mapped}:= ${formattedValue}`);
  }

  return {
    query: { filter_by: parts.length > 0 ? parts.join(" && ") : "" },
    warnings,
  };
};
