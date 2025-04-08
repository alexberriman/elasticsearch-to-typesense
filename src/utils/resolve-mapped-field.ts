import { TransformerContext } from "../core/types";

export const resolveMappedField = (
  field: string,
  ctx: TransformerContext
): string | undefined => {
  const mapped = ctx.propertyMapping[field] ?? field;

  const valid =
    ctx.typesenseSchema?.fields.some((f) => f.name === mapped) ?? true;

  return valid ? mapped : undefined;
};
