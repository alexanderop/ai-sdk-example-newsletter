import { http, HttpResponse } from 'msw'
import { createClaudeMessage } from '../../factories/claude-message.factory'
import { createRSSFeedXML } from '../../factories/rss-feed.factory'
import { createRedditFeedXML } from '../../factories/reddit-feed.factory'
import { createHNResponse } from '../../factories/hn-stories.factory'

export const happyPathScenario = [
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = await request.json() as { system?: string }
    const systemPrompt = body.system || ''

    if (systemPrompt.includes('RSS Fetcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: '## RSS Feed Results\n### Vue.js Blog\n- [Vue 3.5](https://blog.vuejs.org/posts/vue-3-5)'
        }]
      }))
    }

    if (systemPrompt.includes('Reddit Researcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: '## Reddit Discussions\n- [Best practices](https://reddit.com/r/vuejs/...) - 45 upvotes'
        }]
      }))
    }

    if (systemPrompt.includes('HN Researcher')) {
      return HttpResponse.json(createClaudeMessage({
        content: [{
          type: 'text',
          text: '## Hacker News\n- [Vue 3 perf](https://news.ycombinator.com/...) - 120 points'
        }]
      }))
    }

    return HttpResponse.json(createClaudeMessage({
      content: [{
        type: 'text',
        text: '# Vue.js Weekly Newsletter\n## 🎯 Official Updates\n- Vue 3.5 Released\n\n## 💬 Community Highlights\n- Best practices discussion'
      }]
    }))
  }),

  http.get('https://blog.vuejs.org/feed.rss', () => {
    return new HttpResponse(createRSSFeedXML({ itemCount: 3, daysOld: 0 }), {
      headers: { 'Content-Type': 'application/xml' }
    })
  }),

  http.get('https://nuxt.com/blog/rss.xml', () => {
    return new HttpResponse(createRSSFeedXML({ itemCount: 2, daysOld: 1 }), {
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
    return HttpResponse.json(createHNResponse({ hitCount: 4, daysOld: 0 }))
  })
]
