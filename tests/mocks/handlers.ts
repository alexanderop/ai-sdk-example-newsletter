import { http, HttpResponse } from 'msw'
import { createClaudeMessage } from '../factories/claude-message.factory'
import { createRSSFeedXML } from '../factories/rss-feed.factory'
import { createRedditFeedXML } from '../factories/reddit-feed.factory'
import { createHNResponse } from '../factories/hn-stories.factory'

export const handlers = [
  // Claude API - conditional responses based on system prompt
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = await request.json() as { system?: string }
    const systemPrompt = body.system || ''

    // RSS Fetcher subagent
    if (systemPrompt.includes('RSS Fetcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: `## RSS Feed Results

### Vue.js Official Blog
- [Vue 3.5 Released](https://blog.vuejs.org/posts/vue-3-5) - ${new Date().toUTCString()} - Major performance improvements

### Nuxt Blog
- [Nuxt 4 Beta](https://nuxt.com/blog/nuxt-4-beta) - ${new Date().toUTCString()} - New features preview`
        }]
      }))
    }

    // Reddit Researcher subagent
    if (systemPrompt.includes('Reddit Researcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: `## Reddit Discussions

### Top Posts from r/vuejs
- [Composition API Best Practices](https://reddit.com/r/vuejs/...) - 45 upvotes, 12 comments
- [Vue 3 vs React](https://reddit.com/r/vuejs/...) - 32 upvotes, 8 comments`
        }]
      }))
    }

    // HN Researcher subagent
    if (systemPrompt.includes('HN Researcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: `## Hacker News Stories

### Vue-related Stories
- [Show HN: Built with Vue 3](https://news.ycombinator.com/...) - 120 points, 25 comments
- [Vue.js 3.5 Performance](https://news.ycombinator.com/...) - 85 points, 15 comments`
        }]
      }))
    }

    // Main orchestrator - newsletter synthesis
    return HttpResponse.json(createClaudeMessage({
      content: [{
        type: 'text',
        text: `# Vue.js Weekly Newsletter
## Week of ${new Date().toLocaleDateString()}

Generated on: ${new Date().toISOString()}

---

## 🎯 Official Updates

- [Vue 3.5 Released](https://blog.vuejs.org/posts/vue-3-5) - Major performance improvements
- [Nuxt 4 Beta](https://nuxt.com/blog/nuxt-4-beta) - New features preview

## 💬 Community Highlights

### Top Reddit Discussions
- [Composition API Best Practices](https://reddit.com/r/vuejs/...) - 45 upvotes

### Hacker News Stories
- [Show HN: Built with Vue 3](https://news.ycombinator.com/...) - 120 points

---

*Generated using Claude Agent SDK*`
      }]
    }))
  }),

  // External data sources
  http.get('https://blog.vuejs.org/feed.rss', () => {
    return new HttpResponse(createRSSFeedXML({
      title: 'Vue.js Blog',
      link: 'https://blog.vuejs.org',
      itemCount: 3
    }), {
      headers: { 'Content-Type': 'application/xml' }
    })
  }),

  http.get('https://nuxt.com/blog/rss.xml', () => {
    return new HttpResponse(createRSSFeedXML({
      title: 'Nuxt Blog',
      link: 'https://nuxt.com/blog',
      itemCount: 2
    }), {
      headers: { 'Content-Type': 'application/xml' }
    })
  }),

  http.get('https://www.reddit.com/r/vuejs.rss', () => {
    return new HttpResponse(createRedditFeedXML({
      itemCount: 5,
      subreddit: 'vuejs',
      daysOld: 0
    }), {
      headers: { 'Content-Type': 'application/atom+xml; charset=UTF-8' }
    })
  }),

  http.get('https://www.reddit.com/r/Nuxt.rss', () => {
    return new HttpResponse(createRedditFeedXML({
      itemCount: 3,
      subreddit: 'Nuxt',
      daysOld: 0
    }), {
      headers: { 'Content-Type': 'application/atom+xml; charset=UTF-8' }
    })
  }),

  http.get('http://hn.algolia.com/api/v1/search', () => {
    return HttpResponse.json(createHNResponse({
      hitCount: 4
    }))
  }),

  // GitHub API - Search repositories
  http.get('https://api.github.com/search/repositories', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')

    if (query?.includes('vue')) {
      return HttpResponse.json({
        items: [
          {
            name: 'vue',
            description: 'The Progressive JavaScript Framework',
            html_url: 'https://github.com/vuejs/vue',
            stargazers_count: 210000
          },
          {
            name: 'nuxt',
            description: 'The Intuitive Vue Framework',
            html_url: 'https://github.com/nuxt/nuxt',
            stargazers_count: 50000
          },
          {
            name: 'vite',
            description: 'Next Generation Frontend Tooling',
            html_url: 'https://github.com/vitejs/vite',
            stargazers_count: 65000
          }
        ]
      })
    }

    return HttpResponse.json({ items: [] })
  })
]
