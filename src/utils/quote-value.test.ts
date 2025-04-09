import { describe, expect, it } from "vitest";
import { quoteValue } from "./quote-value.js";

describe("quoteValue", () => {
  it("should quote string values", () => {
    expect(quoteValue("hello")).toBe('"hello"');
  });

  it("should escape double quotes in strings", () => {
    expect(quoteValue('he"llo')).toBe('"he\\"llo"');
  });

  it("should not quote numbers", () => {
    expect(quoteValue(123)).toBe("123");
  });

  it("should not quote booleans", () => {
    expect(quoteValue(true)).toBe("true");
    expect(quoteValue(false)).toBe("false");
  });

  it("should convert null to string", () => {
    expect(quoteValue(null)).toBe("null");
  });

  it("should convert undefined to string", () => {
    expect(quoteValue(undefined)).toBe("undefined");
  });
});
