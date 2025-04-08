import {
  ElasticsearchQuery,
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "./types";
import { transformMatch } from "../transformers/match";
import { transformTerms } from "../transformers/terms";
import { transformRange } from "../transformers/range";
import { transformBool } from "../transformers/bool";
import { transformFunctionScore } from "../transformers/function-score";
import { transformMultiMatch } from "../transformers/multi-match";
import { transformPrefix } from "../transformers/prefix";
import { normalizeParentheses } from "../utils/normalize-parentheses";
import { transformExists } from "../transformers/exists";

type TransformerFn = (
  query: any,
  ctx: TransformerContext
) => TransformResult<Partial<TypesenseQuery>>;

const transformers: Record<string, TransformerFn> = {
  match: transformMatch,
  terms: transformTerms,
  range: transformRange,
  bool: transformBool,
  function_score: transformFunctionScore,
  exists: transformExists,
  multi_match: transformMultiMatch,
  prefix: transformPrefix,
};

export const transformQueryRecursively = (
  esQuery: ElasticsearchQuery,
  ctx: TransformerContext
): TransformResult<TypesenseQuery> => {
  const results = new Set<string>();
  const warnings: string[] = [];
  let searchQuery = "*"; // Default to match all query
  const dynamicParams: Record<string, any> = {};

  for (const key in esQuery) {
    const transformer = transformers[key];
    if (transformer) {
      const result = transformer((esQuery as any)[key], ctx);

      // Handle filter clauses
      if (result.query.filter_by) {
        results.add(result.query.filter_by);
      }

      // Handle search query terms (from multi_match)
      if (result.query.q && result.query.q !== "*") {
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

  const filter_by =
    normalizeParentheses([...results].join(" && ")) || undefined;

  return {
    query: {
      q: searchQuery,
      filter_by,
      ...dynamicParams,
    },
    warnings,
  };
};
