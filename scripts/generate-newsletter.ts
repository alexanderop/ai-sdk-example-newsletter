import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { config } from 'dotenv'
import { z } from 'zod'
import { loadPrompt, getPrompt } from './prompts/loader.js'

// Load .env file
config()

interface NewsItem {
  title: string
  url: string
}

interface RepoItem {
  name: string
  description: string
  url: string
  stars?: number
}

// Reddit Post schema with runtime validation
export const RedditPostSchema = z.object({
  title: z.string().min(1),
  link: z.string().url(),
  pubDate: z.date(),
  subreddit: z.string().min(1)
})

export type RedditPost = z.infer<typeof RedditPostSchema>

interface GitHubRepoResponse {
  name: string
  html_url: string
  description: string | null
  stargazers_count: number
}

interface GitHubSearchResponse {
  items: GitHubRepoResponse[]
}

function validateEnvironment(): void {
  // Check if .env file exists
  const envPath = join(process.cwd(), '.env')
  if (!existsSync(envPath)) {
    throw new Error(
      '❌ .env file not found!\n\n'
      + 'Please create a .env file in the project root with your Anthropic API key:\n'
      + 'ANTHROPIC_API_KEY=your_api_key_here\n\n'
      + 'You can get your API key from: https://console.anthropic.com/'
    )
  }

  // Check if API key is set
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      '❌ ANTHROPIC_API_KEY not found in environment!\n\n'
      + 'Please add your Anthropic API key to the .env file:\n'
      + 'ANTHROPIC_API_KEY=your_api_key_here\n\n'
      + 'You can get your API key from: https://console.anthropic.com/'
    )
  }

  // Check if API key looks valid (not empty, not placeholder)
  const apiKey = process.env.ANTHROPIC_API_KEY.trim()
  if (apiKey === '' || apiKey === 'your_api_key_here' || apiKey === 'test-key') {
    throw new Error(
      '❌ Invalid ANTHROPIC_API_KEY in .env file!\n\n'
      + 'Please replace the placeholder with your actual Anthropic API key:\n'
      + 'ANTHROPIC_API_KEY=your_api_key_here\n\n'
      + 'You can get your API key from: https://console.anthropic.com/'
    )
  }
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'test-key'
})

interface RetryOptions {
  maxRetries: number
  initialDelay: number
}

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

interface UsageMetrics {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

function logUsageMetrics(usage: UsageMetrics): void {
  const inputCost = (usage.input_tokens / 1_000_000) * 1.0 // $1 per million input tokens for Haiku 4.5
  const outputCost = (usage.output_tokens / 1_000_000) * 5.0 // $5 per million output tokens
  const cacheCost = ((usage.cache_creation_input_tokens || 0) / 1_000_000) * 1.25 // $1.25 per million for cache writes
  const cacheReadCost = ((usage.cache_read_input_tokens || 0) / 1_000_000) * 0.10 // $0.10 per million for cache reads

  const totalCost = inputCost + outputCost + cacheCost + cacheReadCost

  console.log('\n📊 Token Usage:')
  console.log(`  Input tokens: ${usage.input_tokens.toLocaleString()}`)
  console.log(`  Output tokens: ${usage.output_tokens.toLocaleString()}`)
  if (usage.cache_creation_input_tokens) {
    console.log(`  Cache creation tokens: ${usage.cache_creation_input_tokens.toLocaleString()}`)
  }
  if (usage.cache_read_input_tokens) {
    console.log(`  Cache read tokens: ${usage.cache_read_input_tokens.toLocaleString()}`)
  }
  console.log(`\n💰 Estimated cost: $${totalCost.toFixed(4)}`)
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
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
  const placeholderRegex = /\[[A-Z][^\]]*\]/
  if (placeholderRegex.test(content)) {
    errors.push('Newsletter contains placeholder content in brackets')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return match ? match[1].trim() : ''
}

export async function fetchSubredditRSS(subreddit: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}.rss`

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Vue-Newsletter-Generator/1.0' }
    })

    if (!response.ok) {
      console.log(`      ❌ r/${subreddit}: Failed (${response.status} ${response.statusText})`)
      return []
    }

    const xmlText = await response.text()

    // Reddit uses Atom format with <entry> tags, not RSS with <item> tags
    const entries = xmlText.match(/<entry>[\s\S]*?<\/entry>/g) || []

    const posts: RedditPost[] = []

    for (const entry of entries) {
      // Extract link from href attribute
      const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/)
      const link = linkMatch ? linkMatch[1] : ''

      // Extract updated date (Atom uses <updated> not <pubDate>)
      const updated = extractTag(entry, 'updated')
      const title = extractTag(entry, 'title')

      // Skip if missing required fields
      if (!title || !link) {
        continue
      }

      // Parse and validate the post using Zod
      const parseResult = RedditPostSchema.safeParse({
        title,
        link,
        pubDate: new Date(updated),
        subreddit
      })

      if (parseResult.success) {
        posts.push(parseResult.data)
      } else {
        console.log(`      ⚠️  r/${subreddit}: Invalid post data - ${parseResult.error.message}`)
      }
    }

    console.log(`      ✅ r/${subreddit}: Fetched ${posts.length} posts`)
    return posts
  } catch (error) {
    console.log(`      ❌ r/${subreddit}: Error - ${(error as Error).message}`)
    return []
  }
}

export async function fetchRedditPosts(): Promise<RedditPost[]> {
  const subreddits = ['vuejs', 'Nuxt']
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  console.log('\n🔍 Fetching Reddit discussions...')
  console.log(`   📍 Subreddits: r/${subreddits.join(', r/')}`)
  const dateStr = sevenDaysAgo.toISOString().split('T')[0]
  console.log(`   📅 Date range: ${dateStr} to today`)
  console.log(`   ℹ️  Note: Reddit RSS feeds don't include upvote scores`)
  console.log('')

  try {
    // Fetch RSS feeds in parallel
    const allPosts = await Promise.all(
      subreddits.map(sub => fetchSubredditRSS(sub))
    )

    // Calculate total posts fetched before filtering
    const totalPostsFetched = allPosts.flat().length

    // Flatten, filter by date only (scores not available in RSS), sort by date
    const filteredPosts = allPosts
      .flat()
      .filter(post => post.pubDate >= sevenDaysAgo)
      .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
      .slice(0, 10) // Top 10 most recent posts

    console.log('')
    if (totalPostsFetched > 0) {
      console.log(`   ✅ Reddit fetch successful`)
      console.log(`   📊 Total posts fetched: ${totalPostsFetched}`)
      console.log(`   📊 Posts after filtering (recent): ${filteredPosts.length}`)
    } else {
      console.log(`   ⚠️  Reddit fetch completed with no posts`)
    }

    if (filteredPosts.length > 0) {
      console.log(`   📝 Recent discussions:`)
      filteredPosts.forEach((post, index) => {
        const dateStr = post.pubDate.toISOString().split('T')[0]
        console.log(`      ${index + 1}. ${post.title} - r/${post.subreddit} (${dateStr})`)
      })
    }

    return filteredPosts
  } catch (error) {
    console.log('')
    console.log(`   ❌ Reddit fetch failed: ${(error as Error).message}`)
    return []
  }
}

export async function fetchVueNews(): Promise<NewsItem[]> {
  try {
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    const dateStr = lastWeek.toISOString().split('T')[0]

    const url = `https://api.github.com/search/repositories?q=vue+in:name,description+pushed:>${dateStr}&sort=updated&order=desc&per_page=5`
    console.log('\n🔍 Fetching Vue.js news...')
    console.log(`   📍 URL: ${url}`)
    console.log(`   📅 Date range: ${dateStr} to today`)

    const response = await fetch(url)

    if (!response.ok) {
      console.error(`   ❌ GitHub API error: ${response.status} ${response.statusText}`)
      return []
    }

    const data = await response.json() as GitHubSearchResponse

    if (!data.items || !Array.isArray(data.items)) {
      console.error('   ❌ Invalid response format from GitHub API')
      return []
    }

    console.log(`   ✅ Found ${data.items.length} recent Vue.js projects`)
    data.items.forEach((item, index) => {
      console.log(`      ${index + 1}. ${item.name} (⭐ ${item.stargazers_count.toLocaleString()})`)
      console.log(`         ${item.html_url}`)
    })

    return data.items.map(item => ({
      title: item.name,
      url: item.html_url
    }))
  } catch (error) {
    console.error('   ❌ Failed to fetch Vue.js news:', error)
    return []
  }
}

export async function fetchTrendingRepos(): Promise<RepoItem[]> {
  try {
    const url = 'https://api.github.com/search/repositories?q=vue+language:typescript&sort=stars&order=desc&per_page=5'
    console.log('\n🔍 Fetching trending Vue.js repositories...')
    console.log(`   📍 URL: ${url}`)
    console.log(`   🔎 Criteria: TypeScript, sorted by stars`)

    const response = await fetch(url)

    if (!response.ok) {
      console.error(`   ❌ GitHub API error: ${response.status} ${response.statusText}`)
      return []
    }

    const data = await response.json() as GitHubSearchResponse

    if (!data.items || !Array.isArray(data.items)) {
      console.error('   ❌ Invalid response format from GitHub API')
      return []
    }

    console.log(`   ✅ Found ${data.items.length} trending repositories`)
    data.items.forEach((item, index) => {
      console.log(`      ${index + 1}. ${item.name} (⭐ ${item.stargazers_count.toLocaleString()})`)
      console.log(`         ${item.description || 'No description'}`)
      console.log(`         ${item.html_url}`)
    })

    return data.items.map(item => ({
      name: item.name,
      description: item.description || 'No description available',
      url: item.html_url,
      stars: item.stargazers_count
    }))
  } catch (error) {
    console.error('   ❌ Failed to fetch trending repos:', error)
    return []
  }
}

export async function generateNewsletter(): Promise<string> {
  validateEnvironment()

  const systemPrompt = loadPrompt('newsletter-basic-system.md')
  const userPrompt = loadPrompt('newsletter-basic-user.md')

  const message = await retryWithBackoff(
    () => anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    }),
    { maxRetries: 3, initialDelay: 1000 }
  )

  const textContent = message.content.find(c => c.type === 'text')
  return textContent?.type === 'text' ? textContent.text : ''
}

export async function generateNewsletterWithRealData(): Promise<string> {
  console.log('\n🚀 Starting newsletter generation...')
  console.log('='.repeat(60))

  validateEnvironment()

  console.log('\n📥 Fetching data from external sources...')
  const [vueNews, trendingRepos, redditPosts] = await Promise.all([
    fetchVueNews(),
    fetchTrendingRepos(),
    fetchRedditPosts()
  ])

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  console.log('\n📝 Preparing context for Claude AI...')
  const newsSection = vueNews.length > 0
    ? vueNews.map(item => `- [${item.title}](${item.url})`).join('\n')
    : '- No recent Vue.js news available'

  const reposSection = trendingRepos.length > 0
    ? trendingRepos.map((repo, index) => `${index + 1}. **[${repo.name}](${repo.url})** - ${repo.description}${repo.stars ? ` (⭐ ${repo.stars.toLocaleString()})` : ''}`).join('\n')
    : '- No trending repositories available'

  const redditSection = redditPosts.length > 0
    ? redditPosts.map((post, index) => {
        const dateStr = post.pubDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return `${index + 1}. **[${post.title}](${post.link})** - r/${post.subreddit} (${dateStr})`
      }).join('\n')
    : '- No significant community discussions this week'

  const contextData = `
Current Date: ${currentDate}

Recent Vue.js Projects:
${newsSection}

Trending Vue.js Repositories:
${reposSection}

Community Discussions from Reddit:
${redditSection}
`.trim()

  console.log(`   📅 Current date: ${currentDate}`)
  console.log(`   📊 Data summary: ${vueNews.length} news items, ${trendingRepos.length} trending repos, ${redditPosts.length} Reddit discussions`)

  console.log('\n🤖 Calling Claude AI API...')
  console.log(`   📍 Endpoint: https://api.anthropic.com/v1/messages`)
  console.log(`   🧠 Model: claude-haiku-4-5-20251001`)
  console.log(`   📏 Max tokens: 4096`)
  console.log(`   💾 Prompt caching: enabled (system prompt)`)

  // Load prompts from external files
  const systemPrompt = loadPrompt('newsletter-system.md')
  const userPrompt = getPrompt('newsletter-user.md', { CONTEXT_DATA: contextData })

  const message = await retryWithBackoff(
    () => anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    }),
    { maxRetries: 3, initialDelay: 1000 }
  )

  console.log('\n   ✅ Claude AI response received')

  // Log usage metrics
  logUsageMetrics(message.usage)

  const textContent = message.content.find(c => c.type === 'text')
  const newsletter = textContent?.type === 'text' ? textContent.text : ''

  console.log('\n🔍 Validating newsletter content...')
  const validation = validateNewsletterContent(newsletter)
  if (validation.isValid) {
    console.log('   ✅ Newsletter content validated successfully')
  } else {
    console.log('   ⚠️  Validation warnings:')
    validation.errors.forEach((error) => {
      console.log(`      - ${error}`)
    })
  }

  console.log(`   📄 Newsletter length: ${newsletter.length} characters`)
  console.log(`   📝 Lines: ${newsletter.split('\n').length}`)

  return newsletter
}

export async function generateNewsletterToFile(filename?: string): Promise<string> {
  const newsletter = await generateNewsletterWithRealData()

  // Generate filename: YYYY-MM-DD-vue-weekly.md
  const date = new Date().toISOString().split('T')[0]
  const defaultFilename = `${date}-vue-weekly.md`
  const actualFilename = filename || defaultFilename

  const outputPath = join(process.cwd(), 'newsletters', actualFilename)

  console.log('\n💾 Writing newsletter to file...')
  console.log(`   📁 Output directory: newsletters/`)
  console.log(`   📄 Filename: ${actualFilename}`)
  console.log(`   🔗 Full path: ${outputPath}`)

  // Ensure directory exists
  const dirPath = dirname(outputPath)
  if (!existsSync(dirPath)) {
    console.log(`   📂 Creating directory: ${dirPath}`)
    mkdirSync(dirPath, { recursive: true })
  }

  // Write file
  writeFileSync(outputPath, newsletter, 'utf-8')
  console.log(`   ✅ File written successfully`)

  return outputPath
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const startTime = Date.now()

  generateNewsletterToFile()
    .then((filePath) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log('\n' + '='.repeat(60))
      console.log(`✅ Newsletter generated successfully!`)
      console.log(`   📁 Location: ${filePath}`)
      console.log(`   ⏱️  Total time: ${duration}s`)
      console.log('='.repeat(60) + '\n')
    })
    .catch((error) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.error('\n' + '='.repeat(60))
      console.error('❌ Error generating newsletter:')
      console.error(`   ${error.message || error}`)
      console.error(`   ⏱️  Failed after: ${duration}s`)
      console.error('='.repeat(60) + '\n')
      process.exit(1)
    })
}
