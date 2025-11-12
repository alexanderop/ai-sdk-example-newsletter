import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import type { LanguageModelV1 } from 'ai'
import type { LLMClient, LLMMessage, LLMResponse } from '../LLMClient.js'
import { getEnvVar } from '../../../utils/env.js'

export class VercelAIClient implements LLMClient {
  public name: string
  public model: string
  public maxTokens?: number
  private modelInstance: LanguageModelV1

  public constructor(opts?: {
    apiKey?: string
    provider?: 'anthropic' | 'openai'
    model?: string
    maxTokens?: number
  }) {
    const provider = opts?.provider ?? 'anthropic'
    this.name = provider
    this.maxTokens = opts?.maxTokens ?? 4096

    // Provider-specific setup
    if (provider === 'anthropic') {
      this.model = opts?.model ?? 'claude-3-5-haiku-20241022'
      const apiKey: string | undefined = opts?.apiKey ?? getEnvVar('ANTHROPIC_API_KEY')
      if (typeof apiKey !== 'string' || apiKey.length === 0) {
        throw new Error('Anthropic API key is required. Provide it via constructor or ANTHROPIC_API_KEY environment variable.')
      }
      this.modelInstance = anthropic(this.model)
    } else if (provider === 'openai') {
      this.model = opts?.model ?? 'gpt-4o-mini'
      const apiKey: string | undefined = opts?.apiKey ?? getEnvVar('OPENAI_API_KEY')
      if (typeof apiKey !== 'string' || apiKey.length === 0) {
        throw new Error('OpenAI API key is required. Provide it via constructor or OPENAI_API_KEY environment variable.')
      }
      this.modelInstance = openai(this.model)
    } else {
      throw new Error(`Unknown provider: ${provider}. Must be 'anthropic' or 'openai'`)
    }
  }

  public async generate(messages: LLMMessage[], opts?: { temperature?: number }): Promise<LLMResponse> {
    // Extract system message
    const systemMessage = messages.find((m): m is LLMMessage => m.role === 'system')
    const conversationMessages = messages.filter(
      (m): m is LLMMessage => m.role === 'user' || m.role === 'assistant'
    )

    // Build messages array with system message cache control if present
    const messagesArray = systemMessage !== undefined
      ? [
          {
            role: 'system' as const,
            content: systemMessage.content,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            experimental_providerMetadata: {
              anthropic: {
                cacheControl: { type: 'ephemeral' as const }
              }
            }
          },
          ...conversationMessages
        ]
      : conversationMessages

    const result = await generateText({
      model: this.modelInstance,
      maxTokens: this.maxTokens,
      temperature: opts?.temperature ?? 0.2,
      messages: messagesArray
    })

    // Extract usage data - Vercel AI SDK uses different field names at runtime
    const usage = result.usage as unknown as {
      inputTokens?: number
      outputTokens?: number
      promptTokens?: number
      completionTokens?: number
      cachedInputTokens?: number
    }

    // Extract cache data from provider metadata
    const providerMetadata = result.experimental_providerMetadata as
      | { anthropic?: { cacheCreationInputTokens?: number, cacheReadInputTokens?: number } }
      | undefined

    const cacheData = providerMetadata?.anthropic

    return {
      text: result.text,
      usage: {
        input_tokens: usage.inputTokens ?? usage.promptTokens ?? 0,
        output_tokens: usage.outputTokens ?? usage.completionTokens ?? 0,
        cache_creation_input_tokens: cacheData?.cacheCreationInputTokens,
        cache_read_input_tokens: usage.cachedInputTokens
      }
    }
  }
}
