import { ElasticSchema, TypesenseSchema } from "../core/types";

export const applyAutoMapping = (
  elastic: ElasticSchema,
  typesense: TypesenseSchema
): Record<string, string> => {
  const mapping: Record<string, string> = {};

  // Only map activity_ prefixed fields to their typesense counterparts
  Object.keys(elastic.properties).forEach((elasticField) => {
    if (elasticField.startsWith("activity_")) {
      const cleanFieldName = elasticField.replace(/^activity_/, "");

      for (const tsField of typesense.fields) {
        if (tsField.name === cleanFieldName) {
          mapping[elasticField] = tsField.name;
          break;
        }
      }
    }
  });

  return mapping;
};
