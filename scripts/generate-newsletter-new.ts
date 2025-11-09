import { config } from 'dotenv'

import { generateNewsletter } from './pipelines/newsletter.js'
import { AnthropicClient } from './core/llm/providers/anthropic.js'
import { OpenAIClient } from './core/llm/providers/openai.js'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { LLMClient } from './core/llm/LLMClient.js'

config()

function llmFromEnv(): LLMClient {
  const provider = (process.env.LLM_PROVIDER ?? 'anthropic').toLowerCase()
  if (provider === 'openai') {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing')
    return new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL })
  }
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY missing')
  return new AnthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL })
}

function save(text: string, filename?: string): string {
  const dir = join(process.cwd(), 'newsletters')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const name = filename ?? new Date().toISOString().split('T')[0] + '-vue-weekly.md'
  const path = join(dir, name)
  writeFileSync(path, text, 'utf-8')
  return path
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const start = Date.now()
  const llm = llmFromEnv()
  console.log(`🤖 Using ${llm.name} provider (${llm.model})`)

  generateNewsletter(llm)
    .then(({ text, usage }): void => {
      const path = save(text)
      console.log(`✅ Wrote ${path}`)
      console.log(`📊 Tokens in/out: ${usage.input_tokens}/${usage.output_tokens}`)
      if (usage.cache_read_input_tokens) {
        console.log(`💾 Cache read: ${usage.cache_read_input_tokens} tokens`)
      }
      if (usage.cache_creation_input_tokens) {
        console.log(`💾 Cache created: ${usage.cache_creation_input_tokens} tokens`)
      }
      console.log(`⏱️  ${((Date.now() - start) / 1000).toFixed(1)}s`)
    })
    .catch((err): void => {
      console.error('❌', err?.message ?? err)
      process.exit(1)
    })
}
