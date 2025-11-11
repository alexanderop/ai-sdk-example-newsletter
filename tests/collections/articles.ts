import { Collection } from '@msw/data'
import { DevToArticleSchema } from '../../schemas/devto.js'

/**
 * Collection for DEV.to articles used in tests.
 *
 * Schema fields:
 * - id: Unique article ID
 * - title: Article title
 * - url: Article URL
 * - published_at: ISO 8601 date string
 * - public_reactions_count: Number of reactions/likes
 * - comments_count: Number of comments
 * - tags: Comma-separated tags string
 * - tag_list: Array of tag strings
 * - user: Optional user object with name
 */
export const articles = new Collection({
  schema: DevToArticleSchema
})
