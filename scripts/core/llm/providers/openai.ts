import OpenAI from 'openai'
import type { LLMClient, LLMMessage, LLMResponse } from '../LLMClient.js'
import { getEnvVar } from '../../../utils/env.js'

export class OpenAIClient implements LLMClient {
  public name = 'openai'
  public model: string
  public maxTokens?: number
  private client: OpenAI

  public constructor(opts?: { apiKey?: string, model?: string, maxTokens?: number }) {
    this.model = opts?.model ?? 'gpt-4o-mini'
    this.maxTokens = opts?.maxTokens ?? 4096
    const apiKey: string | undefined = opts?.apiKey ?? getEnvVar('OPENAI_API_KEY')
    if (typeof apiKey !== 'string' || apiKey.length === 0) {
      throw new Error('OpenAI API key is required. Provide it via constructor or OPENAI_API_KEY environment variable.')
    }
    this.client = new OpenAI({ apiKey })
  }

  public async generate(messages: LLMMessage[], opts?: { temperature?: number }): Promise<LLMResponse> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      temperature: opts?.temperature ?? 0.2,
      max_tokens: this.maxTokens,
      messages: messages.map((m): { role: 'system' | 'user' | 'assistant', content: string } => ({ role: m.role, content: m.content }))
    })

    const choice = res.choices[0]
    if (choice === undefined) {
      throw new Error('No response from OpenAI')
    }
    return {
      text: choice.message?.content ?? '',
      usage: {
        input_tokens: res.usage?.prompt_tokens ?? 0,
        output_tokens: res.usage?.completion_tokens ?? 0
      }
    }
  }
}
