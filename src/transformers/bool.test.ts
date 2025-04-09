import { describe, expect, it, vi } from "vitest";
import { transformBool } from "./bool.js";
import { TransformerContext } from "../core/types.js";
import * as transformer from "../core/transformer.js";

// Mock the transformQueryRecursively function
vi.mock("../core/transformer", () => ({
  transformQueryRecursively: vi.fn(),
}));

describe("transformBool", () => {
  const createContext = (): TransformerContext => ({
    propertyMapping: {},
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("transforms bool query with must clause", () => {
    const mockResult1 = {
      query: { filter_by: "field1:=value1" },
      warnings: [],
    };
    const mockResult2 = {
      query: { filter_by: "field2:=value2" },
      warnings: [],
    };

    vi.spyOn(transformer, "transformQueryRecursively")
      .mockReturnValueOnce(mockResult1)
      .mockReturnValueOnce(mockResult2);

    const query = {
      must: [{ term: { field1: "value1" } }, { term: { field2: "value2" } }],
    };

    const result = transformBool(query, createContext());

    expect(result.query.filter_by).toBe("(field1:=value1) && (field2:=value2)");
    expect(result.warnings).toEqual([]);
    expect(transformer.transformQueryRecursively).toHaveBeenCalledTimes(2);
  });

  it("transforms bool query with should clause", () => {
    const mockResult1 = {
      query: { filter_by: "field1:=value1" },
      warnings: [],
    };
    const mockResult2 = {
      query: { filter_by: "field2:=value2" },
      warnings: [],
    };

    vi.spyOn(transformer, "transformQueryRecursively")
      .mockReturnValueOnce(mockResult1)
      .mockReturnValueOnce(mockResult2);

    const query = {
      should: [{ term: { field1: "value1" } }, { term: { field2: "value2" } }],
    };

    const result = transformBool(query, createContext());

    expect(result.query.filter_by).toBe("(field1:=value1) || (field2:=value2)");
    expect(result.warnings).toEqual([]);
    expect(transformer.transformQueryRecursively).toHaveBeenCalledTimes(2);
  });

  it("transforms bool query with must_not clause for same field", () => {
    const mockResult1 = {
      query: { filter_by: 'field:= "value1"' },
      warnings: [],
    };
    const mockResult2 = {
      query: { filter_by: 'field:= "value2"' },
      warnings: [],
    };

    vi.spyOn(transformer, "transformQueryRecursively")
      .mockReturnValueOnce(mockResult1)
      .mockReturnValueOnce(mockResult2);

    const query = {
      must_not: [{ term: { field: "value1" } }, { term: { field: "value2" } }],
    };

    const result = transformBool(query, createContext());

    expect(result.query.filter_by).toBe(
      'field:!= "value1" && field:!= "value2"'
    );
    expect(result.warnings).toEqual([]);
    expect(transformer.transformQueryRecursively).toHaveBeenCalledTimes(2);
    expect(transformer.transformQueryRecursively).toHaveBeenNthCalledWith(
      1,
      { term: { field: "value1" } },
      expect.objectContaining({ negated: true })
    );
  });

  it("transforms bool query with must_not clause for different fields", () => {
    const mockResult1 = {
      query: { filter_by: 'field1:= "value1"' },
      warnings: [],
    };
    const mockResult2 = {
      query: { filter_by: 'field2:= "value2"' },
      warnings: [],
    };

    vi.spyOn(transformer, "transformQueryRecursively")
      .mockReturnValueOnce(mockResult1)
      .mockReturnValueOnce(mockResult2);

    const query = {
      must_not: [
        { term: { field1: "value1" } },
        { term: { field2: "value2" } },
      ],
    };

    const result = transformBool(query, createContext());

    expect(result.query.filter_by).toBe(
      'field1:!= "value1" && field2:!= "value2"'
    );
    expect(result.warnings).toEqual([]);
  });

  it("transforms complex bool query with multiple clauses", () => {
    const mustResult = { query: { filter_by: "must:= value" }, warnings: [] };
    const shouldResult = {
      query: { filter_by: "should:= value" },
      warnings: [],
    };
    const mustNotResult = {
      query: { filter_by: "mustNot:= value" },
      warnings: ["Warning"],
    };

    vi.spyOn(transformer, "transformQueryRecursively")
      .mockReturnValueOnce(mustResult)
      .mockReturnValueOnce(shouldResult)
      .mockReturnValueOnce(mustNotResult);

    const query = {
      must: [{ term: { field1: "value1" } }],
      should: [{ term: { field2: "value2" } }],
      must_not: [{ term: { field3: "value3" } }],
    };

    const result = transformBool(query, createContext());

    expect(result.query.filter_by).toBe(
      "((must:= value)) && ((should:= value)) && (mustNot:!= value)"
    );
    expect(result.warnings).toContain("Warning");
    expect(transformer.transformQueryRecursively).toHaveBeenCalledTimes(3);
  });

  it("skips must_not clause with unsupported negated range filter", () => {
    const mockResult = {
      query: { filter_by: "field:> 10" },
      warnings: [],
    };

    vi.spyOn(transformer, "transformQueryRecursively").mockReturnValueOnce(
      mockResult
    );

    const query = {
      must_not: [{ range: { field: { gt: 10 } } }],
    };

    const result = transformBool(query, createContext());

    expect(result.query.filter_by).toBe("");
    expect(result.warnings).toContain(
      "Skipped must_not clause with unsupported negated range filter"
    );
  });

  it("handles empty query", () => {
    const result = transformBool({}, createContext());

    expect(result.query.filter_by).toBe("");
    expect(result.warnings).toEqual([]);
    expect(transformer.transformQueryRecursively).not.toHaveBeenCalled();
  });
});
