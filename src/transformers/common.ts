import { resolveMappedField } from "../utils/resolve-mapped-field";
import { transformGeoSort } from "../utils/transform-geo-sort";
import { TransformerContext } from "../core/types";

export const createPaginationAndSort = (
  input: any,
  ctx: TransformerContext
): { query: Record<string, any>; warnings: string[] } => {
  const warnings: string[] = [];
  const query: Record<string, any> = {};

  const from = input.from;
  const size = input.size;

  if (typeof size === "number") query.per_page = size;
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
          return geoSortResult.sort || null;
        }

        if (field === "_score") {
          return ctx.defaultScoreField || "_text_match:desc";
        }

        const mapped = resolveMappedField(field, ctx);
        if (!mapped) {
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
