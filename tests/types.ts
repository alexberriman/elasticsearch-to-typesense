import { createTransformer } from "../src/index.js";

// TypeScript declarations for JSON schema
export interface ExtendedTypesenseSchema {
  fields: Array<{ name: string; type: string }>;
  default_sorting_field: string;
  token_separators: string[];
  enable_nested_fields: boolean;
}

// Define types for Typesense
export interface CollectionFieldSchema {
  name: string;
  type: string;
  facet?: boolean;
  index?: boolean;
  optional?: boolean;
  sort?: boolean;
  [key: string]: unknown; // Allow any additional properties
}

export interface CollectionSchema {
  name: string;
  fields: CollectionFieldSchema[];
  default_sorting_field?: string;
  token_separators?: string[];
  enable_nested_fields?: boolean;
  [key: string]: unknown; // Allow any additional properties
}

// Define the field type for our transformations
export type FieldType =
  | "string"
  | "int32"
  | "int64"
  | "float"
  | "bool"
  | "geopoint"
  | "string[]"
  | "int32[]"
  | "int64[]"
  | "float[]"
  | "bool[]";

export interface Collection {
  transformer: ReturnType<typeof createTransformer>;
  setUp?: () => Promise<void>;
  tearDown?: () => Promise<void>;
}
