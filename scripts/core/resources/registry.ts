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

  public async collect(): Promise<Record<string, Item[]>> {
    const out: Record<string, Item[]> = {}
    const results = await Promise.allSettled(this.resources.map((r): Promise<Item[]> => r.fetch()))
    results.forEach((res, i): void => {
      const id = this.resources[i].id
      if (res.status === 'rejected') {
        throw res.reason
      }
      out[id] = res.value
    })
    return out
  }
}
