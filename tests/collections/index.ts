/**
 * Central export for all test collections.
 * Collections provide queryable, in-memory data stores for testing.
 */

import { articles } from './articles'
import { repos } from './repos'
import { stories } from './stories'
import { redditPosts } from './reddit-posts'
import { claudeMessages } from './claude-messages'
import { rssItems } from './rss-items'

export { articles, repos, stories, redditPosts, claudeMessages, rssItems }

/**
 * Clears all collections.
 * Call this in afterEach() to ensure test isolation.
 */
export function clearAllCollections(): void {
  // Delete all records from each collection
  const allArticles = articles.findMany((q): unknown => q.where((): boolean => true))
  allArticles.forEach((article): void => {
    articles.delete(article)
  })

  const allRepos = repos.findMany((q): unknown => q.where((): boolean => true))
  allRepos.forEach((repo): void => {
    repos.delete(repo)
  })

  const allStories = stories.findMany((q): unknown => q.where((): boolean => true))
  allStories.forEach((story): void => {
    stories.delete(story)
  })

  const allPosts = redditPosts.findMany((q): unknown => q.where((): boolean => true))
  allPosts.forEach((post): void => {
    redditPosts.delete(post)
  })

  const allMessages = claudeMessages.findMany((q): unknown => q.where((): boolean => true))
  allMessages.forEach((message): void => {
    claudeMessages.delete(message)
  })

  const allRssItems = rssItems.findMany((q): unknown => q.where((): boolean => true))
  allRssItems.forEach((item): void => {
    rssItems.delete(item)
  })
}

/**
 * Dumps all collection data to console for debugging.
 */
export function dumpCollections(): void {
  // eslint-disable-next-line no-console
  console.log('=== Collection State ===')
  // eslint-disable-next-line no-console
  console.log('Articles:', articles.findMany((q): unknown => q.where((): boolean => true)))
  // eslint-disable-next-line no-console
  console.log('Repos:', repos.findMany((q): unknown => q.where((): boolean => true)))
  // eslint-disable-next-line no-console
  console.log('Stories:', stories.findMany((q): unknown => q.where((): boolean => true)))
  // eslint-disable-next-line no-console
  console.log('Reddit Posts:', redditPosts.findMany((q): unknown => q.where((): boolean => true)))
  // eslint-disable-next-line no-console
  console.log('Claude Messages:', claudeMessages.findMany((q): unknown => q.where((): boolean => true)))
  // eslint-disable-next-line no-console
  console.log('RSS Items:', rssItems.findMany((q): unknown => q.where((): boolean => true)))
  // eslint-disable-next-line no-console
  console.log('========================')
}
