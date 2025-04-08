import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";
import { resolveMappedField } from "../utils/resolve-mapped-field";

/**
 * Interface for Elasticsearch prefix query
 */
export interface PrefixQuery {
  [field: string]: {
    value: string;
    boost?: number;
  };
}

/**
 * Transforms an Elasticsearch prefix query to Typesense search parameters.
 *
 * In Typesense, prefix search is supported through search parameters:
 * - Setting q to the prefix value with an asterisk at the end (e.g., "term*")
 * - Setting query_by to the field name to search
 *
 * @param prefix - The Elasticsearch prefix query
 * @param ctx - The transformer context with field mappings
 * @returns - Transformed TypesenseQuery parts and warnings
 */
export const transformPrefix = (
  prefix: PrefixQuery,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];

  // Get the first field in the prefix query object (ES prefix queries only support one field)
  const [field] = Object.keys(prefix);

  if (!field) {
    return {
      query: {},
      warnings: ["Empty prefix query"],
    };
  }

  // Resolve the mapped field name
  const mappedField = resolveMappedField(field, ctx);
  if (!mappedField) {
    return {
      query: {},
      warnings: [`Skipped unmapped field "${field}"`],
    };
  }

  // Get the prefix value
  const prefixData = prefix[field];
  const prefixValue =
    typeof prefixData === "object" ? prefixData.value : prefixData;
  const boost = typeof prefixData === "object" ? prefixData.boost : undefined;

  if (!prefixValue || typeof prefixValue !== "string") {
    return {
      query: {},
      warnings: [`Invalid prefix value for field "${field}"`],
    };
  }

  // Construct the Typesense query parameters
  const query: Partial<TypesenseQuery> = {
    q: `${prefixValue}*`, // Add asterisk for prefix matching
    query_by: mappedField,
  };

  // Add boost if specified
  if (boost !== undefined) {
    query.query_by_weights = `${boost}`;
  }

  return {
    query,
    warnings,
  };
};
