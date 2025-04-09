import { TransformerContext } from "../core/types.js";

/**
 * Options for applying the value transformer
 */
export interface ApplyValueTransformerOptions {
  /** Original field name from Elasticsearch query */
  elasticField: string;
  /** Mapped field name for Typesense query */
  typesenseField: string;
  /** Original value from Elasticsearch query */
  value: any;
  /** Transformer context */
  ctx: TransformerContext;
}

/**
 * Apply the value transformer if provided in the context
 *
 * @param options - Options containing all necessary parameters
 * @returns Transformed value (or original if no transformer defined)
 */
export const applyValueTransformer = (
  options: ApplyValueTransformerOptions
): any => {
  const { elasticField, typesenseField, value, ctx } = options;

  // If no transformer, return the original value
  if (ctx.valueTransformer === undefined) {
    return value;
  }

  // Extract schema information for the fields
  const elasticFieldSchema = ctx.elasticSchema?.properties?.[elasticField];
  const typesenseFieldSchema = ctx.typesenseSchema?.fields.find(
    (field) => field.name === typesenseField
  );

  // Apply the transformer with all relevant context
  return ctx.valueTransformer(typesenseField, value, {
    elasticField,
    typesenseField,
    typesenseSchema: ctx.typesenseSchema,
    elasticSchema: ctx.elasticSchema,
    elasticFieldSchema,
    typesenseFieldSchema,
  });
};
