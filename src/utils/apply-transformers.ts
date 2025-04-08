import { normalizeParentheses } from "./normalize-parentheses";
import {
  ElasticsearchQuery,
  TransformerContext,
  TypesenseQuery,
  TransformResult,
} from "../core/types";

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
    if (!transformer) {
      warnings.push(`Unsupported clause: "${key}"`);
      continue;
    }

    const { query, warnings: w } = transformer(value, ctx);
    if (query.filter_by) filterParts.push(query.filter_by);
    warnings.push(...w);
  }

  return {
    query: {
      q: "*",
      filter_by: normalizeParentheses(filterParts.join(" && ")) || undefined,
    },
    warnings,
  };
};
