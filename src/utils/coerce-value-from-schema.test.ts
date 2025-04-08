import { describe, expect, it } from "vitest";
import { coerceValueFromSchema } from "./coerce-value-from-schema";
import { TypesenseSchema } from "../core/types";

describe("coerceValueFromSchema", () => {
  const mockSchema: TypesenseSchema = {
    fields: [
      { name: "int_field", type: "int32" },
      { name: "float_field", type: "float" },
      { name: "string_field", type: "string" },
      { name: "bool_field", type: "bool" },
      { name: "geo_field", type: "geopoint" },
    ],
  };

  it("should return original value when schema is undefined", () => {
    expect(coerceValueFromSchema("any_field", 123)).toBe(123);
    expect(coerceValueFromSchema("any_field", "test")).toBe("test");
  });

  it("should return original value when field is not in schema", () => {
    expect(coerceValueFromSchema("missing_field", 123, mockSchema)).toBe(123);
    expect(coerceValueFromSchema("missing_field", "test", mockSchema)).toBe(
      "test"
    );
  });

  it("should convert nullish values based on field type", () => {
    expect(coerceValueFromSchema("int_field", null, mockSchema)).toBe(0);
    expect(coerceValueFromSchema("float_field", null, mockSchema)).toBe(0);
    expect(coerceValueFromSchema("string_field", null, mockSchema)).toBe("");
    expect(coerceValueFromSchema("bool_field", null, mockSchema)).toBe(false);
    expect(coerceValueFromSchema("geo_field", null, mockSchema)).toBe("");

    expect(coerceValueFromSchema("int_field", undefined, mockSchema)).toBe(0);
    expect(coerceValueFromSchema("int_field", "null", mockSchema)).toBe(0);
    expect(coerceValueFromSchema("int_field", "undefined", mockSchema)).toBe(0);
  });

  it("should convert string values to integers for int fields", () => {
    expect(coerceValueFromSchema("int_field", "123", mockSchema)).toBe(123);
    expect(coerceValueFromSchema("int_field", 123, mockSchema)).toBe(123);
  });

  it("should convert string values to floats for float fields", () => {
    expect(coerceValueFromSchema("float_field", "123.45", mockSchema)).toBe(
      123.45
    );
    expect(coerceValueFromSchema("float_field", 123.45, mockSchema)).toBe(
      123.45
    );
  });

  it("should convert values to booleans for bool fields", () => {
    expect(coerceValueFromSchema("bool_field", "true", mockSchema)).toBe(true);
    expect(coerceValueFromSchema("bool_field", "TRUE", mockSchema)).toBe(true);
    expect(coerceValueFromSchema("bool_field", "false", mockSchema)).toBe(
      false
    );
    expect(coerceValueFromSchema("bool_field", true, mockSchema)).toBe(true);
    expect(coerceValueFromSchema("bool_field", 1, mockSchema)).toBe(true);
    expect(coerceValueFromSchema("bool_field", 0, mockSchema)).toBe(false);
  });

  it("should convert values to strings for string fields", () => {
    expect(coerceValueFromSchema("string_field", 123, mockSchema)).toBe("123");
    expect(coerceValueFromSchema("string_field", true, mockSchema)).toBe(
      "true"
    );
    expect(coerceValueFromSchema("string_field", "test", mockSchema)).toBe(
      "test"
    );
  });

  it("should convert values to strings for geopoint fields", () => {
    expect(
      coerceValueFromSchema("geo_field", "47.1234,9.5678", mockSchema)
    ).toBe("47.1234,9.5678");
    expect(coerceValueFromSchema("geo_field", 123, mockSchema)).toBe("123");
  });
});
