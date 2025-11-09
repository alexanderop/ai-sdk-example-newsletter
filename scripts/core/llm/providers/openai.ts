import OpenAI from 'openai'
import type { LLMClient, LLMMessage, LLMResponse } from '../LLMClient.js'

export class OpenAIClient implements LLMClient {
  public name = 'openai'
  public model: string
  public maxTokens?: number
  private client: OpenAI

  constructor(opts?: { apiKey?: string, model?: string, maxTokens?: number }) {
    this.model = opts?.model ?? 'gpt-4o-mini'
    this.maxTokens = opts?.maxTokens ?? 4096
    this.client = new OpenAI({ apiKey: opts?.apiKey ?? process.env.OPENAI_API_KEY! })
  }

  async generate(messages: LLMMessage[], opts?: { temperature?: number }): Promise<LLMResponse> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      temperature: opts?.temperature ?? 0.2,
      max_tokens: this.maxTokens,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    })

    const choice = res.choices[0]
    return {
      text: choice.message?.content ?? '',
      usage: {
        input_tokens: res.usage?.prompt_tokens ?? 0,
        output_tokens: res.usage?.completion_tokens ?? 0
      }
    }
  }
}
