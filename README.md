# AI-Powered Vue.js Newsletter Generator

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![Quality Gate](https://github.com/alexanderopalic/ai-sdk-example-newsletter/workflows/Quality%20Gate/badge.svg)](https://github.com/alexanderopalic/ai-sdk-example-newsletter/actions/workflows/ci.yml)
[![PR Checks](https://github.com/alexanderopalic/ai-sdk-example-newsletter/workflows/PR%20Quality%20Checks/badge.svg)](https://github.com/alexanderopalic/ai-sdk-example-newsletter/actions/workflows/pr-checks.yml)

A Nuxt 4 application with an integrated Vue.js newsletter generator powered by the Anthropic Claude API. This project combines a standard Nuxt UI template with a CLI script that fetches real Vue.js community content from GitHub and generates weekly newsletters using AI.

## Features

- 🤖 **AI-Powered Content Generation** - Uses Claude Haiku 4.5 to create engaging newsletters
- 📊 **Real Data Sources** - Fetches actual Vue.js repositories and trending projects from GitHub API
- 💰 **Cost-Optimized** - Implements prompt caching to reduce API costs by ~90%
- 🔄 **Reliable** - Automatic retry with exponential backoff for transient failures
- ✅ **Well-Tested** - Comprehensive test suite using MSW for deterministic HTTP mocking
- 📈 **Token Tracking** - Real-time monitoring of API usage and cost estimation

## Prerequisites

- Node.js (latest LTS recommended)
- pnpm 10.19.0 (locked via `packageManager` field)
- Anthropic API key

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Configure your environment:

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

## Available Commands

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

## Newsletter Generator

### Quick Start

Generate a weekly Vue.js newsletter:

```bash
pnpm newsletter
```

This creates a file at `newsletters/YYYY-MM-DD-vue-weekly.md` with curated Vue.js content.

### How It Works

The newsletter generator (`scripts/generate-newsletter.ts`) follows this workflow:

1. **Environment Validation** - Verifies `.env` exists and `ANTHROPIC_API_KEY` is configured
2. **Data Collection** - Fetches real data from GitHub API in parallel:
   - Recent Vue.js repositories
   - Trending Vue/TypeScript projects
3. **AI Generation** - Sends collected data to Claude Haiku 4.5 with structured prompts
4. **Content Validation** - Ensures newsletter meets quality standards
5. **Output** - Saves formatted Markdown to `newsletters/` directory

### Key Features

- **Real Data, No Hallucinations** - Fetches actual GitHub data before AI generation
- **Prompt Caching** - System prompts are cached, reducing costs by ~90% on repeated runs
- **Retry Logic** - Exponential backoff (3 retries, 1s initial delay) handles transient API failures
- **Token Tracking** - Logs token usage and cost estimation for each run
- **Error Handling** - Graceful degradation for API failures and rate limits

### Testing

The project uses **MSW (Mock Service Worker)** for deterministic HTTP testing:

- `tests/setup.ts` - Configures MSW server globally
- `tests/mocks/handlers.ts` - Defines mock responses for Claude API, GitHub API
- `tests/factories/` - Test data factories using `@faker-js/faker`
- `tests/schemas/` - Zod schemas for response validation
- `tests/mocks/scenarios/` - Pre-configured test scenarios

All HTTP requests during tests are intercepted, ensuring:
- No actual API calls
- Fast, deterministic test execution
- API key validation works with test key

## Architecture

### Dual-Purpose Structure

The project contains two distinct components:

1. **Nuxt Web Application** (`/app`, `/pages`, `/components`)
   - Standard Nuxt 4 application using Nuxt UI
   - Pre-rendered homepage with template components
   - Uses 1tbs brace style and no comma dangles per ESLint config

2. **Newsletter Generator** (`/scripts`)
   - Standalone TypeScript script executed via `tsx`
   - Uses Anthropic Claude API for content generation
   - Fetches real data from GitHub API
   - Outputs markdown files to `/newsletters` directory

## Key Dependencies

- `@anthropic-ai/sdk` - Claude API client for newsletter generation
- `@nuxt/ui` - Nuxt UI component library
- `msw` - HTTP mocking for tests
- `vitest` - Test runner with v8 coverage provider
- `tsx` - TypeScript execution for scripts
- `zod` - Schema validation in tests

## Contributing

This project uses strict code quality standards:
- TypeScript for type safety
- ESLint with type-aware rules
- Vitest for comprehensive test coverage
- MSW for reliable HTTP mocking

Check out the [CLAUDE.md](./CLAUDE.md) file for detailed architecture documentation and development guidance.
