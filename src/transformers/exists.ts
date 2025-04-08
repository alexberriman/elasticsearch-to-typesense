import { resolveMappedField } from "../utils/resolve-mapped-field";
import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";

interface ExistsQuery {
  field?: string;
}

export const transformExists = (
  query: unknown,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  // Type-safe handling of field
  const existsQuery =
    typeof query === "object" && query !== null
      ? (query as ExistsQuery)
      : ({} as ExistsQuery);

  // Handle missing field
  if (existsQuery.field === undefined || existsQuery.field === "") {
    return {
      query: {},
      warnings: ["Missing field parameter in exists clause"],
    };
  }

  const field = existsQuery.field;
  const resolvedField = resolveMappedField(field, ctx);

  if (resolvedField === undefined || resolvedField === null) {
    return {
      query: {},
      warnings: [`Could not resolve field "${field}" in exists clause`],
    };
  }

  // We no longer need to check the field type since we use a universal approach
  // that works for all field types
  // Check field type from schema, but use a safer default approach
  // that works for all field types without potential parsing issues

  // In Typesense, using `:!= null` is a more reliable way to check if a field exists
  // regardless of its type
  const filter_by = `${resolvedField}:!= null`;

  return {
    query: {
      filter_by,
    },
    warnings: [],
  };
};
