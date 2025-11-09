export type ResourceKind = 'rss' | 'atom' | 'json' | 'github' | 'custom'

export interface ResourceConfig {
  id: string
  kind: ResourceKind
  url: string
  minScore?: number       // optional filter (e.g., HN points)
  limit?: number
  tag?: string            // subreddit, label, etc
}

export interface Item {
  title: string
  url: string
  date?: Date
  score?: number
  comments?: number
  description?: string
  stars?: number
  source: string          // human-friendly source name
}

export interface Resource {
  id: string
  fetch(): Promise<Item[]>
}
