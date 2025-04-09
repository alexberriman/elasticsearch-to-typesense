import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";

const commonParserOptions = {
  ecmaVersion: 2020,
  sourceType: "module",
};

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "*.json",
      "eslint.config.js",
      "scripts/**",
      "*.md",
      "*.prettierrc",
      ".npmignore",
      ".gitignore",
      "vitest.config.ts",
      "test-type.ts",
      "vitest.integration.config.ts",
      "vitest.setup.ts",
    ],
  },
  {
    // Configuration for source files
    files: ["src/**/*.ts", "!src/**/*.test.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ...commonParserOptions,
        project: ["./tsconfig.json", "./tsconfig.test.json"],
        tsconfigRootDir: ".",
      },
      globals: {},
    },
    plugins: {
      "@typescript-eslint": typescript,
      prettier: prettier,
      import: importPlugin,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...prettier.configs.recommended.rules,
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Enable strict-boolean-expressions but leave other strict rules off for now
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      // Enforce .js extension for imports in ESM
      "import/extensions": ["error", "ignorePackages", { "ts": "never", "js": "always" }],
    },
  },
  {
    files: ["src/**/*.test.ts", "tests/**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ...commonParserOptions,
        project: ["./tsconfig.json", "./tsconfig.test.json"],
        tsconfigRootDir: ".",
      },
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        vi: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      prettier: prettier,
      import: importPlugin,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...prettier.configs.recommended.rules,
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Allow assertions and testing utilities
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
      // Keep strict type checking rules enabled for tests too
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
  prettierConfig,
];
