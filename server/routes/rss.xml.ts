import { Feed } from 'feed'
import { queryCollection } from '@nuxt/content/server'
import { loadNewsletterConfig } from '../../scripts/utils/config-loader'
import type { NewsletterConfig } from '../../schemas/config'

// Cache the config at module level to avoid repeated file reads
let cachedConfig: NewsletterConfig | null = null

export default defineEventHandler(async (event) => {
  // Load newsletter config with caching
  let config: NewsletterConfig
  try {
    if (cachedConfig) {
      config = cachedConfig
    } else {
      config = await loadNewsletterConfig()
      cachedConfig = config
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to load newsletter configuration: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  const feed = new Feed({
    title: config.title,
    description: config.description,
    id: config.siteUrl,
    link: config.siteUrl,
    language: config.language,
    favicon: `${config.siteUrl}/favicon.ico`,
    copyright: `© ${new Date().getFullYear()} ${config.author}`,
    feedLinks: {
      rss: `${config.siteUrl}/rss.xml`
    },
    author: {
      name: config.author
    }
  })

  // Query newsletters using Content v3 API
  const newsletters = await queryCollection(event, 'newsletters')
    .order('date', 'DESC')
    .limit(20)
    .all()

  // Add items to feed
  for (const newsletter of newsletters) {
    feed.addItem({
      title: newsletter.title ?? config.title,
      id: `${config.siteUrl}${newsletter.path}`,
      link: `${config.siteUrl}${newsletter.path}`,
      description: newsletter.description || newsletter.title,
      date: new Date(newsletter.date),
      author: [{
        name: newsletter.author || config.author
      }]
    })
  }

  // Set headers using H3
  setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')

  return feed.rss2()
})
