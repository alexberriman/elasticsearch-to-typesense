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
};

export const transformQueryRecursively = (
  esQuery: ElasticsearchQuery,
  ctx: TransformerContext
): TransformResult<TypesenseQuery> => {
  const results: string[] = [];
  const warnings: string[] = [];

  for (const key in esQuery) {
    const transformer = transformers[key];
    if (transformer) {
      const result = transformer((esQuery as any)[key], ctx);
      if (result.query.filter_by) results.push(result.query.filter_by);
      warnings.push(...result.warnings);
    } else {
      warnings.push(`Unsupported clause: "${key}"`);
    }
  }

  return {
    query: {
      q: "*",
      filter_by: results.filter(Boolean).join(" && ") || undefined,
    },
    warnings,
  };
};
