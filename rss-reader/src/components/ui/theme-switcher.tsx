import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Monitor, Moon } from 'lucide-react'
import { cn } from '~/lib/utils'

const themes = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'system', label: '系统', icon: Monitor },
  { value: 'dark', label: '深色', icon: Moon },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="inline-flex rounded-full border border-zinc-200 p-[3px] dark:border-zinc-700">
        <div className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="relative inline-flex rounded-full border border-zinc-200 p-[3px] dark:border-zinc-700">
      <div
        className="absolute top-1 z-0 size-8 rounded-full bg-base-100 shadow-sm transition-all duration-200"
        style={{
          left: theme === 'light' ? 4 : theme === 'dark' ? 68 : 36,
        }}
      />
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors',
            theme === value ? 'text-accent' : 'text-zinc-600 dark:text-zinc-400'
          )}
          aria-label={`切换到${label}主题`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}
