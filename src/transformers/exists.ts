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

  const tsField = ctx.typesenseSchema?.fields.find(
    (f) => f.name === resolvedField
  );
  const isNumeric =
    tsField?.type === "int64" ||
    tsField?.type === "int32" ||
    tsField?.type === "float";

  const filter_by = isNumeric
    ? `${resolvedField}:>0`
    : `${resolvedField}:!=null`;

  return {
    query: {
      filter_by,
    },
    warnings: [],
  };
};
