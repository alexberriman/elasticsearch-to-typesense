import { describe, expect, it, vi } from "vitest";
import { transformPrefix } from "./prefix";
import { TransformerContext } from "../core/types";
import * as resolveFieldModule from "../utils/resolve-mapped-field";

describe("transformPrefix", () => {
  const createContext = (propertyMapping = {}): TransformerContext => ({
    propertyMapping,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("transforms a basic prefix query", () => {
    const query = {
      field_name: {
        value: "test",
      },
    };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformPrefix(query, ctx);

    expect(result).toEqual({
      query: {
        q: "test*",
        query_by: "mapped_field",
      },
      warnings: [],
    });
  });

  it("handles prefix query with boost", () => {
    const query = {
      field_name: {
        value: "test",
        boost: 2.5,
      },
    };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformPrefix(query, ctx);

    expect(result).toEqual({
      query: {
        q: "test*",
        query_by: "mapped_field",
        query_by_weights: "2.5",
      },
      warnings: [],
    });
  });

  it("handles simplified prefix query format", () => {
    const query = {
      field_name: "test",
    };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformPrefix(query, ctx);

    expect(result).toEqual({
      query: {
        q: "test*",
        query_by: "mapped_field",
      },
      warnings: [],
    });
  });

  it("adds warning for unmapped field", () => {
    const query = { unknown_field: { value: "test" } };
    const ctx = createContext({});

    vi.spyOn(resolveFieldModule, "resolveMappedField").mockReturnValue(
      undefined
    );

    const result = transformPrefix(query, ctx);

    expect(result).toEqual({
      query: {},
      warnings: ['Skipped unmapped field "unknown_field"'],
    });
  });

  it("adds warning for invalid prefix value", () => {
    const query = { field_name: { value: null } };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformPrefix(query, ctx);

    expect(result).toEqual({
      query: {},
      warnings: ['Invalid prefix value for field "field_name"'],
    });
  });

  it("adds warning for empty prefix query", () => {
    const query = {};
    const ctx = createContext({});

    const result = transformPrefix(query, ctx);

    expect(result).toEqual({
      query: {},
      warnings: ["Empty prefix query"],
    });
  });
});
