import { TransformerContext } from "../core/types.js";

export const resolveMappedField = (
  field: string | null | undefined,
  ctx: TransformerContext
): string | undefined => {
  if (field === null || field === undefined) {
    return "";
  }

  // Empty string case
  if (field === "") {
    return "";
  }

  const mapped = ctx.propertyMapping[field] ?? field;

  const valid =
    ctx.typesenseSchema?.fields.some((f) => f.name === mapped) ?? true;

  return valid === true ? mapped : undefined;
};
