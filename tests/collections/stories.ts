import { Collection } from '@msw/data'
import { HNStorySchema } from '../../schemas/hn.js'

/**
 * Collection for Hacker News stories used in tests.
 *
 * Schema fields:
 * - objectID: Unique story ID
 * - title: Story title
 * - url: Story URL (nullable)
 * - points: Number of upvotes
 * - num_comments: Number of comments
 * - author: Username of author
 * - created_at: ISO 8601 timestamp
 */
export const stories = new Collection({
  schema: HNStorySchema
})
