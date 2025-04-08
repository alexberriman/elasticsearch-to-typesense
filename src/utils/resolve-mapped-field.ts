import { TransformerContext } from "../core/types";

export const resolveMappedField = (
  field: string,
  ctx: TransformerContext
): string | undefined => {
  const mapped = ctx.propertyMapping[field] ?? field;

  const valid =
    ctx.typesenseSchema?.fields.some((f) => f.name === mapped) ?? true;

  if (!valid) {
    console.warn(
      `[transform] Field "${field}" mapped to "${mapped}" was not found in Typesense schema`
    );
  }

  return valid ? mapped : undefined;
};
