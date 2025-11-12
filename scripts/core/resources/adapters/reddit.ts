import type { Resource, Item, ResourceConfig, ContentCategory, Priority } from '../types.js'
import { validatePriority } from '../types.js'
import { getText } from '../../fetch/http.js'
import { parseAtomEntries, toDate } from '../../fetch/parsers.js'
import { z, ZodError } from 'zod'

const ParsedAtomEntrySchema = z.object({
  title: z.string(),
  link: z.string(),
  updated: z.string()
})

const ParsedAtomArraySchema = z.array(ParsedAtomEntrySchema)

export class RedditResource implements Resource {
  public id: string
  public category: ContentCategory = 'discussions'
  public priority: Priority
  private url: string
  private tag: string
  private limit: number

  public constructor(cfg: ResourceConfig) {
    this.id = cfg.id
    this.url = cfg.url
    this.limit = cfg.limit ?? 10
    this.priority = validatePriority(cfg.priority, cfg.id)

    // Extract subreddit name from URL or use tag
    // URL format: https://www.reddit.com/r/SUBREDDIT.rss
    const subredditMatch = this.url.match(/\/r\/([^/.]+)/)
    this.tag = subredditMatch?.[1] ?? cfg.tag ?? 'reddit'
  }

  public async fetch(): Promise<Item[]> {
    try {
      const xml = await getText(this.url, { 'User-Agent': 'Vue-Newsletter-Generator/1.0' })
      const rawEntries = parseAtomEntries(xml)

      // Validate parsed data with Zod schema - adds runtime type safety!
      const entries = ParsedAtomArraySchema.parse(rawEntries)

      const items: Item[] = entries.map((e): Item => ({
        title: e.title,
        url: e.link,
        date: e.updated ? toDate(e.updated) : undefined,
        source: `r/${this.tag}`,
        priority: this.priority
      }))
      return items
        .filter((i): boolean => !!i.title && !!i.url)
        .sort((a, b): number => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
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
