import { describe, expect, it, vi } from "vitest";
import {
  isReservedKeyword,
  resolveReservedKeyword,
} from "./handle-reserved-keywords";
import { TypesenseSchema } from "../core/types";

describe("isReservedKeyword", () => {
  it("should identify 'now' as a reserved keyword", () => {
    expect(isReservedKeyword("now")).toBe(true);
    expect(isReservedKeyword("NOW")).toBe(true);
    expect(isReservedKeyword("Now")).toBe(true);
  });

  it("should return false for non-reserved keywords", () => {
    expect(isReservedKeyword("today")).toBe(false);
    expect(isReservedKeyword("current_date")).toBe(false);
    expect(isReservedKeyword("")).toBe(false);
  });

  it("should return false for non-string values", () => {
    expect(isReservedKeyword(123)).toBe(false);
    expect(isReservedKeyword(null)).toBe(false);
    expect(isReservedKeyword(undefined)).toBe(false);
    expect(isReservedKeyword({})).toBe(false);
    expect(isReservedKeyword([])).toBe(false);
  });
});

describe("resolveReservedKeyword", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 0, 1, 0, 0, 0, 0)); // 2023-01-01T00:00:00.000Z
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockSchema: TypesenseSchema = {
    fields: [
      { name: "int_field", type: "int32" },
      { name: "int64_field", type: "int64" },
      { name: "float_field", type: "float" },
      { name: "string_field", type: "string" },
      { name: "bool_field", type: "bool" },
    ],
  };

  it("should return original value for non-reserved keywords", () => {
    expect(resolveReservedKeyword("any_field", "not_now", mockSchema)).toBe(
      "not_now"
    );
    expect(resolveReservedKeyword("any_field", 123, mockSchema)).toBe(123);
    expect(resolveReservedKeyword("any_field", null, mockSchema)).toBe(null);
  });

  it("should return original value when schema is undefined", () => {
    expect(resolveReservedKeyword("any_field", "now")).toBe("now");
  });

  it("should return original value when field is not in schema", () => {
    expect(resolveReservedKeyword("missing_field", "now", mockSchema)).toBe(
      "now"
    );
  });

  it("should resolve 'now' to timestamp for int fields", () => {
    const timestamp = Date.now(); // 1672531200000
    expect(resolveReservedKeyword("int_field", "now", mockSchema)).toBe(
      timestamp
    );
    expect(resolveReservedKeyword("int64_field", "now", mockSchema)).toBe(
      timestamp
    );
  });

  it("should resolve 'now' to float timestamp for float fields", () => {
    const timestamp = Date.now() * 1.0; // 1672531200000.0
    expect(resolveReservedKeyword("float_field", "now", mockSchema)).toBe(
      timestamp
    );
  });

  it("should resolve 'now' to ISO string for other field types", () => {
    const isoString = new Date().toISOString(); // "2023-01-01T00:00:00.000Z"
    expect(resolveReservedKeyword("string_field", "now", mockSchema)).toBe(
      isoString
    );
    expect(resolveReservedKeyword("bool_field", "now", mockSchema)).toBe(
      isoString
    );
  });
});
