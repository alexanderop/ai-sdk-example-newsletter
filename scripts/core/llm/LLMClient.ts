export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMUsage {
  input_tokens: number
  output_tokens: number
  // optional extras for providers
  [k: string]: number | undefined
}

export interface LLMResponse {
  text: string
  usage: LLMUsage
}

export interface LLMClient {
  name: string
  model: string
  maxTokens?: number
  generate(messages: LLMMessage[], opts?: { temperature?: number }): Promise<LLMResponse>
}
