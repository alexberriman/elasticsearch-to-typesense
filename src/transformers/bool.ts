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
      const isNegated = key === "must_not";
      const sub = transformQueryRecursively(q, { ...ctx, negated: isNegated });

      if (sub.query.filter_by) subFilterSet.add(`(${sub.query.filter_by})`);
      warnings.push(...sub.warnings);
    }

    if (subFilterSet.size > 0) {
      if (key === "must_not") {
        const parsed = [...subFilterSet].map((clause) =>
          clause.match(/^\((\w+):=("[^"]+"|\w+)\)$/)
        );

        const allSameField =
          parsed.length > 1 &&
          parsed.every((m) => m && m[1] === parsed[0]?.[1]);

        if (allSameField) {
          const field = parsed[0]![1];
          const values = parsed.map((m) => m![2]);
          filters.push(`${field}:!=[${values.join(",")}]`);
        } else {
          const safe = [...subFilterSet].filter(
            (clause) => !/[<>]=?|:[^=]/.test(clause)
          );

          if (safe.length > 0) {
            filters.push(`!(${safe.join(" || ")})`);
          } else {
            warnings.push(
              "Skipped must_not clause with unsupported negated range filter"
            );
          }
        }
      } else {
        const joined = [...subFilterSet].join(
          key === "should" ? " || " : " && "
        );
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
