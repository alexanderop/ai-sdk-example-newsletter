import { Collection } from '@msw/data'
import { GitHubRepoSchema } from '../../schemas/github.js'

/**
 * Collection for GitHub repositories used in tests.
 *
 * Schema fields:
 * - name: Repository name
 * - description: Repository description
 * - html_url: GitHub URL
 * - stargazers_count: Number of stars
 * - language: Optional programming language
 */
export const repos = new Collection({
  schema: GitHubRepoSchema
})
