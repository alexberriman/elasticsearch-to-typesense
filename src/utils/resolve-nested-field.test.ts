import { describe, expect, it } from "vitest";
import { resolveNestedField } from "./resolve-nested-field.js";

describe("resolveNestedField", () => {
  const testDocument = {
    id: "123",
    name: "Test Document",
    metadata: {
      createdAt: "2023-01-01",
      author: {
        id: "456",
        name: "John Doe",
        contact: {
          email: "john@example.com",
          phone: "123-456-7890",
        },
      },
      tags: ["test", "document"],
    },
    stats: {
      views: 100,
      likes: 50,
    },
  };

  it("should resolve top-level fields", () => {
    expect(resolveNestedField("id", testDocument)).toBe("123");
    expect(resolveNestedField("name", testDocument)).toBe("Test Document");
  });

  it("should resolve nested fields with dot notation", () => {
    expect(resolveNestedField("metadata.createdAt", testDocument)).toBe(
      "2023-01-01"
    );
    expect(resolveNestedField("metadata.author.name", testDocument)).toBe(
      "John Doe"
    );
    expect(
      resolveNestedField("metadata.author.contact.email", testDocument)
    ).toBe("john@example.com");
    expect(resolveNestedField("stats.views", testDocument)).toBe(100);
  });

  it("should return undefined for non-existent fields", () => {
    expect(resolveNestedField("nonexistent", testDocument)).toBeUndefined();
    expect(
      resolveNestedField("metadata.nonexistent", testDocument)
    ).toBeUndefined();
    expect(
      resolveNestedField("metadata.author.nonexistent", testDocument)
    ).toBeUndefined();
    expect(
      resolveNestedField("metadata.author.contact.nonexistent", testDocument)
    ).toBeUndefined();
  });

  it("should handle arrays in path", () => {
    expect(resolveNestedField("metadata.tags.0", testDocument)).toBe("test");
    expect(resolveNestedField("metadata.tags.1", testDocument)).toBe(
      "document"
    );
    expect(resolveNestedField("metadata.tags.2", testDocument)).toBeUndefined();
  });

  it("should handle empty path segments", () => {
    expect(resolveNestedField("", testDocument)).toBeUndefined();
    expect(
      resolveNestedField("metadata..author.name", testDocument)
    ).toBeUndefined();
  });

  it("should handle undefined document", () => {
    expect(resolveNestedField("id", undefined as any)).toBeUndefined();
    expect(
      resolveNestedField("metadata.author.name", undefined as any)
    ).toBeUndefined();
  });

  it("should handle null document", () => {
    expect(resolveNestedField("id", null as any)).toBeUndefined();
    expect(
      resolveNestedField("metadata.author.name", null as any)
    ).toBeUndefined();
  });
});
