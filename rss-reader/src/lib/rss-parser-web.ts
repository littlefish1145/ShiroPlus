import { getFaviconUrl } from '~/lib/utils'
import type { Feed, Article } from '~/store/atoms'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

function stripHtmlTags(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

interface WebFeedInfo {
  id: string
  title: string
  url: string
  description: string | null
  image_url: string | null
}

interface WebArticle {
  id: string
  feed_id: string
  title: string
  link: string
  description: string | null
  content: string | null
  pub_date: string
  author: string | null
}

function parseXml(xmlString: string): { feed: WebFeedInfo; items: WebArticle[] } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')
  
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('XML解析错误')
  }

  const isAtom = doc.querySelector('feed') !== null
  
  if (isAtom) {
    return parseAtom(doc, generateId())
  } else {
    return parseRss(doc, generateId())
  }
}

function parseAtom(doc: Document, feedId: string): { feed: WebFeedInfo; items: WebArticle[] } {
  const feedEl = doc.querySelector('feed')!
  
  const title = feedEl.querySelector('title')?.textContent || 'Unknown Feed'
  const subtitle = feedEl.querySelector('subtitle')?.textContent || null
  
  let imageUrl: string | null = null
  const icon = feedEl.querySelector('icon')?.textContent
  const logo = feedEl.querySelector('logo')?.textContent
  imageUrl = logo || icon || null

  const feed: WebFeedInfo = {
    id: feedId,
    title,
    url: '',
    description: subtitle,
    image_url: imageUrl,
  }

  const items: WebArticle[] = []
  feedEl.querySelectorAll('entry').forEach((entry) => {
    const itemTitle = entry.querySelector('title')?.textContent || '无标题'
    const link = entry.querySelector('link')?.getAttribute('href') || ''
    const summary = entry.querySelector('summary')?.textContent || entry.querySelector('content')?.textContent || null
    const published = entry.querySelector('published')?.textContent || entry.querySelector('updated')?.textContent || new Date().toISOString()
    const author = entry.querySelector('author name')?.textContent || null

    items.push({
      id: generateId(),
      feed_id: feedId,
      title: itemTitle,
      link,
      description: summary ? stripHtmlTags(summary) : null,
      content: summary,
      pub_date: published,
      author,
    })
  })

  return { feed, items }
}

function parseRss(doc: Document, feedId: string): { feed: WebFeedInfo; items: WebArticle[] } {
  const channel = doc.querySelector('channel')!
  
  const title = channel.querySelector('title')?.textContent || 'Unknown Feed'
  const description = channel.querySelector('description')?.textContent || null
  const imageUrl = channel.querySelector('image url')?.textContent || null

  const feed: WebFeedInfo = {
    id: feedId,
    title,
    url: '',
    description,
    image_url: imageUrl,
  }

  const items: WebArticle[] = []
  channel.querySelectorAll('item').forEach((item) => {
    const itemTitle = item.querySelector('title')?.textContent || '无标题'
    const link = item.querySelector('link')?.textContent || ''
    const description = item.querySelector('description')?.textContent || (item.querySelector('content\\:encoded') as any)?.textContent || null
    const pubDate = item.querySelector('pubDate')?.textContent || (item.querySelector('dc\\:date') as any)?.textContent || new Date().toISOString()
    const author = item.querySelector('author')?.textContent || (item.querySelector('dc\\:creator') as any)?.textContent || null

    items.push({
      id: generateId(),
      feed_id: feedId,
      title: itemTitle,
      link,
      description: description ? stripHtmlTags(description) : null,
      content: description,
      pub_date: pubDate,
      author,
    })
  })

  return { feed, items }
}

async function fetchAndParse(url: string): Promise<{ feed: WebFeedInfo; items: WebArticle[] }> {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
      'User-Agent': 'RSS Reader/1.0',
    },
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const xml = await response.text()
  return parseXml(xml)
}

export async function parseFeed(url: string): Promise<{ feed: Omit<Feed, 'unreadCount'>; articles: Article[] }> {
  try {
    const { feed: feedInfo, items } = await fetchAndParse(url)
    
    const feed: Omit<Feed, 'unreadCount'> = {
      id: feedInfo.id,
      title: feedInfo.title,
      url,
      description: feedInfo.description ?? undefined,
      imageUrl: feedInfo.image_url ?? getFaviconUrl(url),
      lastFetched: new Date().toISOString(),
    }

    const articles: Article[] = items.map((item) => ({
      id: item.id,
      feedId: item.feed_id,
      title: item.title,
      link: item.link,
      description: item.description ?? undefined,
      content: item.content ?? item.description ?? undefined,
      pubDate: item.pub_date,
      author: item.author ?? undefined,
      read: false,
      bookmarked: false,
    }))

    return { feed, articles }
  } catch (error) {
    console.error('Failed to parse feed:', error)
    throw new Error(`无法解析 RSS 源: ${error}`)
  }
}

export async function fetchAllFeeds(feeds: Feed[]): Promise<{ feedId: string; articles: Article[] }[]> {
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const { items } = await fetchAndParse(feed.url)

      const articles: Article[] = items.map((item) => ({
        id: item.id,
        feedId: feed.id,
        title: item.title,
        link: item.link,
        description: item.description ?? undefined,
        content: item.content ?? item.description ?? undefined,
        pubDate: item.pub_date,
        author: item.author ?? undefined,
        read: false,
        bookmarked: false,
      }))

      return { feedId: feed.id, articles }
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<{ feedId: string; articles: Article[] }> => r.status === 'fulfilled')
    .map((r) => r.value)
}
