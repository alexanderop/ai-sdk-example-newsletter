import { describe, it, expect } from 'vitest'
import { NewsletterConfigSchema, SourceConfigSchema } from '../schemas/config'

describe('NewsletterConfigSchema', () => {
  it('validates valid newsletter config', () => {
    const config = {
      title: 'Vue.js Weekly',
      description: 'Weekly Vue.js news',
      author: 'John Doe',
      siteUrl: 'https://example.com',
      topic: 'Vue.js',
      slug: 'vue-weekly',
      language: 'en'
    }

    const result = NewsletterConfigSchema.parse(config)
    expect(result).toEqual(config)
  })

  it('requires title, description, and siteUrl', () => {
    const config = {
      author: 'John Doe'
    }

    expect(() => NewsletterConfigSchema.parse(config)).toThrow()
  })

  it('uses default values for optional fields', () => {
    const config = {
      title: 'Test Newsletter',
      description: 'Test description',
      siteUrl: 'https://example.com'
    }

    const result = NewsletterConfigSchema.parse(config)
    expect(result.language).toBe('en')
    expect(result.author).toBeDefined()
  })
})

describe('SourceConfigSchema', () => {
  it('validates RSS source config', () => {
    const source = {
      id: 'test-rss',
      kind: 'rss',
      url: 'https://example.com/feed.rss',
      tag: 'Example RSS',
      limit: 10,
      priority: 3
    }

    const result = SourceConfigSchema.parse(source)
    expect(result).toEqual(source)
  })

  it('uses default priority of 3', () => {
    const source = {
      id: 'test-rss',
      kind: 'rss',
      url: 'https://example.com/feed.rss',
      limit: 10
    }

    const result = SourceConfigSchema.parse(source)
    expect(result.priority).toBe(3)
  })

  it('validates priority is between 1 and 5', () => {
    const source = {
      id: 'test-rss',
      kind: 'rss',
      url: 'https://example.com/feed.rss',
      limit: 10,
      priority: 6
    }

    expect(() => SourceConfigSchema.parse(source)).toThrow()
  })
})
