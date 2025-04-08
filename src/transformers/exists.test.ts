import { describe, expect, it, vi } from "vitest";
import { transformExists } from "./exists";
import { TransformerContext } from "../core/types";
import * as resolveFieldModule from "../utils/resolve-mapped-field";

describe("transformExists", () => {
  const createContext = (
    propertyMapping = {},
    typesenseSchema = undefined
  ): TransformerContext => ({
    propertyMapping,
    typesenseSchema,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("transforms exists query for string field", () => {
    const query = { field: "field_name" };
    // @ts-expect-error - Test schema structure
    const ctx = createContext(
      { field_name: "mapped_field" },
      { fields: [{ name: "mapped_field", type: "string" }] }
    );

    const result = transformExists(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:!= null",
      },
      warnings: [],
    });
  });

  it("transforms exists query for integer field", () => {
    const query = { field: "field_name" };
    // @ts-expect-error - Test schema structure
    const ctx = createContext(
      { field_name: "mapped_field" },
      { fields: [{ name: "mapped_field", type: "int32" }] }
    );

    const result = transformExists(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:!= null",
      },
      warnings: [],
    });
  });

  it("transforms exists query for float field", () => {
    const query = { field: "field_name" };
    const ctx = createContext(
      { field_name: "mapped_field" },
      { fields: [{ name: "mapped_field", type: "float" }] }
    );

    const result = transformExists(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:!= null",
      },
      warnings: [],
    });
  });

  it("transforms exists query for int64 field", () => {
    const query = { field: "field_name" };
    const ctx = createContext(
      { field_name: "mapped_field" },
      { fields: [{ name: "mapped_field", type: "int64" }] }
    );

    const result = transformExists(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:!= null",
      },
      warnings: [],
    });
  });

  it("defaults to !=null when schema is not available", () => {
    const query = { field: "field_name" };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformExists(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:!= null",
      },
      warnings: [],
    });
  });

  it("defaults to !=null when field type is not recognized", () => {
    const query = { field: "field_name" };
    const ctx = createContext(
      { field_name: "mapped_field" },
      { fields: [{ name: "mapped_field", type: "unknown_type" }] }
    );

    const result = transformExists(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:!= null",
      },
      warnings: [],
    });
  });

  it("returns warning when field cannot be resolved", () => {
    const query = { field: "unknown_field" };
    const ctx = createContext();

    vi.spyOn(resolveFieldModule, "resolveMappedField").mockReturnValue(
      undefined
    );

    const result = transformExists(query, ctx);

    expect(result).toEqual({
      query: {},
      warnings: ['Could not resolve field "unknown_field" in exists clause'],
    });
  });
});
