'use client'

import { useAtomValue } from 'jotai'

import { postFontFamilyAtom } from '~/atoms/reading'
import { MainMarkdown } from '~/components/ui/markdown'
import { useCurrentPostDataSelector } from '~/providers/post/CurrentPostDataProvider'

export const PostMarkdownRenderer = () => {
  const text = useCurrentPostDataSelector((data) => data?.text)
  const fontFamily = useAtomValue(postFontFamilyAtom)

  if (!text) return null
  return (
    <MainMarkdown
      allowsScript
      value={text}
      className={
        fontFamily === 'serif'
          ? 'markdown--drop-cap font-serif'
          : 'min-w-0 overflow-hidden font-sans'
      }
    />
  )
}
