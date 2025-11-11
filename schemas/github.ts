import { z } from 'zod'

/**
 * Shared schema for GitHub repository data.
 * Used by both application code (with validation) and tests.
 */
export const GitHubRepoSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  html_url: z.string(),
  stargazers_count: z.number(),
  pushed_at: z.string(),
  language: z.string().nullish()
})

export const GitHubSearchResponseSchema = z.object({
  items: z.array(GitHubRepoSchema)
})

export type GitHubRepo = z.infer<typeof GitHubRepoSchema>
export type GitHubSearchResponse = z.infer<typeof GitHubSearchResponseSchema>
