import Typesense from "typesense";

const TYPESENSE_API_KEY = "test123";
const TYPESENSE_HOST = "localhost";
const TYPESENSE_PORT = 8108;

export const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: TYPESENSE_HOST,
      port: TYPESENSE_PORT,
      protocol: "http",
    },
  ],
  apiKey: TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 10,
});
