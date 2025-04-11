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

  // Build the query by including all parameters from the base query
  const query: Partial<TypesenseQuery> = { ...base.query };

  // If filter_by exists and isn't empty, wrap it in parentheses
  if (typeof query.filter_by === "string" && query.filter_by.length > 0) {
    query.filter_by = `(${query.filter_by})`;
  } else if (query.filter_by === "") {
    // If it's an empty string, set it to undefined
    // This ensures consistent behavior with the existing tests
    query.filter_by = undefined;
  }

  return {
    query,
    warnings,
  };
};
