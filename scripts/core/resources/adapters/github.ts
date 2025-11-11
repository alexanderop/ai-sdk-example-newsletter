import type { Resource, Item, ResourceConfig, ContentCategory } from '../types.js'
import { getJson } from '../../fetch/http.js'
import { GitHubSearchResponseSchema, type GitHubRepo } from '../../../../schemas/github.js'
import { ZodError } from 'zod'

export class GitHubSearchResource implements Resource {
  public id: string
  public category: ContentCategory = 'repos'
  public priority: number
  private url: string
  private limit: number

  public constructor(cfg: ResourceConfig) {
    this.id = cfg.id
    this.limit = cfg.limit ?? 5
    this.url = cfg.url // full query passed via config

    // Validate and set priority
    const configPriority = cfg.priority ?? 3
    if (configPriority < 1 || configPriority > 5) {
      console.warn(`[${cfg.id}] Invalid priority ${configPriority}, using default 3`)
      this.priority = 3
    } else {
      this.priority = configPriority as 1 | 2 | 3 | 4 | 5
    }
  }

  public async fetch(): Promise<Item[]> {
    try {
      const rawData = await getJson<unknown>(this.url)

      // Validate response with Zod schema - adds runtime type safety!
      const data = GitHubSearchResponseSchema.parse(rawData)

      return (data.items ?? []).slice(0, this.limit).map((i: GitHubRepo): Item => ({
        title: i.name,
        url: i.html_url,
        description: i.description ?? 'No description',
        stars: i.stargazers_count,
        date: new Date(i.pushed_at),
        source: 'GitHub',
        priority: this.priority
      }))
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
