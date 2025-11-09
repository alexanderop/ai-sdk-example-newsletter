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

The newsletter generator uses Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) with:
- **Prompt Caching**: System prompts are cached to reduce costs by ~90% on repeated runs
- **Retry Logic**: Automatic retry with exponential backoff (3 retries, starting at 1s delay)
- **Cost Monitoring**: Real-time token usage and cost tracking logged to console
- **Error Handling**: Graceful handling of API failures and rate limits

### Testing Architecture

Tests use **MSW (Mock Service Worker)** for HTTP mocking:
- `tests/setup.ts` - Configures MSW server for all tests
- `tests/mocks/handlers.ts` - Defines mock responses for Claude API, GitHub API, RSS feeds
- `tests/factories/` - Test data factories using `@faker-js/faker`
- `tests/schemas/` - Zod schemas for validating API responses
- `tests/mocks/scenarios/` - Pre-configured test scenarios (happy-path, partial-failure)

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
- `vitest` - Test runner with coverage via v8 provider
- `tsx` - TypeScript execution for scripts
- `zod` - Schema validation in tests
