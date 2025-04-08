import { describe, expect, it } from "vitest";
import { resolveMappedField } from "./resolve-mapped-field";
import { TransformerContext, TypesenseSchema } from "../core/types";

describe("resolveMappedField", () => {
  const mockSchema: TypesenseSchema = {
    fields: [
      { name: "mapped_field", type: "string" },
      { name: "original_field", type: "string" }
    ]
  };

  it("should return mapped field when mapping exists", () => {
    const ctx: TransformerContext = {
      propertyMapping: {
        "original_field": "mapped_field"
      },
      typesenseSchema: mockSchema
    };

    expect(resolveMappedField("original_field", ctx)).toBe("mapped_field");
  });

  it("should return original field when no mapping exists", () => {
    const ctx: TransformerContext = {
      propertyMapping: {},
      typesenseSchema: mockSchema
    };

    expect(resolveMappedField("original_field", ctx)).toBe("original_field");
  });

  it("should return undefined when mapped field is not in schema", () => {
    const ctx: TransformerContext = {
      propertyMapping: {
        "original_field": "nonexistent_field"
      },
      typesenseSchema: mockSchema
    };

    expect(resolveMappedField("original_field", ctx)).toBeUndefined();
  });

  it("should return field when typesenseSchema is not provided", () => {
    const ctx: TransformerContext = {
      propertyMapping: {
        "original_field": "mapped_field"
      }
    };

    expect(resolveMappedField("original_field", ctx)).toBe("mapped_field");
    expect(resolveMappedField("other_field", ctx)).toBe("other_field");
  });

  it("should handle nullish field values", () => {
    const ctx: TransformerContext = {
      propertyMapping: {},
      typesenseSchema: mockSchema
    };

    expect(resolveMappedField("", ctx)).toBe("");
  });
});