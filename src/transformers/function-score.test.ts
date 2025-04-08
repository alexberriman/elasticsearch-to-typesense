import { describe, expect, it, vi } from "vitest";
import { transformFunctionScore } from "./function-score";
import { TransformerContext } from "../core/types";
import * as transformer from "../core/transformer";

// Mock the transformQueryRecursively function
vi.mock("../core/transformer", () => ({
  transformQueryRecursively: vi.fn(),
}));

describe("transformFunctionScore", () => {
  const createContext = (): TransformerContext => ({
    propertyMapping: {},
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("transforms function_score query with a base query", () => {
    const mockBaseResult = {
      query: { filter_by: "field:=value" },
      warnings: [],
    };

    vi.spyOn(transformer, "transformQueryRecursively").mockReturnValueOnce(
      mockBaseResult
    );

    const query = {
      query: { term: { field: "value" } },
    };

    const result = transformFunctionScore(query, createContext());

    expect(result.query.filter_by).toBe("(field:=value)");
    expect(result.warnings).toEqual([]);
    expect(transformer.transformQueryRecursively).toHaveBeenCalledTimes(1);
    expect(transformer.transformQueryRecursively).toHaveBeenCalledWith(
      { term: { field: "value" } },
      expect.any(Object)
    );
  });

  it("adds warning when functions are provided", () => {
    const mockBaseResult = {
      query: { filter_by: "field:=value" },
      warnings: [],
    };

    vi.spyOn(transformer, "transformQueryRecursively").mockReturnValueOnce(
      mockBaseResult
    );

    const query = {
      query: { term: { field: "value" } },
      functions: [{ field_value_factor: { field: "score", factor: 1.2 } }],
    };

    const result = transformFunctionScore(query, createContext());

    expect(result.query.filter_by).toBe("(field:=value)");
    expect(result.warnings).toContain(
      "function_score.functions are not supported in Typesense"
    );
    expect(transformer.transformQueryRecursively).toHaveBeenCalledTimes(1);
  });

  it("returns warning when query is missing", () => {
    const query = {
      functions: [{ field_value_factor: { field: "score", factor: 1.2 } }],
    };

    const result = transformFunctionScore(query, createContext());

    expect(result.query).toEqual({});
    expect(result.warnings).toContain('Missing "query" in function_score');
    expect(transformer.transformQueryRecursively).not.toHaveBeenCalled();
  });

  it("propagates warnings from base query", () => {
    const mockBaseResult = {
      query: { filter_by: "field:=value" },
      warnings: ["Warning from base query"],
    };

    vi.spyOn(transformer, "transformQueryRecursively").mockReturnValueOnce(
      mockBaseResult
    );

    const query = {
      query: { term: { field: "value" } },
    };

    const result = transformFunctionScore(query, createContext());

    expect(result.query.filter_by).toBe("(field:=value)");
    expect(result.warnings).toContain("Warning from base query");
    expect(transformer.transformQueryRecursively).toHaveBeenCalledTimes(1);
  });

  it("handles empty filter_by from base query", () => {
    const mockBaseResult = {
      query: { filter_by: "" },
      warnings: [],
    };

    vi.spyOn(transformer, "transformQueryRecursively").mockReturnValueOnce(
      mockBaseResult
    );

    const query = {
      query: { term: { field: "value" } },
    };

    const result = transformFunctionScore(query, createContext());

    expect(result.query.filter_by).toBe(undefined);
    expect(result.warnings).toEqual([]);
    expect(transformer.transformQueryRecursively).toHaveBeenCalledTimes(1);
  });
});
