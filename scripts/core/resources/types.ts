export type ResourceKind = 'rss' | 'atom' | 'json' | 'github' | 'custom'

export type ContentCategory = 'articles' | 'repos' | 'discussions' | 'news'

export interface ResourceConfig {
  id: string
  kind: ResourceKind
  url: string
  minScore?: number // optional filter (e.g., HN points)
  limit?: number
  tag?: string // subreddit, label, etc
  priority?: number // 1=lowest, 5=highest (default=3)
}

export interface Item {
  title: string
  url: string
  date?: Date
  score?: number
  comments?: number
  description?: string
  stars?: number
  source: string // human-friendly source name
  priority?: number // inherited from resource config (1-5)
}

export interface Resource {
  id: string
  category: ContentCategory
  priority: number // 1=lowest, 5=highest (default=3)
  fetch(): Promise<Item[]>
}
