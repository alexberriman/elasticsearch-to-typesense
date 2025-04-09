import { describe, expect, it, vi } from "vitest";
import { transformGeoDistance } from "./geo-distance.js";
import { TransformerContext } from "../core/types.js";
import * as resolveFieldModule from "../utils/resolve-mapped-field.js";

// Mock the resolveMappedField function
vi.spyOn(resolveFieldModule, "resolveMappedField").mockImplementation(
  () => "geopoint"
);

describe("transformGeoDistance", () => {
  const createContext = (): TransformerContext => ({
    propertyMapping: {},
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(resolveFieldModule, "resolveMappedField").mockImplementation(
      () => "geopoint"
    );
  });

  it("should transform a geo_distance query with kilometers", () => {
    const query = {
      distance: "3km",
      activity_location: {
        lat: 40.73,
        lon: -73.9,
      },
    };

    const result = transformGeoDistance(query, createContext());

    expect(result.query.filter_by).toBe("geopoint:(40.73, -73.9, 3 km)");
    expect(result.warnings).toHaveLength(0);
  });

  it("should transform a geo_distance query with miles", () => {
    const query = {
      distance: "5mi",
      activity_location: {
        lat: 51.5,
        lon: -0.12,
      },
    };

    const result = transformGeoDistance(query, createContext());

    // 5 miles ≈ 8.04672 km
    expect(result.query.filter_by).toBe("geopoint:(51.5, -0.12, 8.0467 km)");
    expect(result.warnings).toHaveLength(0);
  });

  it("should transform a geo_distance query with meters", () => {
    const query = {
      distance: "500m",
      activity_location: {
        lat: 48.85,
        lon: 2.35,
      },
    };

    const result = transformGeoDistance(query, createContext());

    expect(result.query.filter_by).toBe("geopoint:(48.85, 2.35, 0.5 km)");
    expect(result.warnings).toHaveLength(0);
  });

  it("should use the resolved field name", () => {
    vi.spyOn(resolveFieldModule, "resolveMappedField").mockImplementationOnce(
      () => "location"
    );

    const query = {
      distance: "3km",
      activity_location: {
        lat: 40.73,
        lon: -73.9,
      },
    };

    const result = transformGeoDistance(query, createContext());

    // Should use the mapped field name from resolveField
    expect(result.query.filter_by).toBe("location:(40.73, -73.9, 3 km)");
    expect(result.warnings).toHaveLength(0);
  });

  it("should handle invalid input", () => {
    const result = transformGeoDistance(null, createContext());

    expect(result.query).toEqual({});
    expect(result.warnings).toContain(
      "Invalid geo_distance query: query is not an object"
    );
  });

  it("should handle missing geo field", () => {
    const query = {
      distance: "3km",
    };

    const result = transformGeoDistance(query, createContext());

    expect(result.query).toEqual({});
    expect(result.warnings).toContain(
      "Invalid geo_distance query: missing geo field"
    );
  });
});
