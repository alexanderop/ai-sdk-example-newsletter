import { z } from 'zod'

export const GitHubRepoSchema = z.object({
  name: z.string(),
  description: z.string(),
  html_url: z.string(),
  stargazers_count: z.number(),
  language: z.string().optional()
})

export const GitHubSearchResponseSchema = z.object({
  items: z.array(GitHubRepoSchema)
})

export type GitHubRepo = z.infer<typeof GitHubRepoSchema>
export type GitHubSearchResponse = z.infer<typeof GitHubSearchResponseSchema>
