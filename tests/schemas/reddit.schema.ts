import { z } from 'zod'

export const RedditItemSchema = z.object({
  'title': z.string(),
  'link': z.string().url(),
  'pubDate': z.string(),
  'category': z.string().optional(),
  'reddit:score': z.string().optional(), // Upvotes as string
  'reddit:comments': z.string().optional() // Comment count as string
})

export const RedditChannelSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  description: z.string(),
  item: z.array(RedditItemSchema)
})

export const RedditFeedSchema = z.object({
  rss: z.object({
    '@version': z.literal('2.0'),
    '@xmlns:reddit': z.string().optional(),
    'channel': RedditChannelSchema
  })
})

export type RedditFeed = z.infer<typeof RedditFeedSchema>
export type RedditItem = z.infer<typeof RedditItemSchema>
