export const resolveNestedField = (
  fieldPath: string,
  doc: Record<string, any>
): any => {
  return fieldPath
    .split(".")
    .reduce((obj, key) => (obj ? obj[key] : undefined), doc);
};
