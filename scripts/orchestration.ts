import type Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import {
  retryWithBackoff,
  logUsageMetrics,
  validateNewsletterContent,
  formatNewsSection,
  formatReposSection,
  formatRedditSection,
  createContextData,
  formatDateForDisplay,
  formatDateForFilename
} from './utils.js'
import {
  fetchVueNews,
  fetchTrendingRepos,
  fetchRedditPosts
} from './api.js'

// ============================================================================
// Orchestration Helper Functions
// ============================================================================

export interface FetchedData {
  vueNews: Awaited<ReturnType<typeof fetchVueNews>>
  trendingRepos: Awaited<ReturnType<typeof fetchTrendingRepos>>
  redditPosts: Awaited<ReturnType<typeof fetchRedditPosts>>
}

export async function fetchAllData(): Promise<FetchedData> {
  console.log('\n📥 Fetching data from external sources...')
  const [vueNews, trendingRepos, redditPosts] = await Promise.all([
    fetchVueNews(),
    fetchTrendingRepos(),
    fetchRedditPosts()
  ])
  return { vueNews, trendingRepos, redditPosts }
}

export function prepareNewsletterContext(data: FetchedData): string {
  console.log('\n📝 Preparing context for Claude AI...')

  const currentDate = formatDateForDisplay(new Date())
  const newsSection = formatNewsSection(data.vueNews)
  const reposSection = formatReposSection(data.trendingRepos)
  const redditSection = formatRedditSection(data.redditPosts)

  const contextData = createContextData(currentDate, newsSection, reposSection, redditSection)

  console.log(`   📅 Current date: ${currentDate}`)
  console.log(`   📊 Data summary: ${data.vueNews.length} news items, ${data.trendingRepos.length} trending repos, ${data.redditPosts.length} Reddit discussions`)

  return contextData
}

export async function callClaudeAPI(
  anthropic: Anthropic,
  systemPrompt: string,
  userPrompt: string,
  withCache = false
): Promise<Anthropic.Message> {
  console.log('\n🤖 Calling Claude AI API...')
  console.log(`   📍 Endpoint: https://api.anthropic.com/v1/messages`)
  console.log(`   🧠 Model: claude-haiku-4-5-20251001`)
  console.log(`   📏 Max tokens: 4096`)
  if (withCache) {
    console.log(`   💾 Prompt caching: enabled (system prompt)`)
  }

  const message = await retryWithBackoff(
    () => anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: withCache
        ? [{
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' }
          }]
        : systemPrompt,
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
  logUsageMetrics(message.usage)

  return message
}

export function extractNewsletterText(message: Anthropic.Message): string {
  const textContent = message.content.find(c => c.type === 'text')
  return textContent?.type === 'text' ? textContent.text : ''
}

export function validateAndLogNewsletter(newsletter: string): void {
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
}

export function saveNewsletterToFile(newsletter: string, filename?: string): string {
  const date = formatDateForFilename(new Date())
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
