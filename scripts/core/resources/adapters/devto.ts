import type { Resource, Item, ResourceConfig } from '../types.js'
import { getJson } from '../../fetch/http.js'

type DevToArticle = {
  id: number
  title: string
  url: string
  published_at: string
  public_reactions_count: number
  comments_count: number
  tags: string[]
  user?: { name: string }
}

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
    const data = await getJson<DevToArticle[]>(this.url)
    return (data ?? [])
      .sort((a, b): number => b.public_reactions_count - a.public_reactions_count)
      .slice(0, this.limit)
      .map((article): Item => ({
        title: article.title,
        url: article.url,
        date: article.published_at ? new Date(article.published_at) : undefined,
        score: article.public_reactions_count,
        comments: article.comments_count,
        description: article.tags?.length ? `#${article.tags.join(' #')}` : undefined,
        source: this.source
      }))
  }
}
