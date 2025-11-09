import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import {
  extractAtomEntry,
  parseAtomDate,
  getDateDaysAgo,
  formatDateForFilename,
  isValidApiKey,
  type RedditPost,
  type NewsItem,
  type RepoItem
} from './utils.js'

// ============================================================================
// Schemas
// ============================================================================

// Reddit Post schema with runtime validation
export const RedditPostSchema = z.object({
  title: z.string().min(1),
  link: z.string().url(),
  pubDate: z.date(),
  subreddit: z.string().min(1)
})

// ============================================================================
// GitHub API Types
// ============================================================================

interface GitHubRepoResponse {
  name: string
  html_url: string
  description: string | null
  stargazers_count: number
}

interface GitHubSearchResponse {
  items: GitHubRepoResponse[]
}

// ============================================================================
// Environment Validation
// ============================================================================

export function validateEnvironment(): void {
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
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!isValidApiKey(apiKey)) {
    throw new Error(
      '❌ Invalid ANTHROPIC_API_KEY in .env file!\n\n'
      + 'Please replace the placeholder with your actual Anthropic API key:\n'
      + 'ANTHROPIC_API_KEY=your_api_key_here\n\n'
      + 'You can get your API key from: https://console.anthropic.com/'
    )
  }
}

// ============================================================================
// Reddit API Functions
// ============================================================================

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
      const atomEntry = extractAtomEntry(entry)

      // Skip if missing required fields
      if (!atomEntry) {
        continue
      }

      // Parse and validate the post using Zod
      const parseResult = RedditPostSchema.safeParse({
        title: atomEntry.title,
        link: atomEntry.link,
        pubDate: parseAtomDate(atomEntry.updated),
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
  const sevenDaysAgo = getDateDaysAgo(7)

  console.log('\n🔍 Fetching Reddit discussions...')
  console.log(`   📍 Subreddits: r/${subreddits.join(', r/')}`)
  const dateStr = formatDateForFilename(sevenDaysAgo)
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

// ============================================================================
// GitHub API Functions
// ============================================================================

export async function fetchVueNews(): Promise<NewsItem[]> {
  try {
    const lastWeek = getDateDaysAgo(7)
    const dateStr = formatDateForFilename(lastWeek)

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
