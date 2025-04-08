import { describe, expect, it } from "vitest";
import { transformTerm } from "./term";
import { TransformerContext } from "../core/types";

describe("transformTerm", () => {
  const createContext = (propertyMapping = {}): TransformerContext => ({
    propertyMapping,
  });

  it("transforms a term query with string value", () => {
    const query = { field_name: "string_value" };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformTerm(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: 'mapped_field:="string_value"',
      },
      warnings: [],
    });
  });

  it("transforms a term query with number value", () => {
    const query = { field_name: 123 };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformTerm(query, ctx);

    expect(result).toEqual({
      query: {
        filter_by: "mapped_field:=123",
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
        filter_by: "mapped_field:=true",
      },
      warnings: [],
    });
  });

  it("returns warning when field cannot be resolved", () => {
    const query = { unknown_field: "value" };
    const ctx = createContext();

    const result = transformTerm(query, ctx);

    expect(result).toEqual({
      query: {},
      warnings: ['Could not resolve field "unknown_field" in term clause'],
    });
  });
});
