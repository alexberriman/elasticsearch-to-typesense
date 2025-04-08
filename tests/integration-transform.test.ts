import { describe, expect, it } from "vitest";
import { createTransformer } from "../src";

import query from "./sample-query.json";

describe("integration", () => {
  it("transforms full ES query to Typesense query", () => {
    const transformer = createTransformer({
      activity_status: "status",
      activity_type_name: "type",
      organisation_status: "org_status",
      // add more mappings as needed
    });

    const result = transformer.transform(query);
    expect(result.ok).toBe(true);

    if (result.ok) {
      console.log("Transformed:", result.value.query);
      console.log("Warnings:", result.value.warnings);
    }
  });
});
