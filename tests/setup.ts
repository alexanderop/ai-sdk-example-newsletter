import { setupServer } from 'msw/node'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { handlers } from './mocks/handlers'
import Anthropic from '@anthropic-ai/sdk'
import type { LLMClient, LLMMessage, LLMResponse } from '../scripts/core/llm/LLMClient'

export const server = setupServer(...handlers)

// Create a mock Anthropic client for tests
export function createMockAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: 'test-api-key-for-testing'
    // No need to set baseURL - MSW will intercept the default API endpoint
  })
}

// Create a mock LLM client for testing the new architecture
export function createMockLLMClient(): LLMClient {
  return {
    name: 'mock',
    model: 'mock-model',
    maxTokens: 4096,
    async generate(_messages: LLMMessage[]): Promise<LLMResponse> {
      // Return a simple mock newsletter
      return {
        text: `# Vue.js Weekly Newsletter

## 🎯 Official Updates

This week brings exciting developments in the Vue.js ecosystem.

## 💬 Community Highlights

The community has been active with discussions and contributions.`,
        usage: {
          input_tokens: 100,
          output_tokens: 50
        }
      }
    }
  }
}

// Start server before all tests
beforeAll((): void => {
  // Set up test environment variable (for functions that check it)
  process.env.ANTHROPIC_API_KEY = 'test-api-key-for-testing'

  server.listen({ onUnhandledRequest: 'error' })
})

// Reset handlers after each test
afterEach((): void => {
  server.resetHandlers()
})

// Clean up after all tests
afterAll((): void => {
  server.close()
})
