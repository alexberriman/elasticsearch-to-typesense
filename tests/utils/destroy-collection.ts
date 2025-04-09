import { typesenseClient } from "../config/typesense-client.js";

interface DestroyCollectionOptions {
  name: string;
}

export async function destroyCollection({ name }: DestroyCollectionOptions) {
  try {
    await typesenseClient.collections(name).delete();
  } catch (error) {
    console.error(`[${name}] ❌ Failed to delete collection: ${error}`);
  }
}
