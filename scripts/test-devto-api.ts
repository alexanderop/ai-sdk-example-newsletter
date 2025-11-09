import { getJson } from './core/fetch/http.js'

type DevToArticle = {
  id: number
  title: string
  url: string
  published_at: string
  public_reactions_count: number
  comments_count: number
  tags: unknown
  tag_list: unknown
  user?: { name: string }
}

async function testDevToAPI(): Promise<void> {
  const url = 'https://dev.to/api/articles?tag=vue&top=7&per_page=1'
  console.log('Testing DEV.to API:', url)

  try {
    const data = await getJson<DevToArticle[]>(url)
    console.log('\n✅ API call successful')
    console.log('Number of articles:', data?.length ?? 0)

    if (data && data.length > 0) {
      console.log('\nFirst article sample:')
      console.log(JSON.stringify(data[0], null, 2))

      console.log('\nType of tags field:', typeof data[0].tags)
      console.log('Tags value:', data[0].tags)
      console.log('Tag_list value:', data[0].tag_list)
    }
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

testDevToAPI()
