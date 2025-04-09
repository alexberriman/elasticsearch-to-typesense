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

  if (typeof size === "number") {
    // Typesense has a maximum limit of 250 for per_page
    const maxPerPage = 250;
    if (size > maxPerPage) {
      warnings.push(
        `Reducing page size from ${size} to ${maxPerPage} (Typesense limit)`
      );
      query.per_page = maxPerPage;
    } else {
      query.per_page = size;
    }
  }
  if (typeof from === "number" && typeof size === "number") {
    query.page = Math.floor(from / size) + 1;
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
