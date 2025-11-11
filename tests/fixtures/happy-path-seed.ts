import { faker } from '@faker-js/faker'
import { articles, repos, stories, redditPosts, claudeMessages, rssItems } from '../collections'

/**
 * Seeds all collections with data for the happy path scenario.
 * This represents a successful newsletter generation with all data sources returning results.
 */
export async function seedHappyPath(): Promise<void> {
  // Seed DEV.to articles

  await articles.createMany(10, i => ({
    id: faker.number.int({ min: 10000, max: 999999 }),
    title: faker.lorem.sentence(),
    url: faker.internet.url(),
    published_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    public_reactions_count: faker.number.int({ min: 5, max: 200 }),
    comments_count: faker.number.int({ min: 0, max: 50 }),
    tags: 'vue, javascript, webdev',
    tag_list: ['vue', 'javascript', 'webdev'],
    user: {
      name: faker.person.fullName()
    }
  }))

  // Seed RSS items for Vue.js blog

  await rssItems.createMany(3, i => ({
    title: faker.lorem.sentence(),
    link: faker.internet.url(),
    pubDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toUTCString(),
    description: faker.lorem.paragraph(),
    guid: faker.string.uuid(),
    feedSource: 'vuejs-blog'
  }))

  // Seed RSS items for Nuxt blog

  await rssItems.createMany(2, i => ({
    title: faker.lorem.sentence(),
    link: faker.internet.url(),
    pubDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toUTCString(),
    description: faker.lorem.paragraph(),
    guid: faker.string.uuid(),
    feedSource: 'nuxt-blog'
  }))

  // Seed GitHub repos

  await repos.createMany(5, i => ({
    name: faker.lorem.word(),
    description: faker.lorem.sentence(),
    html_url: faker.internet.url(),
    stargazers_count: faker.number.int({ min: 100, max: 100000 }),
    pushed_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    language: 'TypeScript'
  }))

  // Seed Hacker News stories

  await stories.createMany(8, () => ({
    objectID: faker.string.numeric(8),
    title: faker.lorem.sentence(),
    url: faker.internet.url(),
    points: faker.number.int({ min: 20, max: 500 }),
    num_comments: faker.number.int({ min: 0, max: 100 }),
    author: faker.internet.username(),
    created_at: new Date().toISOString()
  }))

  // Seed Reddit posts for vuejs subreddit

  await redditPosts.createMany(5, (i) => {
    const username = faker.internet.username()
    const postId = faker.string.alphanumeric(7)
    const slug = faker.lorem.slug()

    return {
      title: faker.lorem.sentence(),
      link: `https://www.reddit.com/r/vuejs/comments/${postId}/${slug}/`,
      updated: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      authorName: `/u/${username}`,
      authorUri: `https://www.reddit.com/user/${username}`,
      subreddit: 'vuejs',
      content: faker.lorem.paragraphs(2),
      postId
    }
  })

  // Seed Reddit posts for Nuxt subreddit

  await redditPosts.createMany(3, (i) => {
    const username = faker.internet.username()
    const postId = faker.string.alphanumeric(7)
    const slug = faker.lorem.slug()

    return {
      title: faker.lorem.sentence(),
      link: `https://www.reddit.com/r/Nuxt/comments/${postId}/${slug}/`,
      updated: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      authorName: `/u/${username}`,
      authorUri: `https://www.reddit.com/user/${username}`,
      subreddit: 'Nuxt',
      content: faker.lorem.paragraphs(2),
      postId
    }
  })

  // Seed Claude messages for different roles
  await claudeMessages.create({
    id: 'msg_rss_fetcher',
    type: 'message',
    role: 'assistant',
    content: [{
      type: 'text',
      text: `## RSS Feed Results

### Vue.js Official Blog
- [Vue 3.5 Released](https://blog.vuejs.org/posts/vue-3-5) - ${new Date().toUTCString()} - Major performance improvements

### Nuxt Blog
- [Nuxt 4 Beta](https://nuxt.com/blog/nuxt-4-beta) - ${new Date().toUTCString()} - New features preview`
    }],
    model: 'claude-haiku-4-5-20251001',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 100,
      output_tokens: 150
    },
    contextRole: 'RSS Fetcher'
  })

  await claudeMessages.create({
    id: 'msg_reddit_researcher',
    type: 'message',
    role: 'assistant',
    content: [{
      type: 'text',
      text: `## Reddit Discussions

### Top Posts from r/vuejs
- [Composition API Best Practices](https://reddit.com/r/vuejs/...) - 45 upvotes, 12 comments
- [Vue 3 vs React](https://reddit.com/r/vuejs/...) - 32 upvotes, 8 comments`
    }],
    model: 'claude-haiku-4-5-20251001',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 100,
      output_tokens: 120
    },
    contextRole: 'Reddit Researcher'
  })

  await claudeMessages.create({
    id: 'msg_hn_researcher',
    type: 'message',
    role: 'assistant',
    content: [{
      type: 'text',
      text: `## Hacker News Stories

### Vue-related Stories
- [Show HN: Built with Vue 3](https://news.ycombinator.com/...) - 120 points, 25 comments
- [Vue.js 3.5 Performance](https://news.ycombinator.com/...) - 85 points, 15 comments`
    }],
    model: 'claude-haiku-4-5-20251001',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 100,
      output_tokens: 110
    },
    contextRole: 'HN Researcher'
  })

  await claudeMessages.create({
    id: 'msg_orchestrator',
    type: 'message',
    role: 'assistant',
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
    }],
    model: 'claude-haiku-4-5-20251001',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 500,
      output_tokens: 300
    },
    contextRole: 'orchestrator'
  })
}
