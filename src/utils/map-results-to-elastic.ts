import { PropertyMapping } from "../core/types.js";

/**
 * Creates a default mapper function for converting Typesense results to Elasticsearch format
 * using an inverse property mapping (Typesense field names to Elasticsearch field names)
 *
 * @param propertyMapping - The property mapping from Elasticsearch to Typesense
 * @returns A function that maps Typesense documents to Elasticsearch format
 */
export const createDefaultMapper = (propertyMapping: PropertyMapping) => {
  // Create an inverse mapping (typesense -> elasticsearch)
  const inverseMapping: PropertyMapping = {};

  for (const [elasticField, typesenseField] of Object.entries(
    propertyMapping
  )) {
    inverseMapping[typesenseField] = elasticField;
  }

  /**
   * Maps a Typesense document to Elasticsearch format
   *
   * @param document - The Typesense document or array of documents to map
   * @returns The mapped Elasticsearch document or array of documents
   */
  return (document: any | any[]): any | any[] => {
    // Handle array of documents
    if (Array.isArray(document)) {
      return document.map((doc) => mapSingleDocument(doc, inverseMapping));
    }

    // Handle single document
    return mapSingleDocument(document, inverseMapping);
  };
};

/**
 * Maps a single Typesense document to Elasticsearch format
 *
 * @param doc - The Typesense document to map
 * @param inverseMapping - The mapping from Typesense field names to Elasticsearch field names
 * @returns The mapped Elasticsearch document
 */
const mapSingleDocument = (
  doc: Record<string, any>,
  inverseMapping: Record<string, string>
): Record<string, any> => {
  if (doc === null || doc === undefined || typeof doc !== "object") {
    return doc;
  }

  // Create a new document to store the mapped fields
  const mappedDoc: Record<string, any> = {};

  // Process each field in the Typesense document
  for (const [typesenseField, value] of Object.entries(doc)) {
    // Check if this field has a mapping
    const elasticField = inverseMapping[typesenseField] || typesenseField;

    // Map value recursively if it's an object or array (but not null)
    if (value !== null && typeof value === "object") {
      if (Array.isArray(value)) {
        // Map array elements recursively if they are objects
        mappedDoc[elasticField] = value.map((item) =>
          typeof item === "object" && item !== null
            ? mapSingleDocument(item, inverseMapping)
            : item
        );
      } else {
        // Map nested object recursively
        mappedDoc[elasticField] = mapSingleDocument(value, inverseMapping);
      }
    } else {
      // Direct value assignment
      mappedDoc[elasticField] = value;
    }
  }

  return mappedDoc;
};
