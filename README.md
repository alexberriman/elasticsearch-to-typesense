# Elastic to Typesense

A utility library for converting Elasticsearch queries to Typesense format.

⚠️ **WARNING: This library is under active development and not ready for production use.** ⚠️

This library is designed to translate Elasticsearch 6.8 queries to Typesense v28 format, helping you migrate your search functionality without rewriting all your queries.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Example Usage](#example-usage)
  - [Basic Query Transformation](#basic-query-transformation)
  - [Multi-Match and Prefix Queries](#multi-match-and-prefix-queries)
  - [Using with Value Transformer](#using-with-value-transformer)
  - [Using with Typesense Schema and Advanced Value Transformation](#using-with-typesense-schema-and-advanced-value-transformation)
- [Configuration Options](#configuration-options)
- [Typesense Query Parameters](#typesense-query-parameters)
- [Result Type Pattern](#result-type-pattern)
  - [What is the Result Pattern?](#what-is-the-result-pattern)
  - [Using the Result Pattern](#using-the-result-pattern)
  - [Helper Functions](#helper-functions)
- [Supported Query Types](#supported-query-types)
- [Mapping Results Back to Elasticsearch Format](#mapping-results-back-to-elasticsearch-format)
  - [Custom Result Mapping](#custom-result-mapping)
  - [Async Mapping with External Data Sources](#async-mapping-with-external-data-sources)
- [Limitations](#limitations)
- [Contributing](#contributing)
  - [Development Setup](#development-setup)
  - [Release Process](#release-process)
- [License](#license)

## Features

- Transform Elasticsearch queries to Typesense syntax
- Support for common query types:
  - Match queries
  - Term queries
  - Range queries
  - Bool queries (must, should, must_not)
  - Exists queries
  - Function score queries
  - Multi-match queries (across multiple fields)
  - Prefix queries (for prefix matching)
- Mapping between Elasticsearch and Typesense field names
- Auto-generation of field mappings
- Support for geo sorting
- Customizable default score field
- Detailed warnings for unsupported query types
- Map Typesense results back to Elasticsearch format (for backward compatibility)

## Installation

```bash
npm install elasticsearch-to-typesense
```

## Getting Started

To use the library, you need to create a transformer instance with your desired configuration:

```typescript
import { createTransformer } from 'elasticsearch-to-typesense';

const transformer = createTransformer({
  // Configuration options here
  propertyMapping: {
    'es_field': 'typesense_field',
    'another_field': 'mapped_field'
  }
});
```

## Example Usage

### Basic Query Transformation

```typescript
import { createTransformer } from 'elasticsearch-to-typesense';

// Initialize the transformer with field mappings
// Keys are Elasticsearch field names, values are Typesense field names
const transformer = createTransformer({
  propertyMapping: {
    'title': 'title',               // Map Elasticsearch 'title' to Typesense 'title'
    'description': 'description',   // Same field name in both
    'price': 'price',               // Same field name in both
    'category': 'category_id'       // Map Elasticsearch 'category' to Typesense 'category_id'
  }
});

// Elasticsearch query
const esQuery = {
  query: {
    bool: {
      must: [
        { match: { title: "smartphone" } },
        { range: { price: { gte: 200, lte: 800 } } }
      ],
      filter: [
        { term: { category: "electronics" } }
      ]
    }
  },
  sort: [
    { price: { order: "asc" } }
  ],
  from: 0,
  size: 20
};

// Transform to Typesense query
const result = transformer.transform(esQuery);

if (result.ok) {
  console.log('Typesense query:', result.value.query);
  
  // Check for any transformation warnings
  if (result.value.warnings.length > 0) {
    console.warn('Transformation warnings:', result.value.warnings);
  }
  
  // Use the transformed query with Typesense client
  const typesenseClient = getTypesenseClient(); // Your Typesense client initialization
  const searchResults = await typesenseClient
    .collections('products')
    .documents()
    .search(result.value.query);
} else {
  // Handle error case
  console.error('Transformation failed:', result.error);
  // You might want to provide a fallback or show an error message
}
```

### Multi-Match and Prefix Queries

```typescript
import { createTransformer } from 'elasticsearch-to-typesense';

const transformer = createTransformer({
  // Keys are Elasticsearch field names, values are Typesense field names
  propertyMapping: {
    'title': 'title',               // Same field name in both
    'description': 'description',   // Same field name in both
    'tags': 'tags',                 // Same field name in both
    'brand': 'brand_name'           // Map Elasticsearch 'brand' to Typesense 'brand_name'
  },
  // Optional: Provide a custom function to map results back to Elasticsearch format
  mapResultsToElasticSchema: (typesenseResults) => {
    // If it's an array of results, map each one
    if (Array.isArray(typesenseResults)) {
      return typesenseResults.map(doc => ({
        // Map Typesense fields back to Elasticsearch fields
        title: doc.title,
        description: doc.description,
        tags: doc.tags,
        brand: doc.brand_name
      }));
    }
    
    // Single result
    return {
      title: typesenseResults.title,
      description: typesenseResults.description,
      tags: typesenseResults.tags,
      brand: typesenseResults.brand_name
    };
  }
});

// Multi-match query (search across multiple fields with weights)
const multiMatchQuery = {
  query: {
    multi_match: {
      query: "wireless headphones",
      fields: ["title^3", "description", "tags^2"],
      type: "best_fields",
      fuzziness: 1
    }
  }
};

// Prefix query (for autocomplete/suggestions)
const prefixQuery = {
  query: {
    prefix: {
      brand: {
        value: "app",
        boost: 2.0
      }
    }
  }
};

// Transform queries
const multiMatchResult = transformer.transform(multiMatchQuery);
const prefixResult = transformer.transform(prefixQuery);

if (multiMatchResult.ok) {
  // Will generate query_by and query_by_weights for Typesense
  console.log('Multi-match query:', multiMatchResult.value.query);
  // Example output: { q: "wireless headphones", query_by: "title,description,tags", query_by_weights: "3,1,2" }
}

if (prefixResult.ok) {
  // Will add wildcard for prefix matching
  console.log('Prefix query:', prefixResult.value.query);
  // Example output: { q: "app*", query_by: "brand_name", query_by_weights: "2" }
}
```

### Using with Value Transformer

```typescript
import { createTransformer } from 'elasticsearch-to-typesense';

// Initialize the transformer with a value transformer function
const transformer = createTransformer({
  propertyMapping: {
    'title': 'title',
    'category': 'category',
    'tags': 'tags'
  },
  
  // Add a valueTransformer to handle case sensitivity differences
  valueTransformer: (field, value, context) => {
    // Check if the value is a string
    if (typeof value === 'string') {
      // For category field, transform to lowercase (since Typesense has lowercase values stored)
      if (field === 'category') {
        return value.toLowerCase();
      }
      
      // For tags field, always transform to lowercase for consistency
      if (field === 'tags') {
        // If it's an array of tags
        if (Array.isArray(value)) {
          return value.map(tag => typeof tag === 'string' ? tag.toLowerCase() : tag);
        }
        return value.toLowerCase();
      }
    }
    
    // For all other values or non-string values, return as-is
    return value;
  }
});

// Example query with case-sensitive values that will be transformed
const elasticQuery = {
  query: {
    bool: {
      must: [
        { match: { title: "Smartphone" } }
      ],
      filter: [
        { term: { category: "Electronics" } },  // This will be transformed to lowercase
        { terms: { tags: ["PREMIUM", "New", "FEATURED"] } }  // These will be transformed to lowercase
      ]
    }
  }
};

// The resulting Typesense query would use the transformed lowercase values
// { filter_by: "title:= \"Smartphone\" && category:= \"electronics\" && tags:= [\"premium\", \"new\", \"featured\"]" }
```

### Using with Typesense Schema and Advanced Value Transformation

```typescript
import { createTransformer } from 'elasticsearch-to-typesense';

// Define your Typesense schema
const typesenseSchema = {
  fields: [
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'price', type: 'float' },
    { name: 'category_id', type: 'string', facet: true },
    { name: 'location', type: 'geopoint' }
  ]
};

// Define your Elasticsearch schema
const elasticSchema = {
  properties: {
    title: { type: 'text' },
    description: { type: 'text' },
    price: { type: 'float' },
    category: { type: 'keyword' },
    location: { type: 'geo_point' }
  }
};

// Initialize the transformer with auto-mapping and a value transformer
const transformer = createTransformer({
  typesenseSchema,  // Typesense schema definition
  elasticSchema,    // Elasticsearch schema definition
  autoMapProperties: true,  // Enable auto-mapping between schemas
  defaultScoreField: 'quality_score:desc',  // Default score field for results
  
  // Add a value transformer that uses schema information
  valueTransformer: (field, value, context) => {
    // Access schema details from the context
    const { typesenseFieldSchema } = context;
    
    if (typeof value === 'string') {
      // Transform all facet field values to lowercase
      if (typesenseFieldSchema?.facet === true) {
        return value.toLowerCase();
      }
      
      // Keep search query fields as-is for better matching
      return value;
    }
    
    // For numeric fields, ensure we have a number
    if (field === 'price' && typeof value === 'string') {
      return parseFloat(value);
    }
    
    // For all other values, return as-is
    return value;
  }
  
  // Note: When autoMapProperties is true, the library will automatically map:
  // - Elasticsearch 'title' → Typesense 'title'
  // - Elasticsearch 'description' → Typesense 'description'
  // - Elasticsearch 'price' → Typesense 'price' 
  // - Elasticsearch 'category' → Typesense 'category_id' (closest match)
  // - Elasticsearch 'location' → Typesense 'location'
});

// Elasticsearch query with geo sorting
const esQuery = {
  query: {
    match: { title: "restaurant" }
  },
  sort: [
    {
      _geo_distance: {
        location: { lat: 40.712, lon: -74.006 },
        order: "asc",
        unit: "km"
      }
    }
  ],
  size: 10
};

// Transform to Typesense query
const result = transformer.transform(esQuery);

if (result.ok) {
  console.log('Typesense query:', result.value.query);
  // This would include geo sorting: location(40.712,-74.006):asc
}
```

## Configuration Options

The `createTransformer` function accepts the following options:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `propertyMapping` | `Record<string, string>` | Maps Elasticsearch field names (keys) to Typesense field names (values). When both schemas are provided, keys should be properties from the Elasticsearch schema and values should be properties from the Typesense schema. | `{}` |
| `typesenseSchema` | `TypesenseSchema` | Typesense schema object with field definitions. Used for auto-mapping and determining field types. | `undefined` |
| `elasticSchema` | `ElasticSchema` | Elasticsearch mapping schema. Used for auto-mapping and determining field types. | `undefined` |
| `autoMapProperties` | `boolean` | Whether to auto-generate field mappings based on schema names. Requires both `typesenseSchema` and `elasticSchema` to be provided. | `false` |
| `fieldMatchStrategy` | `(elasticField: string, typesenseField: string) => boolean` | Custom function to determine if fields match for auto-mapping. Receives an Elasticsearch field name and a Typesense field name and should return true if they should be mapped to each other. | `undefined` |
| `defaultQueryString` | `string` | Default search query string to use when none is provided in the input query. | `*` |
| `defaultScoreField` | `string` | Default field to use for scoring/relevance when no sorting is specified. | `_text_match:desc` |
| `valueTransformer` | `(field: string, value: any, context: object) => any` | Optional function to transform field values from Elasticsearch to Typesense. Useful when values differ between systems (e.g., case sensitivity differences). Receives the field name, value, and context object with schema information. | `undefined` |
| `mapResultsToElasticSchema` | `(documents: any \| any[]) => any \| any[] \| Promise<any \| any[]>` | Optional function to map Typesense search results back to Elasticsearch format. When provided, the transformer will expose a `mapResults` function. If not provided but `propertyMapping` is set, a default mapping function will be created based on inverting the property mapping. | `undefined` |

## Typesense Query Parameters

The following Typesense search parameters are supported in the transformation:

| Parameter | Description |
|-----------|-------------|
| `q` | The search query (defaults to "*" for match all) |
| `filter_by` | Filter conditions (generated from match, term, range, etc.) |
| `sort_by` | Sort order (generated from Elasticsearch sort) |
| `per_page` | Number of results per page (from Elasticsearch size) |
| `page` | Page number (calculated from Elasticsearch from/size) |
| `query_by` | Fields to search in (used by multi_match and prefix queries) |
| `query_by_weights` | Relative weights for fields (used by multi_match with boost values) |

### TypesenseSchema

```typescript
/**
 * Represents a Typesense schema definition
 * https://typesense.org/docs/0.22.2/api/collections.html#create-a-collection
 */
interface TypesenseSchema {
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
```

### ElasticSchema

```typescript
/**
 * Represents an Elasticsearch schema (mapping) definition
 * https://www.elastic.co/guide/en/elasticsearch/reference/6.8/mapping.html
 */
interface ElasticSchema {
  /**
   * Properties mapping of the Elasticsearch index
   * Keys are field names, values are field definitions
   */
  properties: Record<string, {
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
  }>;
}
```

## Result Type Pattern

This library uses a `Result` type pattern for error handling, which provides better type safety and helps distinguish between successful operations and errors.

### What is the Result Pattern?

The `Result<T>` type can be either:
- A successful result: `{ ok: true, value: T }`
- An error result: `{ ok: false, error: string }`

This approach offers several advantages:
- Explicit error handling with type safety
- No exceptions to catch
- Clear indication of possible failure points
- Consistent error handling throughout the codebase

### Using the Result Pattern

When using the transformer, you should always check the `ok` property before accessing the result:

```typescript
import { createTransformer } from 'elasticsearch-to-typesense';

const transformer = createTransformer({
  propertyMapping: { /* ... */ }
});

const result = transformer.transform(elasticsearchQuery);

if (result.ok) {
  // Success case - access the result value
  const typesenseQuery = result.value.query;
  const warnings = result.value.warnings;
  
  // Use the transformed query
  console.log('Transformed query:', typesenseQuery);
  
  // Optionally handle any warnings
  if (warnings.length > 0) {
    console.warn('Transformation warnings:', warnings);
  }
} else {
  // Error case - handle the error
  console.error('Transformation failed:', result.error);
}
```

### Helper Functions

The library provides utility functions to work with Result objects:

```typescript
import { 
  ok, 
  err, 
  isOk, 
  isErr 
} from 'elasticsearch-to-typesense';

// Create a successful result
const successResult = ok({ some: 'data' });

// Create an error result
const errorResult = err('Something went wrong');

// Check result type with type guards
if (isOk(result)) {
  // TypeScript knows result.value is available here
  console.log(result.value);
} else if (isErr(result)) {
  // TypeScript knows result.error is available here
  console.error(result.error);
}

// Alternatively, you can use simple boolean checks
if (!result.ok) {
  // TypeScript knows result.error is available here
  console.error(result.error);
} else {
  // TypeScript knows result.value is available here
  console.log(result.value);
}
```

These utilities make it easier to handle different result cases with proper type safety.

## Supported Query Types

| Elasticsearch Query | Typesense Equivalent |
|---------------------|----------------------|
| `match` | Filter by equality |
| `term` | Filter by exact match (singular value) |
| `terms` | Filter by array of values |
| `range` | Filter by range operators (gt, gte, lt, lte) |
| `bool` | Combination of filter clauses with AND/OR/NOT operators |
| `exists` | Filter by field presence |
| `function_score` | Base query (functions not supported) |
| `multi_match` | Search across multiple fields with weights |
| `prefix` | Prefix search with wildcard matching |

## Mapping Results Back to Elasticsearch Format

When you're migrating from Elasticsearch to Typesense, you might have existing code that expects responses in Elasticsearch format. The library provides a `mapResults` function to help with this transition:

```typescript
import { createTransformer } from 'elasticsearch-to-typesense';
import { TypesenseClient } from 'typesense';

// Initialize the Typesense client
const typesenseClient = new TypesenseClient({
  nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
  apiKey: 'xyz',
});

// Create a transformer with result mapping
const transformer = createTransformer({
  propertyMapping: {
    'es_title': 'ts_title',
    'es_price': 'ts_price',
    'es_category': 'ts_category',
    'es_created_at': 'ts_created_at'
  }
});

// Transform an Elasticsearch query to Typesense format
const elasticQuery = {
  query: {
    bool: {
      must: [
        { match: { es_title: "smartphone" } }
      ],
      filter: [
        { term: { es_category: "electronics" } }
      ]
    }
  }
};

const result = transformer.transform(elasticQuery);

if (result.ok) {
  // Execute the query with Typesense
  const typesenseResponse = await typesenseClient
    .collections('products')
    .documents()
    .search(result.value.query);
    
  // Map the results back to Elasticsearch format for compatibility with existing code
  if (transformer.mapResults) {
    // This will use the inverse of the property mapping to transform fields
    // ts_title → es_title, ts_price → es_price, etc.
    const elasticsearchCompatibleResults = transformer.mapResults(typesenseResponse.hits);
    
    // Your existing code can now process the results as if they came from Elasticsearch
    processResults(elasticsearchCompatibleResults);
  }
}
```

### Custom Result Mapping

You can provide a custom mapping function for more complex transformations:

```typescript
const transformer = createTransformer({
  // Property mapping for query transformation (ES → TS)
  propertyMapping: { ... },
  
  // Custom function for result mapping (TS → ES)
  mapResultsToElasticSchema: (typesenseHits) => {
    if (Array.isArray(typesenseHits)) {
      return typesenseHits.map(hit => ({
        _id: hit.id,
        _source: {
          title: hit.document.ts_title,
          price: hit.document.ts_price,
          // Transform nested fields
          category: {
            name: hit.document.ts_category,
            level: hit.document.ts_category_level
          },
          // Add calculated fields
          score: hit.text_match,
          // Format dates in Elasticsearch style
          created_at: new Date(hit.document.ts_created_at).toISOString()
        },
        _score: hit.text_match
      }));
    }
    
    // Handle single document case
    return { /* similar transformation */ };
  }
});
```

### Async Mapping with External Data Sources

The `mapResultsToElasticSchema` function can also be async, allowing you to enrich Typesense results with data from external sources before returning them in Elasticsearch format. This is particularly useful when:

1. Typesense doesn't store all fields that were in your Elasticsearch index
2. You need to normalize or combine data from multiple sources
3. You're integrating with existing systems that expect Elasticsearch document structure

Here's an example of enriching Typesense results with data from a PostgreSQL database:

```typescript
import { createTransformer } from 'elasticsearch-to-typesense';
import { Pool } from 'pg';
import { TypesenseClient } from 'typesense';

// Initialize database connection
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Initialize Typesense client
const typesenseClient = new TypesenseClient({
  nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
  apiKey: 'xyz',
});

// Create transformer with async mapping function
const transformer = createTransformer({
  propertyMapping: {
    'product_id': 'id',
    'product_name': 'name',
    'product_category': 'category'
  },
  
  // Async mapping function to enrich Typesense results with database data
  mapResultsToElasticSchema: async (typesenseHits) => {
    if (!Array.isArray(typesenseHits)) {
      return typesenseHits; // Handle single document case or empty results
    }
    
    // Extract product IDs from Typesense results
    const productIds = typesenseHits.map(hit => hit.document.id);
    
    if (productIds.length === 0) {
      return [];
    }
    
    try {
      // Fetch additional product details from PostgreSQL
      const result = await pgPool.query(
        `SELECT 
          product_id, 
          inventory_status, 
          warehouse_location,
          manufacturer_details,
          related_products
        FROM product_inventory 
        WHERE product_id = ANY($1)`,
        [productIds]
      );
      
      // Create a lookup map for quick access to db data
      const productDetailsMap = result.rows.reduce((map, row) => {
        map[row.product_id] = row;
        return map;
      }, {});
      
      // Map and combine data from Typesense and PostgreSQL
      return typesenseHits.map(hit => {
        const typesenseDoc = hit.document;
        const dbData = productDetailsMap[typesenseDoc.id] || {};
        
        // Return in Elasticsearch format
        return {
          _id: typesenseDoc.id,
          _index: 'products',
          _score: hit.text_match,
          _source: {
            // Fields from Typesense
            product_id: typesenseDoc.id,
            product_name: typesenseDoc.name,
            product_category: typesenseDoc.category,
            price: typesenseDoc.price,
            
            // Fields from PostgreSQL
            inventory_status: dbData.inventory_status || 'unknown',
            warehouse_location: dbData.warehouse_location,
            manufacturer: JSON.parse(dbData.manufacturer_details || '{}'),
            related_products: JSON.parse(dbData.related_products || '[]'),
            
            // Computed fields
            is_in_stock: dbData.inventory_status === 'in_stock',
            last_updated: new Date().toISOString()
          }
        };
      });
    } catch (error) {
      console.error('Error enriching search results with database data:', error);
      
      // Fallback to basic mapping if database query fails
      return typesenseHits.map(hit => ({
        _id: hit.document.id,
        _source: {
          product_id: hit.document.id,
          product_name: hit.document.name,
          product_category: hit.document.category
        }
      }));
    }
  }
});

// Usage example
async function searchProducts(query) {
  const elasticQuery = { 
    query: { 
      match: { product_name: query } 
    } 
  };
  
  const result = transformer.transform(elasticQuery);
  
  if (!result.ok) {
    // Handle the error case properly
    console.error('Query transformation failed:', result.error);
    throw new Error(`Failed to transform query: ${result.error}`);
  }
  
  try {
    // Execute search with Typesense using the transformed query
    const typesenseResponse = await typesenseClient
      .collections('products')
      .documents()
      .search(result.value.query);
    
    // Log any warnings from the transformation
    if (result.value.warnings.length > 0) {
      console.warn('Transformation produced warnings:', result.value.warnings);
    }
    
    // Enrich and map results to Elasticsearch format
    // This will execute the async mapping function and fetch data from PostgreSQL
    const enrichedResults = await transformer.mapResults(typesenseResponse.hits);
    
    return enrichedResults;
  } catch (error) {
    console.error('Search or enrichment failed:', error);
    throw error;
  }
}
```

Another example using S3 to fetch additional product images:

```typescript
import { createTransformer } from 'elasticsearch-to-typesense';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { TypesenseClient } from 'typesense';

// Initialize S3 client
const s3Client = new S3Client({ region: 'us-east-1' });

// Initialize Typesense client
const typesenseClient = new TypesenseClient({
  nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
  apiKey: 'xyz',
});

// Create transformer with S3 enrichment
const transformer = createTransformer({
  propertyMapping: {
    'es_product_id': 'ts_product_id',
    'es_name': 'ts_name',
    'es_description': 'ts_description'
  },
  
  // Async mapping function to fetch additional assets from S3
  mapResultsToElasticSchema: async (typesenseHits) => {
    if (!Array.isArray(typesenseHits)) {
      return typesenseHits;
    }
    
    // Process each hit and enrich with S3 data
    const enrichedResults = await Promise.all(typesenseHits.map(async (hit) => {
      const productId = hit.document.ts_product_id;
      
      try {
        // Fetch product metadata from S3
        const metadataResponse = await s3Client.send(
          new GetObjectCommand({
            Bucket: 'product-catalog',
            Key: `products/${productId}/metadata.json`
          })
        );
        
        // Convert stream to string and parse JSON
        const metadata = JSON.parse(
          await streamToString(metadataResponse.Body)
        );
        
        // Construct S3 URLs for product images
        const imageUrls = metadata.imageIds.map(imageId => 
          `https://product-catalog.s3.amazonaws.com/products/${productId}/images/${imageId}`
        );
        
        // Return in Elasticsearch format with enriched data
        return {
          _id: productId,
          _source: {
            // Fields from Typesense
            es_product_id: productId,
            es_name: hit.document.ts_name,
            es_description: hit.document.ts_description,
            es_price: hit.document.ts_price,
            
            // Fields from S3
            es_images: imageUrls,
            es_color_variants: metadata.colorVariants,
            es_specifications: metadata.specifications,
            es_warranty_info: metadata.warrantyInfo,
            
            // Additional fields
            es_image_count: imageUrls.length,
            es_last_updated: metadata.lastUpdated
          }
        };
      } catch (error) {
        console.warn(`Failed to fetch S3 data for product ${productId}:`, error);
        
        // Return basic mapping if S3 fetch fails
        return {
          _id: productId,
          _source: {
            es_product_id: productId,
            es_name: hit.document.ts_name,
            es_description: hit.document.ts_description,
            es_price: hit.document.ts_price,
            // Default values for missing fields
            es_images: [],
            es_image_count: 0
          }
        };
      }
    }));
    
    return enrichedResults;
  }
});

// Helper function to convert S3 stream to string
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}
```

These async mapping approaches let you maintain backward compatibility with systems expecting Elasticsearch format while leveraging Typesense's performance and simplicity for your search engine.

## Limitations

- Not all Elasticsearch query types are supported
- Function score modifiers are not supported in Typesense
- Some complex nested queries may not translate perfectly
- Typesense has different syntax and capabilities than Elasticsearch

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/alexberriman/elasticsearch-to-typesense.git
cd elasticsearch-to-typesense
```

2. Install dependencies:
```bash
npm install
```

3. Run tests:
```bash
# Run unit tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run integration tests (requires a running Typesense instance)
npm run test:integration

# Run a specific integration test (e.g., test query #2)
npm run test:integration:single --index=2
```

4. Build the package:
```bash
npm run build
```

### Release Process

This package uses [semantic-release](https://github.com/semantic-release/semantic-release) for versioning and releasing. Commits should follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat: add new feature` (triggers a minor release)
- `fix: fix a bug` (triggers a patch release)
- `docs: update documentation` (no release)
- `test: add tests` (no release)
- `chore: update build process` (no release)
- Breaking changes should include `BREAKING CHANGE:` in the commit body (triggers a major release)

## License

ISC