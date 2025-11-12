import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('API Key Validation', (): void => {
  let originalAnthropicKey: string | undefined
  let originalOpenAIKey: string | undefined
  let originalProvider: string | undefined

  beforeEach((): void => {
    // Save original environment variables
    originalAnthropicKey = process.env.ANTHROPIC_API_KEY
    originalOpenAIKey = process.env.OPENAI_API_KEY
    originalProvider = process.env.LLM_PROVIDER
  })

  afterEach((): void => {
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

  it('should work with valid ANTHROPIC_API_KEY', async (): Promise<void> => {
    process.env.ANTHROPIC_API_KEY = 'test-api-key-for-testing'
    delete process.env.LLM_PROVIDER // Default to Anthropic

    const { VercelAIClient } = await import('../scripts/core/llm/providers/vercel-ai')

    expect((): VercelAIClient => new VercelAIClient({ provider: 'anthropic' })).not.toThrow()
  })

  it('should work with valid OPENAI_API_KEY when provider is openai', async (): Promise<void> => {
    process.env.OPENAI_API_KEY = 'test-openai-key'
    process.env.LLM_PROVIDER = 'openai'

    const { VercelAIClient } = await import('../scripts/core/llm/providers/vercel-ai')

    expect((): VercelAIClient => new VercelAIClient({ provider: 'openai' })).not.toThrow()
  })

  it('should validate API key format', async (): Promise<void> => {
    const { isValidApiKey } = await import('../scripts/utils/validate')

    expect(isValidApiKey('sk-ant-api03-valid-key')).toBe(true)
    expect(isValidApiKey('test-api-key-for-testing')).toBe(true)
    expect(isValidApiKey('your_api_key_here')).toBe(false)
    expect(isValidApiKey('test-key')).toBe(false)
    expect(isValidApiKey('')).toBe(false)
  })

  it('should allow Anthropic client with injected API key', async (): Promise<void> => {
    const { VercelAIClient } = await import('../scripts/core/llm/providers/vercel-ai')

    const client = new VercelAIClient({
      apiKey: 'test-injected-key',
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022'
    })

    expect(client.name).toBe('anthropic')
    expect(client.model).toBe('claude-3-5-sonnet-20241022')
  })

  it('should allow OpenAI client with injected API key', async (): Promise<void> => {
    const { VercelAIClient } = await import('../scripts/core/llm/providers/vercel-ai')

    const client = new VercelAIClient({
      apiKey: 'test-injected-openai-key',
      provider: 'openai',
      model: 'gpt-4o-mini'
    })

    expect(client.name).toBe('openai')
    expect(client.model).toBe('gpt-4o-mini')
  })
})
