export type ResourceKind = 'rss' | 'atom' | 'json' | 'github' | 'custom'

export type ContentCategory = 'articles' | 'repos' | 'discussions' | 'news'

export type Priority = 1 | 2 | 3 | 4 | 5

export interface ResourceConfig {
  id: string
  kind: ResourceKind
  url: string
  minScore?: number // optional filter (e.g., HN points)
  limit?: number
  tag?: string // subreddit, label, etc
  priority?: Priority // 1=lowest, 5=highest (default=3)
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
  priority?: Priority // inherited from resource config (1-5)
}

export interface Resource {
  id: string
  category: ContentCategory
  priority: Priority // 1=lowest, 5=highest (default=3)
  fetch(): Promise<Item[]>
}

/**
 * Validates and normalizes a priority value from resource configuration.
 * Returns a valid Priority (1-5), defaulting to 3 for invalid inputs.
 */
export function validatePriority(
  configPriority: number | undefined,
  resourceId: string
): Priority {
  const priority = configPriority ?? 3
  if (priority < 1 || priority > 5) {
    console.warn(`[${resourceId}] Invalid priority ${priority}, using default 3`)
    return 3
  }
  return priority as Priority
}
