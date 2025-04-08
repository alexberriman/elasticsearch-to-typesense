import { describe, expect, it } from "vitest";
import { normalizeParentheses } from "./normalize-parentheses";

describe("normalizeParentheses", () => {
  it("should remove redundant outer parentheses", () => {
    expect(normalizeParentheses("(test)")).toBe("test");
    expect(normalizeParentheses("((test))")).toBe("test");
    expect(normalizeParentheses("(((test)))")).toBe("test");
  });

  it("should preserve necessary parentheses", () => {
    expect(normalizeParentheses("(a && b) || c")).toBe("(a && b) || c");
    expect(normalizeParentheses("a && (b || c)")).toBe("a && (b || c)");
  });

  it("should handle empty strings", () => {
    expect(normalizeParentheses("")).toBe("");
  });

  it("should handle whitespace", () => {
    expect(normalizeParentheses("  (test)  ")).toBe("test");
  });

  it("should handle nested expressions", () => {
    expect(normalizeParentheses("(a && (b || c))")).toBe("a && (b || c)");
  });

  it("should handle unbalanced parentheses correctly", () => {
    expect(normalizeParentheses("(a && b)).")).toBe("(a && b)).");
    expect(normalizeParentheses("((a && b)")).toBe("((a && b)");
  });
});