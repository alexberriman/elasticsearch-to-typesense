import { describe, expect, it, vi } from "vitest";
import { transformRange } from "./range";
import { TransformerContext } from "../core/types";
import * as handleReservedKeywords from "../utils/handle-reserved-keywords";
import * as coerceValueModule from "../utils/coerce-value-from-schema";

describe("transformRange", () => {
  const createContext = (
    propertyMapping = {},
    typesenseSchema = undefined
  ): TransformerContext => ({
    propertyMapping,
    typesenseSchema,
  });

  it("should transform range query with gt, lt, gte, lte operators", () => {
    const query = {
      field_name: {
        gt: 10,
        lt: 20,
        gte: 5,
        lte: 25,
      },
    };
    const ctx = createContext({ field_name: "mapped_field" });

    vi.spyOn(
      handleReservedKeywords,
      "resolveReservedKeyword"
    ).mockImplementation((_field, value) => value);
    vi.spyOn(coerceValueModule, "coerceValueFromSchema").mockImplementation(
      (_field, value) => value
    );

    const result = transformRange(query, ctx);

    expect(result.query.filter_by).toContain("mapped_field:>10");
    expect(result.query.filter_by).toContain("mapped_field:<20");
    expect(result.query.filter_by).toContain("mapped_field:>=5");
    expect(result.query.filter_by).toContain("mapped_field:<=25");
    expect(result.warnings).toEqual([]);
  });

  it("should add warning and skip unmapped fields", () => {
    const query = {
      unmapped_field: {
        gt: 10,
      },
    };
    const ctx = createContext({});

    const result = transformRange(query, ctx);

    expect(result.query.filter_by).toBe("");
    expect(result.warnings).toEqual([
      'Skipped unmapped field "unmapped_field"',
    ]);
  });

  it("should add warning for unsupported range operators", () => {
    const query = {
      field_name: {
        unknown_op: 10,
      },
    };
    const ctx = createContext({ field_name: "mapped_field" });

    vi.spyOn(
      handleReservedKeywords,
      "resolveReservedKeyword"
    ).mockImplementation((_field, value) => value);
    vi.spyOn(coerceValueModule, "coerceValueFromSchema").mockImplementation(
      (_field, value) => value
    );

    const result = transformRange(query, ctx);

    expect(result.query.filter_by).toBe("");
    expect(result.warnings).toEqual([
      'Unsupported range operator "unknown_op" on field "field_name"',
    ]);
  });

  it("should add warning when range conditions are not an object", () => {
    const query = {
      field_name: "not_an_object",
    };
    const ctx = createContext({ field_name: "mapped_field" });

    const result = transformRange(query, ctx);

    expect(result.query.filter_by).toBe("");
    expect(result.warnings).toEqual([
      'Range conditions must be an object for "field_name"',
    ]);
  });

  it("should quote string values", () => {
    const query = {
      field_name: {
        gte: "2022-01-01",
        lte: "2022-12-31",
      },
    };
    const ctx = createContext({ field_name: "mapped_field" });

    vi.spyOn(
      handleReservedKeywords,
      "resolveReservedKeyword"
    ).mockImplementation((_field, value) => value);
    vi.spyOn(coerceValueModule, "coerceValueFromSchema").mockImplementation(
      (_field, value) => value
    );

    const result = transformRange(query, ctx);

    expect(result.query.filter_by).toContain('mapped_field:>="2022-01-01"');
    expect(result.query.filter_by).toContain('mapped_field:<="2022-12-31"');
    expect(result.warnings).toEqual([]);
  });
});
