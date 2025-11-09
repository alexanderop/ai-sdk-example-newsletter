# GitHub Copilot Instructions

## Project Overview

Dual-purpose Nuxt 4 application combining:
1. **Nuxt UI web template** (`/app`, `/pages`, `/components`) - Standard Nuxt 4 with UI components
2. **CLI newsletter generator** (`/scripts/generate-newsletter.ts`) - Standalone script using Anthropic Claude API to generate Vue.js newsletters

## Development Commands

```bash
# Web app
pnpm dev              # Start dev server on :3000
pnpm build            # Production build
pnpm typecheck        # Type check entire project

# Newsletter script
pnpm newsletter       # Generate newsletter to newsletters/YYYY-MM-DD-vue-weekly.md

# Linting (dual setup)
pnpm lint             # ESLint (comprehensive)
pnpm lint:fast        # oxlint (fast, basic)
pnpm lint:type-aware  # oxlint with TypeScript type checking

# Testing
pnpm test             # Run Vitest once
pnpm test:watch       # Watch mode
pnpm test:ui          # Visual UI
```

## Critical Architecture Notes

### Newsletter Generation Flow

The script implements a production-grade LLM workflow:

1. **Environment validation** - Strict checks for `ANTHROPIC_API_KEY` in `.env` (see `validateEnvironment()`)
2. **Parallel data fetching** - GitHub API calls for Vue news + trending repos run concurrently
3. **Real data context** - Fetched data is injected into prompt to prevent hallucinations
4. **Prompt caching** - System prompts use `cache_control: { type: 'ephemeral' }` for ~90% cost reduction
5. **Retry with exponential backoff** - `retryWithBackoff()` handles transient failures (3 retries, 1s → 2s → 4s delays)
6. **Token usage tracking** - Real-time logging with cost estimates (Haiku 4.5 pricing)
7. **Content validation** - `validateNewsletterContent()` ensures no placeholders or missing sections

Key functions in `scripts/generate-newsletter.ts`:
- `fetchVueNews()` - Recent Vue repos from GitHub
- `fetchTrendingRepos()` - Top Vue TypeScript repos by stars
- `generateNewsletterWithRealData()` - Main orchestrator
- `retryWithBackoff()` - Exponential backoff for API calls

### Testing Architecture

Uses **MSW v2** for HTTP mocking at the network layer:

- `tests/setup.ts` - Configures MSW server, sets `ANTHROPIC_API_KEY=test-api-key-for-testing`
- `tests/mocks/handlers.ts` - Intercepts Claude API + external sources (GitHub, RSS feeds)
- `tests/factories/*.factory.ts` - Generate realistic mock data using `@faker-js/faker`
- `tests/schemas/*.schema.ts` - Zod schemas for runtime validation
- `tests/mocks/scenarios/` - Pre-configured test scenarios (`happy-path.ts`, `partial-failure.ts`)

**Important:** All HTTP requests are mocked during tests - no real API calls. The `test-api-key-for-testing` key passes validation but never hits real endpoints.

### Code Style Conventions

**ESLint configuration** (set in `nuxt.config.ts`):
- `braceStyle: '1tbs'` - One True Brace Style (opening brace on same line)
- `commaDangle: 'never'` - No trailing commas

**oxlint setup** (`.oxlintrc.json`):
- 40+ strict type-aware rules enabled
- Run with `pnpm lint:type-aware` for full TypeScript analysis
- Used alongside ESLint (not a replacement)

## Environment Setup

Required `.env` file:
```bash
ANTHROPIC_API_KEY=sk-ant-...  # Get from https://console.anthropic.com/
```

The script validates:
- `.env` exists
- API key is set
- API key is not a placeholder (`test-key`, `your_api_key_here`)

## Package Management

**Always use `pnpm`** - Project locked to `pnpm@10.19.0` via `packageManager` field in `package.json`.

## Key Dependencies

- `@anthropic-ai/sdk` v0.68+ - Claude API client for newsletter generation
- `@nuxt/ui` v4.1+ - Nuxt UI component library
- `tsx` v4.20+ - TypeScript execution for scripts (no compilation needed)
- `msw` v2.12+ - HTTP mocking for tests
- `vitest` v4+ - Test runner with v8 coverage
- `zod` v4.1+ - Schema validation in tests
- `oxlint` v1.26+ - Fast TypeScript-aware linter

## Common Patterns

### Adding New Newsletter Data Sources

1. Add fetch function to `generate-newsletter.ts`:
   ```typescript
   export async function fetchNewSource(): Promise<NewsItem[]> {
     const response = await fetch('https://api.example.com/data')
     // ... handle response
     return items
   }
   ```

2. Update MSW handlers in `tests/mocks/handlers.ts`:
   ```typescript
   http.get('https://api.example.com/data', () => {
     return HttpResponse.json(createMockData())
   })
   ```

3. Add to parallel fetch in `generateNewsletterWithRealData()`:
   ```typescript
   const [vueNews, trendingRepos, newSource] = await Promise.all([
     fetchVueNews(),
     fetchTrendingRepos(),
     fetchNewSource()  // Add here
   ])
   ```

### Testing with MSW Scenarios

Use pre-built scenarios for common conditions:

```typescript
import { happyPathScenario } from './mocks/scenarios/happy-path'

it('should handle success case', async () => {
  server.use(...happyPathScenario)  // Override default handlers
  const result = await generateNewsletter()
  expect(result).toContain('# Vue.js Weekly Newsletter')
})
```

Available scenarios:
- `happy-path.ts` - All sources return data
- `partial-failure.ts` - Some sources fail (503, timeouts)

### Prompt Caching Pattern

Reduce Claude API costs by 90% with prompt caching:

```typescript
const message = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  system: [
    {
      type: 'text',
      text: 'Long system prompt here...',
      cache_control: { type: 'ephemeral' }  // Cache this
    }
  ],
  messages: [{ role: 'user', content: 'Variable user input' }]
})
```

First call creates cache (pays cache write cost), subsequent calls within 5 minutes hit cache (90% cheaper).

## Directory Structure

```
app/              # Nuxt 4 web application
  components/     # Vue components (AppLogo, TemplateMenu)
  pages/          # Nuxt pages (index.vue)
  app.vue         # Root component

scripts/          # CLI newsletter generator
  generate-newsletter.ts  # Main script (500+ lines)

tests/            # Vitest + MSW testing
  mocks/          # MSW handlers + scenarios
  factories/      # Mock data generators
  schemas/        # Zod schemas

newsletters/      # Generated markdown files
docs/plans/       # Design documents
```

## Debugging Tips

1. **Newsletter script logging** - Verbose console output shows each step:
   - GitHub API calls with URLs
   - Claude API call details (endpoint, model, token usage)
   - Cost estimates in USD
   - File writing paths

2. **Test debugging** - Use Vitest UI:
   ```bash
   pnpm test:ui  # Opens browser UI with test results
   ```

3. **API key issues** - Script provides clear error messages for missing/invalid keys

4. **MSW debugging** - Set `onUnhandledRequest: 'warn'` in `tests/setup.ts` to see unhandled requests

## Cost Optimization

Current setup uses Claude Haiku 4.5:
- $1.00 per million input tokens
- $5.00 per million output tokens
- $1.25 per million cache write tokens
- $0.10 per million cache read tokens

Typical newsletter generation: **~$0.01-0.05** (with caching enabled)

## File Naming Conventions

- **Newsletter files**: `YYYY-MM-DD-vue-weekly.md` (e.g., `2025-11-09-vue-weekly.md`)
- **Test files**: `*.test.ts` in `tests/` directory
- **Factory files**: `*.factory.ts` in `tests/factories/`
- **Schema files**: `*.schema.ts` in `tests/schemas/`
