import { faker } from '@faker-js/faker'

interface RedditFeedOptions {
  itemCount?: number
  daysOld?: number
  minScore?: number
}

export function createRedditFeedXML(options: RedditFeedOptions = {}): string {
  const {
    itemCount = 5,
    daysOld = 0,
    minScore = 10
  } = options

  const items = Array.from({ length: itemCount }, () => {
    const pubDate = new Date()
    pubDate.setDate(pubDate.getDate() - daysOld)

    return {
      title: faker.lorem.sentence(),
      link: `https://www.reddit.com/r/vuejs/comments/${faker.string.alphanumeric(6)}/${faker.lorem.slug()}/`,
      pubDate: pubDate.toUTCString(),
      score: faker.number.int({ min: minScore, max: 200 }),
      comments: faker.number.int({ min: 0, max: 50 })
    }
  })

  const itemsXML = items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <pubDate>${item.pubDate}</pubDate>
      <reddit:score>${item.score}</reddit:score>
      <reddit:comments>${item.comments}</reddit:comments>
    </item>
  `).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:reddit="https://www.reddit.com/wiki/rss">
  <channel>
    <title>vuejs</title>
    <link>https://www.reddit.com/r/vuejs</link>
    <description>The Progressive JavaScript Framework</description>
    ${itemsXML}
  </channel>
</rss>`
}
