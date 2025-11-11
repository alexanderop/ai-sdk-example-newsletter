import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createMockLLMClient } from './setup'
import { seedHappyPath } from './fixtures/happy-path-seed'
import { seedPartialFailure } from './fixtures/partial-failure-seed'
import { existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

describe('Newsletter Generation', (): void => {
  const testOutputPath = join(process.cwd(), 'newsletters', 'test-output.md')

  beforeEach((): void => {
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath)
    }
  })

  afterEach((): void => {
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath)
    }
  })

  it('should generate a newsletter using pipeline', async (): Promise<void> => {
    await seedHappyPath()

    const { generateNewsletter } = await import('../scripts/pipelines/newsletter')
    const mockClient = createMockLLMClient()

    const result = await generateNewsletter(mockClient)

    expect(result.text).toContain('# Vue.js Weekly Newsletter')
    expect(result.usage).toBeDefined()
    expect(result.usage.input_tokens).toBeGreaterThan(0)
    expect(result.usage.output_tokens).toBeGreaterThan(0)
  })

  it('should work with Anthropic client', async (): Promise<void> => {
    await seedHappyPath()

    const { AnthropicClient } = await import('../scripts/core/llm/providers/anthropic')
    const { generateNewsletter } = await import('../scripts/pipelines/newsletter')

    const client = new AnthropicClient({
      apiKey: 'test-api-key-for-testing',
      model: 'claude-haiku-4-5-20251001'
    })

    const result = await generateNewsletter(client)

    expect(result.text).toContain('# Vue.js Weekly Newsletter')
    expect(result.usage.input_tokens).toBeGreaterThan(0)
  })

  it('should handle partial source failures gracefully', async (): Promise<void> => {
    await seedPartialFailure()

    const { generateNewsletter } = await import('../scripts/pipelines/newsletter')
    const mockClient = createMockLLMClient()

    const result = await generateNewsletter(mockClient)

    expect(result.text).toContain('# Vue.js Weekly Newsletter')
    expect(result.text.length).toBeGreaterThan(100)
  })

  it('should validate newsletter content has no placeholders', async (): Promise<void> => {
    await seedHappyPath()

    const { generateNewsletter } = await import('../scripts/pipelines/newsletter')
    const { validateNewsletterContent } = await import('../scripts/utils/validate')
    const mockClient = createMockLLMClient()

    const result = await generateNewsletter(mockClient)
    const validation = validateNewsletterContent(result.text)

    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('should fetch from GitHub resource adapter', async (): Promise<void> => {
    await seedHappyPath()

    const { GitHubSearchResource } = await import('../scripts/core/resources/adapters/github')

    const resource = new GitHubSearchResource({
      id: 'test-github',
      kind: 'github',
      url: 'https://api.github.com/search/repositories?q=vue+in:name,description+pushed:>2020-01-01&sort=updated&order=desc&per_page=5',
      limit: 5
    })

    const items = await resource.fetch()

    expect(items).toBeDefined()
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
    expect(items[0]).toHaveProperty('title')
    expect(items[0]).toHaveProperty('url')
    expect(items[0]).toHaveProperty('source')
  })

  it('should fetch from Reddit resource adapter', async (): Promise<void> => {
    await seedHappyPath()

    const { RedditResource } = await import('../scripts/core/resources/adapters/reddit')

    const resource = new RedditResource({
      id: 'test-reddit',
      kind: 'atom',
      url: 'https://www.reddit.com/r/vuejs.rss',
      tag: 'vuejs',
      limit: 10
    })

    const items = await resource.fetch()

    expect(items).toBeDefined()
    expect(Array.isArray(items)).toBe(true)
    items.forEach((item): void => {
      expect(item).toHaveProperty('title')
      expect(item).toHaveProperty('url')
      expect(item).toHaveProperty('source')
    })
  })

  it('should fetch from HN resource adapter', async (): Promise<void> => {
    await seedHappyPath()

    const { HNResource } = await import('../scripts/core/resources/adapters/hn')

    const resource = new HNResource({
      id: 'test-hn',
      kind: 'json',
      url: 'https://hn.algolia.com/api/v1/search?query=vue&tags=story',
      minScore: 20,
      limit: 10
    })

    const items = await resource.fetch()

    expect(items).toBeDefined()
    expect(Array.isArray(items)).toBe(true)
    items.forEach((item): void => {
      expect(item).toHaveProperty('title')
      expect(item).toHaveProperty('url')
      expect(item.source).toBe('Hacker News')
    })
  })

  it('should fetch from DEV.to resource adapter', async (): Promise<void> => {
    await seedHappyPath()

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

  it('should use ResourceRegistry to collect from multiple sources', async (): Promise<void> => {
    await seedHappyPath()

    const { ResourceRegistry } = await import('../scripts/core/resources/registry')

    const registry = new ResourceRegistry()
    registry.register({
      id: 'github-test',
      kind: 'github',
      url: 'https://api.github.com/search/repositories?q=vue&per_page=5',
      limit: 5
    })
    registry.register({
      id: 'reddit-test',
      kind: 'atom',
      url: 'https://www.reddit.com/r/vuejs.rss',
      tag: 'vuejs',
      limit: 10
    })

    const { results: collected } = await registry.collect()

    expect(collected).toHaveProperty('github-test')
    expect(collected).toHaveProperty('reddit-test')
    expect(Array.isArray(collected['github-test'])).toBe(true)
    expect(Array.isArray(collected['reddit-test'])).toBe(true)
  })

  it('should register DevToResource via registry with devto- ID prefix', async (): Promise<void> => {
    await seedHappyPath()

    const { ResourceRegistry } = await import('../scripts/core/resources/registry')

    const registry = new ResourceRegistry()
    registry.register({
      id: 'devto-vue',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue&top=7&per_page=20',
      tag: 'DEV.to #vue',
      limit: 10
    })

    const { results: collected } = await registry.collect()

    expect(collected).toHaveProperty('devto-vue')
    expect(Array.isArray(collected['devto-vue'])).toBe(true)
    expect(collected['devto-vue'].length).toBeGreaterThan(0)
    expect(collected['devto-vue'][0].source).toContain('DEV.to')
  })

  it('should validate newsletter content structure', async (): Promise<void> => {
    const { validateNewsletterContent } = await import('../scripts/utils/validate')

    const validContent = `# Vue.js Weekly Newsletter

## Recent Projects
Some content

## Trending Repositories
More content`

    const result = validateNewsletterContent(validContent)

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should detect invalid newsletter content', async (): Promise<void> => {
    const { validateNewsletterContent } = await import('../scripts/utils/validate')

    const invalidContent = 'Just some text without proper structure'

    const result = validateNewsletterContent(invalidContent)

    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should detect placeholder content', async (): Promise<void> => {
    const { hasPlaceholderContent } = await import('../scripts/utils/validate')

    expect(hasPlaceholderContent('[Project Name] is cool')).toBe(true)
    expect(hasPlaceholderContent('[Date] was yesterday')).toBe(true)
    expect(hasPlaceholderContent('Normal text')).toBe(false)
  })

  it('should calculate token costs correctly', async (): Promise<void> => {
    const { calculateTokenCost } = await import('../scripts/utils/logging')

    const usage = {
      input_tokens: 1000,
      output_tokens: 500,
      cache_creation_input_tokens: 2000,
      cache_read_input_tokens: 5000
    }

    const costs = calculateTokenCost(usage)

    expect(costs.inputCost).toBeCloseTo(0.001) // $1 per million
    expect(costs.outputCost).toBeCloseTo(0.0025) // $5 per million
    expect(costs.cacheCost).toBeCloseTo(0.0025) // $1.25 per million
    expect(costs.cacheReadCost).toBeCloseTo(0.0005) // $0.10 per million
    expect(costs.totalCost).toBeCloseTo(0.0065)
  })

  it('should format dates correctly', async (): Promise<void> => {
    const { format } = await import('../scripts/utils/date')

    const date = new Date('2025-01-15')
    const formatted = format(date)

    expect(formatted).toContain('January')
    expect(formatted).toContain('15')
    expect(formatted).toContain('2025')
  })

  it('should render articles section from DEV.to sources', async (): Promise<void> => {
    await seedHappyPath()

    const { ResourceRegistry } = await import('../scripts/core/resources/registry')

    // First verify DEV.to sources are collected properly
    const registry = new ResourceRegistry()
    registry.register({
      id: 'devto-vue',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue&top=7&per_page=20',
      tag: 'DEV.to #vue',
      limit: 10
    })
    registry.register({
      id: 'devto-nuxt',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=nuxt&top=7&per_page=20',
      tag: 'DEV.to #nuxt',
      limit: 10
    })

    const { results: collected } = await registry.collect()

    // Verify both sources collected articles
    expect(collected['devto-vue']).toBeDefined()
    expect(collected['devto-nuxt']).toBeDefined()
    expect(collected['devto-vue'].length).toBeGreaterThan(0)
    expect(collected['devto-nuxt'].length).toBeGreaterThan(0)

    // Verify articles have expected properties
    const articles = [...collected['devto-vue'], ...collected['devto-nuxt']]
    articles.forEach((article): void => {
      expect(article).toHaveProperty('title')
      expect(article).toHaveProperty('url')
      expect(article).toHaveProperty('score')
      expect(article).toHaveProperty('comments')
      expect(article.source).toContain('DEV.to')
    })
  })

  it('should handle validation errors gracefully and continue with partial data', async (): Promise<void> => {
    const { seedValidationError } = await import('./fixtures/validation-error-seed')
    await seedValidationError()

    const { generateNewsletter } = await import('../scripts/pipelines/newsletter')
    const mockClient = createMockLLMClient()

    // Should not throw - graceful degradation with logged errors
    const result = await generateNewsletter(mockClient)

    // Newsletter still generates despite validation failure
    expect(result.text).toContain('# Vue.js Weekly Newsletter')
    expect(result.text.length).toBeGreaterThan(100)
  })

  it('should return errors object when resources fail', async (): Promise<void> => {
    const { seedValidationError } = await import('./fixtures/validation-error-seed')
    await seedValidationError()

    const { ResourceRegistry } = await import('../scripts/core/resources/registry')

    const registry = new ResourceRegistry()
    registry.register({
      id: 'github-news',
      kind: 'github',
      url: 'https://api.github.com/search/repositories?q=vue',
      limit: 5
    })

    const { results, errors } = await registry.collect()

    // Verify errors object contains the failed resource
    expect(errors['github-news']).toBeDefined()
    expect(errors['github-news']).toBeInstanceOf(Error)
    expect(errors['github-news'].message).toContain('Resource validation failed')

    // Verify results still contains empty array for failed resource
    expect(results['github-news']).toBeDefined()
    expect(Array.isArray(results['github-news'])).toBe(true)
    expect(results['github-news'].length).toBe(0)
  })

  it('should return partial results when some resources succeed and others fail', async (): Promise<void> => {
    const { seedPartialFailure } = await import('./fixtures/partial-failure-seed')
    await seedPartialFailure()

    const { ResourceRegistry } = await import('../scripts/core/resources/registry')

    const registry = new ResourceRegistry()
    registry.register({
      id: 'devto-vue',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue',
      tag: 'DEV.to',
      limit: 10
    })
    registry.register({
      id: 'github-news',
      kind: 'github',
      url: 'https://api.github.com/search/repositories?q=vue',
      limit: 5
    })

    const { results, errors } = await registry.collect()

    // Verify successful resource has data
    expect(results['devto-vue']).toBeDefined()
    expect(results['devto-vue'].length).toBeGreaterThan(0)

    // Verify failed resource has empty array (no repos seeded)
    expect(results['github-news']).toBeDefined()
    expect(results['github-news'].length).toBe(0)

    // Errors might be empty if the resource returns successfully with no data
    // (partial failure seed doesn't seed repos, but doesn't cause validation error)
  })
})
