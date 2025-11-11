import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DevToResource } from '../scripts/core/resources/adapters/devto'
import { GitHubSearchResource } from '../scripts/core/resources/adapters/github'
import { HNResource } from '../scripts/core/resources/adapters/hn'
import * as httpModule from '../scripts/core/fetch/http'

describe('Schema Validation Error Handling', (): void => {
  beforeEach((): void => {
    vi.restoreAllMocks()
  })

  it('should throw error on invalid DEV.to API response', async (): Promise<void> => {
    // Mock getJson to return invalid data
    const getJsonSpy = vi.spyOn(httpModule, 'getJson').mockResolvedValue([
      {
        id: 123,
        title: 'Test Article',
        // Missing required fields like url, published_at, etc.
        invalid_field: 'This should not be here'
      }
    ])

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation((): void => {})

    const resource = new DevToResource({
      id: 'test-devto',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue',
      tag: 'DEV.to',
      limit: 10
    })

    // Should throw error instead of returning empty array
    await expect(resource.fetch()).rejects.toThrow('Resource validation failed for test-devto')

    // Should log validation error
    expect(consoleSpy).toHaveBeenCalled()
    const errorCall = consoleSpy.mock.calls[0]
    expect(errorCall[0]).toContain('[test-devto] API response validation failed:')

    expect(getJsonSpy).toHaveBeenCalled()
  })

  it('should throw error on invalid GitHub API response', async (): Promise<void> => {
    // Mock getJson to return invalid data structure
    const getJsonSpy = vi.spyOn(httpModule, 'getJson').mockResolvedValue({
      // Missing items array
      total_count: 100,
      incomplete_results: false
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation((): void => {})

    const resource = new GitHubSearchResource({
      id: 'test-github',
      kind: 'github',
      url: 'https://api.github.com/search/repositories?q=vue',
      limit: 5
    })

    // Should throw error instead of returning empty array
    await expect(resource.fetch()).rejects.toThrow('Resource validation failed for test-github')

    // Should log validation error
    expect(consoleSpy).toHaveBeenCalled()
    const errorCall = consoleSpy.mock.calls[0]
    expect(errorCall[0]).toContain('[test-github] API response validation failed:')

    expect(getJsonSpy).toHaveBeenCalled()
  })

  it('should throw error on invalid HN API response', async (): Promise<void> => {
    // Mock getJson to return invalid hits structure
    const getJsonSpy = vi.spyOn(httpModule, 'getJson').mockResolvedValue({
      hits: [
        {
          title: 'Test Story'
          // Missing required fields like objectID, points, etc.
        }
      ],
      nbHits: 1
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation((): void => {})

    const resource = new HNResource({
      id: 'test-hn',
      kind: 'json',
      url: 'https://hn.algolia.com/api/v1/search?query=vue',
      minScore: 20,
      limit: 10
    })

    // Should throw error instead of returning empty array
    await expect(resource.fetch()).rejects.toThrow('Resource validation failed for test-hn')

    // Should log validation error
    expect(consoleSpy).toHaveBeenCalled()
    const errorCall = consoleSpy.mock.calls[0]
    expect(errorCall[0]).toContain('[test-hn] API response validation failed:')

    expect(getJsonSpy).toHaveBeenCalled()
  })

  it('should re-throw network errors', async (): Promise<void> => {
    // Mock getJson to throw network error
    const networkError = new Error('Network request failed')
    vi.spyOn(httpModule, 'getJson').mockRejectedValue(networkError)

    const resource = new DevToResource({
      id: 'test-devto',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue',
      tag: 'DEV.to',
      limit: 10
    })

    // Network errors should be re-thrown, not swallowed
    await expect(resource.fetch()).rejects.toThrow('Network request failed')
  })

  it('should handle valid data correctly', async (): Promise<void> => {
    // Mock getJson to return valid data
    vi.spyOn(httpModule, 'getJson').mockResolvedValue([
      {
        id: 123,
        title: 'Test Article',
        url: 'https://dev.to/test',
        published_at: '2025-01-01T00:00:00Z',
        public_reactions_count: 50,
        comments_count: 10,
        tags: 'vue, javascript',
        tag_list: ['vue', 'javascript'],
        user: { name: 'Test User' }
      }
    ])

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation((): void => {})

    const resource = new DevToResource({
      id: 'test-devto',
      kind: 'json',
      url: 'https://dev.to/api/articles?tag=vue',
      tag: 'DEV.to',
      limit: 10
    })

    const result = await resource.fetch()

    // Should return parsed data
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      title: 'Test Article',
      url: 'https://dev.to/test',
      score: 50,
      comments: 10
    })

    // Should NOT log validation error
    expect(consoleSpy).not.toHaveBeenCalled()
  })
})
