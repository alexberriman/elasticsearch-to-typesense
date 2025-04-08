import { describe, it, expect } from "vitest";
import { transformMatchQuery } from "./match-transformer";

describe("transformMatchQuery", () => {
  it("should transform a match query to a filter_by string", () => {
    const esQuery = { match: { city: "Berlin" } };
    const result = transformMatchQuery(esQuery);
    expect(result).toBe("city:=Berlin");
  });
});
