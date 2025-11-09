import Anthropic from '@anthropic-ai/sdk'
import type { LLMClient, LLMMessage, LLMResponse } from '../LLMClient.js'

export class AnthropicClient implements LLMClient {
  public name = 'anthropic'
  public model: string
  public maxTokens?: number
  private client: Anthropic

  constructor(opts?: { apiKey?: string; model?: string; maxTokens?: number }) {
    this.model = opts?.model ?? 'claude-haiku-4-5-20251001'
    this.maxTokens = opts?.maxTokens ?? 4096
    this.client = new Anthropic({ apiKey: opts?.apiKey ?? process.env.ANTHROPIC_API_KEY! })
  }

  async generate(messages: LLMMessage[], opts?: { temperature?: number }): Promise<LLMResponse> {
    const system = messages.find(m => m.role === 'system')?.content ?? ''
    const userMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens!,
      temperature: opts?.temperature ?? 0.2,
      system: [{
        type: 'text',
        text: system,
        cache_control: { type: 'ephemeral' }
      }],
      messages: userMessages
    })

    const text = msg.content.find(c => c.type === 'text')?.type === 'text'
      ? (msg.content.find(c => c.type === 'text') as { type: 'text'; text: string }).text
      : ''

    return {
      text,
      usage: {
        input_tokens: msg.usage.input_tokens,
        output_tokens: msg.usage.output_tokens,
        cache_creation_input_tokens: (msg.usage as any).cache_creation_input_tokens,
        cache_read_input_tokens: (msg.usage as any).cache_read_input_tokens
      }
    }
  }
}
