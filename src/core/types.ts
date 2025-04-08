export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type TransformResult<T> = {
  query: T;
  warnings: string[];
};

export type PropertyMapping = Record<string, string>;

export interface TransformerContext {
  propertyMapping: PropertyMapping;
  typesenseSchema?: TypesenseSchema;
  elasticSchema?: ElasticSchema;
  negated?: boolean;
  defaultScoreField?: string;
}

export type ElasticsearchQuery = Record<string, unknown>;

export type TypesenseQuery = {
  q: string;
  filter_by?: string;
  sort_by?: string;
  per_page?: number;
  page?: number;
};

// Simplified for now — refine as needed
export interface TypesenseSchema {
  fields: Array<{ name: string; type: string }>;
}

export interface ElasticSchema {
  properties: Record<string, any>;
}

export interface TransformerOptions {
  propertyMapping?: PropertyMapping;
  typesenseSchema?: TypesenseSchema;
  elasticSchema?: ElasticSchema;
  autoMapProperties?: boolean;
  fieldMatchStrategy?: (
    elasticField: string,
    typesenseField: string
  ) => boolean;
  defaultQueryString?: string;
  /**
   * Default sort to use when _score is requested in Elasticsearch.
   * By default, will use "_text_match:desc" in Typesense.
   * For example, you could set this to "quality_score:desc" or another field.
   */
  defaultScoreField?: string;
}
