import { z } from 'zod'

/**
 * Shared schema for RSS feed data.
 * Used by both application code (with validation) and tests.
 */
export const RSSItemSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  pubDate: z.string(), // RFC 822 date format
  description: z.string(),
  guid: z.string()
})

export const RSSChannelSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  description: z.string(),
  item: z.array(RSSItemSchema)
})

export const RSSFeedSchema = z.object({
  rss: z.object({
    channel: RSSChannelSchema
  })
})

export type RSSItem = z.infer<typeof RSSItemSchema>
export type RSSChannel = z.infer<typeof RSSChannelSchema>
export type RSSFeed = z.infer<typeof RSSFeedSchema>
