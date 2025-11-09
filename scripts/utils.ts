// ============================================================================
// Type Definitions
// ============================================================================

export interface UsageMetrics {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface RetryOptions {
  maxRetries: number
  initialDelay: number
}

// ============================================================================
// XML/String Processing
// ============================================================================

export function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return match ? match[1].trim() : ''
}

export interface AtomEntry {
  title: string
  link: string
  updated: string
}

export function extractAtomEntry(entry: string): AtomEntry | null {
  // Extract link from href attribute
  const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/)
  const link = linkMatch ? linkMatch[1] : ''

  // Extract updated date (Atom uses <updated> not <pubDate>)
  const updated = extractTag(entry, 'updated')
  const title = extractTag(entry, 'title')

  // Return null if missing required fields
  if (!title || !link) {
    return null
  }

  return { title, link, updated }
}

export function parseAtomDate(dateString: string): Date {
  return new Date(dateString)
}

// ============================================================================
// Validation
// ============================================================================

export function hasPlaceholderContent(content: string): boolean {
  const placeholderRegex = /\[[A-Z][^\]]*\]/
  return placeholderRegex.test(content)
}

export function validateNewsletterContent(content: string): ValidationResult {
  const errors: string[] = []

  // Check for title
  if (!content.includes('# Vue.js Weekly Newsletter')) {
    errors.push('Missing newsletter title')
  }

  // Check for sections (at least one ## heading)
  const sectionRegex = /^##\s+/m
  if (!sectionRegex.test(content)) {
    errors.push('Newsletter must have at least one section (## heading)')
  }

  // Check for placeholder content in brackets
  if (hasPlaceholderContent(content)) {
    errors.push('Newsletter contains placeholder content in brackets')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function isValidApiKey(apiKey: string): boolean {
  const trimmed = apiKey.trim()
  return trimmed !== '' && trimmed !== 'your_api_key_here' && trimmed !== 'test-key'
}

// ============================================================================
// Formatting/Calculation
// ============================================================================

export interface TokenCost {
  inputCost: number
  outputCost: number
  cacheCost: number
  cacheReadCost: number
  totalCost: number
}

export function calculateTokenCost(usage: UsageMetrics): TokenCost {
  const inputCost = (usage.input_tokens / 1_000_000) * 1.0 // $1 per million input tokens for Haiku 4.5
  const outputCost = (usage.output_tokens / 1_000_000) * 5.0 // $5 per million output tokens
  const cacheCost = ((usage.cache_creation_input_tokens || 0) / 1_000_000) * 1.25 // $1.25 per million for cache writes
  const cacheReadCost = ((usage.cache_read_input_tokens || 0) / 1_000_000) * 0.10 // $0.10 per million for cache reads

  const totalCost = inputCost + outputCost + cacheCost + cacheReadCost

  return {
    inputCost,
    outputCost,
    cacheCost,
    cacheReadCost,
    totalCost
  }
}

export function logUsageMetrics(usage: UsageMetrics): void {
  const costs = calculateTokenCost(usage)

  console.log('\n📊 Token Usage:')
  console.log(`  Input tokens: ${usage.input_tokens.toLocaleString()}`)
  console.log(`  Output tokens: ${usage.output_tokens.toLocaleString()}`)
  if (usage.cache_creation_input_tokens) {
    console.log(`  Cache creation tokens: ${usage.cache_creation_input_tokens.toLocaleString()}`)
  }
  if (usage.cache_read_input_tokens) {
    console.log(`  Cache read tokens: ${usage.cache_read_input_tokens.toLocaleString()}`)
  }
  console.log(`\n💰 Estimated cost: $${costs.totalCost.toFixed(4)}`)
}

export interface NewsItem {
  title: string
  url: string
}

export function formatNewsSection(items: NewsItem[]): string {
  if (items.length === 0) {
    return '- No recent Vue.js news available'
  }
  return items.map(item => `- [${item.title}](${item.url})`).join('\n')
}

export interface RepoItem {
  name: string
  description: string
  url: string
  stars?: number
}

export function formatReposSection(repos: RepoItem[]): string {
  if (repos.length === 0) {
    return '- No trending repositories available'
  }
  return repos.map((repo, index) =>
    `${index + 1}. **[${repo.name}](${repo.url})** - ${repo.description}${repo.stars ? ` (⭐ ${repo.stars.toLocaleString()})` : ''}`
  ).join('\n')
}

export interface RedditPost {
  title: string
  link: string
  pubDate: Date
  subreddit: string
}

export function formatRedditSection(posts: RedditPost[]): string {
  if (posts.length === 0) {
    return '- No significant community discussions this week'
  }
  return posts.map((post, index) => {
    const dateStr = post.pubDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${index + 1}. **[${post.title}](${post.link})** - r/${post.subreddit} (${dateStr})`
  }).join('\n')
}

export function createContextData(
  currentDate: string,
  newsSection: string,
  reposSection: string,
  redditSection: string
): string {
  return `
Current Date: ${currentDate}

Recent Vue.js Projects:
${newsSection}

Trending Vue.js Repositories:
${reposSection}

Community Discussions from Reddit:
${redditSection}
`.trim()
}

// ============================================================================
// Date/Time Helpers
// ============================================================================

export function getDateDaysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0]
}

// ============================================================================
// Retry Logic
// ============================================================================

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxRetries, initialDelay } = options
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`   🔄 Retry attempt ${attempt}/${maxRetries}`)
      }
      return await operation()
    } catch (error) {
      lastError = error as Error
      if (attempt === maxRetries) {
        console.error(`   ❌ All ${maxRetries} attempts failed`)
        throw lastError
      }
      const delay = initialDelay * Math.pow(2, attempt - 1)
      console.log(`   ⏱️  Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}
