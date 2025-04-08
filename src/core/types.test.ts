import { describe, expect, it } from "vitest";
import {
  Result,
  TransformResult,
  PropertyMapping,
  TypesenseQuery,
  TransformerContext,
  TransformerOptions,
} from "./types";

describe("types", () => {
  describe("Result type", () => {
    it("should create a successful result", () => {
      const result: Result<number> = {
        ok: true,
        value: 42,
      };

      expect(result.ok).toBe(true);
      expect((result as any).value).toBe(42);
    });

    it("should create an error result", () => {
      const result: Result<number> = {
        ok: false,
        error: "Something went wrong",
      };

      expect(result.ok).toBe(false);
      expect((result as any).error).toBe("Something went wrong");
    });
  });

  describe("TransformResult type", () => {
    it("should create a transform result", () => {
      const result: TransformResult<TypesenseQuery> = {
        query: {
          q: "*",
          filter_by: "field:=value",
        },
        warnings: ["Warning message"],
      };

      expect(result.query.q).toBe("*");
      expect(result.query.filter_by).toBe("field:=value");
      expect(result.warnings).toEqual(["Warning message"]);
    });
  });

  describe("PropertyMapping type", () => {
    it("should map Elasticsearch field names to Typesense field names", () => {
      const mapping: PropertyMapping = {
        elastic_field1: "typesense_field1",
        elastic_field2: "typesense_field2",
      };

      expect(mapping.elastic_field1).toBe("typesense_field1");
      expect(mapping.elastic_field2).toBe("typesense_field2");
    });
  });

  describe("TransformerContext type", () => {
    it("should create a minimal context", () => {
      const ctx: TransformerContext = {
        propertyMapping: {},
      };

      expect(ctx.propertyMapping).toEqual({});
      expect(ctx.typesenseSchema).toBeUndefined();
      expect(ctx.elasticSchema).toBeUndefined();
      expect(ctx.negated).toBeUndefined();
      expect(ctx.defaultScoreField).toBeUndefined();
    });

    it("should create a complete context", () => {
      const ctx: TransformerContext = {
        propertyMapping: { field1: "mapped1" },
        typesenseSchema: { fields: [{ name: "mapped1", type: "string" }] },
        elasticSchema: { properties: { field1: { type: "text" } } },
        negated: true,
        defaultScoreField: "quality_score:desc",
      };

      expect(ctx.propertyMapping).toEqual({ field1: "mapped1" });
      expect(ctx.typesenseSchema).toEqual({
        fields: [{ name: "mapped1", type: "string" }],
      });
      expect(ctx.elasticSchema).toEqual({
        properties: { field1: { type: "text" } },
      });
      expect(ctx.negated).toBe(true);
      expect(ctx.defaultScoreField).toBe("quality_score:desc");
    });
  });

  describe("TypesenseQuery type", () => {
    it("should create a minimal query", () => {
      const query: TypesenseQuery = {
        q: "*",
      };

      expect(query.q).toBe("*");
      expect(query.filter_by).toBeUndefined();
      expect(query.sort_by).toBeUndefined();
      expect(query.per_page).toBeUndefined();
      expect(query.page).toBeUndefined();
    });

    it("should create a complete query", () => {
      const query: TypesenseQuery = {
        q: "search term",
        filter_by: "field:=value",
        sort_by: "field:asc",
        per_page: 20,
        page: 2,
      };

      expect(query.q).toBe("search term");
      expect(query.filter_by).toBe("field:=value");
      expect(query.sort_by).toBe("field:asc");
      expect(query.per_page).toBe(20);
      expect(query.page).toBe(2);
    });
  });

  describe("TransformerOptions type", () => {
    it("should create options with defaults", () => {
      const options: TransformerOptions = {};

      expect(options.propertyMapping).toBeUndefined();
      expect(options.typesenseSchema).toBeUndefined();
      expect(options.elasticSchema).toBeUndefined();
      expect(options.autoMapProperties).toBeUndefined();
      expect(options.fieldMatchStrategy).toBeUndefined();
      expect(options.defaultQueryString).toBeUndefined();
      expect(options.defaultScoreField).toBeUndefined();
    });

    it("should create options with all properties", () => {
      const fieldMatchFn = (
        elasticField: string,
        typesenseField: string
      ): boolean => {
        return elasticField === typesenseField;
      };

      const options: TransformerOptions = {
        propertyMapping: { field1: "mapped1" },
        typesenseSchema: { fields: [{ name: "mapped1", type: "string" }] },
        elasticSchema: { properties: { field1: { type: "text" } } },
        autoMapProperties: true,
        fieldMatchStrategy: fieldMatchFn,
        defaultQueryString: "default query",
        defaultScoreField: "quality_score:desc",
      };

      expect(options.propertyMapping).toEqual({ field1: "mapped1" });
      expect(options.typesenseSchema).toEqual({
        fields: [{ name: "mapped1", type: "string" }],
      });
      expect(options.elasticSchema).toEqual({
        properties: { field1: { type: "text" } },
      });
      expect(options.autoMapProperties).toBe(true);
      expect(options.fieldMatchStrategy).toBe(fieldMatchFn);
      expect(options.defaultQueryString).toBe("default query");
      expect(options.defaultScoreField).toBe("quality_score:desc");
    });
  });
});
