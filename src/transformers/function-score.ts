import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types.js";
import { transformQueryRecursively } from "../core/transformer.js";

interface FunctionScoreQuery {
  query?: unknown;
  functions?: unknown[];
  [key: string]: unknown;
}

export const transformFunctionScore = (
  fnScore: unknown,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];

  // Type checking
  const functionScore =
    typeof fnScore === "object" && fnScore !== null
      ? (fnScore as FunctionScoreQuery)
      : ({} as FunctionScoreQuery);

  // Check for query property existence
  if (functionScore.query === undefined) {
    return {
      query: {},
      warnings: ['Missing "query" in function_score'],
    };
  }

  const base = transformQueryRecursively(functionScore.query, ctx);
  warnings.push(...base.warnings);

  if (Array.isArray(functionScore.functions)) {
    warnings.push("function_score.functions are not supported in Typesense");
  }

  return {
    query: {
      filter_by:
        typeof base.query.filter_by === "string" &&
        base.query.filter_by.length > 0
          ? `(${base.query.filter_by})`
          : undefined,
    },
    warnings,
  };
};
