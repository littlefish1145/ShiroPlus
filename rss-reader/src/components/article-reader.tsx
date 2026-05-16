import { useEffect } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { Bookmark, BookmarkCheck, ExternalLink, ArrowLeft } from 'lucide-react'
import { articlesAtom, selectedArticleIdAtom, readArticlesAtom, bookmarkedArticlesAtom } from '~/store/atoms'
import { Button } from '~/components/ui'
import { cn, formatRelativeTime } from '~/lib/utils'
import type { Article } from '~/store/atoms'

export function ArticleReader() {
  const articles = useAtomValue(articlesAtom)
  const [selectedArticleId, setSelectedArticleId] = useAtom(selectedArticleIdAtom)
  const [readArticles, setReadArticles] = useAtom(readArticlesAtom)
  const [bookmarkedArticles, setBookmarkedArticles] = useAtom(bookmarkedArticlesAtom)

  const allArticles = Object.values(articles).flat()
  const article = allArticles.find((a) => a.id === selectedArticleId)

  useEffect(() => {
    if (article && !readArticles.includes(article.id)) {
      setReadArticles((prev) => [...prev, article.id])
    }
  }, [article, readArticles, setReadArticles])

  if (!article) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
          <svg className="h-8 w-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium">选择文章阅读</h3>
        <p className="text-sm text-muted-foreground">从左侧列表选择一篇文章进行阅读</p>
      </div>
    )
  }

  const isBookmarked = bookmarkedArticles.includes(article.id)

  const handleToggleBookmark = () => {
    setBookmarkedArticles((prev) =>
      prev.includes(article.id)
        ? prev.filter((id) => id !== article.id)
        : [...prev, article.id]
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedArticleId(null)}
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <div className="flex gap-1">
          <Button
            variant={isBookmarked ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleToggleBookmark}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <article className="mx-auto max-w-3xl px-6 py-8">
          <header className="mb-8">
            <h1 className="mb-4 text-2xl font-bold leading-tight md:text-3xl">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {article.author && (
                <>
                  <span className="font-medium">{article.author}</span>
                  <span>·</span>
                </>
              )}
              <span>{formatRelativeTime(article.pubDate)}</span>
              {article.link && (
                <>
                  <span>·</span>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent"
                  >
                    原文链接
                  </a>
                </>
              )}
            </div>
          </header>

          <div
            className="prose prose-zinc dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: article.content || article.description || '',
            }}
          />
        </article>
      </div>
    </div>
  )
}
