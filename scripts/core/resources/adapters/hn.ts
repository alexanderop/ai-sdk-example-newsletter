import type { Resource, Item, ResourceConfig, ContentCategory, Priority } from '../types.js'
import { validatePriority } from '../types.js'
import { getJson } from '../../fetch/http.js'
import { HNSearchResponseSchema, type HNStory } from '../../../../schemas/hn.js'
import { ZodError } from 'zod'

export class HNResource implements Resource {
  public id: string
  public category: ContentCategory = 'discussions'
  public priority: Priority
  private url: string
  private minScore: number
  private limit: number

  public constructor(cfg: ResourceConfig) {
    this.id = cfg.id
    this.minScore = cfg.minScore ?? 20
    this.limit = cfg.limit ?? 10
    this.priority = validatePriority(cfg.priority, cfg.id)

    // Calculate Unix timestamp for 7 days ago
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60)

    // Use cfg.url if provided, otherwise default to vue query
    if (cfg.url) {
      this.url = cfg.url
    } else {
      const q = encodeURIComponent('vue OR nuxt OR vite')
      this.url = `https://hn.algolia.com/api/v1/search?query=${q}&tags=story&numericFilters=created_at_i>${sevenDaysAgo}`
    }
  }

  public async fetch(): Promise<Item[]> {
    try {
      const rawData = await getJson<unknown>(this.url)

      // Validate response with Zod schema - adds runtime type safety!
      const data = HNSearchResponseSchema.parse(rawData)

      return data.hits
        .filter((h: HNStory): boolean => h.points >= this.minScore)
        .map((h: HNStory): Item => ({
          title: h.title,
          url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
          score: h.points,
          comments: h.num_comments,
          date: new Date(h.created_at),
          source: 'Hacker News',
          priority: this.priority
        }))
        .sort((a, b): number => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, this.limit)
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(`[${this.id}] API response validation failed:`, error.issues)
        throw new Error(`Resource validation failed for ${this.id}`)
      }
      // Re-throw network errors and other unexpected errors
      throw error
    }
  }
}
