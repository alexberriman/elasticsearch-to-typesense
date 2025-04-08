import { describe, expect, it } from "vitest";
import { createTransformer } from "../src";
import query from "./sample-query.json";
import typesenseSchema from "./typesense-schema.json";
import elasticSchema from "./elastic-schema.json";

const TYPESENSE_API_KEY = "test123";
const TYPESENSE_HOST = "http://localhost:8108";
const COLLECTION_NAME = "activities";

describe("integration", () => {
  it("transforms and executes the query against Typesense", async () => {
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
        visibility: "visibility_id",
      },
    });

    const result = transformer.transform(query);
    expect(result.ok).toBe(true);

    expect(result.ok).toBeTruthy();
    if (!result.ok) {
      throw Error("unable to transformer");
    }

    const typesenseQuery = result.value.query;
    console.log(
      "✅ Transformed Query:",
      JSON.stringify(typesenseQuery, null, 2)
    );

    const url = new URL(
      `${TYPESENSE_HOST}/collections/${COLLECTION_NAME}/documents/search`
    );
    Object.entries(typesenseQuery).forEach(([key, value]) =>
      url.searchParams.append(key, String(value))
    );

    const response = await fetch(url.toString(), {
      headers: {
        "X-TYPESENSE-API-KEY": TYPESENSE_API_KEY,
      },
    });

    const data = await response.json();
    expect(response.ok).toBe(true);
    expect(data).toHaveProperty("hits");
  });
});
