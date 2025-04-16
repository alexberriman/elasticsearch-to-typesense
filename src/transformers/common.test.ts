import { describe, expect, it, vi } from "vitest";
import { createPaginationAndSort } from "./common.js";
import { TransformerContext } from "../core/types.js";
import * as resolveFieldModule from "../utils/resolve-mapped-field.js";
import * as geoSortModule from "../utils/transform-geo-sort.js";

describe("createPaginationAndSort", () => {
  const createContext = (
    propertyMapping = {},
    defaultScoreField = undefined
  ): TransformerContext => ({
    propertyMapping,
    defaultScoreField,
  });

  it("creates pagination parameters from from and size", () => {
    const input = {
      from: 20,
      size: 10,
    };

    const result = createPaginationAndSort(input, createContext());

    expect(result.query).toEqual({
      per_page: 10,
      page: 3, // (20/10)+1 = 3
    });
    expect(result.warnings).toEqual([]);
  });

  it("creates per_page when only size is provided", () => {
    const input = {
      size: 15,
    };

    const result = createPaginationAndSort(input, createContext());

    expect(result.query).toEqual({
      per_page: 15,
    });
    expect(result.warnings).toEqual([]);
  });

  it("transforms simple sort fields", () => {
    // @ts-expect-error - Mock can return null for test
    vi.spyOn(resolveFieldModule, "resolveMappedField").mockImplementation(
      (field) =>
        field === "field1"
          ? "mapped_field1"
          : field === "field2"
            ? "mapped_field2"
            : null
    );

    const input = {
      sort: [{ field1: { order: "asc" } }, { field2: { order: "desc" } }],
    };

    const result = createPaginationAndSort(input, createContext());

    expect(result.query).toEqual({
      sort_by: "mapped_field1:asc,mapped_field2:desc",
    });
    expect(result.warnings).toEqual([]);
  });

  it("transforms _score field with default value", () => {
    const input = {
      sort: [{ _score: { order: "desc" } }],
    };

    const result = createPaginationAndSort(input, createContext());

    expect(result.query).toEqual({
      sort_by: "_text_match:desc",
    });
    expect(result.warnings).toEqual([]);
  });

  it("transforms _score field with custom default", () => {
    const input = {
      sort: [{ _score: { order: "desc" } }],
    };

    const result = createPaginationAndSort(
      input,
      createContext({}, "quality_score:desc")
    );

    expect(result.query).toEqual({
      sort_by: "quality_score:desc",
    });
    expect(result.warnings).toEqual([]);
  });

  it("transforms geo_distance sort", () => {
    const mockGeoSortResult = {
      sort: "location(10,20):asc",
      warnings: [],
    };

    vi.spyOn(geoSortModule, "transformGeoSort").mockReturnValue(
      mockGeoSortResult
    );

    const input = {
      sort: [
        {
          _geo_distance: {
            location: { lat: 10, lon: 20 },
            order: "asc",
          },
        },
      ],
    };

    const result = createPaginationAndSort(input, createContext());

    expect(result.query).toEqual({
      sort_by: "location(10,20):asc",
    });
    expect(result.warnings).toEqual([]);
    expect(geoSortModule.transformGeoSort).toHaveBeenCalledWith(
      { location: { lat: 10, lon: 20 }, order: "asc" },
      expect.any(Object)
    );
  });

  it("adds warning for unmapped sort field", () => {
    // @ts-expect-error - Mock returns null for test
    vi.spyOn(resolveFieldModule, "resolveMappedField").mockReturnValue(null);

    const input = {
      sort: [{ unknown_field: { order: "asc" } }],
    };

    const result = createPaginationAndSort(input, createContext());

    expect(result.query).toEqual({});
    expect(result.warnings).toEqual([
      'Skipped unmapped sort field "unknown_field"',
    ]);
  });

  it("combines different sorts and pagination", () => {
    vi.spyOn(resolveFieldModule, "resolveMappedField").mockReturnValue(
      "mapped_field"
    );

    const mockGeoSortResult = {
      sort: "location(10,20):asc",
      warnings: [],
    };

    vi.spyOn(geoSortModule, "transformGeoSort").mockReturnValue(
      mockGeoSortResult
    );

    const input = {
      from: 30,
      size: 15,
      sort: [
        { field: { order: "desc" } },
        { _geo_distance: { location: { lat: 10, lon: 20 }, order: "asc" } },
      ],
    };

    const result = createPaginationAndSort(input, createContext());

    expect(result.query).toEqual({
      per_page: 15,
      page: 3,
      sort_by: "mapped_field:desc,location(10,20):asc",
    });
    expect(result.warnings).toEqual([]);
  });

  it("propagates warnings from geo sort", () => {
    const mockGeoSortResult = {
      sort: "location(10,20):asc",
      warnings: ["Geo warning"],
    };

    vi.spyOn(geoSortModule, "transformGeoSort").mockReturnValue(
      mockGeoSortResult
    );

    const input = {
      sort: [
        { _geo_distance: { location: { lat: 10, lon: 20 }, order: "asc" } },
      ],
    };

    const result = createPaginationAndSort(input, createContext());

    expect(result.query).toEqual({
      sort_by: "location(10,20):asc",
    });
    expect(result.warnings).toEqual(["Geo warning"]);
  });

  it("handles invalid size parameter", () => {
    const input = {
      size: -5,
    };

    const result = createPaginationAndSort(input, createContext());

    expect(result.query).toEqual({
      per_page: 10,
    });
    expect(result.warnings).toEqual([
      "Invalid size parameter: -5, using default: 10",
    ]);
  });

  it("handles non-numeric size parameter", () => {
    const input = {
      size: "invalid",
    };

    const result = createPaginationAndSort(input, createContext());

    expect(result.query).toEqual({
      per_page: 10,
    });
    expect(result.warnings).toEqual([
      "Invalid size parameter: invalid, using default: 10",
    ]);
  });

  it("handles invalid from parameter", () => {
    const input = {
      from: -10,
      size: 10,
    };

    const result = createPaginationAndSort(input, createContext());

    expect(result.query).toEqual({
      per_page: 10,
      page: 1,
    });
    expect(result.warnings).toEqual([
      "Invalid page calculation: 0, using default: 1",
    ]);
  });

  it("handles non-numeric from parameter", () => {
    const input = {
      from: "invalid",
      size: 10,
    };

    const result = createPaginationAndSort(input, createContext());

    expect(result.query).toEqual({
      per_page: 10,
      page: 1,
    });
    expect(result.warnings).toEqual([
      "Invalid from parameter: invalid, using default page: 1",
    ]);
  });
});
