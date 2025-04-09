import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types.js";
import { transformQueryRecursively } from "../core/transformer.js";
import { normalizeParentheses } from "../utils/normalize-parentheses.js";

interface BoolQuery {
  must?: unknown[];
  must_not?: unknown[];
  should?: unknown[];
  filter?: unknown[];
  [key: string]: unknown;
}

export const transformBool = (
  bool: unknown,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  // Type checking and handling
  const boolQuery =
    typeof bool === "object" && bool !== null
      ? (bool as BoolQuery)
      : ({} as BoolQuery);
  const warnings: string[] = [];
  const filters: string[] = [];

  const handleArray = (key: "must" | "should" | "must_not") => {
    const queries = boolQuery[key];
    if (!Array.isArray(queries)) return;

    const subFilterSet: Set<string> = new Set();

    for (const q of queries) {
      const isNegated = key === "must_not";
      const sub = transformQueryRecursively(q, { ...ctx, negated: isNegated });

      if (
        typeof sub.query.filter_by === "string" &&
        sub.query.filter_by.length > 0
      ) {
        subFilterSet.add(`(${sub.query.filter_by})`);
      }
      warnings.push(...sub.warnings);
    }

    if (subFilterSet.size > 0) {
      if (key === "must_not") {
        // Extract individual conditions to be negated
        const clausesToNegate: string[] = [];

        for (const clause of subFilterSet) {
          // Remove outer parentheses if present
          const cleanClause = clause.replace(/^\((.+)\)$/, "$1");

          // Handle different condition formats

          // Try field:= value format or field == value format
          if (cleanClause.includes(":= ") || cleanClause.includes(" == ")) {
            const separator = cleanClause.includes(":= ") ? ":= " : " == ";
            const [field, value] = cleanClause.split(separator, 2);
            // Same field negation pattern - we'll collect these for array-based negation
            const fieldName = field.trim();
            const valueStr = value.trim();

            // Add to list of clauses to negate
            clausesToNegate.push(`${fieldName}:!= ${valueStr}`);
            continue;
          }

          // Try field IN [...] format
          if (cleanClause.includes(" IN ")) {
            const [field, valueArray] = cleanClause.split(" IN ", 2);
            clausesToNegate.push(`${field.trim()}:!= ${valueArray.trim()}`);
            continue;
          }

          // Try field:> value format or field > value format
          if (cleanClause.includes(":> ") || cleanClause.includes(" > ")) {
            // For range queries in must_not, we need to add a specific warning
            warnings.push(
              "Skipped must_not clause with unsupported negated range filter"
            );
            return; // Exit from the loop since we can't handle these range filters correctly
          }

          // Try field:< value format or field < value format
          if (cleanClause.includes(":< ") || cleanClause.includes(" < ")) {
            const separator = cleanClause.includes(":< ") ? ":< " : " < ";
            const [field, value] = cleanClause.split(separator, 2);
            clausesToNegate.push(`${field.trim()}:>= ${value.trim()}`);
            continue;
          }

          // Try field:>= value format or field >= value format
          if (cleanClause.includes(":>= ") || cleanClause.includes(" >= ")) {
            const separator = cleanClause.includes(":>= ") ? ":>= " : " >= ";
            const [field, value] = cleanClause.split(separator, 2);
            clausesToNegate.push(`${field.trim()}:< ${value.trim()}`);
            continue;
          }

          // Try field:<= value format or field <= value format
          if (cleanClause.includes(":<= ") || cleanClause.includes(" <= ")) {
            const separator = cleanClause.includes(":<= ") ? ":<= " : " <= ";
            const [field, value] = cleanClause.split(separator, 2);
            clausesToNegate.push(`${field.trim()}:> ${value.trim()}`);
            continue;
          }

          // For other formats, add a warning
          warnings.push(`Unsupported negation format: ${clause}`);
        }

        if (clausesToNegate.length > 0) {
          // Join all negated clauses with AND and wrap them in parentheses
          filters.push(`(${clausesToNegate.join(" && ")})`);
        } else {
          warnings.push(
            "Could not parse must_not clauses into valid Typesense filter expressions"
          );
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
