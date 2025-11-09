# Vue.js Newsletter Agent Design

**Date:** 2025-11-09
**Purpose:** Demonstrate Claude Agent SDK capabilities by building an automated Vue.js newsletter generator

## Overview

Build a standalone Node.js script that uses the Claude Agent SDK to generate a comprehensive weekly Vue.js newsletter. The agent will gather content from multiple sources (RSS feeds, Reddit, Hacker News) using parallel subagents, then synthesize the information into a well-structured Markdown newsletter.

## Architecture

### File Structure

```
scripts/
  generate-newsletter.ts          # Main orchestrator agent
  agents/
    rss-fetcher.md               # Subagent for RSS feeds
    reddit-researcher.md         # Subagent for Reddit
    hn-researcher.md             # Subagent for Hacker News

newsletters/
  YYYY-MM-DD-vue-weekly.md       # Generated newsletters

tests/
  # Test files
  newsletter.test.ts             # Integration tests
  setup.ts                       # MSW server setup + global config

  # Schemas (source of truth)
  schemas/
    claude-api.schema.ts         # Claude API response schemas
    claude-stream.schema.ts      # SSE event schemas
    rss-feed.schema.ts           # RSS XML schemas
    reddit.schema.ts             # Reddit API schemas
    hn.schema.ts                 # Hacker News API schemas
    newsletter.schema.ts         # Newsletter output schema

  # Factories (data generation)
  factories/
    claude-message.factory.ts    # Claude message factory
    claude-stream.factory.ts     # SSE stream factory
    rss-feed.factory.ts          # RSS feed factory
    reddit-feed.factory.ts       # Reddit feed factory
    hn-stories.factory.ts        # HN stories factory
    index.ts                     # Export all factories

  # MSW mocking
  mocks/
    handlers.ts                  # All MSW request handlers
    scenarios/                   # Pre-built test scenarios
      happy-path.ts              # All sources working
      partial-failure.ts         # Some sources failing
      empty-week.ts              # No content found
      rate-limited.ts            # API rate limit errors

  # Static fixtures (optional, for reference)
  fixtures/
    vue-blog-rss.xml            # Real RSS example
    reddit-response.json        # Real Reddit example

vitest.config.ts                # Vitest configuration
package.json                    # Updated dependencies
.env.example                    # Environment variable template
```

### Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "latest",
    "tsx": "latest",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@faker-js/faker": "^9.3.0",
    "msw": "^2.8.0",
    "vitest": "^2.1.8",
    "@vitest/ui": "^2.1.8"
  },
  "scripts": {
    "newsletter": "tsx scripts/generate-newsletter.ts",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Main Orchestrator Agent

### Configuration
- **Model:** Claude Haiku (most cost-effective for testing)
- **Tools:** File system access (Read, Write), subagent spawning
- **Role:** Vue.js Newsletter Curator

### System Prompt
The main agent acts as a Vue.js community newsletter curator responsible for:
- Gathering content from multiple sources
- Filtering and deduplicating content
- Organizing into clear sections (Official Updates, Ecosystem News, Community Highlights)
- Prioritizing quality over quantity
- Maintaining professional but friendly tone

### Orchestration Flow

1. Initialize main agent with Claude Haiku model
2. Calculate date range (last 7 days from current date)
3. Spawn 3 subagents in parallel:
   - RSS Fetcher subagent
   - Reddit Researcher subagent
   - HN Researcher subagent
4. Wait for all subagents to complete (2 minute timeout per subagent)
5. Collect and consolidate results from all subagents
6. Synthesize content into structured newsletter
7. Write Markdown file to `newsletters/YYYY-MM-DD-vue-weekly.md`

## Subagent Specifications

### Subagent 1: RSS Fetcher

**Purpose:** Fetch and parse RSS feeds from Vue.js ecosystem blogs

**Input:**
- List of RSS feed URLs:
  - https://blog.vuejs.org/feed.rss
  - https://nuxt.com/blog/rss.xml
  - https://vuetelescope.com/rss.xml
- Date range (7 days)

**Process:**
1. Use WebFetch tool to retrieve each RSS feed
2. Parse XML/RSS content
3. Filter for posts published in last 7 days
4. Extract: title, link, publication date, summary

**Output:**
```markdown
## RSS Feed Results
### Vue.js Official Blog
- [Title](link) - Date - Brief summary

### Nuxt Blog
- [Title](link) - Date - Brief summary
```

### Subagent 2: Reddit Researcher

**Purpose:** Find top Vue.js discussions from Reddit

**Input:**
- Subreddit: /r/vuejs
- Date range (7 days)
- Minimum upvotes: 10

**Process:**
1. Use WebFetch to access Reddit RSS: https://www.reddit.com/r/vuejs.rss
2. Filter posts from last 7 days
3. Filter by minimum upvote threshold
4. Extract: title, link, upvotes, comment count, author
5. Return top 5-10 discussions

**Output:**
Structured list of Reddit posts with metadata

### Subagent 3: Hacker News Researcher

**Purpose:** Find Vue-related stories from Hacker News

**Input:**
- Search query: "vue" OR "vuejs" OR "nuxt"
- Date range (7 days)
- Minimum points: 20

**Process:**
1. Use WebFetch to access HN Algolia API: http://hn.algolia.com/api/v1/search?query=vue&tags=story
2. Filter stories from last 7 days
3. Filter by minimum points threshold
4. Extract: title, link, points, comment count
5. Return top 5-10 stories

**Output:**
Structured list of HN stories with metadata

## Newsletter Output Format

### Template Structure

```markdown
# Vue.js Weekly Newsletter
## Week of [Start Date] - [End Date]

Generated on: [Timestamp]

---

## 🎯 Official Updates
[Content from RSS feeds - Vue.js official blog, major announcements]

## 📦 Ecosystem News
[Content from RSS feeds - Nuxt, Pinia, VueUse, other major libraries]

## 💬 Community Highlights

### Top Reddit Discussions
[Top posts from /r/vuejs with upvotes and links]

### Hacker News Stories
[Vue-related HN stories with points and links]

## 📚 Articles & Tutorials
[Blog posts and tutorials from RSS feeds]

---

*Generated using Claude Agent SDK | [Date]*
```

### Content Processing Rules

1. **Deduplication:** Remove same article appearing in multiple sources
2. **Prioritization:** Sort by relevance (upvotes, points, recency)
3. **Limits:** Top 5-10 items per section to keep newsletter concise
4. **Summaries:** Include 1-2 sentence summaries for each item
5. **Formatting:** Use emoji section headers for visual appeal

### File Naming

- Format: `YYYY-MM-DD-vue-weekly.md`
- Example: `2025-11-09-vue-weekly.md`
- Location: `newsletters/` directory

### Metadata

Each newsletter includes:
- Date range covered
- Generation timestamp
- Number of sources checked
- Total items found vs. items included

## Error Handling

### Subagent Failures

- Each subagent wraps work in try-catch
- If RSS fetch fails → log warning, continue with other feeds
- If Reddit/HN fails → note in newsletter that source was unavailable
- Main agent waits for all subagents with 2-minute timeout each

### Network Issues

- Agent SDK provides built-in retry logic
- WebFetch tool handles timeouts gracefully
- If all sources fail → generate newsletter with error message

### Data Validation

- Verify dates are within 7-day range
- Validate URLs before including
- Ensure minimum content threshold (at least 3 items total)
- If below threshold, note "quiet week" in newsletter

## Testing Strategy

### Test Framework & Architecture

- **Runner:** Vitest (v2.1.8+)
- **Mocking:** MSW (Mock Service Worker v2.8+)
- **Validation:** Zod schemas for type-safe data structures
- **Data Generation:** Faker.js for realistic mock data
- **Approach:** Schema-first TDD with integration tests

### Schema-First Testing with Zod

All API data structures are defined using Zod schemas that serve as the single source of truth. This provides type safety, runtime validation, and automatic TypeScript type generation.

**Benefits:**
- Validate mock responses match real API structure
- Catch breaking changes when APIs evolve
- Generate TypeScript types from schemas
- Ensure test data is always valid

**Example Schema:**
```typescript
// tests/schemas/claude-api.schema.ts
import { z } from 'zod'

export const ClaudeMessageSchema = z.object({
  id: z.string(),
  type: z.literal('message'),
  role: z.enum(['assistant']),
  content: z.array(z.object({
    type: z.literal('text'),
    text: z.string()
  })),
  model: z.string(),
  stop_reason: z.enum(['end_turn', 'max_tokens', 'stop_sequence']),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number()
  })
})

export type ClaudeMessage = z.infer<typeof ClaudeMessageSchema>
```

**Schema Coverage:**
- `claude-api.schema.ts` - Claude API Messages endpoint responses
- `claude-stream.schema.ts` - Server-Sent Events (SSE) streaming format
- `rss-feed.schema.ts` - RSS 2.0 feed structure
- `reddit.schema.ts` - Reddit RSS feed format
- `hn.schema.ts` - Hacker News Algolia API responses
- `newsletter.schema.ts` - Generated newsletter structure

### Factory Pattern with Faker.js

Factories combine Zod schemas with Faker.js to generate realistic, valid mock data. Each factory provides sensible defaults but allows overrides for specific test cases.

**Factory Architecture:**
```typescript
// tests/factories/claude-message.factory.ts
import { faker } from '@faker-js/faker'
import { ClaudeMessageSchema, type ClaudeMessage } from '../schemas/claude-api.schema'

export function createClaudeMessage(overrides?: Partial<ClaudeMessage>): ClaudeMessage {
  const message = {
    id: overrides?.id ?? `msg_${faker.string.alphanumeric(29)}`,
    type: 'message' as const,
    role: 'assistant' as const,
    content: overrides?.content ?? [{
      type: 'text' as const,
      text: overrides?.content?.[0]?.text ?? faker.lorem.paragraphs(2)
    }],
    model: overrides?.model ?? 'claude-3-5-haiku-20241022',
    stop_reason: overrides?.stop_reason ?? 'end_turn' as const,
    usage: {
      input_tokens: overrides?.usage?.input_tokens ?? faker.number.int({ min: 50, max: 500 }),
      output_tokens: overrides?.usage?.output_tokens ?? faker.number.int({ min: 100, max: 1000 })
    }
  }

  // Validate the generated data matches schema
  return ClaudeMessageSchema.parse(message)
}
```

**Factory Benefits:**
- **Realistic data:** Faker generates varied, realistic content
- **Flexible:** Override any field for specific test scenarios
- **Validated:** Zod ensures every factory output is valid
- **Deterministic option:** Seed Faker for reproducible tests

**Advanced Factory Patterns:**

1. **Builder Pattern:**
```typescript
const feed = new RSSFeedBuilder()
  .withTitle('Nuxt Blog')
  .withItem({ title: 'Nuxt 4 Released', pubDate: new Date('2025-11-08') })
  .withRandomItems(3)
  .withOldItems(2)  // Should be filtered out
  .buildXML()
```

2. **Preset Variations:**
```typescript
export const ClaudeMessagePresets = {
  newsletterSynthesis: () => createClaudeMessage({
    content: [{ type: 'text', text: '# Vue.js Weekly Newsletter\n...' }]
  }),
  rssSubagent: (items = 3) => createClaudeMessage({
    content: [{ type: 'text', text: `## RSS Results\n...` }]
  }),
  apiError: (errorMsg: string) => createClaudeMessage({
    content: [{ type: 'text', text: `## Error\n${errorMsg}` }]
  })
}
```

3. **Seeded/Deterministic Data:**
```typescript
export function withSeed<T>(seed: number, fn: () => T): T {
  faker.seed(seed)
  const result = fn()
  faker.seed() // Reset to random
  return result
}

// Usage for snapshot testing
const message = withSeed(12345, () => ClaudeMessagePresets.newsletterSynthesis())
expect(message).toMatchSnapshot()
```

### MSW Integration - Mocking LLM Responses

MSW intercepts HTTP requests to the Anthropic API (`https://api.anthropic.com/v1/messages`) and returns mock responses. This approach mocks at the HTTP layer rather than the SDK layer, making tests more realistic and future-proof.

**Key Benefits:**
- **Fast:** No API calls, instant responses
- **Deterministic:** Predictable outputs for consistent testing
- **Cost-effective:** Zero API costs during development/CI
- **Offline:** Develop and test without internet connectivity
- **Realistic:** Tests the full integration path including request formatting

**Handler Architecture:**
```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import { createClaudeMessage } from '../factories/claude-message.factory'
import { createRSSFeed } from '../factories/rss-feed.factory'

export const handlers = [
  // Claude API endpoint - conditional responses based on request
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = await request.json()
    const systemPrompt = body.system || ''

    if (systemPrompt.includes('RSS Fetcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: '## RSS Feed Results\n### Vue.js Official Blog\n- [Vue 3.5](https://blog.vuejs.org/posts/vue-3-5)'
        }]
      }))
    }

    if (systemPrompt.includes('Reddit Researcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: '## Reddit Discussions\n- [Composition API best practices](https://reddit.com/...) - 45 upvotes'
        }]
      }))
    }

    // Default newsletter synthesis response
    return HttpResponse.json(createClaudeMessage())
  }),

  // External data sources
  http.get('https://blog.vuejs.org/feed.rss', () =>
    HttpResponse.xml(createRSSFeed())
  ),

  http.get('https://www.reddit.com/r/vuejs.rss', () =>
    HttpResponse.xml(createRedditFeed())
  ),

  http.get('http://hn.algolia.com/api/v1/search', () =>
    HttpResponse.json(createHNResponse())
  )
]
```

**Test Setup:**
```typescript
// tests/setup.ts
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

export const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Streaming Response Mocking

When the Claude API receives `stream: true`, it returns Server-Sent Events (SSE) instead of a single JSON response. MSW can mock this streaming behavior for realistic tests.

**SSE Event Schema:**
```typescript
// tests/schemas/claude-stream.schema.ts
export const StreamEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('message_start'),
    message: z.object({
      id: z.string(),
      type: z.literal('message'),
      role: z.literal('assistant'),
      model: z.string()
    })
  }),
  z.object({
    type: z.literal('content_block_delta'),
    delta: z.object({
      type: z.literal('text_delta'),
      text: z.string()
    }),
    index: z.number()
  }),
  z.object({
    type: z.literal('message_delta'),
    delta: z.object({
      stop_reason: z.enum(['end_turn', 'max_tokens'])
    }),
    usage: z.object({
      output_tokens: z.number()
    })
  })
])
```

**Streaming Factory:**
```typescript
// tests/factories/claude-stream.factory.ts
export function createStreamingResponse(text: string) {
  const chunks = text.match(/.{1,20}/g) || [text]

  return [
    {
      type: 'message_start',
      message: {
        id: `msg_${faker.string.alphanumeric(29)}`,
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-haiku-20241022'
      }
    },
    ...chunks.map((chunk) => ({
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: chunk },
      index: 0
    })),
    {
      type: 'message_delta',
      delta: { stop_reason: 'end_turn' },
      usage: { output_tokens: chunks.length * 5 }
    }
  ]
}
```

**MSW Streaming Handler:**
```typescript
http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
  const body = await request.json()

  if (body.stream) {
    const events = createStreamingResponse('# Vue.js Weekly Newsletter\n...')
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        for (const event of events) {
          controller.enqueue(encoder.encode(`event: ${event.type}\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        }
        controller.close()
      }
    })

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  }

  return HttpResponse.json(createClaudeMessage())
})
```

### Test Scenarios Pattern

Test scenarios are pre-configured sets of MSW handlers that simulate specific real-world conditions. This makes tests more readable and reusable.

**Happy Path Scenario:**
```typescript
// tests/mocks/scenarios/happy-path.ts
export const happyPathScenario = [
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    // All subagents return successful responses
    const body = await request.json()
    const systemPrompt = body.system || ''

    if (systemPrompt.includes('RSS Fetcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{ type: 'text', text: '## RSS Results\n- [Vue 3.5]...' }]
      }))
    }

    return HttpResponse.json(createClaudeMessage())
  }),

  http.get('https://blog.vuejs.org/feed.rss', () =>
    HttpResponse.xml(createRSSFeed({ itemCount: 3 }))
  ),

  http.get('https://www.reddit.com/r/vuejs.rss', () =>
    HttpResponse.xml(createRedditFeed({ itemCount: 5 }))
  ),

  http.get('http://hn.algolia.com/api/v1/search', () =>
    HttpResponse.json(createHNResponse({ hitCount: 4 }))
  )
]
```

**Partial Failure Scenario:**
```typescript
// tests/mocks/scenarios/partial-failure.ts
export const partialFailureScenario = [
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = await request.json()
    const systemPrompt = body.system || ''

    if (systemPrompt.includes('Reddit Researcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: '## Error\nReddit API returned 503 - Service Unavailable'
        }]
      }))
    }

    return HttpResponse.json(createClaudeMessage())
  }),

  http.get('https://blog.vuejs.org/feed.rss', () =>
    HttpResponse.xml(createRSSFeed())
  ),

  http.get('https://www.reddit.com/r/vuejs.rss', () =>
    HttpResponse.json({ error: 'Service Unavailable' }, { status: 503 })
  ),

  http.get('http://hn.algolia.com/api/v1/search', () =>
    HttpResponse.json(createHNResponse())
  )
]
```

**Using Scenarios in Tests:**
```typescript
// tests/newsletter.test.ts
import { describe, it, expect } from 'vitest'
import { server } from './setup'
import { happyPathScenario } from './mocks/scenarios/happy-path'
import { partialFailureScenario } from './mocks/scenarios/partial-failure'
import { generateNewsletter } from '../scripts/generate-newsletter'

describe('Newsletter Generation', () => {
  it('generates complete newsletter when all sources work', async () => {
    server.use(...happyPathScenario)

    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
    expect(result).toContain('## 🎯 Official Updates')
    expect(result).toContain('## 💬 Community Highlights')
  })

  it('handles partial failures gracefully', async () => {
    server.use(...partialFailureScenario)

    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
    expect(result).toContain('Reddit unavailable')
  })
})
```

### Test Cases

**1. Happy Path:**
- All sources (RSS, Reddit, HN) return valid data
- Claude API returns properly formatted responses for all subagents
- Newsletter generated with all sections populated
- File written to `newsletters/` directory
- Content properly formatted as Markdown
- All items within 7-day date range

**2. Partial Failures:**
- RSS feed returns 404 → Newsletter generated with other sources
- Reddit unavailable (503) → Newsletter notes Reddit unavailable
- HN times out → Newsletter continues with RSS + Reddit
- One subagent fails → Main agent continues with remaining data

**3. Data Validation:**
- Filters out posts older than 7 days
- Removes duplicate entries across sources
- Handles empty responses gracefully
- Validates all URLs before including
- Ensures minimum content threshold (at least 3 items)

**4. Edge Cases:**
- No content in date range → "quiet week" message
- Malformed RSS XML → Log error, skip that feed
- Invalid URLs → Filter them out
- All sources fail → Generate newsletter with error message

**5. LLM-Specific Tests:**
- Claude API returns `max_tokens` stop reason → Handle gracefully
- Streaming responses work correctly
- Token usage tracked accurately
- Different models return expected formats

**6. Streaming Tests:**
- SSE events arrive in correct order
- Content chunks reassemble correctly
- Stream termination handled properly
- Network interruptions handled gracefully

### Mock Endpoints

All HTTP endpoints are mocked using MSW:

**Claude API:**
- `POST https://api.anthropic.com/v1/messages` → Mock LLM responses (both regular and streaming)

**External Data Sources:**
- `GET https://blog.vuejs.org/feed.rss` → Mock RSS XML
- `GET https://nuxt.com/blog/rss.xml` → Mock RSS XML
- `GET https://www.reddit.com/r/vuejs.rss` → Mock RSS XML
- `GET http://hn.algolia.com/api/v1/search*` → Mock JSON responses

### TDD Workflow

```bash
# 1. Write failing test with scenario
pnpm test

# 2. Implement feature
# Edit generate-newsletter.ts or agent files

# 3. Run tests until passing
pnpm test

# 4. Refactor and clean up
# Factories and schemas ensure data stays valid

# 5. Optional: Watch mode for rapid iteration
pnpm test:watch

# 6. Optional: Visual UI for debugging
pnpm test:ui

# 7. Optional: Validate with real API (integration test)
REAL_API=true pnpm run newsletter
```

### Testing Best Practices

1. **Schema-First:** Define schemas before writing tests or implementation
2. **Factory Defaults:** Use sensible defaults, override only what matters for the test
3. **Scenario Reuse:** Create scenarios for common test conditions
4. **Deterministic Tests:** Use seeded Faker for snapshot tests
5. **Validate Mocks:** All factory output is validated against schemas
6. **Separation of Concerns:** Schemas, factories, and scenarios in separate files
7. **Test Real Integration:** Occasional manual runs against real APIs to validate mocks

## Environment Setup

### Required Environment Variables

```bash
# .env
ANTHROPIC_API_KEY=your_api_key_here
```

### .env.example Template

```bash
# Claude API Key (get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-...
```

## Cost Estimation

Using Claude Haiku model:
- Input: ~$0.25 per million tokens
- Output: ~$1.25 per million tokens
- Estimated cost per newsletter generation: **< $0.10**
- Main agent + 3 subagents should use ~50-100k tokens total

## Success Criteria

The implementation is successful when:

1. ✅ Script runs via `pnpm run newsletter`
2. ✅ Generates Markdown file in newsletters/ directory
3. ✅ Newsletter includes content from all 3 sources
4. ✅ Content is filtered to last 7 days
5. ✅ No duplicate entries
6. ✅ Well-formatted Markdown with sections
7. ✅ All tests pass with MSW mocks
8. ✅ Error handling works for partial failures
9. ✅ Total cost per run < $0.10

## Future Enhancements

- Email delivery via SMTP
- HTML email template generation
- Scheduled runs via GitHub Actions
- Web UI to browse past newsletters
- Customizable content sources
- Multi-language support
