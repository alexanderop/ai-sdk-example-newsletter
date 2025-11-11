# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 4 application with an integrated Vue.js newsletter generator powered by the Anthropic Claude API. The project combines a standard Nuxt UI template with a CLI script that fetches Vue.js community content and generates weekly newsletters.

## Commands

### Development
```bash
pnpm dev              # Start development server on localhost:3000
pnpm build            # Build for production
pnpm preview          # Preview production build locally
pnpm typecheck        # Run TypeScript type checking
```

### Code Quality
```bash
pnpm lint             # Run ESLint (comprehensive)
pnpm lint:fast        # Run oxlint (fast linting)
pnpm lint:type-aware  # Run oxlint with type checking
```

### Testing
```bash
pnpm test             # Run Vitest tests once
pnpm test:watch       # Run tests in watch mode
pnpm test:ui          # Open Vitest UI
```

### Newsletter Generator
```bash
pnpm newsletter       # Generate weekly Vue.js newsletter
```

## Architecture

### Dual-Purpose Structure

The project has two distinct parts:

1. **Nuxt Web Application** (`/app`, `/pages`, `/components`)
   - Standard Nuxt 4 application using Nuxt UI
   - Pre-rendered homepage with template menu and logo components
   - Uses 1tbs brace style and no comma dangles per ESLint config

2. **Newsletter Generator** (`/scripts`)
   - Standalone TypeScript script executed via `tsx`
   - Uses Anthropic Claude API to generate newsletters
   - Fetches real data from GitHub API
   - Outputs markdown files to `/newsletters` directory

### Newsletter Generation Flow

The script in `scripts/generate-newsletter.ts` implements:
1. Environment validation (checks for `ANTHROPIC_API_KEY` in `.env`)
2. Parallel data fetching from GitHub API (Vue news + trending repos)
3. Claude API call with real data context to prevent hallucinations
4. Automatic retry with exponential backoff for transient failures
5. Token usage tracking and cost estimation
6. Content validation to ensure quality
7. File writing to `newsletters/YYYY-MM-DD-vue-weekly.md`

Key functions:
- `fetchVueNews()` - Gets recent Vue repositories from GitHub
- `fetchTrendingRepos()` - Gets trending Vue TypeScript repos
- `generateNewsletterWithRealData()` - Creates newsletter with real data
- `generateNewsletterToFile()` - Writes output to file
- `validateEnvironment()` - Checks API key configuration
- `retryWithBackoff()` - Implements exponential backoff retry logic
- `validateNewsletterContent()` - Validates newsletter structure and content

### Claude API Integration

The newsletter generator uses Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) with:
- **Prompt Caching**: System prompts are cached to reduce costs by ~90% on repeated runs
- **Retry Logic**: Automatic retry with exponential backoff (3 retries, starting at 1s delay)
- **Cost Monitoring**: Real-time token usage and cost tracking logged to console
- **Error Handling**: Graceful handling of API failures and rate limits

### Testing Architecture

Tests use **MSW (Mock Service Worker)** with **@msw/data** for HTTP mocking and data management:

**Core Components:**
- `tests/setup.ts` - Configures MSW server and collection lifecycle
- `tests/mocks/handlers.ts` - Thin query layer that fetches from collections
- `tests/collections/` - @msw/data collections for queryable test data
- `tests/fixtures/` - Seed functions for test scenarios (happy-path, partial-failure)
- `tests/utils/` - XML formatters for RSS/Atom feeds
- `schemas/` - Shared Zod schemas used by BOTH tests AND application code

**Collections-Based Approach:**
Instead of factory functions generating data on demand, tests use collections:
- Collections store test data in queryable, in-memory stores
- Tests explicitly seed collections before running
- MSW handlers query collections to return responses
- Collections are cleared after each test for isolation

**Example:**
```typescript
// Before (factory-based):
server.use(...happyPathScenario)

// After (collection-based):
await articles.createMany(10, (i) => ({ /* data */ }))
const items = await resource.fetch() // Queries collection via MSW
```

**Benefits:**
- Explicit test data - see exactly what each test uses
- Deterministic assertions - control data size and content
- Better debugging - query collections to inspect state
- Type safety - Zod schemas validate at runtime

The testing setup intercepts all HTTP requests during tests, ensuring:
- No actual API calls are made
- Tests run fast and deterministically
- API key validation works with test key `test-api-key-for-testing`

### Environment Variables

Required in `.env`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

The script validates:
- `.env` file exists
- API key is set
- API key is not a placeholder value

## TypeScript Configuration

The project uses Nuxt's generated TypeScript config (`.nuxt/tsconfig.*.json`). The root `tsconfig.json` only contains references to these generated configs.

## Package Manager

**Use pnpm only** - The project is locked to `pnpm@10.19.0` via `packageManager` field in `package.json`.

## Key Dependencies

- `@anthropic-ai/sdk` - Claude API client for newsletter generation
- `@nuxt/ui` - Nuxt UI component library
- `msw` - HTTP mocking for tests
- `@msw/data` - Data modeling and querying for tests
- `vitest` - Test runner with coverage via v8 provider
- `tsx` - TypeScript execution for scripts
- `zod` - Schema validation in tests AND application code (runtime validation)

## Shared Schemas

The project uses **shared Zod schemas** in `/schemas/` for both application and test code:
- Application adapters validate API responses at runtime with `.parse()`
- Test collections use the same schemas for type-safe test data
- Single source of truth prevents schema drift between tests and production
- Runtime validation catches API changes immediately with detailed error messages

**Error Handling:**
If an API response doesn't match the schema, adapters fail fast by:
1. Logging validation errors to console with `[resource-id]` prefix and detailed Zod issues
2. Throwing an error (`Resource validation failed for ${resource-id}`) to halt execution
3. Re-throwing network errors and unexpected exceptions

This fail-fast approach ensures invalid data never propagates into the newsletter generation pipeline.
