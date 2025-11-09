import { faker } from '@faker-js/faker'
import { DevToArticlesResponseSchema, type DevToArticle, type DevToArticlesResponse } from '../schemas/devto.schema'

interface DevToArticleOptions {
  articleCount?: number
  daysOld?: number
  minReactions?: number
  tags?: string[]
}

export function createDevToArticle(daysOld: number = 0, minReactions: number = 5, tags: string[] = ['vue']): DevToArticle {
  const publishedAt = new Date()
  publishedAt.setDate(publishedAt.getDate() - daysOld)

  return {
    id: faker.number.int({ min: 10000, max: 999999 }),
    title: faker.lorem.sentence(),
    url: faker.internet.url(),
    published_at: publishedAt.toISOString(),
    public_reactions_count: faker.number.int({ min: minReactions, max: 200 }),
    comments_count: faker.number.int({ min: 0, max: 50 }),
    tags,
    user: {
      name: faker.person.fullName()
    }
  }
}

export function createDevToResponse(options: DevToArticleOptions = {}): DevToArticlesResponse {
  const {
    articleCount = 5,
    daysOld = 0,
    minReactions = 5,
    tags = ['vue', 'javascript']
  } = options

  const articles = Array.from({ length: articleCount }, (): DevToArticle =>
    createDevToArticle(daysOld, minReactions, tags)
  )

  return DevToArticlesResponseSchema.parse(articles)
}
