# Elastic to Typesense

A utility library for converting Elasticsearch queries to Typesense format.

⚠️ **WARNING: This library is under active development and not ready for production use.** ⚠️

This library is designed to translate Elasticsearch 6.8 queries to Typesense v28 format, helping you migrate your search functionality without rewriting all your queries.

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
  console.log('Warnings:', result.value.warnings);
  
  // Use the transformed query with Typesense client
  const typesenseClient = getTypesenseClient(); // Your Typesense client initialization
  const searchResults = await typesenseClient
    .collections('products')
    .documents()
    .search(result.value.query);
} else {
  console.error('Error:', result.error);
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

### Using with Typesense Schema

```typescript
import { createTransformer } from 'elasticsearch-to-typesense';

// Define your Typesense schema
const typesenseSchema = {
  fields: [
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'price', type: 'float' },
    { name: 'category_id', type: 'string' },
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

// Initialize the transformer with auto-mapping
// This will automatically generate propertyMapping based on the schemas
const transformer = createTransformer({
  typesenseSchema,  // Typesense schema definition
  elasticSchema,    // Elasticsearch schema definition
  autoMapProperties: true,  // Enable auto-mapping between schemas
  defaultScoreField: 'quality_score:desc'  // Default score field for results
  
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