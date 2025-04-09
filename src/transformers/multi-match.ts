import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types.js";
import { resolveMappedField } from "../utils/resolve-mapped-field.js";
import { applyValueTransformer } from "../utils/apply-value-transformer.js";

interface MultiMatchQuery {
  fields: string[];
  query: string;
  type?: string;
  fuzziness?: string | number;
  boost?: number;
}

/**
 * Transform Elasticsearch multi_match query to Typesense search query
 *
 * Elasticsearch multi_match allows searching multiple fields with different weights
 * In Typesense, we map this to the q, query_by, and query_by_weights parameters
 */
export const transformMultiMatch = (
  multiMatch: MultiMatchQuery,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];
  const { fields, query, type, fuzziness } = multiMatch;

  if (fields === undefined || !Array.isArray(fields) || fields.length === 0) {
    warnings.push("Multi-match requires fields to be specified");
    return {
      query: {},
      warnings,
    };
  }

  // Map Elasticsearch field names to Typesense field names
  const mappedFields: string[] = [];
  const weights: number[] = [];

  for (const field of fields) {
    // Handle field boosting notation (e.g., "title^2")
    const [fieldName, boost] = field.split("^");
    const mappedField = resolveMappedField(fieldName, ctx);

    if (mappedField === undefined || mappedField === null) {
      warnings.push(`Skipped unmapped field "${fieldName}" in multi_match`);
      continue;
    }

    // Only add mapped fields to our query
    mappedFields.push(mappedField);

    // Handle field boosting - default to 1 if not specified
    if (boost) {
      weights.push(parseFloat(boost) * 10); // Scale up for Typesense
    } else {
      weights.push(10); // Default weight
    }
  }

  if (mappedFields.length === 0) {
    warnings.push("No valid fields to search after mapping");
    return {
      query: {},
      warnings,
    };
  }

  // Build Typesense query options
  let typesenseQuery: Partial<TypesenseQuery> = {};

  // Add dynamic parameters that aren't part of the TypesenseQuery type
  const dynamicParams: Record<string, any> = {};

  // Apply value transformer to the query text if provided
  // For multi-match, we apply it with the first mapped field (or null if none)
  const queryField = mappedFields.length > 0 ? mappedFields[0] : null;
  const elasticField = fields.length > 0 ? fields[0].split("^")[0] : null;

  // Transform the query value
  const transformedQuery =
    elasticField !== null && queryField !== null
      ? applyValueTransformer({
          elasticField,
          typesenseField: queryField,
          value: query,
          ctx,
        })
      : query;

  // Set the query text
  typesenseQuery.q = transformedQuery;

  // Handle query_by and query_by_weights
  dynamicParams.query_by = mappedFields.join(",");

  if (weights.length > 0 && weights.some((w) => w !== weights[0])) {
    dynamicParams.query_by_weights = weights.join(",");
  }

  // Handle fuzziness (Typesense uses num_typos)
  if (fuzziness !== undefined) {
    if (fuzziness === "AUTO" || fuzziness === "auto") {
      dynamicParams.num_typos = 2;
    } else {
      const fuzzyValue = parseInt(String(fuzziness), 10);
      if (!isNaN(fuzzyValue) && fuzzyValue >= 0) {
        dynamicParams.num_typos = Math.min(fuzzyValue, 2); // Typesense supports max 2 typos
      }
    }
  }

  // Handle type parameter
  if (type !== undefined && type !== null && type !== "") {
    switch (type) {
      case "phrase_prefix":
        dynamicParams.prefix = true;
        break;
      case "phrase":
        // Phrase matches require exact matches in order
        dynamicParams.num_typos = 0;
        break;
      default:
        warnings.push(`Unsupported multi_match type: "${type}"`);
    }
  }

  return {
    query: {
      ...typesenseQuery,
      ...dynamicParams,
    },
    warnings,
  };
};
