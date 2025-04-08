import { describe, expect, it, vi } from "vitest";
import { createTransformer } from "./create-transformer";
import { ResultMapper, TransformerOptions } from "./types";
import * as autoMapping from "../utils/apply-auto-mapping";
import * as transformer from "./transformer";
import * as transformHints from "../utils/suggest-transform-hints";
import * as common from "../transformers/common";
import * as mapResultsModule from "../utils/map-results-to-elastic";

vi.mock("../utils/apply-auto-mapping", () => ({
  applyAutoMapping: vi.fn(),
}));

vi.mock("./transformer", () => ({
  transformQueryRecursively: vi.fn(),
}));

vi.mock("../utils/suggest-transform-hints", () => ({
  suggestTransformHints: vi.fn(),
}));

vi.mock("../transformers/common", () => ({
  createPaginationAndSort: vi.fn(),
}));

vi.mock("../utils/map-results-to-elastic", () => ({
  createDefaultMapper: vi.fn(),
}));

describe("createTransformer", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should create a transformer with default options", () => {
    const transformer = createTransformer({});
    expect(transformer).toHaveProperty("transform");
    expect(typeof transformer.transform).toBe("function");
    expect(transformer).not.toHaveProperty("mapResults");
  });

  it("should use provided propertyMapping when autoMapProperties is false", () => {
    const options: TransformerOptions = {
      propertyMapping: { field1: "mappedField1" },
      autoMapProperties: false,
    };

    createTransformer(options);
    expect(autoMapping.applyAutoMapping).not.toHaveBeenCalled();
  });

  it("should generate auto-mapping when autoMapProperties is true", () => {
    const elasticSchema = { properties: { field1: { type: "text" } } };
    const typesenseSchema = { fields: [{ name: "field1", type: "string" }] };
    const mockMapping = { field1: "mappedField1" };

    vi.mocked(autoMapping.applyAutoMapping).mockReturnValue(mockMapping);

    const options: TransformerOptions = {
      autoMapProperties: true,
      elasticSchema,
      typesenseSchema,
    };

    createTransformer(options);
    expect(autoMapping.applyAutoMapping).toHaveBeenCalledWith(
      elasticSchema,
      typesenseSchema
    );
  });

  describe("transform method", () => {
    it("should return error for non-object input", () => {
      const transformer = createTransformer({});
      const result = transformer.transform("not-an-object" as any);

      expect(result.ok).toBe(false);
      expect(result).toEqual({
        ok: false,
        error: "Input must be an object",
      });
    });

    it("should return error for null input", () => {
      const transformer = createTransformer({});
      const result = transformer.transform(null as any);

      expect(result.ok).toBe(false);
      expect(result).toEqual({
        ok: false,
        error: "Input must be an object",
      });
    });

    it("should process valid input", () => {
      const mockQuery = { filter_by: "test:filter" };
      const mockPagination = { query: { per_page: 10 }, warnings: [] };
      const mockTransform = {
        query: mockQuery,
        warnings: ["Warning 1"],
      };
      const mockHints = ["Hint 1"];

      vi.mocked(transformer.transformQueryRecursively).mockReturnValue(
        mockTransform
      );
      vi.mocked(common.createPaginationAndSort).mockReturnValue(mockPagination);
      vi.mocked(transformHints.suggestTransformHints).mockReturnValue(
        mockHints
      );

      const options: TransformerOptions = {
        autoMapProperties: true,
        elasticSchema: { properties: {} },
        typesenseSchema: { fields: [] },
      };

      const transformerInstance = createTransformer(options);
      const input = { query: { match: { field: "value" } } };
      const result = transformerInstance.transform(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          query: {
            ...mockQuery,
            per_page: 10,
          },
          warnings: ["Warning 1", ...mockHints],
        });
      }

      expect(transformer.transformQueryRecursively).toHaveBeenCalledWith(
        input.query,
        expect.anything()
      );
      expect(common.createPaginationAndSort).toHaveBeenCalledWith(
        input,
        expect.anything()
      );
    });

    it("should handle missing query property", () => {
      const mockPagination = { query: { per_page: 10 }, warnings: [] };
      const mockTransform = {
        query: { filter_by: "test:filter" },
        warnings: [],
      };

      vi.mocked(transformer.transformQueryRecursively).mockReturnValue(
        mockTransform
      );
      vi.mocked(common.createPaginationAndSort).mockReturnValue(mockPagination);
      vi.mocked(transformHints.suggestTransformHints).mockReturnValue([]);

      const transformerInstance = createTransformer({});
      const input = { sort: [{ field: "asc" }] }; // No query property
      const result = transformerInstance.transform(input);

      expect(result.ok).toBe(true);
      expect(transformer.transformQueryRecursively).toHaveBeenCalledWith(
        {}, // Empty object for missing query
        expect.anything()
      );
    });

    it("should not generate hints when autoMapProperties is false", () => {
      vi.mocked(transformer.transformQueryRecursively).mockReturnValue({
        query: { q: "*" },
        warnings: [],
      });
      vi.mocked(common.createPaginationAndSort).mockReturnValue({
        query: {},
        warnings: [],
      });

      const transformerInstance = createTransformer({
        autoMapProperties: false,
      });
      transformerInstance.transform({ query: {} });

      expect(transformHints.suggestTransformHints).not.toHaveBeenCalled();
    });
  });

  describe("mapResults method", () => {
    it("should include mapResults function when custom mapper is provided", () => {
      const customMapper: ResultMapper = (doc) => ({ mapped: true, doc });

      const transformer = createTransformer({
        mapResultsToElasticSchema: customMapper,
      });

      expect(transformer).toHaveProperty("mapResults");
      expect(transformer.mapResults).toBe(customMapper);

      // Test mapper works
      const result = transformer.mapResults({ field: "value" });
      expect(result).toEqual({ mapped: true, doc: { field: "value" } });
    });

    it("should include mapResults function when property mapping is provided", () => {
      const mockDefaultMapper = (doc: any) => ({ default_mapped: true, doc });
      vi.mocked(mapResultsModule.createDefaultMapper).mockReturnValue(
        mockDefaultMapper
      );

      const propertyMapping = { es_field: "ts_field" };
      const transformer = createTransformer({ propertyMapping });

      expect(transformer).toHaveProperty("mapResults");
      expect(mapResultsModule.createDefaultMapper).toHaveBeenCalledWith(
        propertyMapping
      );

      // Test mapper works
      const result = transformer.mapResults?.({ ts_field: "value" });
      expect(result).toEqual({
        default_mapped: true,
        doc: { ts_field: "value" },
      });
    });

    it("should not include mapResults function with no mapping information", () => {
      const transformer = createTransformer({});
      expect(transformer).not.toHaveProperty("mapResults");
    });

    it("should support async mapping functions", async () => {
      const asyncMapper: ResultMapper = async (doc) => {
        return { async_mapped: true, doc };
      };

      const transformer = createTransformer({
        mapResultsToElasticSchema: asyncMapper,
      });

      expect(transformer).toHaveProperty("mapResults");

      const resultPromise = transformer.mapResults({ field: "value" });
      expect(resultPromise).toBeInstanceOf(Promise);

      const result = await resultPromise;
      expect(result).toEqual({
        async_mapped: true,
        doc: { field: "value" },
      });
    });

    it("should handle array inputs in mapResults", () => {
      const customMapper: ResultMapper = (docs) => {
        if (Array.isArray(docs)) {
          return docs.map((d) => ({ mapped: true, doc: d }));
        }
        return { mapped: true, doc: docs };
      };

      const transformer = createTransformer({
        mapResultsToElasticSchema: customMapper,
      });

      const docs = [{ id: 1 }, { id: 2 }];
      const result = transformer.mapResults(docs);

      expect(result).toEqual([
        { mapped: true, doc: { id: 1 } },
        { mapped: true, doc: { id: 2 } },
      ]);
    });
  });
});
