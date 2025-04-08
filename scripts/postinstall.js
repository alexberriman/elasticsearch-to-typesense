#!/usr/bin/env node

// This script will show a warning message when the package is installed
// It's designed to work in both ESM and CommonJS environments

try {
  const fs = require("fs");
  const path = require("path");

  const packageJsonPath = path.join(__dirname, "..", "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  const YELLOW = "\x1b[33m";
  const RED = "\x1b[31m";
  const RESET = "\x1b[0m";
  const BOLD = "\x1b[1m";

  // Only show the message in production dependencies, not when developing the package itself
  const isDevDependency =
    process.env.npm_config_save_dev === "true" ||
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test";

  // Don't show in CI environments
  const isCI =
    process.env.CI === "true" ||
    process.env.CONTINUOUS_INTEGRATION === "true" ||
    process.env.BUILD_NUMBER != null;

  if (!isDevDependency && !isCI) {
    console.log(`
${YELLOW}${BOLD}⚠️  WARNING: ${packageJson.name}@${packageJson.version} is under active development${RESET}
${YELLOW}This library is not yet ready for production use.${RESET}
${RED}Breaking changes may be introduced in minor and patch releases.${RESET}

${YELLOW}Please use with caution and report any issues to:${RESET}
${YELLOW}https://github.com/alexberriman/elasticsearch-to-typesense/issues${RESET}
`);
  }
} catch (error) {
  // Silently fail so we don't break npm install
  // This might happen during development or in environments with restricted permissions
}
