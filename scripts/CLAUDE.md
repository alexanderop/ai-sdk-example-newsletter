# Newsletter Generator Guidelines

This file provides guidance specific to the newsletter generator scripts in `/scripts`.

## Purpose

The newsletter generator fetches Vue.js community content from multiple sources and uses Claude API to create weekly newsletters. Output goes to `/newsletters/YYYY-MM-DD-vue-weekly.md`.

## Architecture

### Core Components

```
/scripts
├── core/
│   ├── resources/
│   │   ├── adapters/        # External API adapters (devto, github, hn, reddit, rss)
│   │   └── registry.ts      # Resource registry and orchestration
│   ├── newsletter/          # Newsletter generation logic
│   └── validation/          # Content validation
├── prompts/                 # Claude API prompts
├── config/                  # Configuration files
└── generate-newsletter.ts   # Main entry point
```

### Resource Adapters

Each external API has an adapter implementing the `Resource` interface:

**Required Methods:**
- `fetch()` - Fetches data from external API
- `transform()` - Transforms raw data to common format

**Adapter Responsibilities:**
1. **Validate API responses** using shared Zod schemas from `/schemas`
2. **Log validation errors** with `[resource-id]` prefix and detailed Zod issues
3. **Fail fast** - Throw on validation errors, don't return empty arrays
4. **Handle network errors** - Re-throw with context

**Example Pattern:**
```typescript
async fetch(): Promise<Article[]> {
  try {
    const response = await fetch(this.endpoint)
    const data = await response.json()

    // Validate with shared schema
    const validated = ArticleSchema.parse(data)
    return validated
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(`[${this.id}] API response validation failed:`, error.issues)
      throw new Error(`Resource validation failed for ${this.id}`)
    }
    throw error // Re-throw network errors
  }
}
```

## Development Guidelines

### Adding a New Resource Adapter

1. **Create schema** in `/schemas` (not in adapter file)
2. **Create adapter** in `scripts/core/resources/adapters/`
3. **Implement `Resource` interface** with `fetch()` and `transform()`
4. **Validate responses** using shared schema with `.parse()`
5. **Add to sources config** in `scripts/config/sources.json` with optional `priority` field:
   ```json
   {
     "id": "my-source",
     "kind": "rss",
     "url": "https://example.com/feed.rss",
     "tag": "My Source",
     "priority": 5,  // Optional: 1-5 (default=3)
     "limit": 10
   }
   ```
6. **Create test collection** in `tests/collections/` using the same schema
7. **Add MSW handler** in `tests/mocks/handlers.ts`
8. **Write tests** in `tests/` to verify integration

### Error Handling Rules

**Expected Errors (Use neverthrow Result):**
- Content validation failures
- Retryable API errors
- Rate limiting

**Unexpected Errors (Throw):**
- Schema validation failures (invalid API response)
- Network errors (no connection)
- Configuration errors (missing API keys)

### Claude API Integration

**Model Selection:**
- Use `claude-haiku-4-5-20251001` for cost efficiency
- Consider Sonnet for more complex analysis

**Prompt Caching:**
- System prompts are cached automatically
- Reduces costs by ~90% on repeated runs
- Cache persists for 5 minutes

**Retry Logic:**
- Use `retryWithBackoff()` utility for transient failures
- 3 retries with exponential backoff starting at 1s
- Don't retry validation errors (those are bugs)

**Cost Monitoring:**
- Log token usage after each API call
- Track input tokens (cached + uncached)
- Track output tokens
- Calculate cost estimate

### Newsletter Content Guidelines

**Structure:**
- Title with date
- Brief introduction
- Categorized sections (Articles, Projects, Discussions)
- Clear formatting with markdown

**Content Quality:**
- No hallucinations - only use provided data
- No placeholder content
- Verify all links are valid
- Check content length is substantial

**Priority System:**
- Sources can be assigned priority levels (1-5, default=3)
- Priority 5 (Critical): Always included first, regardless of score
- Priority 4 (High): Strong preference, included before lower priorities
- Priority 3 (Normal): Default behavior, sorted by score
- Priority 2 (Low): Included if space available after higher priorities
- Priority 1 (Minimal): Only included if very few other items
- Within each priority level, items are sorted by score (reactions, stars, etc.)
- Use priority to ensure featured developer blogs or important sources always appear

## Common Tasks

### Running the Newsletter Generator

```bash
# Ensure .env has ANTHROPIC_API_KEY set
pnpm newsletter
```

### Testing Resource Adapters

```bash
# Run all tests
pnpm test

# Watch mode for TDD
pnpm test:watch

# Test specific adapter
pnpm test tests/validation-errors.test.ts
```

### Debugging API Issues

1. **Check schema validation** - Look for `[resource-id]` logs
2. **Inspect raw response** - Add `console.log(data)` before `.parse()`
3. **Test with real API** - Use `scripts/test-devto-api.ts` pattern
4. **Update schema** - If API changed, update shared schema in `/schemas`

## Environment Variables

Required in `.env`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

**Validation:**
- Script checks `.env` file exists
- Verifies API key is set
- Rejects placeholder values

## Best Practices

### Schema Management

✅ **DO:**
- Define schemas in `/schemas` for reuse
- Use `.parse()` for strict validation
- Export schema types with `z.infer<typeof Schema>`

❌ **DON'T:**
- Duplicate schemas in adapter files
- Use `.safeParse()` and silently fail
- Skip validation for "trusted" APIs

### Resource Registry

✅ **DO:**
- Register all adapters in `registry.ts`
- Use parallel fetching with `Promise.all()`
- Handle individual adapter failures gracefully

❌ **DON'T:**
- Fetch resources sequentially (slow)
- Let one adapter failure kill the entire process
- Hard-code resource list in multiple places

### Prompts

✅ **DO:**
- Keep prompts in `/scripts/prompts` directory
- Use template literals for dynamic content
- Test prompts with real data before deploying

❌ **DON'T:**
- Hard-code prompts in main script
- Use vague instructions that allow hallucinations
- Skip testing prompt changes
