import type { Resource, ResourceConfig, Item } from './types.js'
import { RedditResource } from './adapters/reddit.js'
import { HNResource } from './adapters/hn.js'
import { GitHubSearchResource } from './adapters/github.js'
import { RSSResource } from './adapters/rss.js'

export class ResourceRegistry {
  private resources: Resource[] = []

  register(cfg: ResourceConfig): this {
    const r
      = cfg.kind === 'json' && cfg.id.startsWith('hn')
        ? new HNResource(cfg)
        : cfg.kind === 'github'
          ? new GitHubSearchResource(cfg)
          : cfg.kind === 'rss'
            ? new RSSResource(cfg)
            : cfg.kind === 'atom'
              ? new RedditResource(cfg)
              : (() => { throw new Error(`Unknown kind ${cfg.kind}`) })()

    this.resources.push(r)
    return this
  }

  add(resource: Resource): this {
    this.resources.push(resource)
    return this
  }

  async collect(): Promise<Record<string, Item[]>> {
    const out: Record<string, Item[]> = {}
    const results = await Promise.allSettled(this.resources.map(r => r.fetch()))
    results.forEach((res, i) => {
      const id = this.resources[i].id
      out[id] = res.status === 'fulfilled' ? res.value : []
    })
    return out
  }
}
