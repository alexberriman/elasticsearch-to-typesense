import { resolveMappedField } from "../utils/resolve-mapped-field.js";
import { transformGeoSort } from "../utils/transform-geo-sort.js";
import { TransformerContext } from "../core/types.js";

export const createPaginationAndSort = (
  input: any,
  ctx: TransformerContext
): { query: Record<string, any>; warnings: string[] } => {
  const warnings: string[] = [];
  const query: Record<string, any> = {};

  const from = input.from;
  const size = input.size;

  // Default pagination values
  const defaultPerPage = 10;
  const defaultPage = 1;
  const maxPerPage = 250;

  // Handle per_page parameter (from size)
  if (typeof size === "number" && size > 0) {
    if (size > maxPerPage) {
      warnings.push(
        `Reducing page size from ${size} to ${maxPerPage} (Typesense limit)`
      );
      query.per_page = maxPerPage;
    } else {
      query.per_page = size;
    }
  } else if (size !== undefined) {
    warnings.push(
      `Invalid size parameter: ${size}, using default: ${defaultPerPage}`
    );
    query.per_page = defaultPerPage;
  }

  // Handle page parameter (from from/size)
  if (typeof from === "number" && typeof size === "number" && size > 0) {
    const calculatedPage = Math.floor(from / size) + 1;
    if (calculatedPage > 0) {
      query.page = calculatedPage;
    } else {
      warnings.push(
        `Invalid page calculation: ${calculatedPage}, using default: ${defaultPage}`
      );
      query.page = defaultPage;
    }
  } else if (from !== undefined && (typeof from !== "number" || from < 0)) {
    warnings.push(
      `Invalid from parameter: ${from}, using default page: ${defaultPage}`
    );
    query.page = defaultPage;
  }

  const sort = input.sort;
  if (Array.isArray(sort)) {
    const sortBy = sort
      .map((entry) => {
        const [field, rawOptions] = Object.entries(entry)[0];
        const options = rawOptions as { order: "asc" | "desc" };

        if (field === "_geo_distance") {
          const geoSortResult = transformGeoSort(
            rawOptions as Record<string, any>,
            ctx
          );
          warnings.push(...geoSortResult.warnings);
          return geoSortResult.sort !== undefined ? geoSortResult.sort : null;
        }

        if (field === "_score") {
          return ctx.defaultScoreField !== undefined
            ? ctx.defaultScoreField
            : "_text_match:desc";
        }

        const mapped = resolveMappedField(field, ctx);
        if (mapped === undefined || mapped === null) {
          warnings.push(`Skipped unmapped sort field "${field}"`);
          return null;
        }

        return `${mapped}:${options.order}`;
      })
      .filter(Boolean)
      .join(",");

    if (sortBy) {
      query.sort_by = sortBy;
    }
  }

  return { query, warnings };
};
