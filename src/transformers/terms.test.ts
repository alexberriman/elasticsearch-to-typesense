import { describe, expect, it } from "vitest";
import { transformTerms } from "./terms";
import { TransformerContext } from "../core/types";

describe("transformTerms", () => {
  const createContext = (propertyMapping = {}): TransformerContext => ({
    propertyMapping,
  });

  it("transforms a terms query with string values", () => {
    const query = { field_name: ["value1", "value2", "value3"] };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformTerms(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:=[value1,value2,value3]",
      },
      warnings: [],
    });
  });

  it("transforms a terms query with number values", () => {
    const query = { field_name: [1, 2, 3] };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformTerms(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:=[1,2,3]",
      },
      warnings: [],
    });
  });

  it("transforms a terms query with mixed type values", () => {
    const query = { field_name: [1, "two", true] };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformTerms(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:=[1,two,true]",
      },
      warnings: [],
    });
  });

  it("transforms a terms query with multiple fields", () => {
    const query = {
      field_name1: ["value1", "value2"],
      field_name2: [1, 2],
    };
    const ctx = createContext({
      field_name1: "mapped_field1",
      field_name2: "mapped_field2",
    });

    const result = transformTerms(query, ctx);

    expect(result.query.filter_by).toContain("mapped_field1:=[value1,value2]");
    expect(result.query.filter_by).toContain("mapped_field2:=[1,2]");
    expect(result.query.filter_by).toContain("&&");
    expect(result.warnings).toEqual([]);
  });

  it("returns warning when field cannot be resolved", () => {
    const query = { unknown_field: ["value1", "value2"] };
    const ctx = createContext();

    const result = transformTerms(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "",
      },
      warnings: ['Skipped unmapped field "unknown_field"'],
    });
  });

  it("returns warning when values is not an array", () => {
    const query = { field_name: "not_an_array" } as any;
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformTerms(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "",
      },
      warnings: ['Terms clause for "field_name" must be an array'],
    });
  });

  it("handles empty array of values", () => {
    const query = { field_name: [] };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformTerms(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:=[]",
      },
      warnings: [],
    });
  });

  it("handles mixed mapped and unmapped fields", () => {
    const query = {
      mapped_field: [1, 2, 3],
      unmapped_field: ["a", "b", "c"],
    };
    const ctx = createContext({ mapped_field: "actual_field" });

    const result = transformTerms(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "actual_field:=[1,2,3]",
      },
      warnings: ['Skipped unmapped field "unmapped_field"'],
    });
  });
});
