import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export interface Feed {
  id: string
  title: string
  url: string
  description?: string
  imageUrl?: string
  lastFetched?: string
  unreadCount: number
}

export interface Article {
  id: string
  feedId: string
  title: string
  link: string
  description?: string
  content?: string
  pubDate: string
  author?: string
  read: boolean
  bookmarked: boolean
}

export interface FeedState {
  feeds: Feed[]
  articles: Record<string, Article[]>
  selectedFeedId: string | null
  selectedArticleId: string | null
}

export const feedsAtom = atomWithStorage<Feed[]>('rss-feeds', [])

export const articlesAtom = atomWithStorage<Record<string, Article[]>>('rss-articles', {})

export const selectedFeedIdAtom = atom<string | null>(null)

export const selectedArticleIdAtom = atom<string | null>(null)

export const readArticlesAtom = atomWithStorage<string[]>('rss-read-articles', [])

export const bookmarkedArticlesAtom = atomWithStorage<string[]>('rss-bookmarked-articles', [])

export const allArticlesAtom = atom((get) => {
  const articles = get(articlesAtom)
  const feeds = get(feedsAtom)
  const allArticles: Article[] = []

  Object.values(articles).forEach((feedArticles) => {
    allArticles.push(...feedArticles)
  })

  return allArticles.sort((a, b) => {
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  })
})

export const unreadCountAtom = atom((get) => {
  const articles = get(allArticlesAtom)
  const readArticles = get(readArticlesAtom)
  return articles.filter((a) => !readArticles.includes(a.id)).length
})
