import { z } from 'zod'

export const RSSItemSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  pubDate: z.string(), // RFC-822 date
  description: z.string().optional(),
  guid: z.string().optional()
})

export const RSSChannelSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  description: z.string(),
  item: z.array(RSSItemSchema)
})

export const RSSFeedSchema = z.object({
  rss: z.object({
    '@version': z.literal('2.0'),
    'channel': RSSChannelSchema
  })
})

export type RSSFeed = z.infer<typeof RSSFeedSchema>
export type RSSChannel = z.infer<typeof RSSChannelSchema>
export type RSSItem = z.infer<typeof RSSItemSchema>
