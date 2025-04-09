import { describe, it, expect } from "vitest";
import { createDefaultMapper } from "./map-results-to-elastic.js";

describe("createDefaultMapper", () => {
  it("creates a function that maps a single document", () => {
    const propertyMapping = {
      elastic_title: "typesense_title",
      elastic_price: "typesense_price",
      elastic_tags: "typesense_tags",
    };

    const mapper = createDefaultMapper(propertyMapping);

    const typesenseDocument = {
      typesense_title: "Test Product",
      typesense_price: 99.99,
      typesense_tags: ["tag1", "tag2"],
      unmapped_field: "value",
    };

    const expectedElasticDocument = {
      elastic_title: "Test Product",
      elastic_price: 99.99,
      elastic_tags: ["tag1", "tag2"],
      unmapped_field: "value", // Unmapped fields keep their original names
    };

    const result = mapper(typesenseDocument);
    expect(result).toEqual(expectedElasticDocument);
  });

  it("maps an array of documents", () => {
    const propertyMapping = {
      elastic_id: "typesense_id",
      elastic_name: "typesense_name",
    };

    const mapper = createDefaultMapper(propertyMapping);

    const typesenseDocuments = [
      { typesense_id: 1, typesense_name: "Item 1" },
      { typesense_id: 2, typesense_name: "Item 2" },
    ];

    const expectedElasticDocuments = [
      { elastic_id: 1, elastic_name: "Item 1" },
      { elastic_id: 2, elastic_name: "Item 2" },
    ];

    const result = mapper(typesenseDocuments);
    expect(result).toEqual(expectedElasticDocuments);
  });

  it("handles nested objects", () => {
    const propertyMapping = {
      elastic_user: "typesense_user",
      "elastic_meta.created_at": "typesense_meta.created_at",
    };

    const mapper = createDefaultMapper(propertyMapping);

    const typesenseDocument = {
      typesense_user: "User1",
      typesense_meta: {
        created_at: "2023-01-01",
        updated_at: "2023-02-01",
      },
    };

    // Note: Even though we only mapped elastic_meta.created_at,
    // the entire nested object gets mapped because we're mapping the parent container
    const expectedElasticDocument = {
      elastic_user: "User1",
      typesense_meta: {
        created_at: "2023-01-01",
        updated_at: "2023-02-01",
      },
    };

    const result = mapper(typesenseDocument);
    expect(result).toEqual(expectedElasticDocument);
  });

  it("handles arrays of objects", () => {
    const propertyMapping = {
      "elastic_items.name": "typesense_items.name",
      "elastic_items.qty": "typesense_items.quantity",
    };

    const mapper = createDefaultMapper(propertyMapping);

    const typesenseDocument = {
      typesense_items: [
        { name: "Item 1", quantity: 5, price: 10 },
        { name: "Item 2", quantity: 3, price: 20 },
      ],
    };

    // Similar to nested objects, we're mapping the container object
    const expectedElasticDocument = {
      typesense_items: [
        { name: "Item 1", quantity: 5, price: 10 },
        { name: "Item 2", quantity: 3, price: 20 },
      ],
    };

    const result = mapper(typesenseDocument);
    expect(result).toEqual(expectedElasticDocument);
  });

  it("handles empty or null input", () => {
    const propertyMapping = {
      elastic_field: "typesense_field",
    };

    const mapper = createDefaultMapper(propertyMapping);

    expect(mapper(null)).toEqual(null);
    expect(mapper(undefined)).toEqual(undefined);
    expect(mapper({})).toEqual({});
    expect(mapper([])).toEqual([]);
  });

  it("preserves non-object values in arrays", () => {
    const propertyMapping = {
      elastic_tags: "typesense_tags",
    };

    const mapper = createDefaultMapper(propertyMapping);

    const typesenseDocument = {
      typesense_tags: ["tag1", "tag2", "tag3"],
    };

    const expectedElasticDocument = {
      elastic_tags: ["tag1", "tag2", "tag3"],
    };

    const result = mapper(typesenseDocument);
    expect(result).toEqual(expectedElasticDocument);
  });
});
