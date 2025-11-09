# DEV.to Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add DEV.to as a content source for the Vue.js newsletter with a dedicated "Articles & Tutorials" section

**Architecture:** Create DevToResource adapter following the HN pattern (kind: "json" + ID prefix detection), add two sources (vue + nuxt tags) with 7-day time window, implement section renderer that combines and sorts by reactions

**Tech Stack:** TypeScript, MSW (testing), Vitest, Zod (schemas), @faker-js/faker (test data)

**Design Reference:** `docs/plans/2025-11-09-devto-integration-design.md`

---

## Task 1: Create DEV.to Test Schema and Factory

**Files:**
- Create: `tests/schemas/devto.schema.ts`
- Create: `tests/factories/devto-articles.factory.ts`
- Modify: `tests/factories/index.ts` (add exports)

### Step 1: Write the DEV.to schema

Create `tests/schemas/devto.schema.ts`:

```typescript
import { z } from 'zod'

export const DevToArticleSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string(),
  published_at: z.string(),
  public_reactions_count: z.number(),
  comments_count: z.number(),
  tags: z.array(z.string()),
  user: z.object({
    name: z.string()
  }).optional()
})

export const DevToArticlesResponseSchema = z.array(DevToArticleSchema)

export type DevToArticle = z.infer<typeof DevToArticleSchema>
export type DevToArticlesResponse = z.infer<typeof DevToArticlesResponseSchema>
```

### Step 2: Write the DEV.to factory

Create `tests/factories/devto-articles.factory.ts`:

```typescript
import { faker } from '@faker-js/faker'
import { DevToArticlesResponseSchema, type DevToArticle, type DevToArticlesResponse } from '../schemas/devto.schema'

interface DevToArticleOptions {
  articleCount?: number
  daysOld?: number
  minReactions?: number
  tags?: string[]
}

export function createDevToArticle(daysOld: number = 0, minReactions: number = 5, tags: string[] = ['vue']): DevToArticle {
  const publishedAt = new Date()
  publishedAt.setDate(publishedAt.getDate() - daysOld)

  return {
    id: faker.number.int({ min: 10000, max: 999999 }),
    title: faker.lorem.sentence(),
    url: faker.internet.url(),
    published_at: publishedAt.toISOString(),
    public_reactions_count: faker.number.int({ min: minReactions, max: 200 }),
    comments_count: faker.number.int({ min: 0, max: 50 }),
    tags,
    user: {
      name: faker.person.fullName()
    }
  }
}

export function createDevToResponse(options: DevToArticleOptions = {}): DevToArticlesResponse {
  const {
    articleCount = 5,
    daysOld = 0,
    minReactions = 5,
    tags = ['vue', 'javascript']
  } = options

  const articles = Array.from({ length: articleCount }, (): DevToArticle =>
    createDevToArticle(daysOld, minReactions, tags)
  )

  return DevToArticlesResponseSchema.parse(articles)
}
```

### Step 3: Export from factory index

Add to `tests/factories/index.ts`:

```typescript
export * from './devto-articles.factory'
```

### Step 4: Verify schemas parse correctly

Run: `pnpm typecheck`

Expected: No TypeScript errors

### Step 5: Commit

```bash
git add tests/schemas/devto.schema.ts tests/factories/devto-articles.factory.ts tests/factories/index.ts
git commit -m "test: add DEV.to schema and factory for test data generation"
```

---

## Task 2: Add MSW Handlers for DEV.to API

**Files:**
- Modify: `tests/mocks/handlers.ts:167` (add before closing bracket)

### Step 1: Add import for DEV.to factory

Add to imports at top of `tests/mocks/handlers.ts`:

```typescript
import { createDevToResponse } from '../factories/devto-articles.factory'
```

### Step 2: Add DEV.to API handler

Add before the closing bracket in `handlers` array (after GitHub handler):

```typescript
  // DEV.to API - Articles by tag
  http.get('https://dev.to/api/articles', ({ request }): HttpResponse => {
    const url = new URL(request.url)
    const tag = url.searchParams.get('tag')
    const top = url.searchParams.get('top')

    if (tag === 'vue') {
      return HttpResponse.json(createDevToResponse({
        articleCount: 10,
        daysOld: Number(top) || 7,
        minReactions: 5,
        tags: ['vue', 'javascript', 'webdev']
      }))
    }

    if (tag === 'nuxt') {
      return HttpResponse.json(createDevToResponse({
        articleCount: 8,
        daysOld: Number(top) || 7,
        minReactions: 5,
        tags: ['nuxt', 'vue', 'ssr']
      }))
    }

    return HttpResponse.json([])
  })
```

### Step 3: Verify handler compiles

Run: `pnpm typecheck`

Expected: No TypeScript errors

### Step 4: Commit

```bash
git add tests/mocks/handlers.ts
git commit -m "test: add MSW handler for DEV.to API with vue and nuxt tag support"
```

---

## Task 3: Update Test Scenarios with DEV.to Mocks

**Files:**
- Modify: `tests/mocks/scenarios/happy-path.ts:81` (add before closing bracket)
- Modify: `tests/mocks/scenarios/partial-failure.ts` (similar addition)

### Step 1: Add import to happy-path scenario

Add to imports at top of `tests/mocks/scenarios/happy-path.ts`:

```typescript
import { createDevToResponse } from '../../factories/devto-articles.factory'
```

### Step 2: Add DEV.to handler to happy-path

Add before closing bracket of `happyPathScenario` array:

```typescript
  http.get('https://dev.to/api/articles', ({ request }): HttpResponse => {
    const url = new URL(request.url)
    const tag = url.searchParams.get('tag')

    if (tag === 'vue') {
      return HttpResponse.json(createDevToResponse({
        articleCount: 10,
        daysOld: 0,
        tags: ['vue', 'javascript']
      }))
    }

    if (tag === 'nuxt') {
      return HttpResponse.json(createDevToResponse({
        articleCount: 8,
        daysOld: 0,
        tags: ['nuxt', 'vue']
      }))
    }

    return HttpResponse.json([])
  })
```

### Step 3: Verify scenario compiles

Run: `pnpm typecheck`

Expected: No TypeScript errors

### Step 4: Commit

```bash
git add tests/mocks/scenarios/happy-path.ts
git commit -m "test: add DEV.to mock to happy path scenario"
```

---

## Task 4: Write Failing Test for DevToResource Adapter

**Files:**
- Modify: `tests/newsletter.test.ts:148` (add after HN test)

### Step 1: Write the failing test

Add after the HN resource adapter test (around line 148):

```typescript
  it('should fetch from DEV.to resource adapter', async (): Promise<void> => {
    server.use(...happyPathScenario)

    const { DevToResource } = await import('../scripts/core/resources/adapters/devto')

    const resource = new DevToResource({
      id: 'test-devto',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue&top=7&per_page=20',
      tag: 'DEV.to #vue',
      limit: 10
    })

    const items = await resource.fetch()

    expect(items).toBeDefined()
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
    expect(items.length).toBeLessThanOrEqual(10)

    // Verify sorting by reactions (descending)
    for (let i = 0; i < items.length - 1; i++) {
      expect(items[i].score ?? 0).toBeGreaterThanOrEqual(items[i + 1].score ?? 0)
    }

    items.forEach((item): void => {
      expect(item).toHaveProperty('title')
      expect(item).toHaveProperty('url')
      expect(item.source).toContain('DEV.to')
      expect(item).toHaveProperty('score') // reactions
      expect(item).toHaveProperty('comments')
      expect(item).toHaveProperty('description') // tags formatted
    })
  })
```

### Step 2: Run test to verify it fails

Run: `pnpm test newsletter.test.ts`

Expected: FAIL with "Cannot find module '../scripts/core/resources/adapters/devto'"

### Step 3: Commit

```bash
git add tests/newsletter.test.ts
git commit -m "test: add failing test for DevToResource adapter"
```

---

## Task 5: Implement DevToResource Adapter

**Files:**
- Create: `scripts/core/resources/adapters/devto.ts`

### Step 1: Write the DevToResource implementation

Create `scripts/core/resources/adapters/devto.ts`:

```typescript
import type { Resource, Item, ResourceConfig } from '../types.js'
import { getJson } from '../../fetch/http.js'

type DevToArticle = {
  id: number
  title: string
  url: string
  published_at: string
  public_reactions_count: number
  comments_count: number
  tags: string[]
  user?: { name: string }
}

export class DevToResource implements Resource {
  public id: string
  private url: string
  private limit: number
  private source: string

  public constructor(cfg: ResourceConfig) {
    this.id = cfg.id
    this.url = cfg.url
    this.limit = cfg.limit ?? 10
    this.source = cfg.tag ?? 'DEV.to'
  }

  public async fetch(): Promise<Item[]> {
    const data = await getJson<DevToArticle[]>(this.url)
    return (data ?? [])
      .sort((a, b): number => b.public_reactions_count - a.public_reactions_count)
      .slice(0, this.limit)
      .map((article): Item => ({
        title: article.title,
        url: article.url,
        date: article.published_at ? new Date(article.published_at) : undefined,
        score: article.public_reactions_count,
        comments: article.comments_count,
        description: article.tags?.length ? `#${article.tags.join(' #')}` : undefined,
        source: this.source
      }))
  }
}
```

### Step 2: Run test to verify it passes

Run: `pnpm test newsletter.test.ts -t "should fetch from DEV.to"`

Expected: PASS

### Step 3: Commit

```bash
git add scripts/core/resources/adapters/devto.ts
git commit -m "feat: implement DevToResource adapter with reaction-based sorting"
```

---

## Task 6: Add DevToResource to Registry

**Files:**
- Modify: `scripts/core/resources/registry.ts:1-6` (add import)
- Modify: `scripts/core/resources/registry.ts:10-20` (add detection logic)

### Step 1: Write failing test for registry detection

Add to `tests/newsletter.test.ts` after ResourceRegistry test:

```typescript
  it('should register DevToResource via registry with devto- ID prefix', async (): Promise<void> => {
    server.use(...happyPathScenario)

    const { ResourceRegistry } = await import('../scripts/core/resources/registry')

    const registry = new ResourceRegistry()
    registry.register({
      id: 'devto-vue',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue&top=7&per_page=20',
      tag: 'DEV.to #vue',
      limit: 10
    })

    const collected = await registry.collect()

    expect(collected).toHaveProperty('devto-vue')
    expect(Array.isArray(collected['devto-vue'])).toBe(true)
    expect(collected['devto-vue'].length).toBeGreaterThan(0)
    expect(collected['devto-vue'][0].source).toContain('DEV.to')
  })
```

### Step 2: Run test to verify it fails

Run: `pnpm test newsletter.test.ts -t "should register DevToResource"`

Expected: FAIL with "Unknown kind json" or similar

### Step 3: Add import to registry

Add to imports in `scripts/core/resources/registry.ts`:

```typescript
import { DevToResource } from './adapters/devto.js'
```

### Step 4: Add detection logic

Modify the `register` method in `scripts/core/resources/registry.ts`:

```typescript
  public register(cfg: ResourceConfig): this {
    const r
      = cfg.kind === 'json' && cfg.id.startsWith('hn')
        ? new HNResource(cfg)
        : cfg.kind === 'json' && cfg.id.startsWith('devto-')
          ? new DevToResource(cfg)
          : cfg.kind === 'github'
            ? new GitHubSearchResource(cfg)
            : cfg.kind === 'rss'
              ? new RSSResource(cfg)
              : cfg.kind === 'atom'
                ? new RedditResource(cfg)
                : ((): never => { throw new Error(`Unknown kind ${cfg.kind}`) })()

    this.resources.push(r)
    return this
  }
```

### Step 5: Run test to verify it passes

Run: `pnpm test newsletter.test.ts -t "should register DevToResource"`

Expected: PASS

### Step 6: Run all tests

Run: `pnpm test`

Expected: All tests PASS

### Step 7: Commit

```bash
git add scripts/core/resources/registry.ts tests/newsletter.test.ts
git commit -m "feat: add DevToResource detection to registry via devto- ID prefix"
```

---

## Task 7: Add DEV.to Sources to Configuration

**Files:**
- Modify: `scripts/config/sources.json:42` (add before closing bracket)

### Step 1: Add DEV.to sources

Add before the closing bracket in `scripts/config/sources.json`:

```json
  {
    "id": "devto-vue",
    "kind": "json",
    "url": "https://dev.to/api/articles?tag=vue&top=7&per_page=20",
    "tag": "DEV.to #vue",
    "limit": 10
  },
  {
    "id": "devto-nuxt",
    "kind": "json",
    "url": "https://dev.to/api/articles?tag=nuxt&top=7&per_page=20",
    "tag": "DEV.to #nuxt",
    "limit": 10
  }
```

### Step 2: Verify JSON is valid

Run: `node -e "console.log(JSON.parse(require('fs').readFileSync('scripts/config/sources.json', 'utf-8')))"`

Expected: JSON parses without errors

### Step 3: Commit

```bash
git add scripts/config/sources.json
git commit -m "feat: add DEV.to sources for vue and nuxt tags with 7-day window"
```

---

## Task 8: Write Failing Test for Articles Section Rendering

**Files:**
- Modify: `tests/newsletter.test.ts:235` (add after date formatting test)

### Step 1: Write the failing test

Add new test:

```typescript
  it('should render articles section from DEV.to sources', async (): Promise<void> => {
    server.use(...happyPathScenario)

    const { generateNewsletter } = await import('../scripts/pipelines/newsletter')
    const mockClient = createMockLLMClient()

    const result = await generateNewsletter(mockClient)

    // Verify the context passed to LLM includes articles section
    expect(result.text).toBeDefined()

    // Since we're testing the pipeline, we need to verify the internal context
    // This test verifies end-to-end that articles are collected and passed to LLM
    expect(mockClient.generate).toHaveBeenCalled()

    const callArgs = mockClient.generate.mock.calls[0][0]
    const userMessage = callArgs.find(m => m.role === 'user')
    expect(userMessage?.content).toContain('Articles & Tutorials from DEV.to:')
  })
```

### Step 2: Run test to verify it fails

Run: `pnpm test newsletter.test.ts -t "should render articles section"`

Expected: FAIL because articles section not yet implemented

### Step 3: Commit

```bash
git add tests/newsletter.test.ts
git commit -m "test: add failing test for articles section rendering"
```

---

## Task 9: Implement Articles Section Renderer

**Files:**
- Modify: `scripts/pipelines/newsletter.ts:12-27` (update renderSections function)
- Modify: `scripts/pipelines/newsletter.ts:29-66` (update generateNewsletter function)

### Step 1: Update renderSections return type

Modify the return type (line 12):

```typescript
function renderSections(collected: Record<string, Item[]>): {
  news: string,
  repos: string,
  reddit: string,
  articles: string
} {
```

### Step 2: Add articles section rendering logic

Add before the return statement (around line 26):

```typescript
  const articles = [...(collected['devto-vue'] ?? []), ...(collected['devto-nuxt'] ?? [])]
    .sort((a, b): number => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 10)
    .map((article, idx): string => {
      const date = article.date
        ? article.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : ''
      const reactions = article.score ? `❤️ ${article.score}` : ''
      const comments = article.comments ? `💬 ${article.comments}` : ''
      const stats = [reactions, comments].filter(Boolean).join(', ')
      const tags = article.description ?? ''

      return `${idx + 1}. **[${article.title}](${article.url})** - ${article.source}${date ? ` (${date})` : ''}${stats ? ` | ${stats}` : ''}${tags ? `\n   ${tags}` : ''}`
    }).join('\n') || '- No recent articles available'

  return { news, repos, reddit, articles }
```

### Step 3: Update context in generateNewsletter

Modify the destructuring (line 40):

```typescript
  const { news, repos, reddit, articles } = renderSections(collected)
```

### Step 4: Add articles to context

Modify the context array (around line 42):

```typescript
  const context = [
    `Current Date: ${currentDate}`,
    '',
    `Recent Vue.js Projects:\n${news}`,
    '',
    `Trending Vue.js Repositories:\n${repos}`,
    '',
    `Community Discussions from Reddit:\n${reddit}`,
    '',
    `Articles & Tutorials from DEV.to:\n${articles}`
  ].join('\n')
```

### Step 5: Run test to verify it passes

Run: `pnpm test newsletter.test.ts -t "should render articles section"`

Expected: PASS

### Step 6: Run all tests

Run: `pnpm test`

Expected: All tests PASS

### Step 7: Commit

```bash
git add scripts/pipelines/newsletter.ts
git commit -m "feat: add articles section renderer combining DEV.to vue and nuxt sources"
```

---

## Task 10: Verify End-to-End Integration

**Files:**
- None (verification only)

### Step 1: Run full test suite

Run: `pnpm test`

Expected: All tests PASS with coverage report

### Step 2: Run type checking

Run: `pnpm typecheck`

Expected: No TypeScript errors

### Step 3: Run linter

Run: `pnpm lint:fast`

Expected: No linting errors

### Step 4: Generate actual newsletter (optional)

**Note:** Only run if you have a valid API key configured

Run: `pnpm newsletter`

Expected: Newsletter generated with "Articles & Tutorials from DEV.to:" section

### Step 5: Verify newsletter output format

If you ran Step 4, check the generated file in `newsletters/` directory.

Expected format in context:
```
Articles & Tutorials from DEV.to:
1. **[Article Title](https://dev.to/...)** - DEV.to #vue (Nov 9) | ❤️ 45, 💬 12
   #vue #javascript #webdev
2. **[Another Article](https://dev.to/...)** - DEV.to #nuxt (Nov 8) | ❤️ 38, 💬 8
   #nuxt #vue #ssr
```

### Step 6: Final commit (if any cleanup needed)

If you made any adjustments during verification:

```bash
git add .
git commit -m "chore: verify end-to-end DEV.to integration"
```

---

## Task 11: Update Documentation

**Files:**
- Modify: `CLAUDE.md` (add DEV.to to architecture description)

### Step 1: Update CLAUDE.md architecture section

Add to the "Newsletter Generation Flow" section in `CLAUDE.md`:

```markdown
Key functions:
- `fetchVueNews()` - Gets recent Vue repositories from GitHub
- `fetchTrendingRepos()` - Gets trending Vue TypeScript repos
- `fetchDevToArticles()` - Gets popular Vue/Nuxt articles from DEV.to (7-day window)
- `generateNewsletterWithRealData()` - Creates newsletter with real data
```

Add to the data sources list:

```markdown
### Data Sources

The newsletter generator fetches from:
- **GitHub API**: Recent Vue.js repositories and trending projects
- **Reddit RSS**: Community discussions from r/vuejs and r/Nuxt
- **Hacker News API**: Vue-related stories with 20+ points
- **RSS Feeds**: Official Vue.js and Nuxt blogs
- **DEV.to API**: Popular Vue/Nuxt articles from the last 7 days
```

### Step 2: Verify CLAUDE.md is accurate

Read through `CLAUDE.md` to ensure accuracy.

### Step 3: Commit

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with DEV.to integration details"
```

---

## Testing Strategy

### Unit Tests
- ✅ DevToResource adapter (sorting, mapping, limits)
- ✅ Registry detection (devto- prefix)
- ✅ Articles section rendering (combining sources, formatting)

### Integration Tests
- ✅ ResourceRegistry.collect() with DEV.to sources
- ✅ Full newsletter pipeline with articles section
- ✅ MSW mocking of DEV.to API

### Manual Testing
- ⚠️ Real API call (optional, requires valid API key)
- ⚠️ Verify newsletter output format
- ⚠️ Check reaction sorting works correctly

## Key Design Decisions

1. **ID-based detection**: Reuse `kind: "json"` with `devto-` prefix (matches HN pattern)
2. **Fetch more, sort, then limit**: per_page=20 ensures we get top 10 by reactions, not just newest 10
3. **Rich formatting**: Show reactions (❤️), comments (💬), date, and tags for context
4. **Separate section**: "Articles & Tutorials" distinct from community discussions
5. **No auth required**: DEV.to public API doesn't need authentication

## Dependencies

- Existing: `getJson()` from `scripts/core/fetch/http.ts`
- Existing: MSW for HTTP mocking
- Existing: @faker-js/faker for test data
- Existing: Zod for schema validation in tests

## Rollback Plan

If issues arise:
1. Remove DEV.to sources from `scripts/config/sources.json`
2. Newsletter generation continues with existing sources
3. No breaking changes to existing functionality

## Success Criteria

- [ ] All tests pass (`pnpm test`)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No linting errors (`pnpm lint:fast`)
- [ ] Newsletter includes "Articles & Tutorials from DEV.to:" section
- [ ] Articles sorted by reactions (descending)
- [ ] Both vue and nuxt tags fetch successfully
- [ ] Empty responses handled gracefully
