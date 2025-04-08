import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";
import { transformQueryRecursively } from "../core/transformer";
import { normalizeParentheses } from "../utils/normalize-parentheses";

export const transformBool = (
  bool: any,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];
  const filters: string[] = [];

  const handleArray = (key: "must" | "should" | "must_not") => {
    const queries = bool[key];
    if (!Array.isArray(queries)) return;

    const subFilterSet: Set<string> = new Set();

    for (const q of queries) {
      const sub = transformQueryRecursively(q, ctx);
      if (sub.query.filter_by) subFilterSet.add(`(${sub.query.filter_by})`);
      warnings.push(...sub.warnings);
    }

    if (subFilterSet.size > 0) {
      const joined = [...subFilterSet].join(
        key === "should" ? " || " : key === "must_not" ? " || " : " && "
      );
      if (key === "must_not") {
        filters.push(`!(${joined})`);
      } else {
        filters.push(`(${joined})`);
      }
    }
  };

  handleArray("must");
  handleArray("should");
  handleArray("must_not");

  const filterBy = normalizeParentheses(filters.join(" && "));

  return {
    query: { filter_by: filterBy },
    warnings,
  };
};
