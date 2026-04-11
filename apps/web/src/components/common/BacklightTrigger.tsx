'use client'

import { useSetAtom } from 'jotai'
import { useEffect } from 'react'

import { backlightVisibleAtom } from '~/atoms/backlight'

export const BacklightTrigger = () => {
  const setBacklightVisible = useSetAtom(backlightVisibleAtom)
  useEffect(() => {
    setBacklightVisible(true)
    return () => setBacklightVisible(false)
  }, [setBacklightVisible])

  return null
}
