import { describe, expect, it, vi } from "vitest";
import { createTransformer } from "./create-transformer.js";
import { ResultMapper, TransformerOptions } from "./types.js";
import * as autoMapping from "../utils/apply-auto-mapping.js";
import * as transformer from "./transformer.js";
import * as transformHints from "../utils/suggest-transform-hints.js";
import * as common from "../transformers/common.js";
import * as mapResultsModule from "../utils/map-results-to-elastic.js";

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
    expect(transformer).toHaveProperty("extend");
    expect(typeof transformer.extend).toBe("function");
    expect(transformer).toHaveProperty("options");
    expect(transformer.options).toEqual({
      propertyMapping: {},
      typesenseSchema: undefined,
      elasticSchema: undefined,
    });
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

    it("should pass valueTransformer to transformer context", () => {
      const mockPagination = { query: {}, warnings: [] };
      const mockTransform = { query: {}, warnings: [] };

      vi.mocked(transformer.transformQueryRecursively).mockReturnValue(
        mockTransform
      );
      vi.mocked(common.createPaginationAndSort).mockReturnValue(mockPagination);

      const valueTransformer = (field: string, value: any) => value;

      const transformerInstance = createTransformer({
        valueTransformer,
      });
      transformerInstance.transform({ query: {} });

      expect(transformer.transformQueryRecursively).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          valueTransformer,
        })
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

  describe("extend method", () => {
    it("should create a new transformer with merged options", () => {
      // Create initial transformer
      const initialOptions: TransformerOptions = {
        propertyMapping: { field1: "mappedField1" },
        defaultScoreField: "score",
      };

      const transformer = createTransformer(initialOptions);

      // Extend with new options
      const extendedOptions: Partial<TransformerOptions> = {
        propertyMapping: { field2: "mappedField2" },
        defaultQueryString: "*",
      };

      const extendedTransformer = transformer.extend(extendedOptions);

      // Verify it's a new instance
      expect(extendedTransformer).not.toBe(transformer);

      // Verify extended transformer has correct properties
      expect(extendedTransformer).toHaveProperty("transform");
      expect(extendedTransformer).toHaveProperty("extend");

      // Verify extended transformer has option values merged correctly
      expect(extendedTransformer).toHaveProperty("options");
      expect(extendedTransformer.options).toEqual({
        propertyMapping: { field1: "mappedField1", field2: "mappedField2" },
        defaultScoreField: "score",
        defaultQueryString: "*",
      });

      // Original transformer's options should remain unchanged
      expect(transformer.options).toEqual({
        propertyMapping: { field1: "mappedField1" },
        defaultScoreField: "score",
      });
    });

    it("should preserve mapResults when extending", () => {
      const customMapper: ResultMapper = (doc) => ({ mapped: true, doc });

      const transformer = createTransformer({
        mapResultsToElasticSchema: customMapper,
      });

      const extendedTransformer = transformer.extend({
        defaultScoreField: "score",
      });

      expect(extendedTransformer).toHaveProperty("mapResults");
      expect(typeof extendedTransformer.mapResults).toBe("function");
    });

    it("should properly merge property mappings when extending", () => {
      // Set up createDefaultMapper mock
      const mockMapperInitial = vi.fn((doc) => ({ initial: true, doc }));
      const mockMapperExtended = vi.fn((doc) => ({ extended: true, doc }));

      // First call should return the initial mapper
      // Second call should return the extended mapper
      vi.mocked(mapResultsModule.createDefaultMapper)
        .mockReturnValueOnce(mockMapperInitial)
        .mockReturnValueOnce(mockMapperExtended);

      // Create initial transformer with property mapping
      const initialTransformer = createTransformer({
        propertyMapping: { field1: "mapped1" },
      });

      // Extend with additional property mappings
      const extendedTransformer = initialTransformer.extend({
        propertyMapping: { field2: "mapped2" },
      });

      // Both should have mapResults and options
      expect(initialTransformer).toHaveProperty("mapResults");
      expect(extendedTransformer).toHaveProperty("mapResults");

      // Verify options reflect the merged property mappings
      expect(initialTransformer.options.propertyMapping).toEqual({
        field1: "mapped1",
      });
      expect(extendedTransformer.options.propertyMapping).toEqual({
        field1: "mapped1",
        field2: "mapped2",
      });

      // createDefaultMapper should have been called twice with different mappings
      expect(mapResultsModule.createDefaultMapper).toHaveBeenCalledTimes(2);
      expect(mapResultsModule.createDefaultMapper).toHaveBeenNthCalledWith(1, {
        field1: "mapped1",
      });
      expect(mapResultsModule.createDefaultMapper).toHaveBeenNthCalledWith(2, {
        field1: "mapped1",
        field2: "mapped2",
      });
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
      expect(transformer).toHaveProperty("extend");

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
      expect(transformer).toHaveProperty("extend");
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
      expect(transformer).toHaveProperty("extend");
    });

    it("should support async mapping functions", async () => {
      const asyncMapper: ResultMapper = async (doc) => {
        return { async_mapped: true, doc };
      };

      const transformer = createTransformer({
        mapResultsToElasticSchema: asyncMapper,
      });

      expect(transformer).toHaveProperty("mapResults");
      expect(transformer).toHaveProperty("extend");

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

      expect(transformer).toHaveProperty("extend");

      const docs = [{ id: 1 }, { id: 2 }];
      const result = transformer.mapResults(docs);

      expect(result).toEqual([
        { mapped: true, doc: { id: 1 } },
        { mapped: true, doc: { id: 2 } },
      ]);
    });
  });
});
