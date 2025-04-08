# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Build: `npm run build`
- Run tests: `npm run test`
- Run single test: `npx vitest path/to/test.ts -t "test description"`

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