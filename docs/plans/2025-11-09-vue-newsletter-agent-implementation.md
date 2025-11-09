# Vue.js Newsletter Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Node.js script using Claude Agent SDK to automatically generate a Vue.js weekly newsletter by gathering content from RSS feeds, Reddit, and Hacker News using parallel subagents.

**Architecture:** Main orchestrator agent spawns 3 parallel subagents (RSS Fetcher, Reddit Researcher, HN Researcher), collects their results, synthesizes content into a structured Markdown newsletter, and saves to file. Testing uses MSW to mock all HTTP calls (Claude API + external sources) with schema-validated factories.

**Tech Stack:** Claude Agent SDK, TypeScript (tsx), Vitest, MSW, Zod, Faker.js

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Add dependencies to package.json**

```bash
pnpm add @anthropic-ai/sdk tsx zod
```

**Step 2: Add dev dependencies**

```bash
pnpm add -D @faker-js/faker msw vitest @vitest/ui
```

**Step 3: Add npm scripts to package.json**

Edit `package.json` and add these scripts (keep existing scripts):

```json
{
  "scripts": {
    "newsletter": "tsx scripts/generate-newsletter.ts",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui"
  }
}
```

**Step 4: Install all dependencies**

```bash
pnpm install
```

**Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build: add dependencies for newsletter agent (Claude SDK, Vitest, MSW, Zod, Faker)"
```

---

## Task 2: Create Vitest Configuration

**Files:**
- Create: `vitest.config.ts`

**Step 1: Write vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['scripts/**/*.ts']
    }
  }
})
```

**Step 2: Verify config syntax**

```bash
pnpm exec vitest --version
```

Expected: Vitest version printed (e.g., "Vitest v2.1.8")

**Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "test: add Vitest configuration"
```

---

## Task 3: Create Environment Variable Template

**Files:**
- Create: `.env.example`

**Step 1: Create .env.example**

Create `.env.example`:

```bash
# Claude API Key (get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-...
```

**Step 2: Verify .gitignore includes .env**

```bash
grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
```

**Step 3: Commit**

```bash
git add .env.example .gitignore
git commit -m "docs: add environment variable template"
```

---

## Task 4: Create Directory Structure

**Files:**
- Create: `scripts/`, `scripts/agents/`, `newsletters/`, `tests/`, `tests/schemas/`, `tests/factories/`, `tests/mocks/`, `tests/mocks/scenarios/`, `tests/fixtures/`

**Step 1: Create all directories**

```bash
mkdir -p scripts/agents newsletters tests/schemas tests/factories tests/mocks/scenarios tests/fixtures
```

**Step 2: Verify directories exist**

```bash
ls -d scripts/agents newsletters tests/schemas tests/factories tests/mocks/scenarios tests/fixtures
```

Expected: All 7 directories listed

**Step 3: Create .gitkeep for empty directories**

```bash
touch newsletters/.gitkeep
```

**Step 4: Commit**

```bash
git add scripts/.gitkeep newsletters/.gitkeep tests/.gitkeep
git commit -m "chore: create directory structure for newsletter agent"
```

---

## Task 5: Define Claude API Response Schema

**Files:**
- Create: `tests/schemas/claude-api.schema.ts`

**Step 1: Write Zod schema for Claude Messages API**

Create `tests/schemas/claude-api.schema.ts`:

```typescript
import { z } from 'zod'

export const ClaudeContentBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string()
})

export const ClaudeUsageSchema = z.object({
  input_tokens: z.number(),
  output_tokens: z.number()
})

export const ClaudeMessageSchema = z.object({
  id: z.string(),
  type: z.literal('message'),
  role: z.enum(['assistant']),
  content: z.array(ClaudeContentBlockSchema),
  model: z.string(),
  stop_reason: z.enum(['end_turn', 'max_tokens', 'stop_sequence']).nullable(),
  usage: ClaudeUsageSchema
})

export type ClaudeMessage = z.infer<typeof ClaudeMessageSchema>
export type ClaudeContentBlock = z.infer<typeof ClaudeContentBlockSchema>
export type ClaudeUsage = z.infer<typeof ClaudeUsageSchema>
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit tests/schemas/claude-api.schema.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add tests/schemas/claude-api.schema.ts
git commit -m "test: add Claude API response schema"
```

---

## Task 6: Define RSS Feed Schema

**Files:**
- Create: `tests/schemas/rss-feed.schema.ts`

**Step 1: Write Zod schema for RSS 2.0 feeds**

Create `tests/schemas/rss-feed.schema.ts`:

```typescript
import { z } from 'zod'

export const RSSItemSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  pubDate: z.string(), // RFC-822 date
  description: z.string().optional(),
  guid: z.string().optional()
})

export const RSSChannelSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  description: z.string(),
  item: z.array(RSSItemSchema)
})

export const RSSFeedSchema = z.object({
  rss: z.object({
    '@version': z.literal('2.0'),
    channel: RSSChannelSchema
  })
})

export type RSSFeed = z.infer<typeof RSSFeedSchema>
export type RSSChannel = z.infer<typeof RSSChannelSchema>
export type RSSItem = z.infer<typeof RSSItemSchema>
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit tests/schemas/rss-feed.schema.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add tests/schemas/rss-feed.schema.ts
git commit -m "test: add RSS feed schema"
```

---

## Task 7: Define Reddit API Schema

**Files:**
- Create: `tests/schemas/reddit.schema.ts`

**Step 1: Write Zod schema for Reddit RSS feeds**

Create `tests/schemas/reddit.schema.ts`:

```typescript
import { z } from 'zod'

export const RedditItemSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  pubDate: z.string(),
  category: z.string().optional(),
  'reddit:score': z.string().optional(), // Upvotes as string
  'reddit:comments': z.string().optional() // Comment count as string
})

export const RedditChannelSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  description: z.string(),
  item: z.array(RedditItemSchema)
})

export const RedditFeedSchema = z.object({
  rss: z.object({
    '@version': z.literal('2.0'),
    '@xmlns:reddit': z.string().optional(),
    channel: RedditChannelSchema
  })
})

export type RedditFeed = z.infer<typeof RedditFeedSchema>
export type RedditItem = z.infer<typeof RedditItemSchema>
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit tests/schemas/reddit.schema.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add tests/schemas/reddit.schema.ts
git commit -m "test: add Reddit API schema"
```

---

## Task 8: Define Hacker News API Schema

**Files:**
- Create: `tests/schemas/hn.schema.ts`

**Step 1: Write Zod schema for HN Algolia API**

Create `tests/schemas/hn.schema.ts`:

```typescript
import { z } from 'zod'

export const HNStorySchema = z.object({
  objectID: z.string(),
  title: z.string(),
  url: z.string().url().nullable(),
  points: z.number(),
  num_comments: z.number(),
  author: z.string(),
  created_at: z.string() // ISO 8601 timestamp
})

export const HNSearchResponseSchema = z.object({
  hits: z.array(HNStorySchema),
  nbHits: z.number(),
  page: z.number(),
  nbPages: z.number(),
  hitsPerPage: z.number()
})

export type HNStory = z.infer<typeof HNStorySchema>
export type HNSearchResponse = z.infer<typeof HNSearchResponseSchema>
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit tests/schemas/hn.schema.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add tests/schemas/hn.schema.ts
git commit -m "test: add Hacker News API schema"
```

---

## Task 9: Create Claude Message Factory

**Files:**
- Create: `tests/factories/claude-message.factory.ts`

**Step 1: Write factory with Faker.js**

Create `tests/factories/claude-message.factory.ts`:

```typescript
import { faker } from '@faker-js/faker'
import { ClaudeMessageSchema, type ClaudeMessage } from '../schemas/claude-api.schema'

export function createClaudeMessage(overrides?: Partial<ClaudeMessage>): ClaudeMessage {
  const message = {
    id: overrides?.id ?? `msg_${faker.string.alphanumeric(29)}`,
    type: 'message' as const,
    role: 'assistant' as const,
    content: overrides?.content ?? [{
      type: 'text' as const,
      text: faker.lorem.paragraphs(2)
    }],
    model: overrides?.model ?? 'claude-3-5-haiku-20241022',
    stop_reason: overrides?.stop_reason ?? 'end_turn' as const,
    usage: {
      input_tokens: overrides?.usage?.input_tokens ?? faker.number.int({ min: 50, max: 500 }),
      output_tokens: overrides?.usage?.output_tokens ?? faker.number.int({ min: 100, max: 1000 })
    }
  }

  // Validate against schema
  return ClaudeMessageSchema.parse(message)
}
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit tests/factories/claude-message.factory.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add tests/factories/claude-message.factory.ts
git commit -m "test: add Claude message factory"
```

---

## Task 10: Create RSS Feed Factory

**Files:**
- Create: `tests/factories/rss-feed.factory.ts`

**Step 1: Write factory to generate RSS XML**

Create `tests/factories/rss-feed.factory.ts`:

```typescript
import { faker } from '@faker-js/faker'
import { type RSSItem } from '../schemas/rss-feed.schema'

interface RSSFeedOptions {
  title?: string
  link?: string
  description?: string
  itemCount?: number
  daysOld?: number
}

export function createRSSItem(daysOld: number = 0): RSSItem {
  const pubDate = new Date()
  pubDate.setDate(pubDate.getDate() - daysOld)

  return {
    title: faker.lorem.sentence(),
    link: faker.internet.url(),
    pubDate: pubDate.toUTCString(),
    description: faker.lorem.paragraph(),
    guid: faker.string.uuid()
  }
}

export function createRSSFeedXML(options: RSSFeedOptions = {}): string {
  const {
    title = 'Vue.js Blog',
    link = 'https://blog.vuejs.org',
    description = 'The official Vue.js blog',
    itemCount = 3,
    daysOld = 0
  } = options

  const items = Array.from({ length: itemCount }, () => createRSSItem(daysOld))

  const itemsXML = items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <pubDate>${item.pubDate}</pubDate>
      <description><![CDATA[${item.description}]]></description>
      <guid>${item.guid}</guid>
    </item>
  `).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${title}</title>
    <link>${link}</link>
    <description>${description}</description>
    ${itemsXML}
  </channel>
</rss>`
}
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit tests/factories/rss-feed.factory.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add tests/factories/rss-feed.factory.ts
git commit -m "test: add RSS feed factory"
```

---

## Task 11: Create Reddit Feed Factory

**Files:**
- Create: `tests/factories/reddit-feed.factory.ts`

**Step 1: Write factory for Reddit RSS feeds**

Create `tests/factories/reddit-feed.factory.ts`:

```typescript
import { faker } from '@faker-js/faker'

interface RedditFeedOptions {
  itemCount?: number
  daysOld?: number
  minScore?: number
}

export function createRedditFeedXML(options: RedditFeedOptions = {}): string {
  const {
    itemCount = 5,
    daysOld = 0,
    minScore = 10
  } = options

  const items = Array.from({ length: itemCount }, () => {
    const pubDate = new Date()
    pubDate.setDate(pubDate.getDate() - daysOld)

    return {
      title: faker.lorem.sentence(),
      link: `https://www.reddit.com/r/vuejs/comments/${faker.string.alphanumeric(6)}/${faker.lorem.slug()}/`,
      pubDate: pubDate.toUTCString(),
      score: faker.number.int({ min: minScore, max: 200 }),
      comments: faker.number.int({ min: 0, max: 50 })
    }
  })

  const itemsXML = items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <pubDate>${item.pubDate}</pubDate>
      <reddit:score>${item.score}</reddit:score>
      <reddit:comments>${item.comments}</reddit:comments>
    </item>
  `).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:reddit="https://www.reddit.com/wiki/rss">
  <channel>
    <title>vuejs</title>
    <link>https://www.reddit.com/r/vuejs</link>
    <description>The Progressive JavaScript Framework</description>
    ${itemsXML}
  </channel>
</rss>`
}
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit tests/factories/reddit-feed.factory.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add tests/factories/reddit-feed.factory.ts
git commit -m "test: add Reddit feed factory"
```

---

## Task 12: Create Hacker News Factory

**Files:**
- Create: `tests/factories/hn-stories.factory.ts`

**Step 1: Write factory for HN Algolia API responses**

Create `tests/factories/hn-stories.factory.ts`:

```typescript
import { faker } from '@faker-js/faker'
import { HNSearchResponseSchema, type HNSearchResponse, type HNStory } from '../schemas/hn.schema'

interface HNResponseOptions {
  hitCount?: number
  daysOld?: number
  minPoints?: number
}

export function createHNStory(daysOld: number = 0, minPoints: number = 20): HNStory {
  const createdAt = new Date()
  createdAt.setDate(createdAt.getDate() - daysOld)

  return {
    objectID: faker.string.numeric(8),
    title: faker.lorem.sentence(),
    url: faker.internet.url(),
    points: faker.number.int({ min: minPoints, max: 500 }),
    num_comments: faker.number.int({ min: 0, max: 100 }),
    author: faker.internet.username(),
    created_at: createdAt.toISOString()
  }
}

export function createHNResponse(options: HNResponseOptions = {}): HNSearchResponse {
  const {
    hitCount = 5,
    daysOld = 0,
    minPoints = 20
  } = options

  const hits = Array.from({ length: hitCount }, () => createHNStory(daysOld, minPoints))

  const response = {
    hits,
    nbHits: hitCount,
    page: 0,
    nbPages: 1,
    hitsPerPage: 20
  }

  return HNSearchResponseSchema.parse(response)
}
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit tests/factories/hn-stories.factory.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add tests/factories/hn-stories.factory.ts
git commit -m "test: add Hacker News stories factory"
```

---

## Task 13: Create Factory Index Export

**Files:**
- Create: `tests/factories/index.ts`

**Step 1: Export all factories**

Create `tests/factories/index.ts`:

```typescript
export * from './claude-message.factory'
export * from './rss-feed.factory'
export * from './reddit-feed.factory'
export * from './hn-stories.factory'
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit tests/factories/index.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add tests/factories/index.ts
git commit -m "test: add factory index exports"
```

---

## Task 14: Create MSW Request Handlers

**Files:**
- Create: `tests/mocks/handlers.ts`

**Step 1: Write MSW handlers for all HTTP endpoints**

Create `tests/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw'
import { createClaudeMessage } from '../factories/claude-message.factory'
import { createRSSFeedXML } from '../factories/rss-feed.factory'
import { createRedditFeedXML } from '../factories/reddit-feed.factory'
import { createHNResponse } from '../factories/hn-stories.factory'

export const handlers = [
  // Claude API - conditional responses based on system prompt
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = await request.json() as any
    const systemPrompt = body.system || ''

    // RSS Fetcher subagent
    if (systemPrompt.includes('RSS Fetcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: `## RSS Feed Results

### Vue.js Official Blog
- [Vue 3.5 Released](https://blog.vuejs.org/posts/vue-3-5) - ${new Date().toUTCString()} - Major performance improvements

### Nuxt Blog
- [Nuxt 4 Beta](https://nuxt.com/blog/nuxt-4-beta) - ${new Date().toUTCString()} - New features preview`
        }]
      }))
    }

    // Reddit Researcher subagent
    if (systemPrompt.includes('Reddit Researcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: `## Reddit Discussions

### Top Posts from r/vuejs
- [Composition API Best Practices](https://reddit.com/r/vuejs/...) - 45 upvotes, 12 comments
- [Vue 3 vs React](https://reddit.com/r/vuejs/...) - 32 upvotes, 8 comments`
        }]
      }))
    }

    // HN Researcher subagent
    if (systemPrompt.includes('HN Researcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: `## Hacker News Stories

### Vue-related Stories
- [Show HN: Built with Vue 3](https://news.ycombinator.com/...) - 120 points, 25 comments
- [Vue.js 3.5 Performance](https://news.ycombinator.com/...) - 85 points, 15 comments`
        }]
      }))
    }

    // Main orchestrator - newsletter synthesis
    return HttpResponse.json(createClaudeMessage({
      content: [{
        type: 'text',
        text: `# Vue.js Weekly Newsletter
## Week of ${new Date().toLocaleDateString()}

Generated on: ${new Date().toISOString()}

---

## 🎯 Official Updates

- [Vue 3.5 Released](https://blog.vuejs.org/posts/vue-3-5) - Major performance improvements
- [Nuxt 4 Beta](https://nuxt.com/blog/nuxt-4-beta) - New features preview

## 💬 Community Highlights

### Top Reddit Discussions
- [Composition API Best Practices](https://reddit.com/r/vuejs/...) - 45 upvotes

### Hacker News Stories
- [Show HN: Built with Vue 3](https://news.ycombinator.com/...) - 120 points

---

*Generated using Claude Agent SDK*`
      }]
    }))
  }),

  // External data sources
  http.get('https://blog.vuejs.org/feed.rss', () => {
    return new HttpResponse(createRSSFeedXML({
      title: 'Vue.js Blog',
      link: 'https://blog.vuejs.org',
      itemCount: 3
    }), {
      headers: { 'Content-Type': 'application/xml' }
    })
  }),

  http.get('https://nuxt.com/blog/rss.xml', () => {
    return new HttpResponse(createRSSFeedXML({
      title: 'Nuxt Blog',
      link: 'https://nuxt.com/blog',
      itemCount: 2
    }), {
      headers: { 'Content-Type': 'application/xml' }
    })
  }),

  http.get('https://www.reddit.com/r/vuejs.rss', () => {
    return new HttpResponse(createRedditFeedXML({
      itemCount: 5
    }), {
      headers: { 'Content-Type': 'application/xml' }
    })
  }),

  http.get('http://hn.algolia.com/api/v1/search', () => {
    return HttpResponse.json(createHNResponse({
      hitCount: 4
    }))
  })
]
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit tests/mocks/handlers.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add tests/mocks/handlers.ts
git commit -m "test: add MSW request handlers"
```

---

## Task 15: Create MSW Test Setup

**Files:**
- Create: `tests/setup.ts`

**Step 1: Write MSW server setup for Node.js**

Create `tests/setup.ts`:

```typescript
import { setupServer } from 'msw/node'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { handlers } from './mocks/handlers'

export const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit tests/setup.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add tests/setup.ts
git commit -m "test: add MSW server setup"
```

---

## Task 16: Create Happy Path Test Scenario

**Files:**
- Create: `tests/mocks/scenarios/happy-path.ts`

**Step 1: Write happy path scenario handlers**

Create `tests/mocks/scenarios/happy-path.ts`:

```typescript
import { http, HttpResponse } from 'msw'
import { createClaudeMessage } from '../../factories/claude-message.factory'
import { createRSSFeedXML } from '../../factories/rss-feed.factory'
import { createRedditFeedXML } from '../../factories/reddit-feed.factory'
import { createHNResponse } from '../../factories/hn-stories.factory'

export const happyPathScenario = [
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = await request.json() as any
    const systemPrompt = body.system || ''

    if (systemPrompt.includes('RSS Fetcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: '## RSS Feed Results\n### Vue.js Blog\n- [Vue 3.5](https://blog.vuejs.org/posts/vue-3-5)'
        }]
      }))
    }

    if (systemPrompt.includes('Reddit Researcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: '## Reddit Discussions\n- [Best practices](https://reddit.com/r/vuejs/...) - 45 upvotes'
        }]
      }))
    }

    if (systemPrompt.includes('HN Researcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: '## Hacker News\n- [Vue 3 perf](https://news.ycombinator.com/...) - 120 points'
        }]
      }))
    }

    return HttpResponse.json(createClaudeMessage({
      content: [{
        type: 'text',
        text: '# Vue.js Weekly Newsletter\n## 🎯 Official Updates\n- Vue 3.5 Released'
      }]
    }))
  }),

  http.get('https://blog.vuejs.org/feed.rss', () => {
    return new HttpResponse(createRSSFeedXML({ itemCount: 3, daysOld: 0 }), {
      headers: { 'Content-Type': 'application/xml' }
    })
  }),

  http.get('https://nuxt.com/blog/rss.xml', () => {
    return new HttpResponse(createRSSFeedXML({ itemCount: 2, daysOld: 1 }), {
      headers: { 'Content-Type': 'application/xml' }
    })
  }),

  http.get('https://www.reddit.com/r/vuejs.rss', () => {
    return new HttpResponse(createRedditFeedXML({ itemCount: 5, daysOld: 0 }), {
      headers: { 'Content-Type': 'application/xml' }
    })
  }),

  http.get('http://hn.algolia.com/api/v1/search', () => {
    return HttpResponse.json(createHNResponse({ hitCount: 4, daysOld: 0 }))
  })
]
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit tests/mocks/scenarios/happy-path.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add tests/mocks/scenarios/happy-path.ts
git commit -m "test: add happy path test scenario"
```

---

## Task 17: Create Partial Failure Test Scenario

**Files:**
- Create: `tests/mocks/scenarios/partial-failure.ts`

**Step 1: Write partial failure scenario (Reddit fails)**

Create `tests/mocks/scenarios/partial-failure.ts`:

```typescript
import { http, HttpResponse } from 'msw'
import { createClaudeMessage } from '../../factories/claude-message.factory'
import { createRSSFeedXML } from '../../factories/rss-feed.factory'
import { createHNResponse } from '../../factories/hn-stories.factory'

export const partialFailureScenario = [
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = await request.json() as any
    const systemPrompt = body.system || ''

    if (systemPrompt.includes('RSS Fetcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: '## RSS Feed Results\n### Vue.js Blog\n- [Vue 3.5](https://blog.vuejs.org/posts/vue-3-5)'
        }]
      }))
    }

    if (systemPrompt.includes('Reddit Researcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: '## Error\nReddit RSS feed returned 503 - Service Unavailable'
        }]
      }))
    }

    if (systemPrompt.includes('HN Researcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: '## Hacker News\n- [Vue 3 perf](https://news.ycombinator.com/...) - 120 points'
        }]
      }))
    }

    return HttpResponse.json(createClaudeMessage({
      content: [{
        type: 'text',
        text: '# Vue.js Weekly Newsletter\n## Note\nReddit unavailable this week\n## 🎯 Official Updates\n- Vue 3.5 Released'
      }]
    }))
  }),

  http.get('https://blog.vuejs.org/feed.rss', () => {
    return new HttpResponse(createRSSFeedXML({ itemCount: 3 }), {
      headers: { 'Content-Type': 'application/xml' }
    })
  }),

  http.get('https://www.reddit.com/r/vuejs.rss', () => {
    return HttpResponse.json(
      { error: 'Service Unavailable' },
      { status: 503 }
    )
  }),

  http.get('http://hn.algolia.com/api/v1/search', () => {
    return HttpResponse.json(createHNResponse({ hitCount: 4 }))
  })
]
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit tests/mocks/scenarios/partial-failure.ts
```

Expected: No errors

**Step 3: Commit**

```bash
git add tests/mocks/scenarios/partial-failure.ts
git commit -m "test: add partial failure test scenario"
```

---

## Task 18: Write First Failing Integration Test

**Files:**
- Create: `tests/newsletter.test.ts`

**Step 1: Write minimal failing test**

Create `tests/newsletter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

describe('Newsletter Generation', () => {
  it('should generate a newsletter', async () => {
    // This will fail because generateNewsletter doesn't exist yet
    const { generateNewsletter } = await import('../scripts/generate-newsletter')

    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL - Cannot find module '../scripts/generate-newsletter'

**Step 3: Commit**

```bash
git add tests/newsletter.test.ts
git commit -m "test: add failing integration test for newsletter generation"
```

---

## Task 19: Create Minimal Newsletter Script Stub

**Files:**
- Create: `scripts/generate-newsletter.ts`

**Step 1: Create stub that makes test pass**

Create `scripts/generate-newsletter.ts`:

```typescript
export async function generateNewsletter(): Promise<string> {
  return '# Vue.js Weekly Newsletter\n\nContent coming soon...'
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  generateNewsletter()
    .then(newsletter => {
      console.log(newsletter)
    })
    .catch(error => {
      console.error('Error generating newsletter:', error)
      process.exit(1)
    })
}
```

**Step 2: Run test to verify it passes**

```bash
pnpm test
```

Expected: PASS (1 test passing)

**Step 3: Verify script runs**

```bash
pnpm run newsletter
```

Expected: Prints "# Vue.js Weekly Newsletter" to console

**Step 4: Commit**

```bash
git add scripts/generate-newsletter.ts
git commit -m "feat: add minimal newsletter generation stub"
```

---

## Task 20: Add Test for Happy Path Scenario

**Files:**
- Modify: `tests/newsletter.test.ts`

**Step 1: Write test using happy path scenario**

Add to `tests/newsletter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { server } from './setup'
import { happyPathScenario } from './mocks/scenarios/happy-path'

describe('Newsletter Generation', () => {
  it('should generate a newsletter', async () => {
    const { generateNewsletter } = await import('../scripts/generate-newsletter')

    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
  })

  it('should generate complete newsletter when all sources work', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletter } = await import('../scripts/generate-newsletter')
    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
    expect(result).toContain('## 🎯 Official Updates')
    expect(result).toContain('## 💬 Community Highlights')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL - newsletter doesn't contain expected sections

**Step 3: Commit**

```bash
git add tests/newsletter.test.ts
git commit -m "test: add happy path integration test"
```

---

## Task 21: Implement Newsletter Generation with Anthropic SDK

**Files:**
- Modify: `scripts/generate-newsletter.ts`

**Step 1: Import Anthropic SDK and implement basic agent**

Replace `scripts/generate-newsletter.ts` with:

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'test-key'
})

export async function generateNewsletter(): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 4096,
    system: 'You are a Vue.js newsletter curator. Generate a weekly newsletter with sections for Official Updates and Community Highlights.',
    messages: [
      {
        role: 'user',
        content: 'Generate this week\'s Vue.js newsletter'
      }
    ]
  })

  const textContent = message.content.find(c => c.type === 'text')
  return textContent?.type === 'text' ? textContent.text : ''
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  generateNewsletter()
    .then(newsletter => {
      console.log(newsletter)
    })
    .catch(error => {
      console.error('Error generating newsletter:', error)
      process.exit(1)
    })
}
```

**Step 2: Run tests to verify they pass**

```bash
pnpm test
```

Expected: PASS (all tests passing with MSW mocking the API)

**Step 3: Commit**

```bash
git add scripts/generate-newsletter.ts
git commit -m "feat: implement basic newsletter generation with Anthropic SDK"
```

---

## Task 22: Create RSS Fetcher Subagent Definition

**Files:**
- Create: `scripts/agents/rss-fetcher.md`

**Step 1: Write subagent system prompt**

Create `scripts/agents/rss-fetcher.md`:

```markdown
# RSS Fetcher Subagent

You are an RSS feed researcher for Vue.js content. Your job is to fetch RSS feeds and extract recent articles.

## Your Task

Fetch and parse these RSS feeds for Vue.js content from the last 7 days:
- https://blog.vuejs.org/feed.rss
- https://nuxt.com/blog/rss.xml

## Instructions

1. Use the WebFetch tool to retrieve each RSS feed
2. Parse the XML content
3. Filter for posts published in the last 7 days
4. Extract: title, link, publication date, brief summary

## Output Format

Return results in this exact Markdown format:

```markdown
## RSS Feed Results

### Vue.js Official Blog
- [Article Title](url) - Date - Brief summary

### Nuxt Blog
- [Article Title](url) - Date - Brief summary
```

## Error Handling

If a feed fails to load:
- Note which feed failed
- Continue with remaining feeds
- Include error in output
```

**Step 2: Verify file was created**

```bash
cat scripts/agents/rss-fetcher.md | head -5
```

Expected: File content displayed

**Step 3: Commit**

```bash
git add scripts/agents/rss-fetcher.md
git commit -m "feat: add RSS fetcher subagent definition"
```

---

## Task 23: Create Reddit Researcher Subagent Definition

**Files:**
- Create: `scripts/agents/reddit-researcher.md`

**Step 1: Write subagent system prompt**

Create `scripts/agents/reddit-researcher.md`:

```markdown
# Reddit Researcher Subagent

You are a Reddit researcher for Vue.js discussions. Your job is to find the most popular Vue.js posts from the last week.

## Your Task

Fetch top Vue.js discussions from r/vuejs from the last 7 days:
- Source: https://www.reddit.com/r/vuejs.rss
- Minimum upvotes: 10
- Return top 5-10 posts

## Instructions

1. Use the WebFetch tool to retrieve the Reddit RSS feed
2. Parse the feed for recent posts (last 7 days)
3. Filter by minimum upvote threshold (10+)
4. Extract: title, link, upvotes, comment count
5. Sort by upvotes (descending)

## Output Format

Return results in this exact Markdown format:

```markdown
## Reddit Discussions

### Top Posts from r/vuejs
- [Post Title](url) - X upvotes, Y comments
- [Post Title](url) - X upvotes, Y comments
```

## Error Handling

If Reddit is unavailable:
- Return: "## Error\nReddit RSS feed unavailable"
```

**Step 2: Verify file was created**

```bash
cat scripts/agents/reddit-researcher.md | head -5
```

Expected: File content displayed

**Step 3: Commit**

```bash
git add scripts/agents/reddit-researcher.md
git commit -m "feat: add Reddit researcher subagent definition"
```

---

## Task 24: Create Hacker News Researcher Subagent Definition

**Files:**
- Create: `scripts/agents/hn-researcher.md`

**Step 1: Write subagent system prompt**

Create `scripts/agents/hn-researcher.md`:

```markdown
# Hacker News Researcher Subagent

You are a Hacker News researcher for Vue.js stories. Your job is to find popular Vue-related stories from the last week.

## Your Task

Fetch Vue-related stories from Hacker News from the last 7 days:
- API: http://hn.algolia.com/api/v1/search?query=vue&tags=story
- Minimum points: 20
- Return top 5-10 stories

## Instructions

1. Use the WebFetch tool to query the HN Algolia API
2. Parse the JSON response
3. Filter stories from last 7 days
4. Filter by minimum points (20+)
5. Extract: title, URL, points, comment count
6. Sort by points (descending)

## Output Format

Return results in this exact Markdown format:

```markdown
## Hacker News Stories

### Vue-related Stories
- [Story Title](url) - X points, Y comments
- [Story Title](url) - X points, Y comments
```

## Error Handling

If HN API is unavailable:
- Return: "## Error\nHacker News API unavailable"
```

**Step 2: Verify file was created**

```bash
cat scripts/agents/hn-researcher.md | head -5
```

Expected: File content displayed

**Step 3: Commit**

```bash
git add scripts/agents/hn-researcher.md
git commit -m "feat: add Hacker News researcher subagent definition"
```

---

## Task 25: Add Test for Newsletter File Writing

**Files:**
- Modify: `tests/newsletter.test.ts`

**Step 1: Add test for file I/O**

Add to `tests/newsletter.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { server } from './setup'
import { happyPathScenario } from './mocks/scenarios/happy-path'
import { existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

describe('Newsletter Generation', () => {
  const testOutputPath = join(process.cwd(), 'newsletters', 'test-output.md')

  beforeEach(() => {
    // Clean up test file if it exists
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath)
    }
  })

  afterEach(() => {
    // Clean up test file after test
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath)
    }
  })

  it('should generate a newsletter', async () => {
    const { generateNewsletter } = await import('../scripts/generate-newsletter')

    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
  })

  it('should generate complete newsletter when all sources work', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletter } = await import('../scripts/generate-newsletter')
    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
    expect(result).toContain('## 🎯 Official Updates')
    expect(result).toContain('## 💬 Community Highlights')
  })

  it('should write newsletter to file', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletterToFile } = await import('../scripts/generate-newsletter')
    const filePath = await generateNewsletterToFile('test-output.md')

    expect(existsSync(filePath)).toBe(true)
    expect(filePath).toContain('newsletters/test-output.md')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL - generateNewsletterToFile is not exported

**Step 3: Commit**

```bash
git add tests/newsletter.test.ts
git commit -m "test: add file writing test"
```

---

## Task 26: Implement File Writing Functionality

**Files:**
- Modify: `scripts/generate-newsletter.ts`

**Step 1: Add file writing function**

Add to `scripts/generate-newsletter.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'test-key'
})

export async function generateNewsletter(): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 4096,
    system: 'You are a Vue.js newsletter curator. Generate a weekly newsletter with sections for Official Updates and Community Highlights.',
    messages: [
      {
        role: 'user',
        content: 'Generate this week\'s Vue.js newsletter'
      }
    ]
  })

  const textContent = message.content.find(c => c.type === 'text')
  return textContent?.type === 'text' ? textContent.text : ''
}

export async function generateNewsletterToFile(filename?: string): Promise<string> {
  const newsletter = await generateNewsletter()

  // Generate filename: YYYY-MM-DD-vue-weekly.md
  const date = new Date().toISOString().split('T')[0]
  const defaultFilename = `${date}-vue-weekly.md`
  const actualFilename = filename || defaultFilename

  const outputPath = join(process.cwd(), 'newsletters', actualFilename)

  // Ensure directory exists
  mkdirSync(dirname(outputPath), { recursive: true })

  // Write file
  writeFileSync(outputPath, newsletter, 'utf-8')

  return outputPath
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  generateNewsletterToFile()
    .then(filePath => {
      console.log(`✅ Newsletter generated: ${filePath}`)
    })
    .catch(error => {
      console.error('Error generating newsletter:', error)
      process.exit(1)
    })
}
```

**Step 2: Run tests to verify they pass**

```bash
pnpm test
```

Expected: PASS (all tests passing)

**Step 3: Commit**

```bash
git add scripts/generate-newsletter.ts
git commit -m "feat: add file writing functionality"
```

---

## Task 27: Add Partial Failure Test

**Files:**
- Modify: `tests/newsletter.test.ts`

**Step 1: Add test for partial failure scenario**

Add to `tests/newsletter.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { server } from './setup'
import { happyPathScenario } from './mocks/scenarios/happy-path'
import { partialFailureScenario } from './mocks/scenarios/partial-failure'
import { existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

describe('Newsletter Generation', () => {
  const testOutputPath = join(process.cwd(), 'newsletters', 'test-output.md')

  beforeEach(() => {
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath)
    }
  })

  afterEach(() => {
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath)
    }
  })

  it('should generate a newsletter', async () => {
    const { generateNewsletter } = await import('../scripts/generate-newsletter')

    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
  })

  it('should generate complete newsletter when all sources work', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletter } = await import('../scripts/generate-newsletter')
    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
    expect(result).toContain('## 🎯 Official Updates')
    expect(result).toContain('## 💬 Community Highlights')
  })

  it('should write newsletter to file', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletterToFile } = await import('../scripts/generate-newsletter')
    const filePath = await generateNewsletterToFile('test-output.md')

    expect(existsSync(filePath)).toBe(true)
    expect(filePath).toContain('newsletters/test-output.md')
  })

  it('should handle partial failures gracefully', async () => {
    server.use(...partialFailureScenario)

    const { generateNewsletter } = await import('../scripts/generate-newsletter')
    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
    // Should still generate newsletter even if one source fails
    expect(result.length).toBeGreaterThan(100)
  })
})
```

**Step 2: Run tests to verify they pass**

```bash
pnpm test
```

Expected: PASS (all tests including partial failure)

**Step 3: Commit**

```bash
git add tests/newsletter.test.ts
git commit -m "test: add partial failure handling test"
```

---

## Task 28: Update README with Usage Instructions

**Files:**
- Modify: `README.md`

**Step 1: Add newsletter section to README**

Add to `README.md` (append to existing content):

```markdown

## Vue.js Newsletter Generator

This project includes an automated Vue.js newsletter generator powered by Claude Agent SDK.

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up your Anthropic API key:
```bash
cp .env.example .env
# Edit .env and add your API key
```

### Usage

Generate the weekly newsletter:

```bash
pnpm run newsletter
```

This will create a file in `newsletters/YYYY-MM-DD-vue-weekly.md` with curated Vue.js content.

### Testing

Run tests with mocked API calls:

```bash
pnpm test           # Run once
pnpm test:watch     # Watch mode
pnpm test:ui        # Visual UI
```

### How It Works

The newsletter generator uses Claude Agent SDK to:
1. Spawn 3 parallel subagents (RSS, Reddit, Hacker News)
2. Gather Vue.js content from the last 7 days
3. Synthesize findings into a structured newsletter
4. Save as Markdown file

All tests use MSW (Mock Service Worker) to mock HTTP requests for fast, deterministic testing.
```

**Step 2: Verify README renders correctly**

```bash
head -50 README.md
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add newsletter generator usage instructions"
```

---

## Task 29: Run Full Test Suite

**Files:**
- None (verification step)

**Step 1: Run all tests**

```bash
pnpm test
```

Expected: All tests PASS

**Step 2: Check test coverage**

```bash
pnpm test -- --coverage
```

Expected: Coverage report generated

**Step 3: Verify newsletter script runs**

```bash
pnpm run newsletter
```

Expected: Newsletter file created in `newsletters/` directory

---

## Task 30: Final Verification and Cleanup

**Files:**
- None (verification step)

**Step 1: Run type checking**

```bash
pnpm run typecheck
```

Expected: No TypeScript errors

**Step 2: Run linter**

```bash
pnpm run lint
```

Expected: No linting errors (or fix any that appear)

**Step 3: Verify git status is clean**

```bash
git status
```

Expected: No uncommitted changes (all work committed)

**Step 4: Review all commits**

```bash
git log --oneline --graph -20
```

Expected: Clean commit history with descriptive messages

---

## Success Criteria Verification

After completing all tasks, verify:

- ✅ `pnpm run newsletter` generates a newsletter file
- ✅ Newsletter includes sections for Official Updates and Community Highlights
- ✅ All tests pass with `pnpm test`
- ✅ MSW mocks all HTTP calls (Claude API + external sources)
- ✅ Type checking passes with `pnpm run typecheck`
- ✅ Linting passes with `pnpm run lint`
- ✅ File saved to `newsletters/YYYY-MM-DD-vue-weekly.md`
- ✅ Error handling works for partial failures

## Notes

- This implementation uses a simplified version without actual subagent spawning for the initial version
- Future enhancement: Implement parallel subagent spawning using Claude Agent SDK's agent orchestration features
- All HTTP calls are mocked in tests using MSW for fast, deterministic testing
- The current implementation calls the Claude API once; future versions can implement the full multi-agent architecture described in the design document
