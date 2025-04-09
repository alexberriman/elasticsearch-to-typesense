import { describe, expect, it } from "vitest";
import { suggestTransformHints } from "./suggest-transform-hints.js";
import { ElasticSchema, TypesenseSchema } from "../core/types.js";

describe("suggestTransformHints", () => {
  const elasticSchema: ElasticSchema = {
    properties: {
      id: { type: "keyword" },
      name: { type: "text" },
      created_at: { type: "date" },
      updated_at: { type: "date" },
      counter: { type: "integer" },
      price: { type: "float" },
      location: { type: "geo_point" },
    },
  };

  const typesenseSchema: TypesenseSchema = {
    fields: [
      { name: "id", type: "string" },
      { name: "name", type: "string" },
      { name: "created_at", type: "string" },
      { name: "updated_at", type: "int64" },
      { name: "counter", type: "int32" },
      { name: "other_field", type: "string" },
    ],
  };

  it("should generate hints for missing fields", () => {
    const hints = suggestTransformHints(elasticSchema, typesenseSchema);

    expect(hints).toContain(
      'No Typesense field for Elasticsearch field "price"'
    );
    expect(hints).toContain(
      'No Typesense field for Elasticsearch field "location"'
    );
  });

  it("should suggest coercion for date fields that aren't numeric in Typesense", () => {
    const hints = suggestTransformHints(elasticSchema, typesenseSchema);

    expect(hints).toContain(
      'Field "created_at" is a date, but TS field "created_at" is type "string". Consider coercion.'
    );
    expect(hints).not.toContain(
      'Field "updated_at" is a date, but TS field "updated_at" is type "int64". Consider coercion.'
    );
  });

  it("should use custom match strategy when provided", () => {
    const customMatchStrategy = (
      elasticField: string,
      typesenseField: string
    ) => {
      return elasticField.toLowerCase() === typesenseField.toLowerCase();
    };

    const customElasticSchema: ElasticSchema = {
      properties: {
        USER_ID: { type: "keyword" },
        USER_NAME: { type: "text" },
      },
    };

    const customTypesenseSchema: TypesenseSchema = {
      fields: [
        { name: "user_id", type: "string" },
        { name: "user_name", type: "string" },
      ],
    };

    const hints = suggestTransformHints(
      customElasticSchema,
      customTypesenseSchema,
      customMatchStrategy
    );

    expect(hints).toHaveLength(0);
  });

  it("should handle empty schemas", () => {
    const emptyElasticSchema: ElasticSchema = { properties: {} };
    const emptyTypesenseSchema: TypesenseSchema = { fields: [] };

    const hints = suggestTransformHints(
      emptyElasticSchema,
      emptyTypesenseSchema
    );

    expect(hints).toEqual([]);
  });

  it("should not generate hints for matching fields with compatible types", () => {
    const hints = suggestTransformHints(elasticSchema, typesenseSchema);

    expect(hints).not.toContain(
      'No Typesense field for Elasticsearch field "id"'
    );
    expect(hints).not.toContain(
      'No Typesense field for Elasticsearch field "name"'
    );
    expect(hints).not.toContain(
      'No Typesense field for Elasticsearch field "counter"'
    );
  });
});
