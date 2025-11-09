// Light regex-based Atom/RSS extraction
export function parseAtomEntries(xml: string): Array<{ title: string, link: string, updated: string }> {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? []
  return entries.map((e): { title: string, link: string, updated: string } => ({
    title: /<title[^>]*>([\s\S]*?)<\/title>/.exec(e)?.[1]?.trim() ?? '',
    link: /<link[^>]*href="([^"]+)"/.exec(e)?.[1] ?? '',
    updated: /<updated[^>]*>([\s\S]*?)<\/updated>/.exec(e)?.[1] ?? ''
  }))
}

export function parseRSSItems(xml: string): Array<{ title: string, link: string, pubDate: string }> {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((m): string => m[1])
  return items.map((i): { title: string, link: string, pubDate: string } => ({
    title: /<title[^>]*>([\s\S]*?)<\/title>/.exec(i)?.[1]?.trim() ?? '',
    link: /<link[^>]*>([\s\S]*?)<\/link>/.exec(i)?.[1]?.trim() ?? '',
    pubDate: /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/.exec(i)?.[1]?.trim() ?? ''
  }))
}

export const toDate = (s: string): Date => new Date(s)
