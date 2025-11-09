import { z } from 'zod'

/**
 * Reddit RSS feeds actually use Atom XML format, not RSS.
 * They use <entry> tags instead of <item> tags.
 * They do NOT include upvote scores in the feed.
 */

// Raw Atom entry structure (for validation if needed)
export const RedditAtomEntrySchema = z.object({
  title: z.string(),
  link: z.object({
    href: z.string().url()
  }),
  updated: z.string(), // ISO 8601 date
  author: z.object({
    name: z.string(),
    uri: z.string().url()
  }),
  category: z.object({
    term: z.string(),
    label: z.string()
  }),
  content: z.object({
    type: z.literal('html'),
    text: z.string()
  })
})

// Parsed Reddit post (what we use in the application)
export const RedditPostSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  pubDate: z.date(),
  subreddit: z.string()
})

export type RedditAtomEntry = z.infer<typeof RedditAtomEntrySchema>
export type RedditPost = z.infer<typeof RedditPostSchema>
