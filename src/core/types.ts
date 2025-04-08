export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type TransformResult<T> = {
  query: T;
  warnings: string[];
};

export type PropertyMapping = Record<string, string>;

export interface TransformerContext {
  propertyMapping: PropertyMapping;
}

export type ElasticsearchQuery = Record<string, unknown>;

export type TypesenseQuery = {
  filter_by?: string;
  sort_by?: string;
  per_page?: number;
  page?: number;
};
