import Anthropic from '@anthropic-ai/sdk'

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

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  generateNewsletter()
    .then(newsletter => {
      console.log(newsletter)
    })
    .catch(error => {
      console.error('Error generating newsletter:', error)
      process.exit(1)
    })
}
