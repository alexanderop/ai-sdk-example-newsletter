# RSS Feed Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor newsletter generator to use category-based content grouping, making it trivial to add new RSS feeds without code changes.

**Architecture:** Move from hardcoded resource ID lookups to a category-based system where each adapter declares its content category. The rendering logic groups items by category, allowing new sources to automatically appear in the correct newsletter section.

**Tech Stack:** TypeScript, Zod (existing), MSW for testing (existing)

---

## Task 1: Add Category Type to Resource Interface

**Files:**
- Modify: `scripts/core/resources/types.ts:1-27`

**Step 1: Add ContentCategory type and update Resource interface**

In `scripts/core/resources/types.ts`, add the category type and update the Resource interface:

```typescript
export type ResourceKind = 'rss' | 'atom' | 'json' | 'github' | 'custom'

export type ContentCategory = 'articles' | 'repos' | 'discussions' | 'news'

export interface ResourceConfig {
  id: string
  kind: ResourceKind
  url: string
  minScore?: number // optional filter (e.g., HN points)
  limit?: number
  tag?: string // subreddit, label, etc
}

export interface Item {
  title: string
  url: string
  date?: Date
  score?: number
  comments?: number
  description?: string
  stars?: number
  source: string // human-friendly source name
}

export interface Resource {
  id: string
  category: ContentCategory
  fetch(): Promise<Item[]>
}
```

**Step 2: Verify TypeScript compilation fails**

Run: `pnpm typecheck`

Expected: FAIL with errors about missing `category` property in all adapter implementations

**Step 3: Commit the type changes**

```bash
git add scripts/core/resources/types.ts
git commit -m "feat: add ContentCategory type to Resource interface"
```

---

## Task 2: Add Category to RSSResource Adapter

**Files:**
- Modify: `scripts/core/resources/adapters/rss.ts:14-26`

**Step 1: Add category property to RSSResource**

In `scripts/core/resources/adapters/rss.ts`, add the category property:

```typescript
export class RSSResource implements Resource {
  public id: string
  public category: ContentCategory = 'articles'
  private url: string
  private sourceName: string
  private limit: number

  public constructor(cfg: ResourceConfig & { sourceName?: string }) {
    this.id = cfg.id
    this.url = cfg.url
    this.sourceName = cfg.tag ?? 'RSS'
    this.limit = cfg.limit ?? 10
  }

  // ... rest of the class stays the same
```

Also add the import at the top:

```typescript
import type { Resource, Item, ResourceConfig, ContentCategory } from '../types.js'
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm typecheck`

Expected: Still fails but with fewer errors (RSSResource now passes)

**Step 3: Commit**

```bash
git add scripts/core/resources/adapters/rss.ts
git commit -m "feat: add articles category to RSSResource adapter"
```

---

## Task 3: Add Category to DevToResource Adapter

**Files:**
- Modify: `scripts/core/resources/adapters/devto.ts`

**Step 1: Add category property to DevToResource**

In `scripts/core/resources/adapters/devto.ts`, add the import and property:

```typescript
import type { Resource, Item, ResourceConfig, ContentCategory } from '../types.js'
```

Then add to the class:

```typescript
export class DevToResource implements Resource {
  public id: string
  public category: ContentCategory = 'articles'
  private url: string
  private sourceName: string
  private limit: number

  // ... rest stays the same
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm typecheck`

Expected: Still fails but with fewer errors

**Step 3: Commit**

```bash
git add scripts/core/resources/adapters/devto.ts
git commit -m "feat: add articles category to DevToResource adapter"
```

---

## Task 4: Add Category to GitHubSearchResource Adapter

**Files:**
- Modify: `scripts/core/resources/adapters/github.ts`

**Step 1: Add category property to GitHubSearchResource**

In `scripts/core/resources/adapters/github.ts`, add the import and property:

```typescript
import type { Resource, Item, ResourceConfig, ContentCategory } from '../types.js'
```

Then add to the class:

```typescript
export class GitHubSearchResource implements Resource {
  public id: string
  public category: ContentCategory = 'repos'
  private url: string
  private limit: number

  // ... rest stays the same
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm typecheck`

Expected: Still fails but with fewer errors

**Step 3: Commit**

```bash
git add scripts/core/resources/adapters/github.ts
git commit -m "feat: add repos category to GitHubSearchResource adapter"
```

---

## Task 5: Add Category to RedditResource Adapter

**Files:**
- Modify: `scripts/core/resources/adapters/reddit.ts`

**Step 1: Add category property to RedditResource**

In `scripts/core/resources/adapters/reddit.ts`, add the import and property:

```typescript
import type { Resource, Item, ResourceConfig, ContentCategory } from '../types.js'
```

Then add to the class:

```typescript
export class RedditResource implements Resource {
  public id: string
  public category: ContentCategory = 'discussions'
  private url: string
  private sourceName: string
  private limit: number

  // ... rest stays the same
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm typecheck`

Expected: Still fails but with fewer errors

**Step 3: Commit**

```bash
git add scripts/core/resources/adapters/reddit.ts
git commit -m "feat: add discussions category to RedditResource adapter"
```

---

## Task 6: Add Category to HNResource Adapter

**Files:**
- Modify: `scripts/core/resources/adapters/hn.ts`

**Step 1: Add category property to HNResource**

In `scripts/core/resources/adapters/hn.ts`, add the import and property:

```typescript
import type { Resource, Item, ResourceConfig, ContentCategory } from '../types.js'
```

Then add to the class:

```typescript
export class HNResource implements Resource {
  public id: string
  public category: ContentCategory = 'discussions'
  private url: string
  private minScore: number
  private limit: number

  // ... rest stays the same
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm typecheck`

Expected: PASS - all adapters now have category property

**Step 3: Commit**

```bash
git add scripts/core/resources/adapters/hn.ts
git commit -m "feat: add discussions category to HNResource adapter"
```

---

## Task 7: Update ResourceRegistry to Return Resources

**Files:**
- Modify: `scripts/core/resources/registry.ts:34-54`

**Step 1: Update collect() return type and implementation**

In `scripts/core/resources/registry.ts`, update the `collect()` method:

```typescript
public async collect(): Promise<{
  results: Record<string, Item[]>,
  errors: Record<string, Error>,
  resources: Resource[]
}> {
  const results: Record<string, Item[]> = {}
  const errors: Record<string, Error> = {}
  const settled = await Promise.allSettled(this.resources.map((r): Promise<Item[]> => r.fetch()))

  settled.forEach((res, i): void => {
    const id = this.resources[i].id
    if (res.status === 'fulfilled') {
      results[id] = res.value
    } else {
      // Graceful degradation: log error and return empty array for failed resource
      const error = res.reason instanceof Error ? res.reason : new Error(String(res.reason))
      errors[id] = error
      results[id] = []
      console.error(`[${id}] Resource fetch failed:`, error.message)
    }
  })

  return { results, errors, resources: this.resources }
}
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm typecheck`

Expected: FAIL - `generateNewsletter` now expects updated return type

**Step 3: Commit**

```bash
git add scripts/core/resources/registry.ts
git commit -m "feat: return resources array from registry.collect()"
```

---

## Task 8: Add groupByCategory Helper Function

**Files:**
- Modify: `scripts/pipelines/newsletter.ts:12-47`

**Step 1: Add import for ContentCategory type**

At the top of `scripts/pipelines/newsletter.ts`, update imports:

```typescript
import type { LLMClient } from '../core/llm/LLMClient.js'
import type { ResourceConfig, Item, Resource, ContentCategory } from '../core/resources/types.js'
```

**Step 2: Add groupByCategory helper function**

Add this function before `renderSections`:

```typescript
function groupByCategory(
  collected: Record<string, Item[]>,
  resources: Resource[]
): Record<ContentCategory, Item[]> {
  const grouped: Record<ContentCategory, Item[]> = {
    articles: [],
    repos: [],
    discussions: [],
    news: []
  }

  resources.forEach((resource): void => {
    const items = collected[resource.id] ?? []
    grouped[resource.category].push(...items)
  })

  return grouped
}
```

**Step 3: Verify TypeScript compilation**

Run: `pnpm typecheck`

Expected: Still fails in generateNewsletter and renderSections

**Step 4: Commit**

```bash
git add scripts/pipelines/newsletter.ts
git commit -m "feat: add groupByCategory helper function"
```

---

## Task 9: Refactor renderSections to Use Categories

**Files:**
- Modify: `scripts/pipelines/newsletter.ts:12-47`

**Step 1: Update renderSections signature and implementation**

Replace the entire `renderSections` function:

```typescript
function renderSections(grouped: Record<ContentCategory, Item[]>): {
  news: string
  repos: string
  discussions: string
  articles: string
} {
  const news = (grouped.news ?? [])
    .map((i): string => `- [${i.title}](${i.url})`)
    .join('\n') || '- No recent Vue.js news available'

  const repos = (grouped.repos ?? [])
    .map((r: Item, idx: number): string =>
      `${idx + 1}. **[${r.title}](${r.url})** - ${r.description ?? 'No description'}${r.stars ? ` (⭐ ${r.stars.toLocaleString()})` : ''}`
    )
    .join('\n') || '- No trending repositories available'

  const discussions = (grouped.discussions ?? [])
    .sort((a, b): number => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
    .slice(0, 10)
    .map((p: Item, idx: number): string => {
      const d = p.date ? p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
      return `${idx + 1}. **[${p.title}](${p.url})** - ${p.source}${d ? ` (${d})` : ''}`
    })
    .join('\n') || '- No significant community discussions this week'

  const articles = (grouped.articles ?? [])
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
    })
    .join('\n') || '- No recent articles available'

  return { news, repos, discussions, articles }
}
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm typecheck`

Expected: Still fails in generateNewsletter (needs to use new functions)

**Step 3: Commit**

```bash
git add scripts/pipelines/newsletter.ts
git commit -m "refactor: update renderSections to use category-based grouping"
```

---

## Task 10: Update generateNewsletter to Use Category Grouping

**Files:**
- Modify: `scripts/pipelines/newsletter.ts:49-94`

**Step 1: Update generateNewsletter to use new grouping**

Replace the data collection and rendering section in `generateNewsletter`:

```typescript
export async function generateNewsletter(llm: LLMClient): Promise<{ text: string, usage: { input_tokens: number, output_tokens: number, cache_creation_input_tokens?: number, cache_read_input_tokens?: number } }> {
  // Load sources config
  const sourcesPath = join(__dirname, '../config/sources.json')
  const sources = JSON.parse(readFileSync(sourcesPath, 'utf-8')) as ResourceConfig[]

  // Collect data from all sources
  const registry = new ResourceRegistry()
  for (const s of sources) registry.register(s)
  const { results: collected, errors, resources } = await registry.collect()

  // Log any resource failures (graceful degradation)
  const errorCount = Object.keys(errors).length
  if (errorCount > 0) {
    console.warn(`Newsletter generation proceeding with ${errorCount} failed resource(s)`)
  }

  // Group items by category
  const grouped = groupByCategory(collected, resources)

  // Format context data
  const { news, repos, discussions, articles } = renderSections(grouped)
  const currentDate = format(new Date())
  const context = [
    `Current Date: ${currentDate}`,
    '',
    `Recent Vue.js Projects:\n${news}`,
    '',
    `Trending Vue.js Repositories:\n${repos}`,
    '',
    `Community Discussions:\n${discussions}`,
    '',
    `Articles & Tutorials:\n${articles}`
  ].join('\n')

  // Load prompts
  const systemPath = join(__dirname, '../prompts/newsletter-system.md')
  const userPath = join(__dirname, '../prompts/newsletter-user.md')
  const system = readFileSync(systemPath, 'utf-8').trim()
  const user = readFileSync(userPath, 'utf-8')
    .replace('{{CONTEXT_DATA}}', context)

  // Generate newsletter
  const res = await llm.generate([
    { role: 'system', content: system },
    { role: 'user', content: user }
  ])

  return { text: res.text, usage: res.usage }
}
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm typecheck`

Expected: PASS - no type errors

**Step 3: Run linting**

Run: `pnpm lint:fast`

Expected: PASS or minor fixable issues

**Step 4: Commit**

```bash
git add scripts/pipelines/newsletter.ts
git commit -m "refactor: use category-based grouping in generateNewsletter"
```

---

## Task 11: Add alexop.dev RSS Feed to Sources

**Files:**
- Modify: `scripts/config/sources.json:1-58`

**Step 1: Add new RSS feed entry**

In `scripts/config/sources.json`, add the new entry after the existing RSS feeds:

```json
[
  {
    "id": "reddit-vuejs",
    "kind": "atom",
    "url": "https://www.reddit.com/r/vuejs.rss",
    "tag": "vuejs",
    "limit": 10
  },
  {
    "id": "reddit-nuxt",
    "kind": "atom",
    "url": "https://www.reddit.com/r/Nuxt.rss",
    "tag": "Nuxt",
    "limit": 10
  },
  {
    "id": "hn-vue",
    "kind": "json",
    "url": "https://hn.algolia.com/api/v1/search?query=vue&tags=story",
    "minScore": 20,
    "limit": 10
  },
  {
    "id": "rss-vue-blog",
    "kind": "rss",
    "url": "https://blog.vuejs.org/feed.rss",
    "tag": "Vue.js Blog",
    "limit": 10
  },
  {
    "id": "rss-nuxt-blog",
    "kind": "rss",
    "url": "https://nuxt.com/blog/rss.xml",
    "tag": "Nuxt Blog",
    "limit": 10
  },
  {
    "id": "rss-alexop-blog",
    "kind": "rss",
    "url": "https://alexop.dev/rss.xml",
    "tag": "Alex Opalic's Blog",
    "limit": 10
  },
  {
    "id": "github-news",
    "kind": "github",
    "url": "https://api.github.com/search/repositories?q=vue+in:name,description+pushed:>2020-01-01&sort=updated&order=desc&per_page=5",
    "limit": 5
  },
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
]
```

**Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('scripts/config/sources.json', 'utf-8'))"`

Expected: No output (success)

**Step 3: Commit**

```bash
git add scripts/config/sources.json
git commit -m "feat: add alexop.dev RSS feed to newsletter sources"
```

---

## Task 12: Run Tests to Verify No Regressions

**Files:**
- Test: `tests/**/*.test.ts`

**Step 1: Run all tests**

Run: `pnpm test`

Expected: PASS - all existing tests continue to pass

Note: Some tests may need updates if they verify exact rendered output format. If tests fail, update them to match the new category-based rendering.

**Step 2: If tests fail, update test expectations**

Check which tests failed and update their expectations to match the new rendering logic. The logic is functionally equivalent, just reorganized.

**Step 3: Run tests again**

Run: `pnpm test`

Expected: PASS

**Step 4: Commit any test updates**

```bash
git add tests/
git commit -m "test: update test expectations for category-based rendering"
```

---

## Task 13: Manual Verification with Newsletter Generation

**Files:**
- None (verification only)

**Step 1: Ensure ANTHROPIC_API_KEY is set**

Run: `echo $ANTHROPIC_API_KEY`

Expected: Your API key is displayed (not empty)

If empty, add to `.env` file:
```
ANTHROPIC_API_KEY=your_api_key_here
```

**Step 2: Generate a test newsletter**

Run: `pnpm newsletter`

Expected: Newsletter generates successfully with no errors

**Step 3: Verify output includes all sources**

Run: `cat newsletters/$(ls -t newsletters/ | head -1)`

Expected: Newsletter includes:
- Articles from DEV.to, Vue.js Blog, Nuxt Blog, AND alexop.dev
- Discussions from Reddit and HN
- Repositories from GitHub

**Step 4: No commit needed**

This is verification only. Newsletter output in `/newsletters` is not committed.

---

## Task 14: Run Full Build and Lint

**Files:**
- All project files

**Step 1: Run TypeScript type checking**

Run: `pnpm typecheck`

Expected: PASS - no type errors

**Step 2: Run linting**

Run: `pnpm lint`

Expected: PASS - no lint errors

**Step 3: Run build**

Run: `pnpm build`

Expected: PASS - build succeeds

**Step 4: No commit needed**

All files already committed. This is final verification.

---

## Completion Checklist

- [ ] All adapters have `category` property
- [ ] ResourceRegistry returns resources array
- [ ] Category grouping helper function added
- [ ] renderSections uses category-based grouping
- [ ] generateNewsletter uses new grouping logic
- [ ] alexop.dev RSS feed added to sources.json
- [ ] All tests pass
- [ ] TypeScript compilation succeeds
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Manual newsletter generation works
- [ ] Newsletter includes content from all sources including alexop.dev

## Verification Commands

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Tests
pnpm test

# Build
pnpm build

# Generate newsletter
pnpm newsletter
```

## Related Documentation

- Design document: `docs/plans/2025-11-11-rss-feed-refactor-design.md`
- Newsletter guidelines: `scripts/CLAUDE.md`
- Main project guidelines: `CLAUDE.md`
