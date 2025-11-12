import { config } from 'dotenv'

import { generateNewsletter } from './pipelines/newsletter.js'
import { VercelAIClient } from './core/llm/providers/vercel-ai.js'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { LLMClient } from './core/llm/LLMClient.js'
import { loadNewsletterConfig } from './utils/config-loader.js'

config()

function llmFromEnv(): LLMClient {
  const provider = (process.env.LLM_PROVIDER ?? 'anthropic').toLowerCase()
  if (provider !== 'openai' && provider !== 'anthropic') {
    throw new Error(`Unknown LLM_PROVIDER: ${provider}. Must be 'openai' or 'anthropic'`)
  }

  const apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY
  const model = provider === 'openai' ? process.env.OPENAI_MODEL : process.env.ANTHROPIC_MODEL

  if (!apiKey) {
    throw new Error(`${provider.toUpperCase()}_API_KEY missing`)
  }

  return new VercelAIClient({
    apiKey,
    provider,
    model
  })
}

async function save(text: string, filename?: string): Promise<string> {
  const newsletterConfig = await loadNewsletterConfig()
  const dir = join(process.cwd(), 'content', 'newsletters')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  const date = new Date().toISOString().split('T')[0]
  const slug = newsletterConfig.slug ?? 'newsletter'
  const name = filename ?? `${date}-${slug}.md`

  // Create frontmatter
  const frontmatter = `---
title: ${newsletterConfig.title}
date: ${date}
description: ${newsletterConfig.description}
author: ${newsletterConfig.author}
---

`

  const fullContent = frontmatter + text
  const path = join(dir, name)
  writeFileSync(path, fullContent, 'utf-8')
  return path
}

const scriptPath = process.argv[1] ? resolve(process.argv[1]) : undefined
const modulePath = resolve(fileURLToPath(import.meta.url))

if (scriptPath && scriptPath === modulePath) {
  (async (): Promise<void> => {
    const start = Date.now()
    const llm = llmFromEnv()
    console.log(`🤖 Using ${llm.name} provider (${llm.model})`)

    try {
      const { text, usage } = await generateNewsletter(llm)
      const path = await save(text)
      console.log(`✅ Wrote ${path}`)
      console.log(`📊 Tokens in/out: ${usage.input_tokens}/${usage.output_tokens}`)
      if (usage.cache_read_input_tokens) {
        console.log(`💾 Cache read: ${usage.cache_read_input_tokens} tokens`)
      }
      if (usage.cache_creation_input_tokens) {
        console.log(`💾 Cache created: ${usage.cache_creation_input_tokens} tokens`)
      }
      console.log(`⏱️  ${((Date.now() - start) / 1000).toFixed(1)}s`)
    } catch (err) {
      console.error('❌ Error:', err)
      if (err instanceof Error) {
        console.error('Message:', err.message)
        console.error('Stack:', err.stack)
      }
      process.exit(1)
    }
  })()
}
