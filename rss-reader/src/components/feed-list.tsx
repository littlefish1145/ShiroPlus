import { useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { X, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button, Input, Modal } from '~/components/ui'
import { feedsAtom, articlesAtom, selectedFeedIdAtom } from '~/store/atoms'
import { parseFeed, fetchAllFeeds } from '~/lib/rss-parser-web'
import type { Article } from '~/store/atoms'
import { FeedItemSkeleton } from '~/components/ui/skeleton'

export function FeedList() {
  const [feeds, setFeeds] = useAtom(feedsAtom)
  const [articles, setArticles] = useAtom(articlesAtom)
  const [selectedFeedId, setSelectedFeedId] = useAtom(selectedFeedIdAtom)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddFeed = async (url: string) => {
    setError(null)
    setIsLoading(true)
    try {
      const { feed, articles } = await parseFeed(url)
      setFeeds((prev) => [...prev, { ...feed, unreadCount: articles.length }])
      setArticles((prev) => ({ ...prev, [feed.id]: articles }))
      setShowAddModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加订阅源失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshAll = async () => {
    if (feeds.length === 0) return
    setIsRefreshing(true)
    try {
      const results = await fetchAllFeeds(feeds)
      const newArticles: Record<string, Article[]> = {}
      results.forEach(({ feedId, articles: feedArticles }) => {
        newArticles[feedId] = feedArticles
      })
      setArticles((prev) => ({ ...prev, ...newArticles }))
    } catch (err) {
      console.error('Refresh failed:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDeleteFeed = (feedId: string) => {
    setFeeds((prev) => prev.filter((f) => f.id !== feedId))
    setArticles((prev) => {
      const newArticles = { ...prev }
      delete newArticles[feedId]
      return newArticles
    })
    if (selectedFeedId === feedId) {
      setSelectedFeedId(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">订阅源</h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshing || feeds.length === 0}
            title="刷新所有"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowAddModal(true)} title="添加订阅源">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <button
          onClick={() => setSelectedFeedId(null)}
          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
            selectedFeedId === null ? 'bg-accent/10' : ''
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <span className="text-lg font-bold">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-medium">全部文章</div>
            <div className="text-xs text-muted-foreground">
              {feeds.length} 个订阅源
            </div>
          </div>
        </button>

        {feeds.map((feed) => (
          <button
            key={feed.id}
            onClick={() => setSelectedFeedId(feed.id)}
            className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
              selectedFeedId === feed.id ? 'bg-accent/10' : ''
            }`}
          >
            {feed.imageUrl ? (
              <img
                src={feed.imageUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div
              className={`hidden h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-white ${
                feed.imageUrl ? 'hidden' : 'flex'
              }`}
            >
              <span className="text-lg font-bold">{feed.title[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{feed.title}</div>
              <div className="text-xs text-muted-foreground">
                {feed.lastFetched ? `更新于 ${new Date(feed.lastFetched).toLocaleDateString()}` : '未更新'}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteFeed(feed.id)
              }}
              className="hidden rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-100 hover:text-red-500 group-hover:block dark:hover:bg-red-900/30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </button>
        ))}
      </div>

      <Modal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        title="添加订阅源"
        description="输入 RSS 源的 URL 地址"
      >
        <AddFeedForm
          onSubmit={handleAddFeed}
          isLoading={isLoading}
          error={error}
          onClearError={() => setError(null)}
        />
      </Modal>
    </div>
  )
}

function AddFeedForm({
  onSubmit,
  isLoading,
  error,
  onClearError,
}: {
  onSubmit: (url: string) => void
  isLoading: boolean
  error: string | null
  onClearError: () => void
}) {
  const [url, setUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    onSubmit(url.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="https://example.com/feed.xml"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            if (error) onClearError()
          }}
          disabled={isLoading}
          autoFocus
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={() => onSubmit('')}>
          取消
        </Button>
        <Button type="submit" isLoading={isLoading} disabled={!url.trim()}>
          添加
        </Button>
      </div>
    </form>
  )
}
