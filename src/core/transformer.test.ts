import { describe, expect, it, vi } from "vitest";
import { transformQueryRecursively } from "./transformer.js";
import { TransformerContext } from "./types.js";
import * as matchTransformer from "../transformers/match.js";
import * as termsTransformer from "../transformers/terms.js";
import * as rangeTransformer from "../transformers/range.js";
import * as boolTransformer from "../transformers/bool.js";
import * as functionScoreTransformer from "../transformers/function-score.js";
import * as existsTransformer from "../transformers/exists.js";
import * as multiMatchTransformer from "../transformers/multi-match.js";
import * as normalizeParentheses from "../utils/normalize-parentheses.js";

// Mock all the transformers
vi.mock("../transformers/match", () => ({
  transformMatch: vi.fn(),
}));

vi.mock("../transformers/terms", () => ({
  transformTerms: vi.fn(),
}));

vi.mock("../transformers/range", () => ({
  transformRange: vi.fn(),
}));

vi.mock("../transformers/bool", () => ({
  transformBool: vi.fn(),
}));

vi.mock("../transformers/function-score", () => ({
  transformFunctionScore: vi.fn(),
}));

vi.mock("../transformers/exists", () => ({
  transformExists: vi.fn(),
}));

vi.mock("../transformers/multi-match", () => ({
  transformMultiMatch: vi.fn(),
}));

vi.mock("../utils/normalize-parentheses", () => ({
  normalizeParentheses: vi.fn(),
}));

describe("transformQueryRecursively", () => {
  const createContext = (): TransformerContext => ({
    propertyMapping: {},
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(normalizeParentheses.normalizeParentheses).mockImplementation(
      (input) => input
    );
  });

  it("should return a default query when esQuery is empty", () => {
    const result = transformQueryRecursively({}, createContext());

    expect(result).toEqual({
      query: {
        q: "*",
        filter_by: undefined,
      },
      warnings: [],
    });
  });

  it("should apply match transformer when match clause is present", () => {
    const matchResult = {
      query: { filter_by: "field:=value" },
      warnings: [],
    };
    vi.mocked(matchTransformer.transformMatch).mockReturnValue(matchResult);

    const esQuery = { match: { field: "value" } };
    const result = transformQueryRecursively(esQuery, createContext());

    expect(matchTransformer.transformMatch).toHaveBeenCalledWith(
      { field: "value" },
      expect.anything()
    );
    expect(result.query.filter_by).toBe("field:=value");
    expect(result.warnings).toEqual([]);
  });

  it("should apply terms transformer when terms clause is present", () => {
    const termsResult = {
      query: { filter_by: "field:=[value1,value2]" },
      warnings: [],
    };
    vi.mocked(termsTransformer.transformTerms).mockReturnValue(termsResult);

    const esQuery = { terms: { field: ["value1", "value2"] } };
    const result = transformQueryRecursively(esQuery, createContext());

    expect(termsTransformer.transformTerms).toHaveBeenCalledWith(
      { field: ["value1", "value2"] },
      expect.anything()
    );
    expect(result.query.filter_by).toBe("field:=[value1,value2]");
    expect(result.warnings).toEqual([]);
  });

  it("should apply range transformer when range clause is present", () => {
    const rangeResult = {
      query: { filter_by: "field:>=10 && field:<=20" },
      warnings: [],
    };
    vi.mocked(rangeTransformer.transformRange).mockReturnValue(rangeResult);

    const esQuery = { range: { field: { gte: 10, lte: 20 } } };
    const result = transformQueryRecursively(esQuery, createContext());

    expect(rangeTransformer.transformRange).toHaveBeenCalledWith(
      { field: { gte: 10, lte: 20 } },
      expect.anything()
    );
    expect(result.query.filter_by).toBe("field:>=10 && field:<=20");
    expect(result.warnings).toEqual([]);
  });

  it("should apply bool transformer when bool clause is present", () => {
    const boolResult = {
      query: { filter_by: "(field1:=value1) && (field2:=value2)" },
      warnings: [],
    };
    vi.mocked(boolTransformer.transformBool).mockReturnValue(boolResult);

    const esQuery = {
      bool: {
        must: [
          { match: { field1: "value1" } },
          { match: { field2: "value2" } },
        ],
      },
    };
    const result = transformQueryRecursively(esQuery, createContext());

    expect(boolTransformer.transformBool).toHaveBeenCalledWith(
      {
        must: [
          { match: { field1: "value1" } },
          { match: { field2: "value2" } },
        ],
      },
      expect.anything()
    );
    expect(result.query.filter_by).toBe("(field1:=value1) && (field2:=value2)");
    expect(result.warnings).toEqual([]);
  });

  it("should apply function_score transformer when function_score clause is present", () => {
    const functionScoreResult = {
      query: { filter_by: "field:=value" },
      warnings: ["function_score.functions are not supported"],
    };
    vi.mocked(functionScoreTransformer.transformFunctionScore).mockReturnValue(
      functionScoreResult
    );

    const esQuery = {
      function_score: {
        query: { match: { field: "value" } },
        functions: [{ field_value_factor: { field: "score" } }],
      },
    };
    const result = transformQueryRecursively(esQuery, createContext());

    expect(
      functionScoreTransformer.transformFunctionScore
    ).toHaveBeenCalledWith(
      {
        query: { match: { field: "value" } },
        functions: [{ field_value_factor: { field: "score" } }],
      },
      expect.anything()
    );
    expect(result.query.filter_by).toBe("field:=value");
    expect(result.warnings).toEqual([
      "function_score.functions are not supported",
    ]);
  });

  it("should apply exists transformer when exists clause is present", () => {
    const existsResult = {
      query: { filter_by: "field:!=null" },
      warnings: [],
    };
    vi.mocked(existsTransformer.transformExists).mockReturnValue(existsResult);

    const esQuery = { exists: { field: "field" } };
    const result = transformQueryRecursively(esQuery, createContext());

    expect(existsTransformer.transformExists).toHaveBeenCalledWith(
      { field: "field" },
      expect.anything()
    );
    expect(result.query.filter_by).toBe("field:!=null");
    expect(result.warnings).toEqual([]);
  });

  it("should add warning for unsupported clauses", () => {
    const esQuery = { unsupported_clause: { field: "value" } };
    const result = transformQueryRecursively(esQuery, createContext());

    expect(result.query.filter_by).toBeUndefined();
    expect(result.warnings).toEqual([
      'Unsupported clause: "unsupported_clause"',
    ]);
  });

  it("should combine multiple filter clauses with AND", () => {
    vi.mocked(matchTransformer.transformMatch).mockReturnValue({
      query: { filter_by: "field1:=value1" },
      warnings: [],
    });
    vi.mocked(termsTransformer.transformTerms).mockReturnValue({
      query: { filter_by: "field2:=[value2,value3]" },
      warnings: [],
    });
    vi.mocked(normalizeParentheses.normalizeParentheses).mockReturnValue(
      "field1:=value1 && field2:=[value2,value3]"
    );

    const esQuery = {
      match: { field1: "value1" },
      terms: { field2: ["value2", "value3"] },
    };
    const result = transformQueryRecursively(esQuery, createContext());

    expect(normalizeParentheses.normalizeParentheses).toHaveBeenCalledWith(
      "field1:=value1 && field2:=[value2,value3]"
    );
    expect(result.query.filter_by).toBe(
      "field1:=value1 && field2:=[value2,value3]"
    );
  });

  it("should collect warnings from all transformers", () => {
    vi.mocked(matchTransformer.transformMatch).mockReturnValue({
      query: { filter_by: "field1:=value1" },
      warnings: ["Warning from match"],
    });
    vi.mocked(termsTransformer.transformTerms).mockReturnValue({
      query: { filter_by: "field2:=[value2,value3]" },
      warnings: ["Warning from terms"],
    });

    const esQuery = {
      match: { field1: "value1" },
      terms: { field2: ["value2", "value3"] },
      unsupported: { field3: "value3" },
    };
    const result = transformQueryRecursively(esQuery, createContext());

    expect(result.warnings).toEqual([
      "Warning from match",
      "Warning from terms",
      'Unsupported clause: "unsupported"',
    ]);
  });

  it("should handle empty filter results", () => {
    vi.mocked(matchTransformer.transformMatch).mockReturnValue({
      query: { filter_by: "" },
      warnings: [],
    });
    vi.mocked(termsTransformer.transformTerms).mockReturnValue({
      query: { filter_by: undefined },
      warnings: [],
    });

    const esQuery = {
      match: { field1: "value1" },
      terms: { field2: ["value2", "value3"] },
    };
    const result = transformQueryRecursively(esQuery, createContext());

    expect(result.query.filter_by).toBeUndefined();
  });

  it("should handle search query from multi_match", () => {
    vi.mocked(multiMatchTransformer.transformMultiMatch).mockReturnValue({
      query: {
        q: "search term",
        query_by: "field1,field2",
        query_by_weights: "2,1",
      },
      warnings: [],
    });
    vi.mocked(matchTransformer.transformMatch).mockReturnValue({
      query: { filter_by: "status:=active" },
      warnings: [],
    });

    const esQuery = {
      multi_match: {
        fields: ["field1^2", "field2"],
        query: "search term",
      },
      match: { status: "active" },
    };
    const result = transformQueryRecursively(esQuery, createContext());

    expect(multiMatchTransformer.transformMultiMatch).toHaveBeenCalledWith(
      { fields: ["field1^2", "field2"], query: "search term" },
      expect.anything()
    );

    // Should use search term from multi_match
    expect(result.query.q).toBe("search term");

    // Should include additional parameters from multi_match
    expect(result.query.query_by).toBe("field1,field2");
    expect(result.query.query_by_weights).toBe("2,1");

    // Should still include filter_by from match
    expect(result.query.filter_by).toBe("status:=active");
  });
});
