import { typesenseClient } from "../config/typesense-client.js";

interface CreateCollectionOptions {
  name: string;
  schema: any;
}

export async function createCollection({
  name,
  schema,
}: CreateCollectionOptions) {
  try {
    await typesenseClient.collections(name).retrieve();
    await typesenseClient.collections(name).delete();
  } catch {}

  try {
    await typesenseClient.collections().create(schema);
  } catch (error) {
    console.error(`[${name}] ❌ Failed to create collection: ${error}`);
    throw error;
  }
}
