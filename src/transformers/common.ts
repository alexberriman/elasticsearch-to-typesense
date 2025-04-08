import { resolveMappedField } from "../utils/resolve-mapped-field";
import { quoteValue } from "../utils/quote-value";
import { coerceValueFromSchema } from "../utils/coerce-value-from-schema";
import { TransformerContext } from "../core/types";

export const createPaginationAndSort = (
  input: any,
  ctx: TransformerContext
): { query: Record<string, any>; warnings: string[] } => {
  const warnings: string[] = [];
  const query: Record<string, any> = {};

  // Pagination
  const from = input.from;
  const size = input.size;

  if (typeof size === "number") query.per_page = size;
  if (typeof from === "number" && typeof size === "number") {
    query.page = Math.floor(from / size) + 1;
  }

  // Sort
  const sort = input.sort;
  if (Array.isArray(sort)) {
    const sortBy = sort
      .map((entry) => {
        const [field, rawOptions] = Object.entries(entry)[0];
        const options = rawOptions as { order: "asc" | "desc" };

        if (field === "_geo_distance") {
          warnings.push("Typesense does not support geo sorting yet");
          return null;
        }

        if (field === "_score") {
          return "_text_match:desc"; // Default for scoring
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
