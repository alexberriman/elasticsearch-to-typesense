import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";
import { transformQueryRecursively } from "../core/transformer";

export const transformFunctionScore = (
  fnScore: any,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];

  if (!fnScore.query) {
    return {
      query: {},
      warnings: ['Missing "query" in function_score'],
    };
  }

  const base = transformQueryRecursively(fnScore.query, ctx);
  warnings.push(...base.warnings);

  if (Array.isArray(fnScore.functions)) {
    warnings.push("function_score.functions are not supported in Typesense");
  }

  return {
    query: base.query,
    warnings,
  };
};
