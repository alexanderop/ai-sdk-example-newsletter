import { z } from 'zod'

export const HNStorySchema = z.object({
  objectID: z.string(),
  title: z.string(),
  url: z.string().url().nullable(),
  points: z.number(),
  num_comments: z.number(),
  author: z.string(),
  created_at: z.string() // ISO 8601 timestamp
})

export const HNSearchResponseSchema = z.object({
  hits: z.array(HNStorySchema),
  nbHits: z.number(),
  page: z.number(),
  nbPages: z.number(),
  hitsPerPage: z.number()
})

export type HNStory = z.infer<typeof HNStorySchema>
export type HNSearchResponse = z.infer<typeof HNSearchResponseSchema>
