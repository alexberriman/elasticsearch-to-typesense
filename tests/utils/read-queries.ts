import queriesJson from "../es-queries.json";

interface Query {
  collection: string;
  query: string;
}

export function readQueries(): Query[] {
  return Object.keys(queriesJson).reduce(
    (queries, key) => [
      ...queries,
      ...[...queriesJson[key].map((query) => ({ collection: key, query }))],
    ],
    [] as Query[]
  );
}
