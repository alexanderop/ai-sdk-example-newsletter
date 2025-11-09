import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('API Key Validation', () => {
  let originalAnthropicKey: string | undefined
  let originalOpenAIKey: string | undefined
  let originalProvider: string | undefined

  beforeEach(() => {
    // Save original environment variables
    originalAnthropicKey = process.env.ANTHROPIC_API_KEY
    originalOpenAIKey = process.env.OPENAI_API_KEY
    originalProvider = process.env.LLM_PROVIDER
  })

  afterEach(() => {
    // Restore original environment variables
    if (originalAnthropicKey) {
      process.env.ANTHROPIC_API_KEY = originalAnthropicKey
    } else {
      delete process.env.ANTHROPIC_API_KEY
    }
    if (originalOpenAIKey) {
      process.env.OPENAI_API_KEY = originalOpenAIKey
    } else {
      delete process.env.OPENAI_API_KEY
    }
    if (originalProvider) {
      process.env.LLM_PROVIDER = originalProvider
    } else {
      delete process.env.LLM_PROVIDER
    }
  })

  it('should work with valid ANTHROPIC_API_KEY', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-api-key-for-testing'
    delete process.env.LLM_PROVIDER // Default to Anthropic

    const { AnthropicClient } = await import('../scripts/core/llm/providers/anthropic')

    expect(() => new AnthropicClient()).not.toThrow()
  })

  it('should work with valid OPENAI_API_KEY when provider is openai', async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key'
    process.env.LLM_PROVIDER = 'openai'

    const { OpenAIClient } = await import('../scripts/core/llm/providers/openai')

    expect(() => new OpenAIClient()).not.toThrow()
  })

  it('should validate API key format', async () => {
    const { isValidApiKey } = await import('../scripts/utils/validate')

    expect(isValidApiKey('sk-ant-api03-valid-key')).toBe(true)
    expect(isValidApiKey('test-api-key-for-testing')).toBe(true)
    expect(isValidApiKey('your_api_key_here')).toBe(false)
    expect(isValidApiKey('test-key')).toBe(false)
    expect(isValidApiKey('')).toBe(false)
  })

  it('should allow Anthropic client with injected API key', async () => {
    const { AnthropicClient } = await import('../scripts/core/llm/providers/anthropic')

    const client = new AnthropicClient({
      apiKey: 'test-injected-key',
      model: 'claude-haiku-4-5-20251001'
    })

    expect(client.name).toBe('anthropic')
    expect(client.model).toBe('claude-haiku-4-5-20251001')
  })

  it('should allow OpenAI client with injected API key', async () => {
    const { OpenAIClient } = await import('../scripts/core/llm/providers/openai')

    const client = new OpenAIClient({
      apiKey: 'test-injected-openai-key',
      model: 'gpt-4o-mini'
    })

    expect(client.name).toBe('openai')
    expect(client.model).toBe('gpt-4o-mini')
  })
})
