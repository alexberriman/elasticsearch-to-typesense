import {
  ElasticsearchQuery,
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "./types.js";
import { transformMatch } from "../transformers/match.js";
import { transformTerms } from "../transformers/terms.js";
import { transformTerm } from "../transformers/term.js";
import { transformRange } from "../transformers/range.js";
import { transformBool } from "../transformers/bool.js";
import { transformFunctionScore } from "../transformers/function-score.js";
import { transformMultiMatch } from "../transformers/multi-match.js";
import { transformPrefix } from "../transformers/prefix.js";
import { normalizeParentheses } from "../utils/normalize-parentheses.js";
import { transformExists } from "../transformers/exists.js";

type TransformerFn = (
  query: any,
  ctx: TransformerContext
) => TransformResult<Partial<TypesenseQuery>>;

const transformers: Record<string, TransformerFn> = {
  match: transformMatch,
  terms: transformTerms,
  term: transformTerm,
  range: transformRange,
  bool: transformBool,
  function_score: transformFunctionScore,
  exists: transformExists,
  multi_match: transformMultiMatch,
  prefix: transformPrefix,
};

export const transformQueryRecursively = (
  query: unknown,
  ctx: TransformerContext
): TransformResult<TypesenseQuery> => {
  // Type checking and handling empty objects
  const esQuery: ElasticsearchQuery =
    typeof query === "object" && query !== null
      ? (query as ElasticsearchQuery)
      : {};
  const results = new Set<string>();
  const warnings: string[] = [];
  let searchQuery = "*"; // Default to match all query
  const dynamicParams: Record<string, any> = {};

  for (const key in esQuery) {
    // Skip if property doesn't exist or isn't own property
    if (!Object.prototype.hasOwnProperty.call(esQuery, key)) continue;

    const transformer = Object.prototype.hasOwnProperty.call(transformers, key)
      ? transformers[key]
      : undefined;

    if (transformer !== undefined) {
      // Safe cast for known transformers
      const queryValue = esQuery[key];
      const result = transformer(queryValue, ctx);

      // Handle filter clauses
      if (
        typeof result.query.filter_by === "string" &&
        result.query.filter_by.length > 0
      ) {
        results.add(result.query.filter_by);
      }

      // Handle search query terms (from multi_match)
      if (typeof result.query.q === "string" && result.query.q !== "*") {
        searchQuery = result.query.q;
      }

      // Collect any additional Typesense parameters
      for (const [paramKey, paramValue] of Object.entries(result.query)) {
        if (
          paramKey !== "q" &&
          paramKey !== "filter_by" &&
          paramKey !== "sort_by"
        ) {
          dynamicParams[paramKey] = paramValue;
        }
      }

      warnings.push(...result.warnings);
    } else {
      warnings.push(`Unsupported clause: "${key}"`);
    }
  }

  const filterStr = normalizeParentheses([...results].join(" && "));
  const filter_by = filterStr !== "" ? filterStr : undefined;

  return {
    query: {
      q: searchQuery,
      filter_by,
      ...dynamicParams,
    },
    warnings,
  };
};
