import { http, HttpResponse } from 'msw'
import { createClaudeMessage } from '../../factories/claude-message.factory'
import { createRSSFeedXML } from '../../factories/rss-feed.factory'
import { createHNResponse } from '../../factories/hn-stories.factory'

export const partialFailureScenario = [
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
          text: '## Error\nReddit RSS feed returned 503 - Service Unavailable'
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
        text: '# Vue.js Weekly Newsletter\n## Note\nReddit unavailable this week\n## 🎯 Official Updates\n- Vue 3.5 Released'
      }]
    }))
  }),

  http.get('https://blog.vuejs.org/feed.rss', () => {
    return new HttpResponse(createRSSFeedXML({ itemCount: 3 }), {
      headers: { 'Content-Type': 'application/xml' }
    })
  }),

  http.get('https://www.reddit.com/r/vuejs.rss', () => {
    return HttpResponse.json(
      { error: 'Service Unavailable' },
      { status: 503 }
    )
  }),

  http.get('http://hn.algolia.com/api/v1/search', () => {
    return HttpResponse.json(createHNResponse({ hitCount: 4 }))
  })
]
