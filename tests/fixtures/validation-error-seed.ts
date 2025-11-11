import { faker } from '@faker-js/faker'
import { claudeMessages } from '../collections'
import { server } from '../setup'
import { http, HttpResponse } from 'msw'

/**
 * Seeds collections and sets up MSW handlers that return invalid data.
 * This simulates API responses that don't match expected schemas.
 */
export async function seedValidationError(): Promise<void> {
  // Override GitHub handler to return invalid data
  server.use(
    http.get('https://api.github.com/search/repositories', (): HttpResponse => {
      return HttpResponse.json({
        items: [
          {
            name: 123, // Invalid: schema expects string, got number
            description: faker.lorem.sentence(),
            html_url: faker.internet.url(),
            stargazers_count: faker.number.int({ min: 100, max: 5000 }),
            pushed_at: new Date().toISOString(),
            language: null // Now valid: schema accepts null/undefined
          }
        ]
      })
    })
  )

  // Seed Claude message for newsletter generation
  await claudeMessages.create({
    id: 'msg_validation_test',
    type: 'message',
    role: 'assistant',
    content: [{
      type: 'text',
      text: `# Vue.js Weekly Newsletter

## 🎯 Official Updates

Test content

## 💬 Community Highlights

Test highlights`
    }],
    model: 'claude-haiku-4-5-20251001',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 500,
      output_tokens: 200
    },
    contextRole: 'orchestrator'
  })
}
