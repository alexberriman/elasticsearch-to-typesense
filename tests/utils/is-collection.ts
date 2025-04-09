import { Collection } from "../types.js";

export function isCollection(collection: unknown): collection is Collection {
  return true;
}
