import type { Resource, ResourceConfig, Item } from './types.js'
import { RedditResource } from './adapters/reddit.js'
import { HNResource } from './adapters/hn.js'
import { GitHubSearchResource } from './adapters/github.js'
import { RSSResource } from './adapters/rss.js'
import { DevToResource } from './adapters/devto.js'

export class ResourceRegistry {
  private resources: Resource[] = []

  public register(cfg: ResourceConfig): this {
    const r
      = cfg.kind === 'json' && cfg.id.startsWith('hn')
        ? new HNResource(cfg)
        : cfg.kind === 'json' && cfg.id.startsWith('devto-')
          ? new DevToResource(cfg)
          : cfg.kind === 'github'
            ? new GitHubSearchResource(cfg)
            : cfg.kind === 'rss'
              ? new RSSResource(cfg)
              : cfg.kind === 'atom'
                ? new RedditResource(cfg)
                : ((): never => { throw new Error(`Unknown kind ${cfg.kind}`) })()

    this.resources.push(r)
    return this
  }

  public add(resource: Resource): this {
    this.resources.push(resource)
    return this
  }

  public async collect(): Promise<{
    results: Record<string, Item[]>,
    errors: Record<string, Error>,
    resources: Resource[]
  }> {
    const results: Record<string, Item[]> = {}
    const errors: Record<string, Error> = {}
    const settled = await Promise.allSettled(this.resources.map((r): Promise<Item[]> => r.fetch()))

    settled.forEach((res, i): void => {
      const id = this.resources[i].id
      if (res.status === 'fulfilled') {
        results[id] = res.value
      } else {
        // Graceful degradation: log error and return empty array for failed resource
        const error = res.reason instanceof Error ? res.reason : new Error(String(res.reason))
        errors[id] = error
        results[id] = []
        console.error(`[${id}] Resource fetch failed:`, error.message)
      }
    })

    return { results, errors, resources: this.resources }
  }
}
