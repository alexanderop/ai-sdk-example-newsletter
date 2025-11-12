import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Reddit Adapter Unit Tests
 *
 * These tests verify the RedditResource adapter correctly uses configuration
 * values, especially ensuring it uses the provided URL instead of constructing
 * one from the tag field.
 */

describe('RedditResource Adapter', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks()
  })

  it('should use the URL from config, not construct one from tag', async (): Promise<void> => {
    // This is THE CRITICAL TEST that was missing
    // It would have caught the bug where adapter constructed URL from tag

    const { RedditResource } = await import('../../scripts/core/resources/adapters/reddit')

    // Mock fetch to spy on which URL is actually requested
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(`
        <feed>
          <entry>
            <title>Test Post</title>
            <link href="https://reddit.com/r/vuejs/test"/>
            <updated>2025-01-01T00:00:00Z</updated>
          </entry>
        </feed>
      `, { status: 200 })
    )
    global.fetch = fetchSpy

    // Config with mismatched URL and tag (like production had)
    const resource = new RedditResource({
      id: 'test-reddit',
      kind: 'atom',
      url: 'https://www.reddit.com/r/vuejs.rss', // Correct URL
      tag: 'Reddit r/vuejs', // Display name with spaces
      limit: 10
    })

    await resource.fetch()

    // VERIFY: adapter used the config URL, not constructed one from tag
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Get the actual URL that was requested
    const actualUrl = fetchSpy.mock.calls[0][0]

    // Should be the config URL, NOT https://www.reddit.com/r/Reddit r/vuejs.rss
    expect(actualUrl).toBe('https://www.reddit.com/r/vuejs.rss')
    expect(actualUrl).not.toContain('Reddit r/')
    expect(actualUrl).not.toContain(' ') // No spaces in URL
  })

  it('should extract subreddit name from URL for source field', async (): Promise<void> => {
    const { RedditResource } = await import('../../scripts/core/resources/adapters/reddit')

    global.fetch = vi.fn().mockResolvedValue(
      new Response(`
        <feed>
          <entry>
            <title>Test Post</title>
            <link href="https://reddit.com/r/vuejs/test"/>
            <updated>2025-01-01T00:00:00Z</updated>
          </entry>
        </feed>
      `, { status: 200 })
    )

    const resource = new RedditResource({
      id: 'test-reddit',
      kind: 'atom',
      url: 'https://www.reddit.com/r/Nuxt.rss',
      tag: 'Reddit r/Nuxt',
      limit: 10
    })

    const items = await resource.fetch()

    // Source should be extracted from URL, not from tag
    expect(items[0].source).toBe('r/Nuxt')
    expect(items[0].source).not.toBe('r/Reddit r/Nuxt')
  })

  it('should handle URLs without tag field', async (): Promise<void> => {
    const { RedditResource } = await import('../../scripts/core/resources/adapters/reddit')

    global.fetch = vi.fn().mockResolvedValue(
      new Response(`
        <feed>
          <entry>
            <title>Test Post</title>
            <link href="https://reddit.com/r/vuejs/test"/>
            <updated>2025-01-01T00:00:00Z</updated>
          </entry>
        </feed>
      `, { status: 200 })
    )

    // No tag provided - adapter should still work with just URL
    const resource = new RedditResource({
      id: 'test-reddit',
      kind: 'atom',
      url: 'https://www.reddit.com/r/programming.rss',
      limit: 10
    })

    const items = await resource.fetch()

    expect(items).toHaveLength(1)
    expect(items[0].source).toBe('r/programming')
  })
})
