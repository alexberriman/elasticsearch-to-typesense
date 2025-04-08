# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Elastic-to-typesense is a library for converting Elasticsearch 6.8 queries to Typesense v28 format. The library is under active development and designed to help migrate search functionality without rewriting queries.

## Project Structure
- `/src/core/` - Core transformer functionality and types
- `/src/transformers/` - Individual query type transformers (match, term, range, etc.)
- `/src/utils/` - Utility functions for transformation process
- `/tests/` - Integration tests (require a running Typesense instance)

## Commands
- Build: `npm run build` or `npm run build:clean` (for clean builds)
- Run unit tests: `npm run test`
- Run tests in watch mode: `npm run test:watch`
- Run integration tests: `npm run test:integration` (requires a running Typesense instance)
- Run linting: `npm run lint`
- Run linting on test files: `npm run lint:tests`
- Fix linting issues: `npm run lint:fix`
- Format code: `npm run format`
- Check formatting: `npm run format:check`
- Run all checks: `npm run check`

## Development Workflow
1. Write code in TypeScript following the code style guidelines
2. Add unit tests in corresponding `*.test.ts` files in the same directory
3. Run `npm run check` before committing to ensure all tests, linting, and formatting pass
4. Use proper commit message format for semantic-release (feat:, fix:, docs:, etc.)

## Package Publishing
- Automated via GitHub Actions and semantic-release
- Ensure NPM_TOKEN is configured in GitHub repository secrets
- Versioning is handled automatically based on conventional commit messages

## Code Style
- TypeScript with strict typing
- Use ES modules (`import`/`export`) and modern ES2022 features
- Name types with PascalCase, variables/functions with camelCase
- Prefer explicit return types for functions
- Use interfaces for complex objects; type aliases for simple ones
- Export types from central `types.ts` files
- Return `Result<T>` type objects for error handling (ok/error pattern)
- Use destructuring for cleaner code
- Document complex functions and interfaces
- Keep functions pure when possible; use immutable approaches

## Testing Strategy
- Unit tests: Test individual transformers and utilities
- Integration tests: Test against a real Typesense instance
- Mock dependencies for unit tests
- Follow the pattern of arrange/act/assert in test functions

## Key Concepts
- **Transformer**: The main entry point that orchestrates the transformation process
- **TransformerContext**: Contains mapping information and configuration
- **TransformResult**: Contains the transformed query and any warnings
- **Property Mapping**: Maps Elasticsearch field names to Typesense field names
- **Auto-mapping**: Automatically generates field mappings based on schema names