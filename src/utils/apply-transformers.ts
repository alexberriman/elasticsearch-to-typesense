import { normalizeParentheses } from "./normalize-parentheses.js";
import {
  ElasticsearchQuery,
  TransformerContext,
  TypesenseQuery,
  TransformResult,
} from "../core/types.js";

type TransformerFn = (
  query: any,
  ctx: TransformerContext
) => TransformResult<Partial<TypesenseQuery>>;

export const applyTransformers = (
  esQuery: ElasticsearchQuery,
  ctx: TransformerContext,
  transformers: Record<string, TransformerFn>
): TransformResult<TypesenseQuery> => {
  const filterParts: string[] = [];
  const warnings: string[] = [];

  for (const [key, value] of Object.entries(esQuery)) {
    const transformer = transformers[key];
    if (transformer === undefined) {
      warnings.push(`Unsupported clause: "${key}"`);
      continue;
    }

    const { query, warnings: w } = transformer(value, ctx);
    if (typeof query.filter_by === "string" && query.filter_by !== "")
      filterParts.push(query.filter_by);
    warnings.push(...w);
  }

  return {
    query: {
      q: "*",
      filter_by:
        filterParts.length > 0
          ? normalizeParentheses(filterParts.join(" && "))
          : undefined,
    },
    warnings,
  };
};
