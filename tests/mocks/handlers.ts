import { http, HttpResponse } from 'msw'
import { articles, repos, stories, redditPosts, claudeMessages, rssItems } from '../collections'
import { buildRSSFeed, buildAtomFeed } from '../utils/format-xml'

export const handlers = [
  // Claude API - conditional responses based on system prompt or context role
  http.post('https://api.anthropic.com/v1/messages', async ({ request }): Promise<HttpResponse> => {
    const body = await request.json() as { system?: string }
    const systemPrompt = body.system || ''

    // Try to find a message matching the system prompt context
    let message = null

    if (systemPrompt.includes('RSS Fetcher')) {
      message = claudeMessages.findFirst((q): unknown =>
        q.where({ contextRole: 'RSS Fetcher' })
      )
    } else if (systemPrompt.includes('Reddit Researcher')) {
      message = claudeMessages.findFirst((q): unknown =>
        q.where({ contextRole: 'Reddit Researcher' })
      )
    } else if (systemPrompt.includes('HN Researcher')) {
      message = claudeMessages.findFirst((q): unknown =>
        q.where({ contextRole: 'HN Researcher' })
      )
    } else {
      // Main orchestrator - newsletter synthesis
      message = claudeMessages.findFirst((q): unknown =>
        q.where({ contextRole: 'orchestrator' })
      )
    }

    // If no specific message found, return first available or default
    if (!message) {
      const allMessages = claudeMessages.findMany((q): unknown => q.where((): boolean => true))
      message = allMessages[0] || {
        id: 'msg_default',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [{
          type: 'text' as const,
          text: '# Vue.js Weekly Newsletter\n\n## Default Content\n\nNo content available.'
        }],
        model: 'claude-haiku-4-5-20251001',
        stop_reason: 'end_turn' as const,
        usage: {
          input_tokens: 100,
          output_tokens: 50
        }
      }
    }

    // Remove contextRole before returning (not part of Claude API response)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/naming-convention
    const { contextRole: _contextRole, ...responseMessage } = message as unknown as any
    return HttpResponse.json(responseMessage)
  }),

  // External data sources - RSS feeds
  http.get('https://blog.vuejs.org/feed.rss', (): Response => {
    const items = rssItems.findMany((q): unknown =>
      q.where({ feedSource: 'vuejs-blog' })
    )

    return new HttpResponse(buildRSSFeed(items, {
      title: 'Vue.js Blog',
      link: 'https://blog.vuejs.org',
      description: 'The official Vue.js blog'
    }), {
      headers: { 'Content-Type': 'application/xml' }
    })
  }),

  http.get('https://nuxt.com/blog/rss.xml', (): Response => {
    const items = rssItems.findMany((q): unknown =>
      q.where({ feedSource: 'nuxt-blog' })
    )

    return new HttpResponse(buildRSSFeed(items, {
      title: 'Nuxt Blog',
      link: 'https://nuxt.com/blog',
      description: 'The official Nuxt blog'
    }), {
      headers: { 'Content-Type': 'application/xml' }
    })
  }),

  http.get('https://www.reddit.com/r/vuejs.rss', (): Response => {
    const posts = redditPosts.findMany((q): unknown =>
      q.where({ subreddit: 'vuejs' })
    )

    return new HttpResponse(buildAtomFeed(posts, {
      subreddit: 'vuejs'
    }), {
      headers: { 'Content-Type': 'application/atom+xml; charset=UTF-8' }
    })
  }),

  http.get('https://www.reddit.com/r/Nuxt.rss', (): Response => {
    const posts = redditPosts.findMany((q): unknown =>
      q.where({ subreddit: 'Nuxt' })
    )

    return new HttpResponse(buildAtomFeed(posts, {
      subreddit: 'Nuxt'
    }), {
      headers: { 'Content-Type': 'application/xml; charset=UTF-8' }
    })
  }),

  http.get('https://hn.algolia.com/api/v1/search', (): HttpResponse => {
    const hits = stories.findMany((q): unknown => q.where((): boolean => true))

    return HttpResponse.json({
      hits,
      nbHits: hits.length,
      page: 0,
      nbPages: 1,
      hitsPerPage: 20
    })
  }),

  // GitHub API - Search repositories
  http.get('https://api.github.com/search/repositories', ({ request }): HttpResponse => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')

    if (query?.includes('vue')) {
      const items = repos.findMany((q): unknown => q.where((): boolean => true))
      return HttpResponse.json({ items })
    }

    return HttpResponse.json({ items: [] })
  }),

  // DEV.to API - Articles by tag
  http.get('https://dev.to/api/articles', ({ request }): HttpResponse => {
    const url = new URL(request.url)
    const tag = url.searchParams.get('tag')

    if (tag) {
      const results = articles.findMany((q): unknown =>
        // eslint-disable-next-line @typescript-eslint/naming-convention
        q.where({ tag_list: (tags: string[]): boolean => tags.includes(tag) })
      )
      return HttpResponse.json(results)
    }

    return HttpResponse.json([])
  })
]
