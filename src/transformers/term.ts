import { resolveMappedField } from "../utils/resolve-mapped-field";
import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";

/**
 * Transforms an Elasticsearch term query to Typesense filter syntax.
 * 
 * IMPORTANT NOTE:
 * This transformer is currently disabled in transformer.ts!
 * 
 * After extensive testing, we discovered that having this transformer enabled 
 * interferes with the bool transformer's handling of term queries. The bool transformer
 * has logic to combine multiple negated terms on the same field into a more efficient
 * format that Typesense requires.
 * 
 * The issue appears to be related to how Typesense handles negation and term filtering.
 * When multiple term conditions for the same field are inside a must_not clause, they
 * need to be combined into a specific format like:
 * 
 *   field:!=["value1","value2"]
 * 
 * The bool transformer already does this correctly when term queries are inside bool clauses.
 * 
 * If you need to enable the term transformer, ensure it formats values in a way that
 * works with the bool transformer's regex pattern in bool.ts.
 */
export const transformTerm = (
  query: any,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const [[field, value]] = Object.entries(query);
  const resolvedField = resolveMappedField(field, ctx);

  if (!resolvedField) {
    return {
      query: {},
      warnings: [`Could not resolve field "${field}" in term clause`],
    };
  }

  // Format value based on type
  if (typeof value === "string") {
    // String values must be wrapped in quotes
    return {
      query: {
        filter_by: `${resolvedField}:="${value}"`,
      },
      warnings: [],
    };
  } else {
    // Numbers, booleans
    return {
      query: {
        filter_by: `${resolvedField}:=${value}`,
      },
      warnings: [],
    };
  }
};