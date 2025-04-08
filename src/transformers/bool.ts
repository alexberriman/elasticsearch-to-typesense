import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";
import { transformQueryRecursively } from "../core/transformer";

export const transformBool = (
  bool: any,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const warnings: string[] = [];
  const filters: string[] = [];

  const handleArray = (key: "must" | "should" | "must_not") => {
    const queries = bool[key];
    if (!Array.isArray(queries)) return;

    const subFilters: string[] = [];

    for (const q of queries) {
      const sub = transformQueryRecursively(q, ctx);
      if (sub.query.filter_by) subFilters.push(`(${sub.query.filter_by})`);
      warnings.push(...sub.warnings);
    }

    if (subFilters.length > 0) {
      const joined = subFilters.join(key === "should" ? " || " : " && ");
      if (key === "must_not") {
        filters.push(`!(${joined})`);
      } else {
        filters.push(joined);
      }
    }
  };

  handleArray("must");
  handleArray("should");
  handleArray("must_not");

  return {
    query: { filter_by: filters.join(" && ") },
    warnings,
  };
};
