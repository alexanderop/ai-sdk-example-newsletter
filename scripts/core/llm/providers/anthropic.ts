import Anthropic from '@anthropic-ai/sdk'
import type { LLMClient, LLMMessage, LLMResponse } from '../LLMClient.js'
import { getEnvVar } from '../../../utils/env.js'

export class AnthropicClient implements LLMClient {
  public name = 'anthropic'
  public model: string
  public maxTokens?: number
  private client: Anthropic

  public constructor(opts?: { apiKey?: string, model?: string, maxTokens?: number }) {
    this.model = opts?.model ?? 'claude-haiku-4-5-20251001'
    this.maxTokens = opts?.maxTokens ?? 4096
    const apiKey: string | undefined = opts?.apiKey ?? getEnvVar('ANTHROPIC_API_KEY')
    if (typeof apiKey !== 'string' || apiKey.length === 0) {
      throw new Error('Anthropic API key is required. Provide it via constructor or ANTHROPIC_API_KEY environment variable.')
    }
    this.client = new Anthropic({ apiKey })
  }

  public async generate(messages: LLMMessage[], opts?: { temperature?: number }): Promise<LLMResponse> {
    const system = messages.find((m): m is LLMMessage => m.role === 'system')?.content ?? ''
    const userMessages = messages
      .filter((m): m is LLMMessage => m.role === 'user' || m.role === 'assistant')
      .map((m): { role: 'user' | 'assistant', content: string } => {
        if (m.role !== 'user' && m.role !== 'assistant') {
          throw new Error(`Invalid role: ${m.role}`)
        }
        return { role: m.role, content: m.content }
      })

    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens ?? 4096,
      temperature: opts?.temperature ?? 0.2,
      system: [{
        type: 'text',
        text: system,
        cache_control: { type: 'ephemeral' }
      }],
      messages: userMessages
    })

    const textContent = msg.content.find((c): c is { type: 'text', text: string } => c.type === 'text')
    const text: string = textContent !== undefined && textContent.type === 'text' ? textContent.text : ''

    // Anthropic SDK's usage type may include cache token fields
    const usageAny: unknown = msg.usage
    let cacheCreationTokens: number | undefined
    let cacheReadTokens: number | undefined

    if (typeof usageAny === 'object' && usageAny !== null && 'cache_creation_input_tokens' in usageAny) {
      const val: unknown = (usageAny as Record<string, unknown>)['cache_creation_input_tokens']
      cacheCreationTokens = typeof val === 'number' ? val : undefined
    }

    if (typeof usageAny === 'object' && usageAny !== null && 'cache_read_input_tokens' in usageAny) {
      const val: unknown = (usageAny as Record<string, unknown>)['cache_read_input_tokens']
      cacheReadTokens = typeof val === 'number' ? val : undefined
    }

    return {
      text,
      usage: {
        input_tokens: msg.usage.input_tokens,
        output_tokens: msg.usage.output_tokens,
        cache_creation_input_tokens: cacheCreationTokens,
        cache_read_input_tokens: cacheReadTokens
      }
    }
  }
}
