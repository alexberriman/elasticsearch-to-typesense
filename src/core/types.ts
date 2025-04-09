import type { Result } from "../utils/result.js";
export type { Result };

export type TransformResult<T> = {
  query: T;
  warnings: string[];
};

/**
 * Property mapping type that maps Elasticsearch field names to Typesense field names.
 * When both schemas are specified:
 * - Keys should be valid properties from the Elasticsearch schema
 * - Values should be valid properties from the Typesense schema
 * Otherwise, it's a generic string to string mapping
 */
export type PropertyMapping = Record<string, string>;

/**
 * Function to transform field values between Elasticsearch and Typesense
 *
 * @param field - The field name in Typesense (already mapped from Elasticsearch)
 * @param value - The original value from Elasticsearch query
 * @param context - Additional context like schema information
 * @returns The transformed value to use in Typesense query
 */
export type ValueTransformer = (
  field: string,
  value: any,
  context: {
    elasticField?: string;
    typesenseField: string;
    typesenseSchema?: TypesenseSchema;
    elasticSchema?: ElasticSchema;
    elasticFieldSchema?: Record<string, any>;
    typesenseFieldSchema?: Record<string, any>;
  }
) => any;

export interface TransformerContext {
  /**
   * Maps Elasticsearch field names (keys) to Typesense field names (values)
   */
  propertyMapping: PropertyMapping;
  typesenseSchema?: TypesenseSchema;
  elasticSchema?: ElasticSchema;
  negated?: boolean;
  defaultScoreField?: string;
  /**
   * Optional function to transform field values from Elasticsearch to Typesense
   */
  valueTransformer?: ValueTransformer;
}

// Define ElasticsearchQuery as a recursive type that can handle nested objects
export type ElasticsearchQuery = {
  [key: string]: unknown;
};

export type TypesenseQuery = {
  q?: string; // Making q optional to fix type errors in tests
  filter_by?: string;
  sort_by?: string;
  per_page?: number;
  page?: number;
  query_by?: string;
  query_by_weights?: string;
  [key: string]: unknown; // Allow additional properties
};

/**
 * Represents a Typesense schema definition
 * https://typesense.org/docs/0.22.2/api/collections.html#create-a-collection
 */
export interface TypesenseSchema {
  /**
   * Array of field definitions for the Typesense collection
   */
  fields: Array<{
    /**
     * Field name in Typesense schema
     */
    name: string;

    /**
     * Field type (string, int32, float, bool, etc.)
     */
    type: string;

    /**
     * Whether the field is optional (can be omitted in documents)
     */
    optional?: boolean;

    /**
     * Whether the field is facetable
     */
    facet?: boolean;

    /**
     * Additional field properties
     */
    [key: string]: any;
  }>;

  /**
   * Default sorting field
   */
  default_sorting_field?: string;
}

/**
 * Represents an Elasticsearch schema (mapping) definition
 * https://www.elastic.co/guide/en/elasticsearch/reference/6.8/mapping.html
 */
export interface ElasticSchema {
  /**
   * Properties mapping of the Elasticsearch index
   * Keys are field names, values are field definitions
   */
  properties: Record<
    string,
    {
      /**
       * Field type (text, keyword, integer, float, boolean, etc.)
       */
      type?: string;

      /**
       * Nested properties for object types
       */
      properties?: Record<string, any>;

      /**
       * Additional field properties
       */
      [key: string]: any;
    }
  >;
}

/**
 * Function to map Typesense documents back to Elasticsearch format
 *
 * @template T - Type of Typesense document(s)
 * @template R - Type of resulting Elasticsearch document(s)
 * @param documents - Typesense document or array of documents
 * @returns Elasticsearch document or array of documents (or Promise of these)
 */
export type ResultMapper<T = any, R = any> = (
  documents: T | T[]
) => R | R[] | Promise<R | R[]>;

export interface TransformerOptions {
  /**
   * Manual mapping of Elasticsearch field names to Typesense field names
   * Keys: Elasticsearch field names
   * Values: Typesense field names
   */
  propertyMapping?: PropertyMapping;

  /**
   * Typesense schema definition
   * Used for auto-mapping and determining field types
   */
  typesenseSchema?: TypesenseSchema;

  /**
   * Elasticsearch schema definition
   * Used for auto-mapping and determining field types
   */
  elasticSchema?: ElasticSchema;

  /**
   * Whether to automatically generate property mappings based on schemas
   * Requires both typesenseSchema and elasticSchema to be provided
   */
  autoMapProperties?: boolean;

  /**
   * Custom strategy for matching Elasticsearch fields to Typesense fields during auto-mapping
   * @param elasticField - Field name from Elasticsearch schema
   * @param typesenseField - Field name from Typesense schema
   * @returns boolean indicating if the fields should be mapped
   */
  fieldMatchStrategy?: (
    elasticField: string,
    typesenseField: string
  ) => boolean;

  /**
   * Default query string to use when none is provided
   */
  defaultQueryString?: string;

  /**
   * Default field to use for scoring/relevance
   */
  defaultScoreField?: string;

  /**
   * Function to map Typesense results back to Elasticsearch format
   * When provided, the transformer will expose a mapResults function
   *
   * If both typesenseSchema and elasticSchema are provided, this function
   * will map between properly typed documents based on the schemas.
   * Otherwise, it operates on generic Record<string, any> objects.
   */
  mapResultsToElasticSchema?: ResultMapper;

  /**
   * Optional function to transform field values from Elasticsearch to Typesense
   * This is useful when values differ between systems (e.g., case sensitivity differences)
   *
   * The function receives the field name, value, and context with schema information,
   * and should return the transformed value to use in the Typesense query.
   */
  valueTransformer?: ValueTransformer;
}
