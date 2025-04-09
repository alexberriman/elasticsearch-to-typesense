import { describe, it, expect } from "vitest";
import { applyValueTransformer } from "./apply-value-transformer.js";
import { TransformerContext } from "../core/types.js";

describe("applyValueTransformer", () => {
  const elasticSchema = {
    properties: {
      title: { type: "text" },
      category: { type: "keyword" },
    },
  };

  const typesenseSchema = {
    fields: [
      { name: "title", type: "string" },
      { name: "category", type: "string", facet: true },
    ],
  };

  it("should return original value when no transformer is provided", () => {
    const ctx: TransformerContext = {
      propertyMapping: { title: "title", category: "category" },
      elasticSchema,
      typesenseSchema,
    };

    const result = applyValueTransformer({
      elasticField: "title",
      typesenseField: "title",
      value: "Test Value",
      ctx,
    });
    expect(result).toBe("Test Value");
  });

  it("should apply the transformer when provided", () => {
    const valueTransformer = (field: string, value: any) => {
      return typeof value === "string" ? value.toLowerCase() : value;
    };

    const ctx: TransformerContext = {
      propertyMapping: { title: "title", category: "category" },
      elasticSchema,
      typesenseSchema,
      valueTransformer,
    };

    const result = applyValueTransformer({
      elasticField: "title",
      typesenseField: "title",
      value: "Test Value",
      ctx,
    });
    expect(result).toBe("test value");
  });

  it("should provide schema details to the transformer function", () => {
    const valueTransformer = (
      field: string,
      value: any,
      context: {
        elasticField?: string;
        typesenseField: string;
        elasticFieldSchema?: Record<string, any>;
        typesenseFieldSchema?: Record<string, any>;
      }
    ) => {
      // For category field, transform to uppercase
      if (context.typesenseField === "category" && typeof value === "string") {
        return value.toUpperCase();
      }
      // For all other fields, lowercase
      return typeof value === "string" ? value.toLowerCase() : value;
    };

    const ctx: TransformerContext = {
      propertyMapping: { title: "title", category: "category" },
      elasticSchema,
      typesenseSchema,
      valueTransformer,
    };

    const titleResult = applyValueTransformer({
      elasticField: "title",
      typesenseField: "title",
      value: "Test",
      ctx,
    });
    expect(titleResult).toBe("test");

    const categoryResult = applyValueTransformer({
      elasticField: "category",
      typesenseField: "category",
      value: "Fiction",
      ctx,
    });
    expect(categoryResult).toBe("FICTION");
  });

  it("should handle non-string values", () => {
    const valueTransformer = (field: string, value: any) => {
      if (typeof value === "number") {
        return value * 2;
      }
      return value;
    };

    const ctx: TransformerContext = {
      propertyMapping: { price: "price" },
      valueTransformer,
    };

    const result = applyValueTransformer({
      elasticField: "price",
      typesenseField: "price",
      value: 10,
      ctx,
    });
    expect(result).toBe(20);
  });
});
