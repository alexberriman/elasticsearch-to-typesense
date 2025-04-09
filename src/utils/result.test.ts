import { describe, expect, it } from "vitest";
import { ok, err, isOk, isErr } from "./result.js";

describe("Result utility functions", () => {
  describe("ok", () => {
    it("should create a successful result", () => {
      const result = ok("test");
      expect(result).toEqual({ ok: true, value: "test" });
    });

    it("should handle different value types", () => {
      expect(ok(123)).toEqual({ ok: true, value: 123 });
      expect(ok(null)).toEqual({ ok: true, value: null });
      expect(ok(undefined)).toEqual({ ok: true, value: undefined });
      expect(ok({ data: "test" })).toEqual({
        ok: true,
        value: { data: "test" },
      });
    });
  });

  describe("err", () => {
    it("should create an error result", () => {
      const result = err("An error occurred");
      expect(result).toEqual({ ok: false, error: "An error occurred" });
    });

    it("should handle different error messages", () => {
      expect(err("")).toEqual({ ok: false, error: "" });
      expect(err("Not found")).toEqual({ ok: false, error: "Not found" });
    });
  });

  describe("isOk", () => {
    it("should return true for successful results", () => {
      expect(isOk(ok("test"))).toBe(true);
    });

    it("should return false for error results", () => {
      expect(isOk(err("An error"))).toBe(false);
    });

    it("should type narrow correctly", () => {
      const result = ok("test");
      if (isOk(result)) {
        expect(result.value).toBe("test");
      }
    });
  });

  describe("isErr", () => {
    it("should return false for successful results", () => {
      expect(isErr(ok("test"))).toBe(false);
    });

    it("should return true for error results", () => {
      expect(isErr(err("An error"))).toBe(true);
    });

    it("should type narrow correctly", () => {
      const result = err("An error");
      if (isErr(result)) {
        expect(result.error).toBe("An error");
      }
    });
  });
});
