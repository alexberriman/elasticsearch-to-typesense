export const createPaginationAndSort = (input: any) => {
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
          warnings.push("Typesense does not support geo sorting yet");
          return null;
        } else if (field === "_score") {
          return "_text_match:desc";
        } else {
          return `${field}:${options.order}`;
        }
      })
      .filter(Boolean)
      .join(",");

    if (sortBy) query.sort_by = sortBy;
  }

  return { query, warnings };
};
