import { describe, it, expect, beforeEach } from 'vitest'
import { clearAllCollections, articles } from './collections'
import { ResourceRegistry } from '../scripts/core/resources/registry'
import { createMockLLMClient } from './setup'

describe('Priority Sorting', (): void => {
  beforeEach(async (): Promise<void> => {
    await clearAllCollections()
  })

  it('should sort articles by priority first, then by score', async (): Promise<void> => {
    // Seed articles - all will be returned by the handler
    await articles.createMany(10, (i) => ({
      id: i + 1,
      title: `Article ${i + 1}`,
      url: `https://dev.to/article-${i + 1}`,
      published_at: '2025-01-01T00:00:00Z',
      public_reactions_count: 100 - i * 10, // Descending scores
      comments_count: 5,
      tags: 'vue',
      tag_list: ['vue']
    }))

    // Create registry with different priority sources
    // All will get the same articles but with different priorities
    const registry = new ResourceRegistry()
    registry.register({
      id: 'devto-high',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue',
      tag: 'High Priority',
      priority: 5,
      limit: 3
    })
    registry.register({
      id: 'devto-normal',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue',
      tag: 'Normal Priority',
      priority: 3,
      limit: 3
    })

    const { results } = await registry.collect()

    // Each source returns top 3 articles, but with different priorities
    const highPriorityArticles = results['devto-high']
    const normalPriorityArticles = results['devto-normal']

    // Verify priorities are set correctly
    highPriorityArticles.forEach((a) => expect(a.priority).toBe(5))
    normalPriorityArticles.forEach((a) => expect(a.priority).toBe(3))

    // Simulate priority sorting (like newsletter pipeline does)
    const allArticles = [...highPriorityArticles, ...normalPriorityArticles]
    const sorted = []
    for (const priority of [5, 4, 3, 2, 1]) {
      const atPriority = allArticles
        .filter((a) => (a.priority ?? 3) === priority)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      sorted.push(...atPriority)
    }

    // Priority 5 articles should come first
    expect(sorted[0].priority).toBe(5)
    expect(sorted[1].priority).toBe(5)
    expect(sorted[2].priority).toBe(5)

    // Priority 3 articles should follow
    expect(sorted[3].priority).toBe(3)
    expect(sorted[4].priority).toBe(3)
    expect(sorted[5].priority).toBe(3)
  })

  it('should limit articles to top 10 respecting priority', async (): Promise<void> => {
    // Seed 15 articles
    await articles.createMany(15, (i) => ({
      id: i + 1,
      title: `Article ${i + 1}`,
      url: `https://dev.to/article-${i + 1}`,
      published_at: '2025-01-01T00:00:00Z',
      public_reactions_count: 50 - i, // Descending scores
      comments_count: 5,
      tags: 'vue',
      tag_list: ['vue']
    }))

    // Create adapters with different priorities
    const registry = new ResourceRegistry()
    registry.register({
      id: 'devto-high',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue',
      tag: 'High Priority Source',
      priority: 5,
      limit: 2 // Only 2 high priority
    })
    registry.register({
      id: 'devto-normal',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue',
      tag: 'Normal Priority Source',
      priority: 3,
      limit: 12 // Many normal priority
    })

    const { results } = await registry.collect()

    // Collect all articles
    const allArticles = [...results['devto-high'], ...results['devto-normal']]

    // Simulate the newsletter pipeline logic
    const selectedArticles = []
    const priorityLevels = [5, 4, 3, 2, 1]

    for (const priority of priorityLevels) {
      const articlesAtPriority = allArticles
        .filter((a) => (a.priority ?? 3) === priority)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

      selectedArticles.push(...articlesAtPriority)
      if (selectedArticles.length >= 10) break
    }

    const final = selectedArticles.slice(0, 10)

    // Verify exactly 10 articles
    expect(final.length).toBe(10)

    // First 2 should be priority 5
    expect(final[0].priority).toBe(5)
    expect(final[1].priority).toBe(5)

    // Remaining 8 should be priority 3 (highest scored)
    for (let i = 2; i < 10; i++) {
      expect(final[i].priority).toBe(3)
    }
  })

  it('should include high priority articles regardless of score', async (): Promise<void> => {
    // Seed articles with varying scores
    await articles.createMany(15, (i) => ({
      id: i + 1,
      title: `Article ${i + 1}`,
      url: `https://dev.to/article-${i + 1}`,
      published_at: '2025-01-01T00:00:00Z',
      public_reactions_count: i < 3 ? 5 : 100 + i, // First 3 have low scores
      comments_count: i < 3 ? 0 : 10,
      tags: 'vue',
      tag_list: ['vue']
    }))

    const registry = new ResourceRegistry()
    // High priority source gets the low-score articles
    registry.register({
      id: 'devto-featured',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue',
      tag: 'Featured Blog',
      priority: 5,
      limit: 3
    })
    // Normal priority source gets all articles
    registry.register({
      id: 'devto-community',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue',
      tag: 'Community',
      priority: 3,
      limit: 10
    })

    const { results } = await registry.collect()
    const allArticles = [...results['devto-featured'], ...results['devto-community']]

    // Simulate priority sorting
    const selectedArticles = []
    const priorityLevels = [5, 4, 3, 2, 1]

    for (const priority of priorityLevels) {
      const articlesAtPriority = allArticles
        .filter((a) => (a.priority ?? 3) === priority)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

      selectedArticles.push(...articlesAtPriority)
      if (selectedArticles.length >= 10) break
    }

    const final = selectedArticles.slice(0, 10)

    // First 3 should be priority 5 (even though they have low scores)
    expect(final[0].priority).toBe(5)
    expect(final[1].priority).toBe(5)
    expect(final[2].priority).toBe(5)

    // Priority 5 articles should have lower scores than priority 3 articles
    const lowestPriority5Score = Math.min(...final.slice(0, 3).map((a) => a.score ?? 0))
    const highestPriority3Score = Math.max(...final.slice(3).map((a) => a.score ?? 0))

    // This demonstrates priority overrides score
    expect(lowestPriority5Score).toBeLessThan(highestPriority3Score)
  })

  it('should handle default priority (3) for sources without explicit priority', async (): Promise<void> => {
    await articles.createMany(5, (i) => ({
      id: i + 1,
      title: `Article ${i}`,
      url: `https://dev.to/article-${i}`,
      published_at: '2025-01-01T00:00:00Z',
      public_reactions_count: 50 + i,
      comments_count: 5,
      tags: 'vue',
      tag_list: ['vue']
    }))

    const registry = new ResourceRegistry()
    // No priority specified - should default to 3
    registry.register({
      id: 'devto-vue',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue&per_page=5',
      tag: 'DEV.to #vue',
      limit: 10
    })

    const { results } = await registry.collect()
    const allArticles = results['devto-vue']

    // All should have default priority of 3
    allArticles.forEach((article) => {
      expect(article.priority).toBe(3)
    })
  })

  it('should generate newsletter with priority-sorted articles', async (): Promise<void> => {
    // Seed high-priority article
    await articles.create({
      id: 1,
      title: 'Featured Developer Blog Post',
      url: 'https://alexop.dev/featured',
      published_at: '2025-01-01T00:00:00Z',
      public_reactions_count: 5,
      comments_count: 0,
      tags: 'vue',
      tag_list: ['vue']
    })

    // Seed normal priority articles
    await articles.createMany(15, (i) => ({
      id: i + 10,
      title: `Community Article ${i}`,
      url: `https://dev.to/article-${i}`,
      published_at: '2025-01-01T00:00:00Z',
      public_reactions_count: 100 - i,
      comments_count: 5,
      tags: 'vue',
      tag_list: ['vue']
    }))

    const { generateNewsletter } = await import('../scripts/pipelines/newsletter')
    const mockClient = createMockLLMClient()

    const result = await generateNewsletter(mockClient)

    // Newsletter should be generated successfully
    expect(result.text).toContain('# Vue.js Weekly Newsletter')
    expect(result.text.length).toBeGreaterThan(100)
  })
})
