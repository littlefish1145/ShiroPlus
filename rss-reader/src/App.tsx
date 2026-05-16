import { ThemeProvider, useTheme } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'jotai'
import { useAtomValue, useAtom } from 'jotai'
import { useState, useEffect } from 'react'
import { FeedList } from './components/feed-list'
import { ArticleList } from './components/article-list'
import { ArticleReader } from './components/article-reader'
import { selectedArticleIdAtom } from './store/atoms'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const selectedArticleId = useAtomValue(selectedArticleIdAtom)

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex h-screen flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-base-100 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="flex items-center gap-2 text-lg font-bold">
              <svg className="h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 11a9 9 0 0 1 9 9" />
                <path d="M4 4a16 16 0 0 1 16 16" />
                <circle cx="5" cy="19" r="1" fill="currentColor" />
              </svg>
              RSS Reader
            </h1>
          </div>
          <ThemeSwitcherInline />
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside
            className={`${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } fixed inset-y-0 left-0 z-40 w-72 transform border-r border-border bg-base-100 transition-transform duration-200 lg:relative lg:translate-x-0`}
          >
            <FeedList />
          </aside>

          {selectedArticleId ? (
            <main className="flex-1 overflow-hidden bg-background">
              <ArticleReader />
            </main>
          ) : (
            <main className="flex flex-1 flex-col overflow-hidden border-r border-border bg-background lg:w-96">
              <ArticleList />
            </main>
          )}
        </div>
      </div>
    </ThemeProvider>
  )
}

function ThemeSwitcherInline() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-8 w-20" />

  return (
    <div className="relative inline-flex rounded-full border border-zinc-200 p-[3px] dark:border-zinc-700">
      <div
        className="absolute top-1 z-0 size-8 rounded-full bg-base-100 shadow-sm transition-all duration-200"
        style={{
          left: theme === 'light' ? 4 : theme === 'dark' ? 68 : 36,
        }}
      />
      {[
        { value: 'light', icon: '☀️' },
        { value: 'system', icon: '💻' },
        { value: 'dark', icon: '🌙' },
      ].map(({ value, icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
            theme === value ? 'text-accent' : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>
        <AppContent />
      </Provider>
    </QueryClientProvider>
  )
}
