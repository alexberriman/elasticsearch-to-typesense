import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types.js";
import { transformQueryRecursively } from "../core/transformer.js";
import { normalizeParentheses } from "../utils/normalize-parentheses.js";

// Define interfaces
interface BoolQuery {
  must?: unknown[];
  must_not?: unknown[];
  should?: unknown[];
  filter?: unknown[];
  [key: string]: unknown;
}

interface NegationHandler {
  predicate: (clause: string) => boolean;
  process: (clause: string) => string | null;
}

// Separator patterns for negations
const separatorPatterns = {
  equality: [":= ", " == "],
  greaterThan: [":> ", " > "],
  lessThan: [":< ", " < "],
  greaterThanOrEqual: [":>= ", " >= "],
  lessThanOrEqual: [":<= ", " <= "],
};

// Get the appropriate separator from a clause
const getSeparator = (clause: string, patterns: string[]): string | null => {
  for (const pattern of patterns) {
    if (clause.includes(pattern)) {
      return pattern;
    }
  }
  return null;
};

// Split a clause into field and value
const splitClause = (
  clause: string,
  separator: string
): { field: string; value: string } | null => {
  const parts = clause.split(separator, 2);
  if (parts.length !== 2) return null;

  return {
    field: parts[0].trim(),
    value: parts[1].trim(),
  };
};

// Create a group of handlers for negating different types of conditions
const createNegationHandlers = (): NegationHandler[] => [
  // Handle equality conditions (field:= value or field == value)
  {
    predicate: (clause) =>
      separatorPatterns.equality.some((pattern) => clause.includes(pattern)),
    process: (clause) => {
      const separator = getSeparator(clause, separatorPatterns.equality);
      if (separator === null) return null;

      const parts = splitClause(clause, separator);
      if (!parts) return null;

      return `${parts.field}:!= ${parts.value}`;
    },
  },

  // Handle IN conditions (field IN [...])
  {
    predicate: (clause) => clause.includes(" IN "),
    process: (clause) => {
      const parts = splitClause(clause, " IN ");
      if (!parts) return null;

      return `${parts.field}:!= ${parts.value}`;
    },
  },

  // Handle greater than conditions
  {
    predicate: (clause) =>
      separatorPatterns.greaterThan.some((pattern) => clause.includes(pattern)),
    process: () => null, // We skip these with a warning
  },

  // Handle less than conditions
  {
    predicate: (clause) =>
      separatorPatterns.lessThan.some((pattern) => clause.includes(pattern)),
    process: (clause) => {
      const separator = getSeparator(clause, separatorPatterns.lessThan);
      if (separator === null) return null;

      const parts = splitClause(clause, separator);
      if (!parts) return null;

      return `${parts.field}:>= ${parts.value}`;
    },
  },

  // Handle greater than or equal conditions
  {
    predicate: (clause) =>
      separatorPatterns.greaterThanOrEqual.some((pattern) =>
        clause.includes(pattern)
      ),
    process: (clause) => {
      const separator = getSeparator(
        clause,
        separatorPatterns.greaterThanOrEqual
      );
      if (separator === null) return null;

      const parts = splitClause(clause, separator);
      if (!parts) return null;

      return `${parts.field}:< ${parts.value}`;
    },
  },

  // Handle less than or equal conditions
  {
    predicate: (clause) =>
      separatorPatterns.lessThanOrEqual.some((pattern) =>
        clause.includes(pattern)
      ),
    process: (clause) => {
      const separator = getSeparator(clause, separatorPatterns.lessThanOrEqual);
      if (separator === null) return null;

      const parts = splitClause(clause, separator);
      if (!parts) return null;

      return `${parts.field}:> ${parts.value}`;
    },
  },
];

// Process a set of clauses to be negated
const processNegatedClauses = (
  subFilterSet: Set<string>
): { clausesToNegate: string[]; warnings: string[] } => {
  const clausesToNegate: string[] = [];
  const warnings: string[] = [];
  const negationHandlers = createNegationHandlers();

  for (const clause of subFilterSet) {
    // Remove outer parentheses if present
    const cleanClause = clause.replace(/^\((.+)\)$/, "$1");

    let handled = false;

    for (const handler of negationHandlers) {
      if (handler.predicate(cleanClause)) {
        const result = handler.process(cleanClause);

        // Special case for greater than (which we can't negate directly)
        if (
          separatorPatterns.greaterThan.some((p) => cleanClause.includes(p)) &&
          result === null
        ) {
          warnings.push(
            "Skipped must_not clause with unsupported negated range filter"
          );
          return { clausesToNegate: [], warnings };
        }

        if (result !== null) {
          clausesToNegate.push(result);
          handled = true;
          break;
        }
      }
    }

    if (!handled) {
      warnings.push(`Unsupported negation format: ${clause}`);
    }
  }

  if (clausesToNegate.length === 0) {
    warnings.push(
      "Could not parse must_not clauses into valid Typesense filter expressions"
    );
  }

  return { clausesToNegate, warnings };
};

// Process sub-queries from a bool query clause (must, should, must_not, filter)
const processSubQueries = (
  queries: unknown[],
  ctx: TransformerContext,
  isNegated: boolean
): { subFilterSet: Set<string>; warnings: string[] } => {
  const subFilterSet: Set<string> = new Set();
  const warnings: string[] = [];

  for (const q of queries) {
    const sub = transformQueryRecursively(q, { ...ctx, negated: isNegated });

    if (
      typeof sub.query.filter_by === "string" &&
      sub.query.filter_by.length > 0
    ) {
      subFilterSet.add(`(${sub.query.filter_by})`);
    }

    warnings.push(...sub.warnings);
  }

  return { subFilterSet, warnings };
};

// Process a specific clause type in the bool query
const processBoolClause = (
  queries: unknown[] | undefined,
  ctx: TransformerContext,
  clauseType: "must" | "should" | "must_not" | "filter"
): { filter: string | null; warnings: string[] } => {
  if (!Array.isArray(queries) || queries.length === 0) {
    return { filter: null, warnings: [] };
  }

  const isNegated = clauseType === "must_not";
  const { subFilterSet, warnings } = processSubQueries(queries, ctx, isNegated);

  if (subFilterSet.size === 0) {
    return { filter: null, warnings };
  }

  if (clauseType === "must_not") {
    const { clausesToNegate, warnings: negationWarnings } =
      processNegatedClauses(subFilterSet);
    warnings.push(...negationWarnings);

    if (clausesToNegate.length === 0) {
      return { filter: null, warnings };
    }

    return { filter: `(${clausesToNegate.join(" && ")})`, warnings };
  } else {
    const operator = clauseType === "should" ? " || " : " && ";
    return { filter: `(${[...subFilterSet].join(operator)})`, warnings };
  }
};

// Main boolean transformer function
export const transformBool = (
  bool: unknown,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  // Type checking and handling
  const boolQuery =
    typeof bool === "object" && bool !== null
      ? (bool as BoolQuery)
      : ({} as BoolQuery);

  const clauses: Array<"must" | "should" | "must_not" | "filter"> = [
    "must",
    "should",
    "must_not",
    "filter",
  ];

  // Process all clause types
  const results = clauses.map((clauseType) =>
    processBoolClause(boolQuery[clauseType] as unknown[], ctx, clauseType)
  );

  // Combine filters and warnings
  const filters = results
    .map((result) => result.filter)
    .filter((filter): filter is string => filter !== null);

  const warnings = results.flatMap((result) => result.warnings);

  // Join filters with AND and normalize parentheses
  const filterBy = normalizeParentheses(filters.join(" && "));

  return {
    query: { filter_by: filterBy },
    warnings,
  };
};
