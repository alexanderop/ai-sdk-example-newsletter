import { faker } from '@faker-js/faker'

interface RedditFeedOptions {
  itemCount?: number
  daysOld?: number
  subreddit?: string
}

/**
 * Creates a Reddit Atom feed XML.
 * Reddit actually uses Atom format, not RSS.
 * Note: Reddit feeds do NOT include upvote scores.
 */
export function createRedditFeedXML(options: RedditFeedOptions = {}): string {
  const {
    itemCount = 5,
    daysOld = 0,
    subreddit = 'vuejs'
  } = options

  const entries = Array.from({ length: itemCount }, () => {
    const updated = new Date()
    updated.setDate(updated.getDate() - daysOld)

    const username = faker.internet.username()
    const postId = faker.string.alphanumeric(7)
    const slug = faker.lorem.slug()

    return {
      title: faker.lorem.sentence(),
      link: `https://www.reddit.com/r/${subreddit}/comments/${postId}/${slug}/`,
      updated: updated.toISOString(),
      authorName: `/u/${username}`,
      authorUri: `https://www.reddit.com/user/${username}`,
      content: faker.lorem.paragraphs(2)
    }
  })

  const entriesXML = entries.map(entry => `
    <entry>
      <author>
        <name>${entry.authorName}</name>
        <uri>${entry.authorUri}</uri>
      </author>
      <category term="${subreddit}" label="r/${subreddit}"/>
      <content type="html"><![CDATA[${entry.content}]]></content>
      <id>t3_${faker.string.alphanumeric(7)}</id>
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
