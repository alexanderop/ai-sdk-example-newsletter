# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered newsletter platform that uses Claude AI to generate automated, curated newsletters from multiple content sources (RSS feeds, Reddit, GitHub, Dev.to). The platform consists of:

1. **Newsletter Generation Scripts** (`scripts/`) - TypeScript-based content aggregation and AI generation
2. **Nuxt 4 Web Application** (`app/`) - Static site for displaying newsletters
3. **Configuration System** (`config/`) - User-editable JSON configs and prompt templates
4. **Automated Deployment** - GitHub Actions workflow for scheduled generation

## Essential Commands

### Development
```bash
pnpm install          # Install dependencies
pnpm dev              # Start Nuxt dev server (http://localhost:3000)
pnpm build            # Build static site for production
pnpm preview          # Preview production build
```

### Newsletter Generation
```bash
pnpm newsletter       # Generate newsletter (requires ANTHROPIC_API_KEY in .env)
```

This command:
- Fetches content from sources defined in `config/sources.json`
- Uses Claude AI to generate a curated newsletter
- Saves output to `content/newsletters/{date}-{slug}.md` with frontmatter

### Testing
```bash
# Unit tests (Vitest)
pnpm test             # Run tests once
pnpm test:watch       # Watch mode
pnpm test:ui          # UI mode
pnpm test -- path/to/test.ts  # Run specific test file

# E2E tests (Playwright)
pnpm e2e              # Run e2e tests
pnpm e2e:headed       # Run with browser visible
pnpm e2e:ui           # Interactive UI mode
pnpm e2e:debug        # Debug mode
```

### Linting & Type Checking
```bash
pnpm lint             # Run oxlint and eslint
pnpm lint:fix         # Auto-fix linting issues
pnpm typecheck        # Run TypeScript type checking
```

**Important**: TypeScript is configured with very strict settings including `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, and `noPropertyAccessFromIndexSignature`.

## Architecture Overview

### Newsletter Generation Pipeline

The newsletter generation follows a multi-stage pipeline architecture:

1. **Resource Registry System** (`scripts/core/resources/`)
   - `registry.ts` - Central registry that manages multiple content source adapters
   - `adapters/` - Source-specific implementations (Reddit, GitHub, RSS, Dev.to, Hacker News)
   - Each adapter implements the `Resource` interface and returns normalized `Item[]` data
   - Supports graceful degradation: if one source fails, others continue

2. **LLM Abstraction Layer** (`scripts/core/llm/`)
   - `LLMClient.ts` - Common interface for AI providers
   - `providers/anthropic.ts` and `providers/openai.ts` - Provider-specific implementations
   - Supports multiple models via environment variables (`LLM_PROVIDER`, `ANTHROPIC_MODEL`, `OPENAI_MODEL`)

3. **Newsletter Pipeline** (`scripts/pipelines/newsletter.ts`)
   - Orchestrates the full generation flow:
     1. Load configs from `config/` directory
     2. Collect items from all registered sources
     3. Group items by category (articles, repos, discussions, news)
     4. Apply priority-based filtering (priority 1-5)
     5. Format context data for AI
     6. Generate newsletter using Claude with system + user prompts
     7. Return markdown with usage statistics

4. **Configuration System** (`schemas/config.ts`, `scripts/utils/config-loader.ts`)
   - Zod schemas validate all configuration files
   - Three config files: `newsletter.json`, `sources.json`, `prompts/system.md`
   - Config loader provides centralized validation and error handling

### Frontend Architecture (Nuxt 4)

1. **Pages** (`app/pages/`)
   - `index.vue` - Homepage
   - `newsletters/index.vue` - Archive page listing all newsletters
   - `newsletters/[...slug].vue` - Individual newsletter view

2. **Content Collection** (`content.config.ts`)
   - Nuxt Content v3 with typed collections
   - Newsletters stored in `content/newsletters/` with frontmatter (title, date, description, author, tags)

3. **RSS Feed** (`server/routes/rss.xml.ts`)
   - Server route that generates RSS feed from newsletter collection
   - Uses `feed` package to generate valid RSS 2.0
   - Queries newsletters using Nuxt Content's `queryCollection` API

### Source Priority System

Sources use a priority-based filtering system (1-5):
- **5 (Critical)**: Always included first
- **4 (High)**: Strong preference
- **3 (Normal)**: Default
- **2 (Low)**: Included if space available
- **1 (Minimal)**: Only if very few other items

Within each priority level, items are sorted by engagement metrics (stars, reactions, upvotes, comments).

## Configuration Files

### `config/newsletter.json`
Main newsletter metadata (title, description, author, siteUrl, topic, slug, language)

### `config/sources.json`
Array of content sources, each with:
- `id` - Unique identifier
- `kind` - Type: `rss`, `atom`, `json`, `github`
- `url` - Source URL
- `tag` - Display name
- `limit` - Max items to fetch
- `priority` - Priority level (1-5)

### `config/prompts/system.md`
Claude system prompt that defines newsletter generation behavior. Use `{TOPIC}` placeholder for dynamic topic replacement.

## Testing Strategy

### Unit Tests (`tests/`)
- Configuration loading and validation (`config-loader.test.ts`, `config-schema.test.ts`)
- Newsletter pipeline logic (`newsletter.test.ts`)
- Priority sorting behavior (`priority-sorting.test.ts`)
- Error handling (`validation-errors.test.ts`, `api-key-validation.test.ts`)

**Coverage thresholds**: 60% lines, 60% functions, 58% branches

### E2E Tests (`tests/e2e/`)
- Playwright tests for user-facing functionality
- Base URL: `http://localhost:3000`
- Runs dev server automatically unless `SKIP_WEBSERVER=1`

## Important Patterns

### Environment Variables
```bash
# Required for newsletter generation
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...

# Optional
LLM_PROVIDER=anthropic  # or 'openai' (default: anthropic)
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
OPENAI_MODEL=gpt-4-turbo
```

### Adding New Content Sources

To add a new content source:

1. Create adapter in `scripts/core/resources/adapters/`
2. Implement `Resource` interface from `types.ts`
3. Register in `registry.ts` based on `kind` field
4. Add to `config/sources.json`

### Modifying Newsletter Format

1. Edit system prompt: `config/prompts/system.md`
2. Adjust context formatting in `scripts/pipelines/newsletter.ts` (`renderSections`)
3. Update frontmatter generation in `scripts/generate-newsletter.ts` (`save` function)

## GitHub Actions Workflow

`.github/workflows/generate-newsletter.yml` runs on schedule:
- Default: Every Monday at 9:00 AM UTC
- Can be triggered manually from Actions tab
- Requires `ANTHROPIC_API_KEY` secret in repository settings
- Automatically commits generated newsletters to `content/newsletters/`

## Deployment

Static site can be deployed to Vercel, Netlify, Cloudflare Pages:
- Build command: `pnpm build`
- Output directory: `.output/public`
- Prerendering enabled for `/` and `/rss.xml`
