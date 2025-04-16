import { applyAutoMapping } from "../utils/apply-auto-mapping.js";
import { suggestTransformHints } from "../utils/suggest-transform-hints.js";
import { createPaginationAndSort } from "../transformers/common.js";
import { transformQueryRecursively } from "./transformer.js";
import { createDefaultMapper } from "../utils/map-results-to-elastic.js";
import { ok, err } from "../utils/result.js";
import {
  Result,
  TransformResult,
  TransformerOptions,
  TransformerContext,
  TypesenseQuery,
  ResultMapper,
} from "./types.js";

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
    valueTransformer: opts.valueTransformer,
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
      return err("Input must be an object");
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

    return ok({
      query: {
        ...main.query,
        ...paginationPart.query,
      },
      warnings: [...main.warnings, ...paginationPart.warnings, ...hints],
    });
  };

  /**
   * Extends the transformer with new options
   *
   * @param extendedOptions - Partial options to merge with the original options
   * @returns A new transformer instance with merged options
   */
  const extend = (extendedOptions: Partial<TransformerOptions>) => {
    // Merge the original options with the extended options
    const mergedOptions: TransformerOptions = {
      ...opts,
      ...extendedOptions,
      // If both have propertyMapping, merge them
      propertyMapping: {
        ...(opts.propertyMapping || {}),
        ...(extendedOptions.propertyMapping || {}),
      },
    };

    return createTransformer(mergedOptions);
  };

  // Create a deep copy of options to expose as readonly
  const options: Readonly<TransformerOptions> = {
    ...opts,
    propertyMapping: { ...propertyMapping },
    typesenseSchema: opts.typesenseSchema
      ? { ...opts.typesenseSchema }
      : undefined,
    elasticSchema: opts.elasticSchema ? { ...opts.elasticSchema } : undefined,
  };

  // Base transformer with transform, extend functions, and readonly options
  const baseTransformer = {
    transform,
    extend,
    options,
  };

  // Determine if we should provide a mapResults function
  if (opts.mapResultsToElasticSchema !== undefined) {
    // Use the provided mapper function
    return {
      ...baseTransformer,
      /**
       * Maps Typesense results back to Elasticsearch format
       *
       * @param documents - The Typesense document(s) to map
       * @returns The mapped Elasticsearch document(s)
       */
      mapResults: opts.mapResultsToElasticSchema,
    };
  } else if (
    propertyMapping !== undefined &&
    Object.keys(propertyMapping).length > 0
  ) {
    // Create a default mapper based on the property mapping
    const defaultMapper = createDefaultMapper(propertyMapping);

    return {
      ...baseTransformer,
      /**
       * Maps Typesense results back to Elasticsearch format
       * Uses a default mapper based on inverting the property mapping
       *
       * @param documents - The Typesense document(s) to map
       * @returns The mapped Elasticsearch document(s)
       */
      mapResults: defaultMapper as ResultMapper,
    };
  }

  // No mapping function provided and no property mapping available
  return baseTransformer;
};
