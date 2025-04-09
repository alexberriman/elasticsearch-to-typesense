import { describe, expect, it } from "vitest";
import { applyAutoMapping } from "./apply-auto-mapping.js";
import { ElasticSchema, TypesenseSchema } from "../core/types.js";

describe("applyAutoMapping", () => {
  it("should map Elasticsearch fields to Typesense fields", () => {
    const elasticSchema: ElasticSchema = {
      properties: {
        id: { type: "keyword" },
        name: { type: "text" },
        age: { type: "integer" },
        activity_date: { type: "date" },
        activity_location: { type: "geo_point" },
      },
    };

    const typesenseSchema: TypesenseSchema = {
      fields: [
        { name: "id", type: "string" },
        { name: "name", type: "string" },
        { name: "age", type: "int32" },
        { name: "date", type: "int64" },
        { name: "location", type: "geopoint" },
      ],
    };

    const mapping = applyAutoMapping(elasticSchema, typesenseSchema);

    expect(mapping).toEqual({
      activity_date: "date",
      activity_location: "location",
    });
  });

  it("should handle empty schemas", () => {
    const elasticSchema: ElasticSchema = { properties: {} };
    const typesenseSchema: TypesenseSchema = { fields: [] };

    const mapping = applyAutoMapping(elasticSchema, typesenseSchema);

    expect(mapping).toEqual({});
  });

  it("should create mappings only for fields that match", () => {
    const elasticSchema: ElasticSchema = {
      properties: {
        id: { type: "keyword" },
        title: { type: "text" },
        description: { type: "text" },
        activity_status: { type: "keyword" },
      },
    };

    const typesenseSchema: TypesenseSchema = {
      fields: [
        { name: "id", type: "string" },
        { name: "status", type: "string" },
        { name: "other_field", type: "string" },
      ],
    };

    const mapping = applyAutoMapping(elasticSchema, typesenseSchema);

    expect(mapping).toEqual({
      activity_status: "status",
    });
    expect(mapping.title).toBeUndefined();
    expect(mapping.description).toBeUndefined();
  });

  it("should handle prefixes in Elasticsearch field names", () => {
    const elasticSchema: ElasticSchema = {
      properties: {
        activity_name: { type: "text" },
        activity_price: { type: "float" },
        activity_category: { type: "keyword" },
        regular_field: { type: "keyword" },
      },
    };

    const typesenseSchema: TypesenseSchema = {
      fields: [
        { name: "name", type: "string" },
        { name: "price", type: "float" },
        { name: "activity_category", type: "string" },
      ],
    };

    const mapping = applyAutoMapping(elasticSchema, typesenseSchema);

    expect(mapping).toEqual({
      activity_name: "name",
      activity_price: "price",
    });
  });
});
