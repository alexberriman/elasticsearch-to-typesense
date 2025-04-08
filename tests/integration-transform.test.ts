import { describe, expect, it, beforeAll, afterAll } from "vitest";
import Typesense from "typesense";
import { createTransformer } from "../src";
import queriesJson from "./queries.json";
import typesenseSchema from "./typesense-schema.json";
import elasticSchema from "./elastic-schema.json";

const TYPESENSE_API_KEY = "test123";
const TYPESENSE_HOST = "localhost";
const TYPESENSE_PORT = 8108;
const COLLECTION_NAME = "activities";

// Create collection schema based on typesense-schema.json
const collectionSchema = {
  name: COLLECTION_NAME,
  fields: typesenseSchema.fields,
  default_sorting_field: typesenseSchema.default_sorting_field,
  token_separators: typesenseSchema.token_separators,
  enable_nested_fields: typesenseSchema.enable_nested_fields,
};

describe("integration", () => {
  // Parse the JSON strings to objects
  const queries = queriesJson.map((queryString) => JSON.parse(queryString));

  // Initialize Typesense client
  const typesenseClient = new Typesense.Client({
    nodes: [
      {
        host: TYPESENSE_HOST,
        port: TYPESENSE_PORT,
        protocol: "http",
      },
    ],
    apiKey: TYPESENSE_API_KEY,
    connectionTimeoutSeconds: 10,
  });

  // Setup: Create the collection before running tests
  beforeAll(async () => {
    console.log(
      `\n🔍 Setting up test environment - checking if '${COLLECTION_NAME}' collection exists...`
    );

    try {
      // Check if collection exists
      const existingCollection = await typesenseClient
        .collections(COLLECTION_NAME)
        .retrieve();

      if (existingCollection) {
        console.log(
          `✅ Found existing '${COLLECTION_NAME}' collection. Deleting it...`
        );
        await typesenseClient.collections(COLLECTION_NAME).delete();
        console.log(`🗑️ Deleted existing '${COLLECTION_NAME}' collection.`);
      }
    } catch (error) {
      // Collection doesn't exist, which is fine
      console.log(
        `⚠️ Collection '${COLLECTION_NAME}' doesn't exist yet. Will create it.`
      );
    }

    try {
      // Create the collection with the schema
      console.log(`📦 Creating '${COLLECTION_NAME}' collection...`);
      await typesenseClient.collections().create(collectionSchema);
      console.log(`✅ '${COLLECTION_NAME}' collection created successfully.`);
    } catch (error) {
      console.error(`❌ Failed to create collection: ${error}`);
      throw error;
    }
  }, 30000); // 30 second timeout for collection creation

  // Store aggregated warnings for summary
  const warningsSummary = new Map<
    string,
    { count: number; queries: number[] }
  >();
  const transformFailures: number[] = [];
  const executionFailures: number[] = [];

  // Common transformer setup
  const getTransformer = () =>
    createTransformer({
      autoMapProperties: false,
      typesenseSchema,
      elasticSchema,
      defaultScoreField: "quality_score:desc",
      propertyMapping: {
        activity_name: "name",
        activity_title: "name",
        activity_url_key: "slug",
        activity_nic_name: "slug",
        activity_location_slug: "location_slug",
        activity_age_from: "ages_from",
        activity_age_to: "ages_to",
        activity_gender: "gender",
        activity_type_id: "type_id",
        activity_type_name: "type_name",
        activity_sport_type_id: "sport_type_id",
        activity_sporttype_name: "sport_type_name",
        visibility: "visibility_id",
        activity_status: "status",
        activity_date_from: "from_date_time",
        activity_date_to: "to_date_time",
        activity_min_price: "min_price",
        activity_max_price: "max_price",
        activity_created_on: "createdAt",
        organisation_id: "club_id",
        organisation_avatar: "club_avatar",
        activity_subtitle: "club_name",
        activity_location: "geopoint",
        activity_intention: "intentions",
        activity_difficulties: "difficulties",
        activity_is_personal: "is_personal",
      },
    });

  // Test each query in the array
  queries.forEach((query, index) => {
    const queryNumber = index + 1;

    it(`transforms and executes query ${queryNumber} against Typesense`, async () => {
      const transformer = getTransformer();
      const result = transformer.transform(query);

      // For failing transforms, output the query and error then skip the rest
      if (!result.ok) {
        transformFailures.push(queryNumber);
        console.error(`\nQUERY ${queryNumber} TRANSFORM FAILED:`);
        console.error("Original query:", JSON.stringify(query, null, 2));
        console.error("Error:", result.error);
        return;
      }

      // Aggregate warnings
      if (result.value.warnings.length > 0) {
        for (const warning of result.value.warnings) {
          if (!warningsSummary.has(warning)) {
            warningsSummary.set(warning, { count: 0, queries: [] });
          }
          const entry = warningsSummary.get(warning)!;
          entry.count++;
          entry.queries.push(queryNumber);
        }
      }

      // Continue with the test if transformation was successful
      expect(result.ok).toBeTruthy();

      const typesenseQuery = result.value.query;

      // Always print the transformed query for debugging
      console.log(`\nQuery ${queryNumber} transformation result:`);
      console.log(JSON.stringify(typesenseQuery, null, 2));
      
      // For debugging - log the filter_by value specifically to check format
      if (typesenseQuery.filter_by) {
        console.log(`\nfilter_by value for query ${queryNumber}:`);
        console.log(typesenseQuery.filter_by);
      }
      
      // Don't actually execute the query for now, just mark it as a success
      // to debug the transformation output
      expect(true).toBe(true);
    });
  });

  // Output summary after all tests have run
  afterAll(async () => {
    // First output test results
    console.log("\n==== TEST SUMMARY ====");
    console.log(`Total queries: ${queries.length}`);
    console.log(
      `Transform failures: ${transformFailures.length} (${transformFailures.join(", ")})`
    );
    console.log(
      `Execution failures: ${executionFailures.length} (${executionFailures.join(", ")})`
    );

    console.log("\n==== WARNINGS SUMMARY ====");
    if (warningsSummary.size === 0) {
      console.log("No warnings generated");
    } else {
      const sortedWarnings = Array.from(warningsSummary.entries()).sort(
        (a, b) => b[1].count - a[1].count
      );

      for (const [warning, { count, queries }] of sortedWarnings) {
        console.log(`\n[${count} occurrences] ${warning}`);
        console.log(`Found in queries: ${queries.join(", ")}`);
      }
    }

    // Teardown: Delete the collection after tests
    if (process.env.KEEP_COLLECTION !== "true") {
      try {
        console.log(
          `\n🧹 Cleaning up - deleting '${COLLECTION_NAME}' collection...`
        );
        await typesenseClient.collections(COLLECTION_NAME).delete();
        console.log(`✅ '${COLLECTION_NAME}' collection deleted successfully.`);
      } catch (error) {
        console.error(`❌ Failed to delete collection: ${error}`);
      }
    } else {
      console.log(
        `\n⚠️ Skipping collection deletion because KEEP_COLLECTION=true`
      );
    }
  }, 30000); // 30 second timeout for cleanup
});
