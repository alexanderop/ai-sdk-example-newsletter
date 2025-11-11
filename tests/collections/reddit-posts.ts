import { Collection } from '@msw/data'
import { z } from 'zod'

/**
 * Collection for Reddit posts used in tests.
 * Stores structured data that will be converted to Atom XML format.
 *
 * Schema fields:
 * - title: Post title
 * - link: Post URL
 * - updated: ISO 8601 timestamp
 * - authorName: Reddit username (e.g., "/u/username")
 * - authorUri: Reddit user profile URL
 * - subreddit: Subreddit name
 * - content: Post content/description
 * - postId: Reddit post ID
 */
const RedditPostDataSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  updated: z.string(),
  authorName: z.string(),
  authorUri: z.string().url(),
  subreddit: z.string(),
  content: z.string(),
  postId: z.string()
})

export const redditPosts = new Collection({
  schema: RedditPostDataSchema
})
