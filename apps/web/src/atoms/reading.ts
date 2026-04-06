import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const isInReadingAtom = atom(false)
export const isFocusReadingAtom = atom(false)
export const isMouseInMarkdownAtom = atom(false)
export const immersiveReadingEnabledAtom = atom(false)
export const mainMarkdownElementAtom = atom<HTMLElement | null>(null)

export const postFontFamilyAtom = atomWithStorage<'sans' | 'serif'>(
  'postFontFamily',
  'sans',
)
