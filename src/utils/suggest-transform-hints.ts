import { ElasticSchema, TypesenseSchema } from "../core/types.js";

export const suggestTransformHints = (
  elastic: ElasticSchema,
  typesense: TypesenseSchema,
  matchStrategy?: (elasticField: string, typesenseField: string) => boolean
): string[] => {
  const hints: string[] = [];

  const match = matchStrategy ?? ((e, t) => e === t);

  for (const [elasticField, elasticMeta] of Object.entries(
    elastic.properties
  )) {
    const tsMatch = typesense.fields.find((tsField) =>
      match(elasticField, tsField.name)
    );

    if (tsMatch === undefined) {
      hints.push(
        `No Typesense field for Elasticsearch field "${elasticField}"`
      );
    } else {
      const elasticType = elasticMeta.type;
      const typesenseType = tsMatch.type;

      if (
        elasticType === "date" &&
        !["int64", "int32"].includes(typesenseType)
      ) {
        hints.push(
          `Field "${elasticField}" is a date, but TS field "${tsMatch.name}" is type "${typesenseType}". Consider coercion.`
        );
      }
    }
  }

  return hints;
};
