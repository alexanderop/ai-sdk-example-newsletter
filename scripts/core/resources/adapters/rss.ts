import type { Resource, Item, ResourceConfig } from '../types.js'
import { getText } from '../../fetch/http.js'
import { parseRSSItems } from '../../fetch/parsers.js'

export class RSSResource implements Resource {
  public id: string
  private url: string
  private sourceName: string
  private limit: number

  public constructor(cfg: ResourceConfig & { sourceName?: string }) {
    this.id = cfg.id
    this.url = cfg.url
    this.sourceName = cfg.tag ?? 'RSS'
    this.limit = cfg.limit ?? 10
  }

  public async fetch(): Promise<Item[]> {
    const xml = await getText(this.url)
    const entries = parseRSSItems(xml)

    return entries.map((e): Item => ({
      title: e.title,
      url: e.link,
      date: e.pubDate ? new Date(e.pubDate) : undefined,
      source: this.sourceName
    }))
      .filter((i): boolean => !!(i.title && i.url))
      .slice(0, this.limit)
  }
}
