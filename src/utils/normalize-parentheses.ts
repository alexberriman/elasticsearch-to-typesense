export const normalizeParentheses = (expression: string): string => {
  let normalized = expression.trim();

  while (normalized.startsWith("(") && normalized.endsWith(")")) {
    const inner = normalized.slice(1, -1);
    let depth = 0;
    let valid = true;

    for (const char of inner) {
      if (char === "(") depth++;
      else if (char === ")") {
        if (depth === 0) {
          valid = false;
          break;
        }
        depth--;
      }
    }

    if (valid && depth === 0) {
      normalized = inner.trim();
    } else {
      break;
    }
  }

  return normalized;
};
