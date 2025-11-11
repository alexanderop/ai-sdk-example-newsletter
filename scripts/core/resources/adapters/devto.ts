import type { Resource, Item, ResourceConfig } from '../types.js'
import { getJson } from '../../fetch/http.js'
import { DevToArticlesResponseSchema, type DevToArticle } from '../../../../schemas/devto.js'
import { ZodError } from 'zod'

export class DevToResource implements Resource {
  public id: string
  private url: string
  private limit: number
  private source: string

  public constructor(cfg: ResourceConfig) {
    this.id = cfg.id
    this.url = cfg.url
    this.limit = cfg.limit ?? 10
    this.source = cfg.tag ?? 'DEV.to'
  }

  public async fetch(): Promise<Item[]> {
    try {
      const rawData = await getJson<unknown>(this.url)

      // Validate response with Zod schema - adds runtime type safety!
      const data = DevToArticlesResponseSchema.parse(rawData)

      return data
        .sort((a, b): number => b.public_reactions_count - a.public_reactions_count)
        .slice(0, this.limit)
        .map((article: DevToArticle): Item => ({
          title: article.title,
          url: article.url,
          date: article.published_at ? new Date(article.published_at) : undefined,
          score: article.public_reactions_count,
          comments: article.comments_count,
          description: article.tag_list?.length ? `#${article.tag_list.join(' #')}` : undefined,
          source: this.source
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
