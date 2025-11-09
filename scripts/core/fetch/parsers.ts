// Light regex-based Atom/RSS extraction
export function parseAtomEntries(xml: string) {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? []
  return entries.map(e => ({
    title: /<title[^>]*>([\s\S]*?)<\/title>/.exec(e)?.[1]?.trim() ?? '',
    link: /<link[^>]*href="([^"]+)"/.exec(e)?.[1] ?? '',
    updated: /<updated[^>]*>([\s\S]*?)<\/updated>/.exec(e)?.[1] ?? ''
  }))
}

export function parseRSSItems(xml: string) {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map(m => m[1])
  return items.map(i => ({
    title: /<title[^>]*>([\s\S]*?)<\/title>/.exec(i)?.[1]?.trim() ?? '',
    link: /<link[^>]*>([\s\S]*?)<\/link>/.exec(i)?.[1]?.trim() ?? '',
    pubDate: /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/.exec(i)?.[1]?.trim() ?? ''
  }))
}

export const toDate = (s: string) => new Date(s)
