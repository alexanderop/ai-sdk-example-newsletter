import { faker } from '@faker-js/faker'
import { HNSearchResponseSchema, type HNSearchResponse, type HNStory } from '../schemas/hn.schema'

interface HNResponseOptions {
  hitCount?: number
  daysOld?: number
  minPoints?: number
}

export function createHNStory(daysOld: number = 0, minPoints: number = 20): HNStory {
  const createdAt = new Date()
  createdAt.setDate(createdAt.getDate() - daysOld)

  return {
    objectID: faker.string.numeric(8),
    title: faker.lorem.sentence(),
    url: faker.internet.url(),
    points: faker.number.int({ min: minPoints, max: 500 }),
    num_comments: faker.number.int({ min: 0, max: 100 }),
    author: faker.internet.username(),
    created_at: createdAt.toISOString()
  }
}

export function createHNResponse(options: HNResponseOptions = {}): HNSearchResponse {
  const {
    hitCount = 5,
    daysOld = 0,
    minPoints = 20
  } = options

  const hits = Array.from({ length: hitCount }, (): HNStory => createHNStory(daysOld, minPoints))

  const response = {
    hits,
    nbHits: hitCount,
    page: 0,
    nbPages: 1,
    hitsPerPage: 20
  }

  return HNSearchResponseSchema.parse(response)
}
