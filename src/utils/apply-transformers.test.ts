import { describe, expect, it, vi } from "vitest";
import { applyTransformers } from "./apply-transformers.js";
import { ElasticsearchQuery, TransformerContext } from "../core/types.js";

describe("applyTransformers", () => {
  const mockContext: TransformerContext = {
    propertyMapping: {},
  };

  it("should apply transformers for each recognized clause", () => {
    const mockTransformers = {
      match: vi.fn().mockReturnValue({
        query: { filter_by: "field1:=value1" },
        warnings: [],
      }),
      term: vi.fn().mockReturnValue({
        query: { filter_by: "field2:=value2" },
        warnings: [],
      }),
    };

    const esQuery: ElasticsearchQuery = {
      match: { field1: "value1" },
      term: { field2: "value2" },
    };

    const result = applyTransformers(esQuery, mockContext, mockTransformers);

    expect(mockTransformers.match).toHaveBeenCalledWith(
      { field1: "value1" },
      mockContext
    );
    expect(mockTransformers.term).toHaveBeenCalledWith(
      { field2: "value2" },
      mockContext
    );
    expect(result.query.filter_by).toBe("field1:=value1 && field2:=value2");
    expect(result.warnings).toEqual([]);
  });

  it("should log warnings for unsupported clauses", () => {
    const mockTransformers = {
      match: vi.fn().mockReturnValue({
        query: { filter_by: "field1:=value1" },
        warnings: [],
      }),
    };

    const esQuery: ElasticsearchQuery = {
      match: { field1: "value1" },
      unsupported: { field2: "value2" },
    };

    const result = applyTransformers(esQuery, mockContext, mockTransformers);

    expect(result.query.filter_by).toBe("field1:=value1");
    expect(result.warnings).toEqual(['Unsupported clause: "unsupported"']);
  });

  it("should collect warnings from transformers", () => {
    const mockTransformers = {
      match: vi.fn().mockReturnValue({
        query: { filter_by: "field1:=value1" },
        warnings: ["Warning 1", "Warning 2"],
      }),
      term: vi.fn().mockReturnValue({
        query: { filter_by: "field2:=value2" },
        warnings: ["Warning 3"],
      }),
    };

    const esQuery: ElasticsearchQuery = {
      match: { field1: "value1" },
      term: { field2: "value2" },
    };

    const result = applyTransformers(esQuery, mockContext, mockTransformers);

    expect(result.query.filter_by).toBe("field1:=value1 && field2:=value2");
    expect(result.warnings).toEqual(["Warning 1", "Warning 2", "Warning 3"]);
  });

  it("should handle empty filter parts", () => {
    const mockTransformers = {
      match: vi.fn().mockReturnValue({
        query: {},
        warnings: [],
      }),
      term: vi.fn().mockReturnValue({
        query: { filter_by: "" },
        warnings: [],
      }),
    };

    const esQuery: ElasticsearchQuery = {
      match: { field1: "value1" },
      term: { field2: "value2" },
    };

    const result = applyTransformers(esQuery, mockContext, mockTransformers);

    expect(result.query.filter_by).toBeUndefined();
  });

  it("should handle empty query", () => {
    const mockTransformers = {
      match: vi.fn(),
      term: vi.fn(),
    };

    const esQuery: ElasticsearchQuery = {};

    const result = applyTransformers(esQuery, mockContext, mockTransformers);

    expect(mockTransformers.match).not.toHaveBeenCalled();
    expect(mockTransformers.term).not.toHaveBeenCalled();
    expect(result.query.filter_by).toBeUndefined();
    expect(result.warnings).toEqual([]);
  });
});
