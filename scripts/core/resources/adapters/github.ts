import type { Resource, Item, ResourceConfig } from '../types.js'
import { getJson } from '../../fetch/http.js'

type GHItem = {
  name: string
  html_url: string
  description: string | null
  stargazers_count: number
  pushed_at: string
}

export class GitHubSearchResource implements Resource {
  id: string
  private url: string
  private limit: number

  constructor(cfg: ResourceConfig) {
    this.id = cfg.id
    this.limit = cfg.limit ?? 5
    this.url = cfg.url // full query passed via config
  }

  async fetch(): Promise<Item[]> {
    const data = await getJson<{ items: GHItem[] }>(this.url)
    return (data.items ?? []).slice(0, this.limit).map(i => ({
      title: i.name,
      url: i.html_url,
      description: i.description ?? 'No description',
      stars: i.stargazers_count,
      date: new Date(i.pushed_at),
      source: 'GitHub'
    }))
  }
}
