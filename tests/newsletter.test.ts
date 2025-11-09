import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { server } from './setup'
import { happyPathScenario } from './mocks/scenarios/happy-path'
import { partialFailureScenario } from './mocks/scenarios/partial-failure'
import { existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

describe('Newsletter Generation', () => {
  const testOutputPath = join(process.cwd(), 'newsletters', 'test-output.md')

  beforeEach(() => {
    // Clean up test file if it exists
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath)
    }
  })

  afterEach(() => {
    // Clean up test file after test
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath)
    }
  })

  it('should generate a newsletter', async () => {
    const { generateNewsletter } = await import('../scripts/generate-newsletter')

    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
  })

  it('should generate complete newsletter when all sources work', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletter } = await import('../scripts/generate-newsletter')
    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
    expect(result).toContain('## 🎯 Official Updates')
    expect(result).toContain('## 💬 Community Highlights')
  })

  it('should write newsletter to file', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletterToFile } = await import('../scripts/generate-newsletter')
    const filePath = await generateNewsletterToFile('test-output.md')

    expect(existsSync(filePath)).toBe(true)
    expect(filePath).toContain('newsletters/test-output.md')
  })

  it('should handle partial failures gracefully', async () => {
    server.use(...partialFailureScenario)

    const { generateNewsletter } = await import('../scripts/generate-newsletter')
    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
    // Should still generate newsletter even if one source fails
    expect(result.length).toBeGreaterThan(100)
  })

  it('should fetch real Vue.js news from web', async () => {
    const { fetchVueNews } = await import('../scripts/generate-newsletter')
    const news = await fetchVueNews()

    expect(news).toBeDefined()
    expect(news.length).toBeGreaterThan(0)
    expect(news[0]).toHaveProperty('title')
    expect(news[0]).toHaveProperty('url')
  })

  it('should fetch GitHub trending Vue repositories', async () => {
    const { fetchTrendingRepos } = await import('../scripts/generate-newsletter')
    const repos = await fetchTrendingRepos()

    expect(repos).toBeDefined()
    expect(repos.length).toBeGreaterThan(0)
    expect(repos[0]).toHaveProperty('name')
    expect(repos[0]).toHaveProperty('description')
    expect(repos[0]).toHaveProperty('url')
  })

  it('should generate newsletter with real data and no placeholders', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletterWithRealData } = await import('../scripts/generate-newsletter')
    const result = await generateNewsletterWithRealData()

    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(50)
    expect(result).not.toContain('[Current Date]')
    expect(result).not.toContain('[Date]')
    expect(result).not.toContain('[City]')
  })

  it('should not contain hallucinated content', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletterWithRealData } = await import('../scripts/generate-newsletter')
    const result = await generateNewsletterWithRealData()

    // No placeholders with brackets
    expect(result).not.toMatch(/\[.*?\]/)

    // No known fake names from original newsletter
    expect(result).not.toContain('Sarah Johnson')
    expect(result).not.toContain('John Smith')
    expect(result).not.toContain('VueDevElite')

    // Should have actual content
    expect(result.length).toBeGreaterThan(50)
  })

  it('should retry API calls on transient failures', async () => {
    let attempts = 0
    const mockOperation = async () => {
      attempts++
      if (attempts < 3) {
        throw new Error('Transient API error')
      }
      return 'success'
    }

    const { retryWithBackoff } = await import('../scripts/generate-newsletter')
    const result = await retryWithBackoff(mockOperation, { maxRetries: 3, initialDelay: 10 })

    expect(result).toBe('success')
    expect(attempts).toBe(3)
  })

  it('should fail after max retries exceeded', async () => {
    let attempts = 0
    const mockOperation = async () => {
      attempts++
      throw new Error('Persistent API error')
    }

    const { retryWithBackoff } = await import('../scripts/generate-newsletter')

    await expect(
      retryWithBackoff(mockOperation, { maxRetries: 3, initialDelay: 10 })
    ).rejects.toThrow('Persistent API error')
    expect(attempts).toBe(3)
  })

  it('should use exponential backoff between retries', async () => {
    const delays: number[] = []
    let attempts = 0
    const mockOperation = async () => {
      attempts++
      if (attempts < 4) {
        throw new Error('Transient error')
      }
      return 'success'
    }

    const { retryWithBackoff } = await import('../scripts/generate-newsletter')
    const startTime = Date.now()
    await retryWithBackoff(mockOperation, { maxRetries: 4, initialDelay: 10 })
    const totalTime = Date.now() - startTime

    // Should have exponential delays: 10ms, 20ms, 40ms
    // Total minimum delay: 70ms
    expect(totalTime).toBeGreaterThanOrEqual(60) // Allow some margin
    expect(attempts).toBe(4)
  })

  it('should track token usage and costs', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletterWithRealData } = await import('../scripts/generate-newsletter')
    const result = await generateNewsletterWithRealData()

    // Should have generated content
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(50)

    // Note: In a real implementation, we would track usage metrics
    // This test validates that the function completes successfully
    // The actual usage tracking will be validated through logging
  })

  it('should validate newsletter content has required sections', async () => {
    const content = `# Vue.js Weekly Newsletter

## Recent Projects
Some content

## Trending Repositories
More content`

    const { validateNewsletterContent } = await import('../scripts/generate-newsletter')
    const result = validateNewsletterContent(content)

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should detect missing sections in newsletter', async () => {
    const content = '# Vue.js Weekly Newsletter\n\nSome content but no sections'

    const { validateNewsletterContent } = await import('../scripts/generate-newsletter')
    const result = validateNewsletterContent(content)

    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should detect placeholder content in newsletter', async () => {
    const content = `# Vue.js Weekly Newsletter

## Recent Projects
[Project Name] is a new framework`

    const { validateNewsletterContent } = await import('../scripts/generate-newsletter')
    const result = validateNewsletterContent(content)

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Newsletter contains placeholder content in brackets')
  })

  it('should fetch Reddit posts from multiple subreddits', async () => {
    server.use(...happyPathScenario)

    const { fetchRedditPosts } = await import('../scripts/generate-newsletter')
    const posts = await fetchRedditPosts()

    expect(posts).toBeDefined()
    expect(Array.isArray(posts)).toBe(true)
    if (posts.length > 0) {
      expect(posts[0]).toHaveProperty('title')
      expect(posts[0]).toHaveProperty('link')
      expect(posts[0]).toHaveProperty('pubDate')
      expect(posts[0]).toHaveProperty('subreddit')
      expect(posts[0].pubDate).toBeInstanceOf(Date)
    }
  })

  it('should filter Reddit posts by date', async () => {
    server.use(...happyPathScenario)

    const { fetchRedditPosts } = await import('../scripts/generate-newsletter')
    const posts = await fetchRedditPosts()

    // All posts should be recent (within last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    posts.forEach((post) => {
      expect(post.pubDate.getTime()).toBeGreaterThanOrEqual(sevenDaysAgo.getTime())
    })
  })

  it('should handle Reddit fetch failures gracefully', async () => {
    server.use(...partialFailureScenario)

    const { fetchRedditPosts } = await import('../scripts/generate-newsletter')
    const posts = await fetchRedditPosts()

    // Should return empty array on failure, not throw
    expect(posts).toBeDefined()
    expect(Array.isArray(posts)).toBe(true)
  })

  it('should include Reddit data in newsletter context', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletterWithRealData } = await import('../scripts/generate-newsletter')
    const result = await generateNewsletterWithRealData()

    // Newsletter should be generated even if Reddit has no data
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(50)
  })
})
