import { faker } from '@faker-js/faker'
import type { RSSItem } from '../schemas/rss-feed.schema'

interface RSSFeedOptions {
  title?: string
  link?: string
  description?: string
  itemCount?: number
  daysOld?: number
}

export function createRSSItem(daysOld: number = 0): RSSItem {
  const pubDate = new Date()
  pubDate.setDate(pubDate.getDate() - daysOld)

  return {
    title: faker.lorem.sentence(),
    link: faker.internet.url(),
    pubDate: pubDate.toUTCString(),
    description: faker.lorem.paragraph(),
    guid: faker.string.uuid()
  }
}

export function createRSSFeedXML(options: RSSFeedOptions = {}): string {
  const {
    title = 'Vue.js Blog',
    link = 'https://blog.vuejs.org',
    description = 'The official Vue.js blog',
    itemCount = 3,
    daysOld = 0
  } = options

  const items = Array.from({ length: itemCount }, () => createRSSItem(daysOld))

  const itemsXML = items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <pubDate>${item.pubDate}</pubDate>
      <description><![CDATA[${item.description}]]></description>
      <guid>${item.guid}</guid>
    </item>
  `).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${title}</title>
    <link>${link}</link>
    <description>${description}</description>
    ${itemsXML}
  </channel>
</rss>`
}
