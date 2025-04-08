import { describe, expect, it, vi } from "vitest";
import { transformGeoSort } from "./transform-geo-sort";
import { resolveMappedField } from "./resolve-mapped-field";

vi.mock("./resolve-mapped-field", () => ({
  resolveMappedField: vi.fn(),
}));

describe("transformGeoSort", () => {
  const mockContext = { propertyMapping: {} };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should transform valid geo sort options", () => {
    vi.mocked(resolveMappedField).mockReturnValue("geopoint");

    const result = transformGeoSort(
      {
        location: { lat: 40.7128, lon: -74.006 },
        order: "asc",
      },
      mockContext
    );

    expect(result.sort).toBe("geopoint(40.7128,-74.006):asc");
    expect(result.warnings).toEqual([]);
    expect(resolveMappedField).toHaveBeenCalledWith("location", mockContext);
  });

  it("should use default asc order when not specified", () => {
    vi.mocked(resolveMappedField).mockReturnValue("geopoint");

    const result = transformGeoSort(
      {
        location: { lat: 40.7128, lon: -74.006 },
      },
      mockContext
    );

    expect(result.sort).toBe("geopoint(40.7128,-74.006):asc");
  });

  it("should warn about invalid order values", () => {
    vi.mocked(resolveMappedField).mockReturnValue("geopoint");

    const result = transformGeoSort(
      {
        location: { lat: 40.7128, lon: -74.006 },
        order: "invalid",
      },
      mockContext
    );

    expect(result.sort).toBe("geopoint(40.7128,-74.006):invalid");
    expect(result.warnings).toContain(
      "Invalid sort order: invalid. Using 'asc' instead."
    );
  });

  it("should warn when no fields with coordinates are found", () => {
    const result = transformGeoSort(
      {
        order: "asc",
      },
      mockContext
    );

    expect(result.sort).toBeUndefined();
    expect(result.warnings).toContain(
      "Invalid geo_distance sort: expected exactly one field with coordinates"
    );
  });

  it("should warn when multiple fields with coordinates are found", () => {
    const result = transformGeoSort(
      {
        location1: { lat: 40.7128, lon: -74.006 },
        location2: { lat: 41.7128, lon: -75.006 },
        order: "asc",
      },
      mockContext
    );

    expect(result.sort).toBeUndefined();
    expect(result.warnings).toContain(
      "Invalid geo_distance sort: expected exactly one field with coordinates"
    );
  });

  it("should warn when coordinates are missing or invalid", () => {
    const result = transformGeoSort(
      {
        location: { lat: "invalid", lon: -74.006 },
        order: "asc",
      },
      mockContext
    );

    expect(result.sort).toBeUndefined();
    expect(result.warnings).toContain(
      "Invalid geo_distance coordinates for field 'location'"
    );
  });

  it("should warn when field cannot be mapped", () => {
    vi.mocked(resolveMappedField).mockReturnValue(undefined);

    const result = transformGeoSort(
      {
        location: { lat: 40.7128, lon: -74.006 },
        order: "asc",
      },
      mockContext
    );

    expect(result.sort).toBeUndefined();
    expect(result.warnings).toContain("Unmapped geo field: location");
  });
});
