export const resolveNestedField = (
  fieldPath: string,
  doc: Record<string, any>
): any => {
  return fieldPath
    .split(".")
    .reduce(
      (obj, key) => (obj !== undefined && obj !== null ? obj[key] : undefined),
      doc
    );
};
