import { describe, expect, it, vi } from "vitest";
import { transformTerm } from "./term.js";
import { TransformerContext } from "../core/types.js";
import * as resolveFieldModule from "../utils/resolve-mapped-field.js";

describe("transformTerm", () => {
  const createContext = (propertyMapping = {}): TransformerContext => ({
    propertyMapping,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("transforms a term query with string value", () => {
    const query = { field_name: "exact_value" };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformTerm(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: 'mapped_field:= "exact_value"',
      },
      warnings: [],
    });
  });

  it("transforms a term query with number value", () => {
    const query = { field_name: 42 };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformTerm(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:= 42",
      },
      warnings: [],
    });
  });

  it("transforms a term query with boolean value", () => {
    const query = { field_name: true };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformTerm(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:= true",
      },
      warnings: [],
    });
  });

  it("transforms a term query with object format (value and boost)", () => {
    const query = {
      field_name: {
        value: "exact_value",
        boost: 2.0,
      },
    };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformTerm(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: 'mapped_field:= "exact_value"',
      },
      warnings: [],
    });
  });

  it("adds warning for unmapped field", () => {
    const query = { unknown_field: "value" };
    const ctx = createContext({});

    vi.spyOn(resolveFieldModule, "resolveMappedField").mockReturnValue(
      undefined
    );

    const result = transformTerm(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "",
      },
      warnings: ['Skipped unmapped field "unknown_field"'],
    });
  });

  it("transforms multiple term conditions", () => {
    const query = {
      field1: "value1",
      field2: 42,
      field3: true,
    };
    const ctx = createContext({
      field1: "mapped_field1",
      field2: "mapped_field2",
      field3: "mapped_field3",
    });

    const result = transformTerm(query, ctx);

    expect(result.query.filter_by).toContain('mapped_field1:= "value1"');
    expect(result.query.filter_by).toContain("mapped_field2:= 42");
    expect(result.query.filter_by).toContain("mapped_field3:= true");
    expect(result.query.filter_by).toContain("&&");
    expect(result.warnings).toEqual([]);
  });
});
