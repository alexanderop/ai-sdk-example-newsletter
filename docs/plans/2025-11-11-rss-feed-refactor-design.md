# RSS Feed Refactor Design

**Date:** 2025-11-11
**Status:** Validated
**Goal:** Refactor newsletter generator to make adding new RSS feeds trivial

## Problem Statement

The current newsletter generator hardcodes resource IDs in `renderSections()`, making it difficult to add new RSS feeds or other data sources. Adding a new RSS feed requires:
1. Adding config to sources.json
2. Modifying renderSections() to include the new resource ID
3. Understanding which section to add it to

This creates unnecessary friction for a common operation.

## Solution Overview

Introduce a **category-based system** where each adapter declares which newsletter section its content belongs to. The rendering logic groups items by category instead of by resource ID, making new sources automatically appear in the correct section.

## Design Details

### 1. Category System

Add a `category` property to the `Resource` interface:

```typescript
// New type for categories
export type ContentCategory = 'articles' | 'repos' | 'discussions' | 'news'

// Updated Resource interface
export interface Resource {
  id: string
  category: ContentCategory  // NEW: each adapter declares its category
  fetch(): Promise<Item[]>
}
```

**Adapter-to-Category Mapping:**
- RSS adapters → `'articles'`
- DevTo adapters → `'articles'`
- GitHub adapters → `'repos'`
- Reddit adapters → `'discussions'`
- HN adapters → `'discussions'`

### 2. Refactored Rendering Logic

Replace resource ID-based grouping with category-based grouping:

```typescript
// New helper function
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

  resources.forEach(resource => {
    const items = collected[resource.id] || []
    grouped[resource.category].push(...items)
  })

  return grouped
}

// Simplified renderSections
function renderSections(grouped: Record<ContentCategory, Item[]>): {
  news: string
  repos: string
  discussions: string
  articles: string
} {
  // Articles section combines RSS + DevTo automatically
  const articles = grouped.articles
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 10)
    .map((item, idx) => formatArticle(item, idx))
    .join('\n') || '- No recent articles available'

  // Similar for other categories...
}
```

### 3. Adding New RSS Feeds

No config format changes needed. Adding a new RSS feed is a single JSON entry:

```json
{
  "id": "rss-alexop-blog",
  "kind": "rss",
  "url": "https://alexop.dev/rss.xml",
  "tag": "Alex Opalic's Blog",
  "limit": 10
}
```

The `tag` field becomes the `source` property displayed in the newsletter.

## Implementation Plan

### Files to Modify

1. **`scripts/core/resources/types.ts`**
   - Add `ContentCategory` type
   - Add `category` property to `Resource` interface

2. **Adapter files** (devto.ts, github.ts, hn.ts, reddit.ts, rss.ts)
   - Add `public category: ContentCategory` property
   - Set category in constructor based on adapter type

3. **`scripts/core/resources/registry.ts`**
   - Update `collect()` to return resources array alongside results
   - Minimal logic changes

4. **`scripts/pipelines/newsletter.ts`**
   - Add `groupByCategory()` helper function
   - Refactor `renderSections()` to accept grouped items by category
   - Update `generateNewsletter()` to use new grouping logic

5. **`scripts/config/sources.json`**
   - Add new entry for alexop.dev RSS feed

### Edge Cases

- Empty categories render friendly "No content available" messages (already handled)
- Resource failures gracefully degrade (already handled)
- Items are sorted/limited per category, not per resource
- Multiple RSS feeds automatically combine in articles section

### Testing Considerations

- Existing tests continue to work (adapter interface remains compatible)
- May need to update tests that verify rendered output format
- Test that multiple RSS feeds combine correctly in articles section
- Verify graceful degradation when individual RSS feeds fail

## Benefits

✅ **Zero code changes to add new RSS feeds** - Just add to sources.json
✅ **Automatic categorization** - Adapter type determines newsletter section
✅ **Centralized formatting** - One place to update article/discussion/repo formatting
✅ **Maintains existing behavior** - All current sources continue working
✅ **Type-safe** - Category system enforced by TypeScript

## Migration Impact

**Backward Compatible:** All existing resource configs continue working without modification.

**No Breaking Changes:** The `Resource` interface gains a new required property, but all existing adapters will be updated in the same PR.
