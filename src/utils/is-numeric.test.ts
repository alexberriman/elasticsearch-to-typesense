import { describe, it, expect } from "vitest";
import { isNumeric } from "./is-numeric.js";

describe("isNumeric", () => {
  // Test positive number cases
  it("should return true for integers", () => {
    expect(isNumeric(0)).toBe(true);
    expect(isNumeric(1)).toBe(true);
    expect(isNumeric(123)).toBe(true);
    expect(isNumeric(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it("should return true for negative integers", () => {
    expect(isNumeric(-1)).toBe(true);
    expect(isNumeric(-123)).toBe(true);
    expect(isNumeric(Number.MIN_SAFE_INTEGER)).toBe(true);
  });

  it("should return true for decimal numbers", () => {
    expect(isNumeric(0.5)).toBe(true);
    expect(isNumeric(1.234)).toBe(true);
    expect(isNumeric(-1.234)).toBe(true);
  });

  it("should return true for very small decimal numbers", () => {
    expect(isNumeric(0.0000001)).toBe(true);
    expect(isNumeric(-0.0000001)).toBe(true);
  });

  it("should return true for scientific notation numbers", () => {
    expect(isNumeric(1e10)).toBe(true);
    expect(isNumeric(-1e10)).toBe(true);
  });

  // Test numeric strings
  it("should return true for string integers", () => {
    expect(isNumeric("0")).toBe(true);
    expect(isNumeric("1")).toBe(true);
    expect(isNumeric("123")).toBe(true);
    expect(isNumeric("+123")).toBe(true);
    expect(isNumeric("-123")).toBe(true);
  });

  it("should return true for string decimal numbers", () => {
    expect(isNumeric("0.5")).toBe(true);
    expect(isNumeric("1.234")).toBe(true);
    expect(isNumeric("-1.234")).toBe(true);
  });

  it("should return true for string scientific notation numbers", () => {
    expect(isNumeric("1e10")).toBe(true);
    expect(isNumeric("1E10")).toBe(true);
    expect(isNumeric("-1e10")).toBe(true);
    expect(isNumeric("1e+10")).toBe(true);
    expect(isNumeric("1e-10")).toBe(true);
  });

  // Test negative cases - not numbers
  it("should return false for non-finite numbers", () => {
    expect(isNumeric(Infinity)).toBe(false);
    expect(isNumeric(-Infinity)).toBe(false);
    expect(isNumeric(NaN)).toBe(false);
  });

  it("should return false for boolean values", () => {
    expect(isNumeric(true)).toBe(false);
    expect(isNumeric(false)).toBe(false);
  });

  it("should return false for null and undefined", () => {
    expect(isNumeric(null)).toBe(false);
    expect(isNumeric(undefined)).toBe(false);
  });

  it("should return false for objects and arrays", () => {
    expect(isNumeric({})).toBe(false);
    expect(isNumeric([])).toBe(false);
    expect(isNumeric([1, 2, 3])).toBe(false);
    expect(isNumeric(new Date())).toBe(false);
  });

  it("should return false for functions", () => {
    expect(isNumeric(() => {})).toBe(false);
  });

  it("should return false for non-numeric strings", () => {
    expect(isNumeric("")).toBe(false);
    expect(isNumeric(" ")).toBe(false);
    expect(isNumeric("abc")).toBe(false);
    expect(isNumeric("123abc")).toBe(false);
    expect(isNumeric("abc123")).toBe(false);
  });

  it("should return false for numeric strings with invalid formats", () => {
    expect(isNumeric(".")).toBe(false);
    expect(isNumeric("-..")).toBe(false);
    expect(isNumeric("1.2.3")).toBe(false);
    expect(isNumeric("1,000")).toBe(false);
    expect(isNumeric("$100")).toBe(false);
  });

  it("should return false for incomplete number formats", () => {
    expect(isNumeric("1e")).toBe(false);
    expect(isNumeric("e10")).toBe(false);
    expect(isNumeric("-")).toBe(false);
    expect(isNumeric("+")).toBe(false);
  });
});
