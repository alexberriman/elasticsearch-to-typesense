import { ElasticSchema, TypesenseSchema } from "../core/types";

export const applyAutoMapping = (
  elastic: ElasticSchema,
  typesense: TypesenseSchema
): Record<string, string> => {
  const mapping: Record<string, string> = {};

  // Create mapping by finding matching field names

  Object.keys(elastic.properties).forEach((elasticField) => {
    for (const tsField of typesense.fields) {
      if (tsField.name.endsWith(elasticField.replace(/^activity_/, ""))) {
        mapping[elasticField] = tsField.name;
        break;
      }
    }
  });

  return mapping;
};
