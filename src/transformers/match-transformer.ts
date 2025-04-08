export type ElasticsearchMatchQuery = {
  match: {
    [field: string]: string | number;
  };
};

export type TypesenseFilterBy = string;

export const transformMatchQuery = (
  query: ElasticsearchMatchQuery
): TypesenseFilterBy => {
  const [[field, value]] = Object.entries(query.match);
  return `${field}:=${value}`;
};
