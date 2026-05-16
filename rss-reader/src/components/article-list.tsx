import { useAtom, useAtomValue } from 'jotai'
import { Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react'
import { cn } from '~/lib/utils'
import { feedsAtom, articlesAtom, selectedFeedIdAtom, selectedArticleIdAtom, readArticlesAtom, bookmarkedArticlesAtom } from '~/store/atoms'
import { ArticleSkeleton } from '~/components/ui/skeleton'
import type { Article } from '~/store/atoms'

export function ArticleList() {
  const feeds = useAtomValue(feedsAtom)
  const articles = useAtomValue(articlesAtom)
  const [selectedFeedId, setSelectedFeedId] = useAtom(selectedFeedIdAtom)
  const [, setSelectedArticleId] = useAtom(selectedArticleIdAtom)
  const [readArticles] = useAtom(readArticlesAtom)
  const [bookmarkedArticles] = useAtom(bookmarkedArticlesAtom)

  const displayArticles = selectedFeedId
    ? articles[selectedFeedId] || []
    : Object.values(articles).flat()

  const sortedArticles = [...displayArticles].sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  )

  if (feeds.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
          <svg className="h-8 w-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium">暂无订阅源</h3>
        <p className="text-sm text-muted-foreground">点击左侧的 + 按钮添加 RSS 订阅源</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">
          {selectedFeedId
            ? feeds.find((f) => f.id === selectedFeedId)?.title || '文章列表'
            : '全部文章'}
        </h2>
        <span className="text-xs text-muted-foreground">
          {sortedArticles.length} 篇文章
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {sortedArticles.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <p className="text-sm text-muted-foreground">暂无文章</p>
          </div>
        ) : (
          sortedArticles.map((article) => (
            <ArticleListItem
              key={article.id}
              article={article}
              isRead={readArticles.includes(article.id)}
              isBookmarked={bookmarkedArticles.includes(article.id)}
              isSelected={selectedFeedId === article.id}
              onSelect={() => setSelectedArticleId(article.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ArticleListItem({
  article,
  isRead,
  isBookmarked,
  isSelected,
  onSelect,
}: {
  article: Article
  isRead: boolean
  isBookmarked: boolean
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <article
      onClick={onSelect}
      className={cn(
        'group cursor-pointer border-b border-border p-4 transition-colors',
        'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
        isSelected && 'bg-accent/5',
        !isRead && 'border-l-2 border-l-accent'
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className={cn(
          'flex-1 text-sm leading-snug',
          isRead ? 'font-normal text-muted-foreground' : 'font-medium'
        )}>
          {article.title}
        </h3>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {isBookmarked && <BookmarkCheck className="h-4 w-4 text-accent" />}
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-md p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {article.description && (
        <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {article.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{article.author || '未知作者'}</span>
        <span>·</span>
        <span>{formatDate(article.pubDate)}</span>
      </div>
    </article>
  )
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days} 天前`
    if (days < 30) return `${Math.floor(days / 7)} 周前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}
