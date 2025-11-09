import type { Resource, Item, ResourceConfig } from '../types.js'
import { getText } from '../../fetch/http.js'
import { parseAtomEntries, toDate } from '../../fetch/parsers.js'

export class RedditResource implements Resource {
  public id: string
  private url: string
  private tag: string
  private limit: number

  public constructor(cfg: ResourceConfig) {
    this.id = cfg.id
    this.tag = cfg.tag ?? 'vuejs'
    this.limit = cfg.limit ?? 10
    this.url = `https://www.reddit.com/r/${this.tag}.rss`
  }

  public async fetch(): Promise<Item[]> {
    const xml = await getText(this.url, { 'User-Agent': 'Vue-Newsletter-Generator/1.0' })
    const entries = parseAtomEntries(xml)
    const items: Item[] = entries.map((e): Item => ({
      title: e.title,
      url: e.link,
      date: e.updated ? toDate(e.updated) : undefined,
      source: `r/${this.tag}`
    }))
    return items
      .filter((i): boolean => !!i.title && !!i.url)
      .sort((a, b): number => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
      .slice(0, this.limit)
  }
}
