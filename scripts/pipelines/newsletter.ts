import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ResourceRegistry } from '../core/resources/registry.js'
import type { LLMClient } from '../core/llm/LLMClient.js'
import type { ResourceConfig, Item, Resource, ContentCategory } from '../core/resources/types.js'
import { format } from '../utils/date.js'
import { loadSourcesConfig, loadSystemPrompt } from '../utils/config-loader.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function groupByCategory(
  collected: Record<string, Item[]>,
  resources: Resource[]
): Record<ContentCategory, Item[]> {
  const grouped: Record<ContentCategory, Item[]> = {
    articles: [],
    repos: [],
    discussions: [],
    news: []
  }

  resources.forEach((resource): void => {
    const items = collected[resource.id] ?? []
    grouped[resource.category].push(...items)
  })

  return grouped
}

function renderSections(grouped: Record<ContentCategory, Item[]>): {
  news: string
  repos: string
  discussions: string
  articles: string
} {
  const news = (grouped.news ?? [])
    .map((i): string => `- [${i.title}](${i.url})`)
    .join('\n') || '- No recent Vue.js news available'

  const repos = (grouped.repos ?? [])
    .map((r: Item, idx: number): string =>
      `${idx + 1}. **[${r.title}](${r.url})** - ${r.description ?? 'No description'}${r.stars ? ` (⭐ ${r.stars.toLocaleString()})` : ''}`
    )
    .join('\n') || '- No trending repositories available'

  const discussions = (grouped.discussions ?? [])
    .sort((a, b): number => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
    .slice(0, 10)
    .map((p: Item, idx: number): string => {
      const d = p.date ? p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
      return `${idx + 1}. **[${p.title}](${p.url})** - ${p.source}${d ? ` (${d})` : ''}`
    })
    .join('\n') || '- No significant community discussions this week'

  // Priority-based article selection: higher priority sources get included first
  const allArticles = grouped.articles ?? []
  const selectedArticles: Item[] = []

  // Sort by priority (5 to 1), then by score within each priority
  const priorityLevels = [5, 4, 3, 2, 1]
  for (const priority of priorityLevels) {
    const needed = 10 - selectedArticles.length
    if (needed <= 0) break

    const articlesAtPriority = allArticles
      .filter((a): boolean => (a.priority ?? 3) === priority)
      .sort((a, b): number => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, needed)

    selectedArticles.push(...articlesAtPriority)
  }

  const articles = selectedArticles
    .map((article, idx): string => {
      const date = article.date
        ? article.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : ''
      const reactions = article.score ? `❤️ ${article.score}` : ''
      const comments = article.comments ? `💬 ${article.comments}` : ''
      const stats = [reactions, comments].filter(Boolean).join(', ')
      const tags = article.description ?? ''

      return `${idx + 1}. **[${article.title}](${article.url})** - ${article.source}${date ? ` (${date})` : ''}${stats ? ` | ${stats}` : ''}${tags ? `\n   ${tags}` : ''}`
    })
    .join('\n') || '- No recent articles available'

  return { news, repos, discussions, articles }
}

export async function generateNewsletter(llm: LLMClient): Promise<{ text: string, usage: { input_tokens: number, output_tokens: number, cache_creation_input_tokens?: number, cache_read_input_tokens?: number } }> {
  // Load sources config from new config directory
  const sources = await loadSourcesConfig() as ResourceConfig[]

  // Collect data from all sources
  const registry = new ResourceRegistry()
  for (const s of sources) registry.register(s)
  const { results: collected, errors, resources } = await registry.collect()

  // Fail immediately if any resource fails
  const errorCount = Object.keys(errors).length
  if (errorCount > 0) {
    const errorMessages = Object.entries(errors)
      .map(([id, error]): string => `  - [${id}] ${error.message}`)
      .join('\n')
    throw new Error(`Newsletter generation failed. ${errorCount} resource(s) failed:\n${errorMessages}`)
  }

  // Group items by category
  const grouped = groupByCategory(collected, resources)

  // Format context data
  const { news, repos, discussions, articles } = renderSections(grouped)
  const currentDate = format(new Date())
  const context = [
    `Current Date: ${currentDate}`,
    '',
    `Recent Vue.js Projects:\n${news}`,
    '',
    `Trending Vue.js Repositories:\n${repos}`,
    '',
    `Community Discussions:\n${discussions}`,
    '',
    `Articles & Tutorials:\n${articles}`
  ].join('\n')

  // Load system prompt from config
  const system = (await loadSystemPrompt()).trim()

  // Load user prompt template
  const userPath = join(__dirname, '../prompts/newsletter-user.md')
  const { readFileSync } = await import('node:fs')
  const user = readFileSync(userPath, 'utf-8')
    .replace('{{CONTEXT_DATA}}', context)

  // Generate newsletter
  const res = await llm.generate([
    { role: 'system', content: system },
    { role: 'user', content: user }
  ])

  return { text: res.text, usage: res.usage }
}
