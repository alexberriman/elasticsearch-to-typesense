import { describe, expect, it, beforeAll, afterAll } from "vitest";

import { collections } from "./collections/index.js";
import { readQueries } from "./utils/read-queries.js";
import { isCollection } from "./utils/is-collection.js";
import { typesenseClient } from "./config/typesense-client.js";

describe("integration", () => {
  const testIndex =
    typeof process.env.TEST_INDEX === "string" && process.env.TEST_INDEX !== ""
      ? parseInt(process.env.TEST_INDEX, 10)
      : undefined;
  const allQueries = readQueries();

  const queries =
    testIndex !== undefined ? [allQueries[testIndex - 1]] : allQueries;

  beforeAll(async () => {
    for (const collectionName in collections) {
      const collection = collections[collectionName];
      if (isCollection(collection)) {
        await collection.setUp?.();
      }
    }
  }, 30000);

  const warningsSummary = new Map<
    string,
    { count: number; queries: number[] }
  >();
  const transformFailures: number[] = [];
  const executionFailures: number[] = [];

  queries.forEach(($query, index) => {
    const { collection: $collection } = $query;
    const query = JSON.parse($query.query);
    if (
      !($collection in collections) ||
      !isCollection(collections[$collection])
    ) {
      console.warn(`${$collection} not configured.`);
      return;
    }
    const collection = collections[$collection];
    const queryNumber = testIndex !== undefined ? testIndex : index + 1;

    it(`${$collection}: transforms and executes query ${queryNumber} against Typesense`, async () => {
      const result = collection.transformer.transform(query);

      if (result.ok === false) {
        transformFailures.push(queryNumber);
        console.error(`\nQUERY ${queryNumber} TRANSFORM FAILED:`);
        console.error("Original query:", JSON.stringify(query, null, 2));
        console.error("Error:", result.error);
        return;
      }

      // Aggregate warnings
      if (result.ok === true && result.value.warnings.length > 0) {
        for (const warning of result.value.warnings) {
          if (warningsSummary.has(warning) === false) {
            warningsSummary.set(warning, { count: 0, queries: [] });
          }
          const entry = warningsSummary.get(warning)!;
          entry.count++;
          entry.queries.push(queryNumber);
        }
      }

      expect(result.ok).toBeTruthy();

      const typesenseQuery = result.value.query;

      try {
        let queryToExecute = { ...typesenseQuery };
        const searchResults = await typesenseClient
          .collections($collection)
          .documents()
          .search(queryToExecute);

        expect(searchResults).toBeDefined();
      } catch (error) {
        executionFailures.push(queryNumber);

        console.error(`\nQUERY ${queryNumber} EXECUTION FAILED:`);
        console.error(
          "Typesense query:",
          JSON.stringify(typesenseQuery, null, 2)
        );
        console.error("Error:", error);

        throw new Error(
          `Query ${queryNumber} failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  });

  afterAll(async () => {
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

    for (const collectionName in collections) {
      const collection = collections[collectionName];
      if (isCollection(collection)) {
        await collection.tearDown?.();
      }
    }
  }, 30000);
});
