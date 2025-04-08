import { describe, expect, it, vi } from "vitest";
import { transformMatch } from "./match";
import { TransformerContext } from "../core/types";
import * as resolveFieldModule from "../utils/resolve-mapped-field";

describe("transformMatch", () => {
  const createContext = (propertyMapping = {}): TransformerContext => ({
    propertyMapping,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("transforms a match query with a single field", () => {
    const query = { field_name: "value" };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformMatch(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: 'mapped_field:="value"',
      },
      warnings: [],
    });
  });

  it("transforms a match query with multiple fields", () => {
    const query = {
      field_name1: "value1",
      field_name2: "value2",
    };
    const ctx = createContext({
      field_name1: "mapped_field1",
      field_name2: "mapped_field2",
    });

    const result = transformMatch(query, ctx);

    expect(result.query.filter_by).toContain('mapped_field1:="value1"');
    expect(result.query.filter_by).toContain('mapped_field2:="value2"');
    expect(result.query.filter_by).toContain("&&");
    expect(result.warnings).toEqual([]);
  });

  it("transforms a match query with number value", () => {
    const query = { field_name: 123 };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformMatch(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:=123",
      },
      warnings: [],
    });
  });

  it("transforms a match query with boolean value", () => {
    const query = { field_name: true };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformMatch(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:=true",
      },
      warnings: [],
    });
  });

  it("returns warning when field cannot be resolved", () => {
    const query = { unknown_field: "value" };
    const ctx = createContext();

    vi.spyOn(resolveFieldModule, "resolveMappedField").mockReturnValue(
      undefined
    );

    const result = transformMatch(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "",
      },
      warnings: ['Skipped unmapped field "unknown_field"'],
    });
  });

  it("handles mixed mapped and unmapped fields", () => {
    const query = {
      known_field: "value1",
      unknown_field: "value2",
    };
    const ctx = createContext({ known_field: "mapped_field" });

    vi.spyOn(resolveFieldModule, "resolveMappedField").mockImplementation(
      (field) => (field === "known_field" ? "mapped_field" : undefined)
    );

    const result = transformMatch(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: 'mapped_field:="value1"',
      },
      warnings: ['Skipped unmapped field "unknown_field"'],
    });
  });
});
