import { createPaginationAndSort } from "../transformers/common";
import { transformQueryRecursively } from "./transformer";
import {
  ElasticsearchQuery,
  PropertyMapping,
  Result,
  TransformResult,
  TransformerContext,
  TypesenseQuery,
} from "./types";

export const createTransformer = (propertyMapping: PropertyMapping) => {
  const ctx: TransformerContext = { propertyMapping };

  const transform = (input: any): Result<TransformResult<TypesenseQuery>> => {
    if (typeof input !== "object" || input == null) {
      return { ok: false, error: "Input must be an object" };
    }

    const queryPart = input.query ?? {};
    const paginationPart = createPaginationAndSort(input);

    const main = transformQueryRecursively(queryPart, ctx);

    return {
      ok: true,
      value: {
        query: {
          ...main.query,
          ...paginationPart.query,
        },
        warnings: [...main.warnings, ...paginationPart.warnings],
      },
    };
  };

  return { transform };
};
