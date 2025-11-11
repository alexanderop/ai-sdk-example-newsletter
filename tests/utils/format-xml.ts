/**
 * XML formatting utilities for converting collection records to XML format.
 * Used by MSW handlers to transform collection data into RSS/Atom feeds.
 */

interface RSSFeedOptions {
  title: string
  link: string
  description?: string
}

interface RSSItem {
  title: string
  link: string
  pubDate: string
  description: string
  guid: string
}

/**
 * Converts an array of RSS items from a collection to RSS 2.0 XML format.
 */
export function buildRSSFeed(items: RSSItem[], options: RSSFeedOptions): string {
  const { title, link, description = '' } = options

  const itemsXML = items.map((item): string => `
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

interface AtomFeedOptions {
  subreddit: string
}

interface AtomEntry {
  title: string
  link: string
  updated: string
  authorName: string
  authorUri: string
  content: string
  postId: string
}

/**
 * Converts an array of Atom entries from a collection to Atom XML format.
 * Used for Reddit RSS feeds which actually use Atom format.
 */
export function buildAtomFeed(entries: AtomEntry[], options: AtomFeedOptions): string {
  const { subreddit } = options

  const entriesXML = entries.map((entry): string => `
    <entry>
      <author>
        <name>${entry.authorName}</name>
        <uri>${entry.authorUri}</uri>
      </author>
      <category term="${subreddit}" label="r/${subreddit}"/>
      <content type="html"><![CDATA[${entry.content}]]></content>
      <id>t3_${entry.postId}</id>
      <link href="${entry.link}"/>
      <title>${entry.title}</title>
      <updated>${entry.updated}</updated>
    </entry>
  `).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <category term="${subreddit}" label="r/${subreddit}"/>
  <icon>https://www.redditstatic.com/icon.png</icon>
  <id>/r/${subreddit}.rss</id>
  <link href="https://www.reddit.com/r/${subreddit}.rss" rel="self"/>
  <link href="https://www.reddit.com/r/${subreddit}"/>
  <title>${subreddit}</title>
  <updated>${new Date().toISOString()}</updated>
  ${entriesXML}
</feed>`
}
