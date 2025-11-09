import { setupServer } from 'msw/node'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { handlers } from './mocks/handlers'
import Anthropic from '@anthropic-ai/sdk'

export const server = setupServer(...handlers)

// Create a mock Anthropic client for tests
export function createMockAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: 'test-api-key-for-testing'
    // No need to set baseURL - MSW will intercept the default API endpoint
  })
}

// Start server before all tests
beforeAll(() => {
  // Set up test environment variable (for functions that check it)
  process.env.ANTHROPIC_API_KEY = 'test-api-key-for-testing'

  server.listen({ onUnhandledRequest: 'error' })
})

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})
