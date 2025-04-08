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

export const createTransformer = (opts: TransformerOptions) => {
  const propertyMapping =
    opts.autoMapProperties === true &&
    opts.elasticSchema != null &&
    opts.typesenseSchema != null
      ? applyAutoMapping(opts.elasticSchema, opts.typesenseSchema)
      : (opts.propertyMapping ?? {});

  const ctx: TransformerContext = {
    propertyMapping,
    typesenseSchema: opts.typesenseSchema,
    elasticSchema: opts.elasticSchema,
    defaultScoreField: opts.defaultScoreField,
  };

  const transform = (
    input: unknown
  ): Result<TransformResult<TypesenseQuery>> => {
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
