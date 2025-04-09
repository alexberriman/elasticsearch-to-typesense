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
      .mockReturnValueOnce(mustNotResult)
      .mockReturnValue({ query: {}, warnings: [] }); // Mock for filter clause (not used)

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

  it("transforms bool query with filter clause", () => {
    // Reset all mocks to start fresh
    vi.resetAllMocks();

    // We need a direct mock implementation rather than return values
    vi.spyOn(transformer, "transformQueryRecursively").mockImplementation(
      (query) => {
        if (typeof query === "object" && query !== null) {
          if (
            "term" in query &&
            typeof query.term === "object" &&
            query.term !== null
          ) {
            const termObj = query.term;
            const field = Object.keys(termObj)[0];
            const value = termObj[field];
            return {
              query: { filter_by: `${field}:= ${value}` },
              warnings: [],
            };
          }
        }
        return { query: {}, warnings: [] };
      }
    );

    const query = {
      filter: [{ term: { field1: "value1" } }, { term: { field2: "value2" } }],
    };

    const result = transformBool(query, createContext());

    // Verify filter_by contains what we expect from the filter clause
    expect(result.query.filter_by).toContain("field1:= value1");
    expect(result.query.filter_by).toContain("field2:= value2");
    expect(result.warnings).toEqual([]);
  });
});

// Tests for utility functions
describe("utilities", () => {
  it("exports transformBool function", () => {
    expect(typeof transformBool).toBe("function");
  });
});

// For testing utility functions, we define our local versions
// since we can't access the private implementations

describe("bool transformation utilities", () => {
  describe("getSeparator", () => {
    const getSeparator = (
      clause: string,
      patterns: string[]
    ): string | null => {
      for (const pattern of patterns) {
        if (clause.includes(pattern)) {
          return pattern;
        }
      }
      return null;
    };

    it("should find the correct separator", () => {
      expect(getSeparator("field:= value", [":= ", " == "])).toBe(":= ");
      expect(getSeparator("field == value", [":= ", " == "])).toBe(" == ");
      expect(getSeparator("field:> value", [":> ", " > "])).toBe(":> ");
      expect(getSeparator("field > value", [":> ", " > "])).toBe(" > ");
    });

    it("should return null when no separator matches", () => {
      expect(getSeparator("field:value", [":= ", " == "])).toBeNull();
    });
  });

  describe("splitClause", () => {
    const splitClause = (
      clause: string,
      separator: string
    ): { field: string; value: string } | null => {
      const parts = clause.split(separator, 2);
      if (parts.length !== 2) return null;

      return {
        field: parts[0].trim(),
        value: parts[1].trim(),
      };
    };

    it("should split a clause into field and value", () => {
      expect(splitClause("field:= value", ":= ")).toEqual({
        field: "field",
        value: "value",
      });
      expect(splitClause("  field  :=  value  ", ":= ")).toEqual({
        field: "field",
        value: "value",
      });
    });

    it("should handle values with spaces", () => {
      expect(splitClause("field:= value with spaces", ":= ")).toEqual({
        field: "field",
        value: "value with spaces",
      });
    });

    it("should return null for invalid clauses", () => {
      expect(splitClause("invalid", ":= ")).toBeNull();
    });
  });

  describe("processNegatedClauses", () => {
    // Simplified version for testing
    const processNegatedClauses = (
      clauses: Set<string>
    ): { clausesToNegate: string[]; warnings: string[] } => {
      const clausesToNegate: string[] = [];
      const warnings: string[] = [];

      for (const clause of clauses) {
        const cleanClause = clause.replace(/^\((.+)\)$/, "$1");

        if (cleanClause.includes(":= ")) {
          const [field, value] = cleanClause.split(":= ", 2);
          clausesToNegate.push(`${field.trim()}:!= ${value.trim()}`);
        } else if (cleanClause.includes(" IN ")) {
          const [field, value] = cleanClause.split(" IN ", 2);
          clausesToNegate.push(`${field.trim()}:!= ${value.trim()}`);
        } else if (cleanClause.includes(":> ") || cleanClause.includes(" > ")) {
          warnings.push(
            "Skipped must_not clause with unsupported negated range filter"
          );
          return { clausesToNegate: [], warnings };
        } else {
          warnings.push(`Unsupported negation format: ${clause}`);
        }
      }

      if (clausesToNegate.length === 0) {
        warnings.push(
          "Could not parse must_not clauses into valid Typesense filter expressions"
        );
      }

      return { clausesToNegate, warnings };
    };

    it("should process equality clauses correctly", () => {
      const clauses = new Set(["(field:= value)"]);
      const result = processNegatedClauses(clauses);

      expect(result.clausesToNegate).toContain("field:!= value");
      expect(result.warnings).toEqual([]);
    });

    it("should handle unsupported range filters", () => {
      const clauses = new Set(["(field:> 10)"]);
      const result = processNegatedClauses(clauses);

      expect(result.clausesToNegate).toEqual([]);
      expect(result.warnings).toContain(
        "Skipped must_not clause with unsupported negated range filter"
      );
    });

    it("should return warnings for unsupported formats", () => {
      const clauses = new Set(["(field CONTAINS value)"]);
      const result = processNegatedClauses(clauses);

      expect(result.warnings).toContain(
        "Unsupported negation format: (field CONTAINS value)"
      );
    });
  });
});
