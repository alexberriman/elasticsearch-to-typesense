import { describe, it, expect } from "vitest";
import { createTransformer } from "../core/create-transformer.js";

describe("valueTransformer integration", () => {
  // Test with real transformers, not mocks

  it("should transform term query values", () => {
    // Create a simple value transformer that lowercases string values
    const valueTransformer = (field: string, value: any) => {
      if (typeof value === "string") {
        return value.toLowerCase();
      }
      return value;
    };

    const transformer = createTransformer({
      valueTransformer,
    });

    const result = transformer.transform({
      query: {
        term: {
          name: "JOHN DOE",
        },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.query.filter_by).toContain('name:= "john doe"');
    }
  });

  it("should transform match query values", () => {
    // Create a simple value transformer that uppercases string values
    const valueTransformer = (field: string, value: any) => {
      if (typeof value === "string") {
        return value.toUpperCase();
      }
      return value;
    };

    const transformer = createTransformer({
      valueTransformer,
    });

    const result = transformer.transform({
      query: {
        match: {
          category: "fiction",
        },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.query.filter_by).toContain('category:= "FICTION"');
    }
  });

  it("should transform multi-match query values", () => {
    // Create a simple value transformer that adds a suffix
    const valueTransformer = (field: string, value: any) => {
      if (typeof value === "string") {
        return `${value}-transformed`;
      }
      return value;
    };

    const transformer = createTransformer({
      valueTransformer,
    });

    const result = transformer.transform({
      query: {
        multi_match: {
          query: "search term",
          fields: ["title", "description"],
        },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.query.q).toBe("search term-transformed");
    }
  });

  it("should transform range query values", () => {
    // Create a simple transformer that multiplies numbers by 10
    const valueTransformer = (field: string, value: any) => {
      if (typeof value === "number") {
        return value * 10;
      }
      return value;
    };

    const transformer = createTransformer({
      valueTransformer,
    });

    const result = transformer.transform({
      query: {
        range: {
          price: {
            gte: 5,
            lte: 20,
          },
        },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.query.filter_by).toContain("price:>= 50");
      expect(result.value.query.filter_by).toContain("price:<= 200");
    }
  });

  it("should transform terms query array values", () => {
    // Create a transformer that prefixes strings in arrays
    const valueTransformer = (field: string, value: any) => {
      if (typeof value === "string") {
        return `prefix-${value}`;
      }
      return value;
    };

    const transformer = createTransformer({
      valueTransformer,
    });

    const result = transformer.transform({
      query: {
        terms: {
          tags: ["tag1", "tag2", "tag3"],
        },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.query.filter_by).toContain('"prefix-tag1"');
      expect(result.value.query.filter_by).toContain('"prefix-tag2"');
      expect(result.value.query.filter_by).toContain('"prefix-tag3"');
    }
  });

  it("should provide schema information to the transformer", () => {
    const typesenseSchema = {
      fields: [
        { name: "category", type: "string", facet: true },
        { name: "title", type: "string" },
      ],
    };

    const elasticSchema = {
      properties: {
        category: { type: "keyword" },
        title: { type: "text" },
      },
    };

    // Create a transformer that uses schema information
    const valueTransformer = (
      field: string,
      value: any,
      context: {
        typesenseFieldSchema?: Record<string, any>;
      }
    ) => {
      // Transform facet fields to lowercase, other fields to uppercase
      if (typeof value === "string") {
        if (context.typesenseFieldSchema?.facet === true) {
          return value.toLowerCase();
        } else {
          return value.toUpperCase();
        }
      }
      return value;
    };

    const transformer = createTransformer({
      typesenseSchema,
      elasticSchema,
      valueTransformer,
    });

    const result = transformer.transform({
      query: {
        bool: {
          must: [
            { term: { category: "Fiction" } }, // Should be lowercase
            { term: { title: "book title" } }, // Should be uppercase
          ],
        },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.query.filter_by).toContain('category:= "fiction"');
      expect(result.value.query.filter_by).toContain('title:= "BOOK TITLE"');
    }
  });

  it("should handle complex geo-distance queries", () => {
    const valueTransformer = (field: string, value: any) => {
      // Convert string coordinates to numbers with precision
      if (
        (field.endsWith(".lat") || field.endsWith(".lon")) &&
        typeof value === "string"
      ) {
        return parseFloat(parseFloat(value).toFixed(2));
      }
      return value;
    };

    const transformer = createTransformer({
      valueTransformer,
    });

    const result = transformer.transform({
      query: {
        geo_distance: {
          distance: "10km",
          location: {
            lat: "37.77493",
            lon: "-122.41942",
          },
        },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Should have formatted coordinates with 2 decimal places
      expect(result.value.query.filter_by).toContain(
        "location:(37.77, -122.42, 10 km)"
      );
    }
  });

  it("should work with prefix queries", () => {
    const valueTransformer = (field: string, value: any) => {
      if (typeof value === "string") {
        return value.toLowerCase();
      }
      return value;
    };

    const transformer = createTransformer({
      valueTransformer,
    });

    const result = transformer.transform({
      query: {
        prefix: {
          title: {
            value: "JaVaS",
          },
        },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.query.q).toBe("javas*");
    }
  });
});
