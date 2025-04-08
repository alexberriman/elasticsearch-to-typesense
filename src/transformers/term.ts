import { resolveMappedField } from "../utils/resolve-mapped-field";
import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";

export const transformTerm = (
  query: any,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const [[field, value]] = Object.entries(query);
  const resolvedField = resolveMappedField(field, ctx);

  if (!resolvedField) {
    return {
      query: {},
      warnings: [`Could not resolve field "${field}" in term clause`],
    };
  }

  if (typeof value === "string") {
    return {
      query: {
        filter_by: `${resolvedField}:="${value}"`,
      },
      warnings: [],
    };
  } else {
    return {
      query: {
        filter_by: `${resolvedField}:=${value}`,
      },
      warnings: [],
    };
  }
};
