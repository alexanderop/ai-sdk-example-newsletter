import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'
import { loadPrompt, getPrompt } from './prompts/loader.js'
import { validateEnvironment, RedditPostSchema } from './api.js'
import {
  fetchAllData,
  prepareNewsletterContext,
  callClaudeAPI,
  extractNewsletterText,
  validateAndLogNewsletter,
  saveNewsletterToFile
} from './orchestration.js'

// Re-export for backward compatibility with tests
export { RedditPostSchema } from './api.js'
export type { RedditPost } from './utils.js'
export { fetchSubredditRSS, fetchRedditPosts, fetchVueNews, fetchTrendingRepos } from './api.js'
export { retryWithBackoff, validateNewsletterContent } from './utils.js'

// ============================================================================
// Newsletter Generation Recipes - The Main Workflows
// ============================================================================

export async function generateNewsletter(anthropicClient?: Anthropic): Promise<string> {
  console.log('\n🚀 Starting newsletter generation...')
  console.log('='.repeat(60))

  // Only load .env and validate environment if no client is injected
  if (!anthropicClient) {
    config()
    validateEnvironment()
  }

  // Create Anthropic client after validation (or use injected client for testing)
  const anthropic = anthropicClient || new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })

  // Step 1: Fetch all data sources in parallel
  const data = await fetchAllData()

  // Step 2: Format data into context for AI
  const contextData = prepareNewsletterContext(data)

  // Step 3: Load prompts and call Claude AI
  const systemPrompt = loadPrompt('newsletter-system.md')
  const userPrompt = getPrompt('newsletter-user.md', { CONTEXT_DATA: contextData })
  const message = await callClaudeAPI(anthropic, systemPrompt, userPrompt, true)

  // Step 4: Extract and validate newsletter
  const newsletter = extractNewsletterText(message)
  validateAndLogNewsletter(newsletter)

  return newsletter
}

export async function generateNewsletterToFile(filename?: string, anthropicClient?: Anthropic): Promise<string> {
  // Step 1: Generate newsletter content
  const newsletter = await generateNewsletter(anthropicClient)

  // Step 2: Save to file
  const filePath = saveNewsletterToFile(newsletter, filename)

  return filePath
}

// ============================================================================
// CLI Entry Point
// ============================================================================
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
