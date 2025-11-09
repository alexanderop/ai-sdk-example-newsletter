# DEV.to Integration Design

**Date**: 2025-11-09
**Status**: Approved

## Overview

Add DEV.to as a content source for the Vue.js newsletter generator, creating a new "Articles & Tutorials" section that fetches popular Vue and Nuxt articles from the DEV.to public API.

## Requirements

- Fetch Vue and Nuxt articles from DEV.to API
- Sort by reaction count (hearts/likes) to prioritize popular content
- Use 7-day time window (most popular articles from last week)
- Display in new "Articles & Tutorials" section, separate from community discussions
- No authentication required (public API endpoint)

## Architecture

### Integration Points

1. **New adapter**: `scripts/core/resources/adapters/devto.ts` implements `Resource` interface
2. **Registry update**: `scripts/core/resources/registry.ts` detects `kind: "json"` + `id.startsWith('devto-')`
3. **Configuration**: `scripts/config/sources.json` adds two entries (Vue and Nuxt tags)
4. **Pipeline rendering**: `scripts/pipelines/newsletter.ts` adds `renderArticlesSection()` logic

### Data Flow

```
sources.json (devto-vue, devto-nuxt)
  ↓
ResourceRegistry.register() → creates DevToResource instances
  ↓
ResourceRegistry.collect() → parallel fetch from DEV.to API
  ↓
renderSections() → combines & sorts by reactions
  ↓
LLM context → "Articles & Tutorials from DEV.to:\n..."
  ↓
Generated newsletter
```

## Implementation Details

### 1. DEV.to Adapter

**File**: `scripts/core/resources/adapters/devto.ts`

**Type Definitions**:
```typescript
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
```

**Mapping to Item Type**:
- `title` → `title`
- `url` → `url`
- `published_at` → `date` (parsed to Date)
- `public_reactions_count` → `score`
- `comments_count` → `comments`
- `tags` → `description` (formatted as "#vue #javascript")
- `config.tag` → `source` (e.g., "DEV.to #vue")

**Implementation**:
```typescript
export class DevToResource implements Resource {
  id: string
  private url: string
  private limit: number
  private source: string

  constructor(cfg: ResourceConfig) {
    this.id = cfg.id
    this.url = cfg.url  // Full API URL from config
    this.limit = cfg.limit ?? 10
    this.source = cfg.tag ?? 'DEV.to'
  }

  async fetch(): Promise<Item[]> {
    const data = await getJson<DevToArticle[]>(this.url)
    return (data ?? [])
      .sort((a, b) => b.public_reactions_count - a.public_reactions_count)
      .slice(0, this.limit)
      .map(article => ({
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

**Key Decisions**:
- No authentication headers (public endpoint)
- Sort by reactions *before* applying limit (get top N by popularity, not recency)
- Fallback to empty array for null/undefined responses
- Tag formatting with `#` prefix for consistency

### 2. Registry Update

**File**: `scripts/core/resources/registry.ts`

Add DEV.to detection to the registration chain:

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

**Pattern**: Reuses `kind: "json"` with ID-based detection, matching the existing HN pattern.

### 3. Configuration

**File**: `scripts/config/sources.json`

Add two new entries:

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

**URL Parameters**:
- `tag=vue` or `tag=nuxt` - Filter by tag
- `top=7` - Most popular from last 7 days
- `per_page=20` - Fetch 20 articles (more than limit)

**Why per_page=20 but limit=10?** API returns articles by publish date, not reactions. Fetching more allows us to sort by reactions and take the top 10 *most popular*, not just 10 most recent.

### 4. Newsletter Pipeline

**File**: `scripts/pipelines/newsletter.ts`

**Update renderSections function**:

```typescript
function renderSections(collected: Record<string, Item[]>): {
  news: string,
  repos: string,
  reddit: string,
  articles: string
} {
  // ... existing news, repos, reddit logic ...

  const articles = [...(collected['devto-vue'] ?? []), ...(collected['devto-nuxt'] ?? [])]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 10)
    .map((article, idx) => {
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
}
```

**Update context in generateNewsletter**:

```typescript
const { news, repos, reddit, articles } = renderSections(collected)
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

**Formatting Details**:
- Combine both sources (devto-vue + devto-nuxt)
- Re-sort by reactions (ensures proper ordering across sources)
- Slice to top 10 combined articles
- Two-line display: title/metadata, then tags indented
- Show reactions (❤️), comments (💬), date, and tags

## Testing Considerations

### Mock Data Requirements

**MSW handler** for `https://dev.to/api/articles`:
- Return array of DevToArticle objects
- Include various reaction counts for sorting tests
- Include both vue and nuxt tags
- Test empty response handling

### Test Scenarios

1. **Adapter unit tests**:
   - Fetch and map articles correctly
   - Sort by reactions (descending)
   - Apply limit correctly
   - Handle empty/null responses
   - Format tags with # prefix

2. **Registry integration tests**:
   - Detect `devto-*` IDs correctly
   - Instantiate DevToResource adapter
   - Throw error for unknown kinds

3. **Pipeline integration tests**:
   - Combine devto-vue and devto-nuxt sources
   - Sort combined results by reactions
   - Format articles section correctly
   - Handle missing sources gracefully

## API Reference

**Endpoint**: `https://dev.to/api/articles`

**Parameters**:
- `tag` - Filter by tag (e.g., "vue", "nuxt")
- `top` - Most popular from last N days
- `per_page` - Number of results (max 1000)

**Authentication**: None required for public endpoints

**Rate Limiting**: 429 "Too Many Requests" may occur (handled by existing retry logic in `http.ts`)

**Documentation**: https://developers.forem.com/api/v0

## Open Questions

None - design approved and ready for implementation.

## Next Steps

1. Use `superpowers:using-git-worktrees` to create isolated workspace
2. Use `superpowers:writing-plans` to create detailed implementation plan
3. Implement using TDD approach (tests first, then implementation)
4. Verify with generated newsletter output
