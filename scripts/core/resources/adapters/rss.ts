import type { Resource, Item, ResourceConfig, ContentCategory, Priority } from '../types.js'
import { validatePriority } from '../types.js'
import { getText } from '../../fetch/http.js'
import { parseRSSItems } from '../../fetch/parsers.js'
import { z, ZodError } from 'zod'

const ParsedRSSItemSchema = z.object({
  title: z.string(),
  link: z.string(),
  pubDate: z.string()
})

const ParsedRSSArraySchema = z.array(ParsedRSSItemSchema)

export class RSSResource implements Resource {
  public id: string
  public category: ContentCategory = 'articles'
  public priority: Priority
  private url: string
  private sourceName: string
  private limit: number

  public constructor(cfg: ResourceConfig & { sourceName?: string }) {
    this.id = cfg.id
    this.url = cfg.url
    this.sourceName = cfg.tag ?? 'RSS'
    this.limit = cfg.limit ?? 10
    this.priority = validatePriority(cfg.priority, cfg.id)
  }

  public async fetch(): Promise<Item[]> {
    try {
      const xml = await getText(this.url)
      const rawEntries = parseRSSItems(xml)

      // Validate parsed data with Zod schema - adds runtime type safety!
      const entries = ParsedRSSArraySchema.parse(rawEntries)

      return entries.map((e): Item => ({
        title: e.title,
        url: e.link,
        date: e.pubDate ? new Date(e.pubDate) : undefined,
        source: this.sourceName,
        priority: this.priority
      }))
        .filter((i): boolean => !!(i.title && i.url))
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
