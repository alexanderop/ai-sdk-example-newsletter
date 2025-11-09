import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ResourceRegistry } from '../core/resources/registry.js'
import type { LLMClient } from '../core/llm/LLMClient.js'
import type { ResourceConfig, Item } from '../core/resources/types.js'
import { format } from '../utils/date.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function renderSections(collected: Record<string, Item[]>): {
  news: string
  repos: string
  reddit: string
  articles: string
} {
  const news = (collected['github-news'] ?? []).map((i): string => `- [${i.title}](${i.url})`).join('\n') || '- No recent Vue.js news available'
  const repos = (collected['github-news'] ?? []).map((r: Item, idx: number): string =>
    `${idx + 1}. **[${r.title}](${r.url})** - ${r.description ?? 'No description'}${r.stars ? ` (⭐ ${r.stars.toLocaleString()})` : ''}`
  ).join('\n') || '- No trending repositories available'

  const reddit = [...(collected['reddit-vuejs'] ?? []), ...(collected['reddit-nuxt'] ?? [])]
    .sort((a, b): number => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
    .slice(0, 10)
    .map((p: Item, idx: number): string => {
      const d = p.date ? p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
      return `${idx + 1}. **[${p.title}](${p.url})** - ${p.source}${d ? ` (${d})` : ''}`
    }).join('\n') || '- No significant community discussions this week'

  const articles = [...(collected['devto-vue'] ?? []), ...(collected['devto-nuxt'] ?? [])]
    .sort((a, b): number => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 10)
    .map((article, idx): string => {
      const date = article.date
        ? article.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : ''
      const reactions = article.score ? `❤️ ${article.score}` : ''
      const comments = article.comments ? `💬 ${article.comments}` : ''
      const stats = [reactions, comments].filter(Boolean).join(', ')
      const tags = article.description ?? ''

      return `${idx + 1}. **[${article.title}](${article.url})** - ${article.source}${date ? ` (${date})` : ''}${stats ? ` | ${stats}` : ''}${tags ? `\n   ${tags}` : ''}`
    }).join('\n') || '- No recent articles available'

  return { news, repos, reddit, articles }
}

export async function generateNewsletter(llm: LLMClient): Promise<{ text: string, usage: { input_tokens: number, output_tokens: number, cache_creation_input_tokens?: number, cache_read_input_tokens?: number } }> {
  // Load sources config
  const sourcesPath = join(__dirname, '../config/sources.json')
  const sources = JSON.parse(readFileSync(sourcesPath, 'utf-8')) as ResourceConfig[]

  // Collect data from all sources
  const registry = new ResourceRegistry()
  for (const s of sources) registry.register(s)
  const collected = await registry.collect()

  // Format context data
  const { news, repos, reddit, articles } = renderSections(collected)
  const currentDate = format(new Date())
  const context = [
    `Current Date: ${currentDate}`,
    '',
    `Recent Vue.js Projects:\n${news}`,
    '',
    `Trending Vue.js Repositories:\n${repos}`,
    '',
    `Community Discussions from Reddit:\n${reddit}`,
    '',
    `Articles & Tutorials from DEV.to:\n${articles}`
  ].join('\n')

  // Load prompts
  const systemPath = join(__dirname, '../prompts/newsletter-system.md')
  const userPath = join(__dirname, '../prompts/newsletter-user.md')
  const system = readFileSync(systemPath, 'utf-8').trim()
  const user = readFileSync(userPath, 'utf-8')
    .replace('{{CONTEXT_DATA}}', context)

  // Generate newsletter
  const res = await llm.generate([
    { role: 'system', content: system },
    { role: 'user', content: user }
  ])

  return { text: res.text, usage: res.usage }
}
