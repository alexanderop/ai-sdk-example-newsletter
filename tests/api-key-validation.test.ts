import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('API Key Validation', () => {
  let originalApiKey: string | undefined

  beforeEach(() => {
    // Save original API key
    originalApiKey = process.env.ANTHROPIC_API_KEY

    // Mock dotenv config to prevent reloading from .env file
    vi.doMock('dotenv', () => ({
      config: vi.fn()
    }))
  })

  afterEach(() => {
    // Restore original API key
    if (originalApiKey) {
      process.env.ANTHROPIC_API_KEY = originalApiKey
    } else {
      delete process.env.ANTHROPIC_API_KEY
    }

    // Clear module cache and mocks
    vi.doUnmock('dotenv')
    vi.resetModules()
  })

  it('should throw error if ANTHROPIC_API_KEY is missing', async () => {
    // Remove API key to test validation
    delete process.env.ANTHROPIC_API_KEY

    // Dynamic import to get fresh module state
    const { generateNewsletter } = await import('../scripts/generate-newsletter')

    await expect(generateNewsletter()).rejects.toThrow('ANTHROPIC_API_KEY not found')
  })

  it('should throw error if ANTHROPIC_API_KEY is a placeholder', async () => {
    // Set invalid placeholder API key
    process.env.ANTHROPIC_API_KEY = 'your_api_key_here'

    const { generateNewsletter } = await import('../scripts/generate-newsletter')

    await expect(generateNewsletter()).rejects.toThrow('Invalid ANTHROPIC_API_KEY')
  })

  it('should allow custom Anthropic client injection for testing', async () => {
    const { generateNewsletter } = await import('../scripts/generate-newsletter')
    const Anthropic = (await import('@anthropic-ai/sdk')).default

    // Create a mock client with a fake API key
    const mockClient = new Anthropic({
      apiKey: 'test-injected-key'
    })

    // This should work even though env var has invalid key
    process.env.ANTHROPIC_API_KEY = 'invalid-placeholder'

    // Should not throw because we're injecting the client
    await expect(generateNewsletter(mockClient)).resolves.toBeTruthy()
  })
})
