import { resolveMappedField } from "../utils/resolve-mapped-field";
import { coerceValueFromSchema } from "../utils/coerce-value-from-schema";
import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";

export const transformExists = (
  query: any,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const field = query.field;
  const resolvedField = resolveMappedField(field, ctx);

  if (!resolvedField) {
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
    ? `${resolvedField}:>0` // Better fallback for numeric fields
    : `${resolvedField}:!=null`;

  return {
    query: {
      filter_by,
    },
    warnings: [],
  };
};
