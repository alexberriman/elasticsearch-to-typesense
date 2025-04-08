import { applyAutoMapping } from "../utils/apply-auto-mapping";
import { suggestTransformHints } from "../utils/suggest-transform-hints";
import { createPaginationAndSort } from "../transformers/common";
import { transformQueryRecursively } from "./transformer";
import {
  Result,
  TransformResult,
  TransformerOptions,
  TransformerContext,
  TypesenseQuery,
} from "./types";

/**
 * Creates a transformer function that converts Elasticsearch queries to Typesense queries
 *
 * @param opts - Configuration options for the transformer
 * @returns Object containing the transform function
 */
export const createTransformer = (opts: TransformerOptions) => {
  // Determine the property mapping to use
  // If auto-mapping is enabled and both schemas are provided, generate mapping automatically
  // Otherwise use the provided mapping or an empty object
  const propertyMapping =
    opts.autoMapProperties === true &&
    opts.elasticSchema != null &&
    opts.typesenseSchema != null
      ? applyAutoMapping(opts.elasticSchema, opts.typesenseSchema)
      : (opts.propertyMapping ?? {});

  // Create the transformer context that will be passed to all transformers
  const ctx: TransformerContext = {
    propertyMapping, // Map of Elasticsearch field names to Typesense field names
    typesenseSchema: opts.typesenseSchema,
    elasticSchema: opts.elasticSchema,
    defaultScoreField: opts.defaultScoreField,
  };

  /**
   * Transforms an Elasticsearch query into a Typesense query
   *
   * @param input - The Elasticsearch query object to transform
   * @returns A Result containing either the transformed query with warnings or an error
   */
  const transform = (
    input: unknown
  ): Result<TransformResult<TypesenseQuery>> => {
    // Validate input
    if (typeof input !== "object" || input == null) {
      return { ok: false, error: "Input must be an object" };
    }

    // Safely cast input after validation
    const elasticQuery = input as Record<string, unknown>;
    // Safely create an empty object that satisfies the ElasticsearchQuery type
    const emptyQuery: Record<string, unknown> = {};
    const queryPart = elasticQuery.query ?? emptyQuery;
    const paginationPart = createPaginationAndSort(input, ctx);
    const main = transformQueryRecursively(queryPart, ctx);

    const hints =
      opts.autoMapProperties === true &&
      opts.elasticSchema != null &&
      opts.typesenseSchema != null
        ? suggestTransformHints(
            opts.elasticSchema,
            opts.typesenseSchema,
            opts.fieldMatchStrategy
          )
        : [];

    return {
      ok: true,
      value: {
        query: {
          ...main.query,
          ...paginationPart.query,
        },
        warnings: [...main.warnings, ...paginationPart.warnings, ...hints],
      },
    };
  };

  return { transform };
};
