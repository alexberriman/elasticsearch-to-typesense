import { describe, expect, it, vi } from "vitest";
import { transformMultiMatch } from "./multi-match.js";
import { TransformerContext } from "../core/types.js";

// Mock the resolve field functions
vi.mock("../utils/resolve-mapped-field", () => ({
  resolveMappedField: vi.fn((field, _ctx) => {
    // Map the known fields and return null for unknown fields
    const mapping: Record<string, string> = {
      activity_title: "title",
      activity_sporttype_name: "sport_type",
      activity_type_name: "type_name",
      activity_subtitle: "subtitle",
      activity_nic_name: "nickname",
    };
    // Check if field exists in mapping before accessing
    if (typeof field === "string" && field in mapping) {
      return mapping[field];
    }
    return null;
  }),
}));

describe("transformMultiMatch", () => {
  const ctx: TransformerContext = {
    propertyMapping: {
      activity_title: "title",
      activity_sporttype_name: "sport_type",
      activity_type_name: "type_name",
      activity_subtitle: "subtitle",
      activity_nic_name: "nickname",
    },
  };

  it("transforms basic multi_match query", () => {
    const multiMatch = {
      fields: [
        "activity_title",
        "activity_sporttype_name",
        "activity_type_name",
      ],
      query: "tennis",
    };

    const result = transformMultiMatch(multiMatch, ctx);

    expect(result.query).toEqual({
      q: "tennis",
      query_by: "title,sport_type,type_name",
    });
    expect(result.warnings).toEqual([]);
  });

  it("handles field boosting", () => {
    const multiMatch = {
      fields: [
        "activity_title^1.4",
        "activity_sporttype_name^1.2",
        "activity_type_name",
      ],
      query: "tennis",
    };

    const result = transformMultiMatch(multiMatch, ctx);

    expect(result.query).toEqual({
      q: "tennis",
      query_by: "title,sport_type,type_name",
      query_by_weights: "14,12,10",
    });
    expect(result.warnings).toEqual([]);
  });

  it("handles fuzziness parameter", () => {
    const multiMatch = {
      fields: ["activity_title", "activity_sporttype_name"],
      query: "tennis",
      fuzziness: "1",
    };

    const result = transformMultiMatch(multiMatch, ctx);

    expect(result.query).toEqual({
      q: "tennis",
      query_by: "title,sport_type",
      num_typos: 1,
    });
    expect(result.warnings).toEqual([]);
  });

  it("handles 'AUTO' fuzziness", () => {
    const multiMatch = {
      fields: ["activity_title", "activity_sporttype_name"],
      query: "tennis",
      fuzziness: "AUTO",
    };

    const result = transformMultiMatch(multiMatch, ctx);

    expect(result.query).toEqual({
      q: "tennis",
      query_by: "title,sport_type",
      num_typos: 2,
    });
    expect(result.warnings).toEqual([]);
  });

  it("handles phrase_prefix type", () => {
    const multiMatch = {
      fields: ["activity_title", "activity_sporttype_name"],
      query: "tennis",
      type: "phrase_prefix",
    };

    const result = transformMultiMatch(multiMatch, ctx);

    expect(result.query).toEqual({
      q: "tennis",
      query_by: "title,sport_type",
      prefix: true,
    });
    expect(result.warnings).toEqual([]);
  });

  it("handles phrase type", () => {
    const multiMatch = {
      fields: ["activity_title", "activity_sporttype_name"],
      query: "tennis tournament",
      type: "phrase",
    };

    const result = transformMultiMatch(multiMatch, ctx);

    expect(result.query).toEqual({
      q: "tennis tournament",
      query_by: "title,sport_type",
      num_typos: 0,
    });
    expect(result.warnings).toEqual([]);
  });

  it("warns about unsupported type", () => {
    const multiMatch = {
      fields: ["activity_title", "activity_sporttype_name"],
      query: "tennis",
      type: "cross_fields",
    };

    const result = transformMultiMatch(multiMatch, ctx);

    expect(result.query).toEqual({
      q: "tennis",
      query_by: "title,sport_type",
    });
    expect(result.warnings).toContain(
      'Unsupported multi_match type: "cross_fields"'
    );
  });

  it("warns about unmapped fields", () => {
    const multiMatch = {
      fields: ["activity_title", "unknown_field", "activity_sporttype_name"],
      query: "tennis",
    };

    const result = transformMultiMatch(multiMatch, ctx);

    // Only check for the warning, not the exact query structure
    expect(result.warnings).toContain(
      'Skipped unmapped field "unknown_field" in multi_match'
    );
    expect(result.query.q).toBe("tennis");
    expect(result.query.query_by).toContain("title");
    expect(result.query.query_by).toContain("sport_type");
  });

  it("handles invalid multi_match with no valid fields", () => {
    const multiMatch = {
      fields: ["unknown_field1", "unknown_field2"],
      query: "tennis",
    };

    const result = transformMultiMatch(multiMatch, ctx);

    expect(result.warnings).toContain(
      'Skipped unmapped field "unknown_field1" in multi_match'
    );
    expect(result.warnings).toContain(
      'Skipped unmapped field "unknown_field2" in multi_match'
    );
    expect(result.warnings).toContain(
      "No valid fields to search after mapping"
    );

    // The result should be an empty object
    expect(Object.keys(result.query)).toHaveLength(0);
  });

  it("handles undefined or empty fields", () => {
    // @ts-expect-error dont need to pass fields for test
    const result = transformMultiMatch({ query: "tennis" }, ctx);

    expect(result.query).toEqual({});
    expect(result.warnings).toContain(
      "Multi-match requires fields to be specified"
    );
  });
});
