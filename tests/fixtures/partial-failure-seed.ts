import { faker } from '@faker-js/faker'
import { articles, stories, claudeMessages } from '../collections'

/**
 * Seeds collections with data for the partial failure scenario.
 * Some data sources return results, while others fail (empty collections).
 * This simulates API failures or empty responses.
 */
export async function seedPartialFailure(): Promise<void> {
  // Seed DEV.to articles - this works

  await articles.createMany(5, i => ({
    id: faker.number.int({ min: 10000, max: 999999 }),
    title: faker.lorem.sentence(),
    url: faker.internet.url(),
    published_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    public_reactions_count: faker.number.int({ min: 5, max: 200 }),
    comments_count: faker.number.int({ min: 0, max: 50 }),
    tags: 'vue, javascript',
    tag_list: ['vue', 'javascript'],
    user: {
      name: faker.person.fullName()
    }
  }))

  // repos collection is NOT seeded - simulates GitHub API failure

  // Seed limited Hacker News stories

  await stories.createMany(2, () => ({
    objectID: faker.string.numeric(8),
    title: faker.lorem.sentence(),
    url: faker.internet.url(),
    points: faker.number.int({ min: 20, max: 100 }),
    num_comments: faker.number.int({ min: 0, max: 20 }),
    author: faker.internet.username(),
    created_at: new Date().toISOString()
  }))

  // redditPosts collection is NOT seeded - simulates Reddit API failure

  // Seed only orchestrator Claude message (minimal response)
  await claudeMessages.create({
    id: 'msg_orchestrator_minimal',
    type: 'message',
    role: 'assistant',
    content: [{
      type: 'text',
      text: `# Vue.js Weekly Newsletter

## 🎯 Official Updates

Limited content this week due to partial data availability.

## 💬 Community Highlights

Some interesting discussions found.`
    }],
    model: 'claude-haiku-4-5-20251001',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 300,
      output_tokens: 100
    },
    contextRole: 'orchestrator'
  })
}
