import { Collection } from '@msw/data'
import { z } from 'zod'

/**
 * Collection for RSS feed items used in tests.
 * Stores structured data that will be converted to RSS XML format.
 *
 * Schema fields:
 * - title: Item title
 * - link: Item URL
 * - pubDate: RFC 822 date string
 * - description: Item description
 * - guid: Unique identifier
 * - feedSource: Which feed this item belongs to (e.g., 'vuejs-blog', 'nuxt-blog')
 */
const RSSItemDataSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  pubDate: z.string(),
  description: z.string(),
  guid: z.string(),
  feedSource: z.string()
})

export const rssItems = new Collection({
  schema: RSSItemDataSchema
})
