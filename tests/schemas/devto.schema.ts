import { z } from 'zod'

export const DevToArticleSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string(),
  published_at: z.string(),
  public_reactions_count: z.number(),
  comments_count: z.number(),
  tags: z.array(z.string()),
  user: z.object({
    name: z.string()
  }).optional()
})

export const DevToArticlesResponseSchema = z.array(DevToArticleSchema)

export type DevToArticle = z.infer<typeof DevToArticleSchema>
export type DevToArticlesResponse = z.infer<typeof DevToArticlesResponseSchema>
