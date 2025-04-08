import { describe, expect, it } from "vitest";
import { createTransformer } from "../src";
import query from "./sample-query.json";
import typesenseSchema from "./typesense-schema.json";
import elasticSchema from "./elastic-schema.json";

describe("integration", () => {
  it("transforms full ES query to Typesense query using auto-mapping and schemas", () => {
    const transformer = createTransformer({
      autoMapProperties: false,
      typesenseSchema,
      elasticSchema,
      propertyMapping: {
        activity_date_to: "to_date_time",
        activity_date_from: "from_date_time",
        activity_status: "status",
        activity_type_id: "type_id",
        activity_age_from: "ages_from",
        activity_age_to: "ages_to",
        activity_sport_type_id: "sport_type_id",
        activity_min_price: "min_price",
        activity_max_price: "max_price",
        activity_url_key: "slug",
        activity_type_name: "type_name",
      },
    });

    const result = transformer.transform(query);
    expect(result.ok).toBe(true);

    if (result.ok) {
      console.log("✅ Transformed Query:", JSON.stringify(result.value.query));
      console.log("⚠️ Warnings:", result.value.warnings);
    } else {
      console.error("❌ Transformation failed:", result.error);
    }
  });
});
