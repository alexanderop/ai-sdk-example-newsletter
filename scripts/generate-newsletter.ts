import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'test-key'
})

export async function generateNewsletter(): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 4096,
    system: 'You are a Vue.js newsletter curator. Generate a weekly newsletter with sections for Official Updates and Community Highlights.',
    messages: [
      {
        role: 'user',
        content: 'Generate this week\'s Vue.js newsletter'
      }
    ]
  })

  const textContent = message.content.find(c => c.type === 'text')
  return textContent?.type === 'text' ? textContent.text : ''
}

export async function generateNewsletterToFile(filename?: string): Promise<string> {
  const newsletter = await generateNewsletter()

  // Generate filename: YYYY-MM-DD-vue-weekly.md
  const date = new Date().toISOString().split('T')[0]
  const defaultFilename = `${date}-vue-weekly.md`
  const actualFilename = filename || defaultFilename

  const outputPath = join(process.cwd(), 'newsletters', actualFilename)

  // Ensure directory exists
  mkdirSync(dirname(outputPath), { recursive: true })

  // Write file
  writeFileSync(outputPath, newsletter, 'utf-8')

  return outputPath
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  generateNewsletterToFile()
    .then(filePath => {
      console.log(`✅ Newsletter generated: ${filePath}`)
    })
    .catch(error => {
      console.error('Error generating newsletter:', error)
      process.exit(1)
    })
}
