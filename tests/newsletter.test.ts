import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { server, createMockLLMClient } from './setup'
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

  it('should generate a newsletter using pipeline', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletter } = await import('../scripts/pipelines/newsletter')
    const mockClient = createMockLLMClient()

    const result = await generateNewsletter(mockClient)

    expect(result.text).toContain('# Vue.js Weekly Newsletter')
    expect(result.usage).toBeDefined()
    expect(result.usage.input_tokens).toBeGreaterThan(0)
    expect(result.usage.output_tokens).toBeGreaterThan(0)
  })

  it('should work with Anthropic client', async () => {
    server.use(...happyPathScenario)

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

  it('should handle partial source failures gracefully', async () => {
    server.use(...partialFailureScenario)

    const { generateNewsletter } = await import('../scripts/pipelines/newsletter')
    const mockClient = createMockLLMClient()

    const result = await generateNewsletter(mockClient)

    expect(result.text).toContain('# Vue.js Weekly Newsletter')
    expect(result.text.length).toBeGreaterThan(100)
  })

  it('should validate newsletter content has no placeholders', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletter } = await import('../scripts/pipelines/newsletter')
    const { validateNewsletterContent } = await import('../scripts/utils/validate')
    const mockClient = createMockLLMClient()

    const result = await generateNewsletter(mockClient)
    const validation = validateNewsletterContent(result.text)

    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('should fetch from GitHub resource adapter', async () => {
    server.use(...happyPathScenario)

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

  it('should fetch from Reddit resource adapter', async () => {
    server.use(...happyPathScenario)

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
    items.forEach((item) => {
      expect(item).toHaveProperty('title')
      expect(item).toHaveProperty('url')
      expect(item).toHaveProperty('source')
    })
  })

  it('should fetch from HN resource adapter', async () => {
    server.use(...happyPathScenario)

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
    items.forEach((item) => {
      expect(item).toHaveProperty('title')
      expect(item).toHaveProperty('url')
      expect(item.source).toBe('Hacker News')
    })
  })

  it('should use ResourceRegistry to collect from multiple sources', async () => {
    server.use(...happyPathScenario)

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

    const collected = await registry.collect()

    expect(collected).toHaveProperty('github-test')
    expect(collected).toHaveProperty('reddit-test')
    expect(Array.isArray(collected['github-test'])).toBe(true)
    expect(Array.isArray(collected['reddit-test'])).toBe(true)
  })

  it('should validate newsletter content structure', async () => {
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

  it('should detect invalid newsletter content', async () => {
    const { validateNewsletterContent } = await import('../scripts/utils/validate')

    const invalidContent = 'Just some text without proper structure'

    const result = validateNewsletterContent(invalidContent)

    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should detect placeholder content', async () => {
    const { hasPlaceholderContent } = await import('../scripts/utils/validate')

    expect(hasPlaceholderContent('[Project Name] is cool')).toBe(true)
    expect(hasPlaceholderContent('[Date] was yesterday')).toBe(true)
    expect(hasPlaceholderContent('Normal text')).toBe(false)
  })

  it('should calculate token costs correctly', async () => {
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

  it('should format dates correctly', async () => {
    const { format } = await import('../scripts/utils/date')

    const date = new Date('2025-01-15')
    const formatted = format(date)

    expect(formatted).toContain('January')
    expect(formatted).toContain('15')
    expect(formatted).toContain('2025')
  })
})
