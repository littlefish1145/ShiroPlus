'use client'

import chroma from 'chroma-js'
import { useAtomValue } from 'jotai'
import { useEffect, useRef } from 'react'

import { backlightVisibleAtom } from '~/atoms/backlight'
import { effectSettingsAtom } from '~/atoms/settings'
import { clsxm } from '~/lib/helper'

export const GlobalBacklight = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const visible = useAtomValue(backlightVisibleAtom)
  const settings = useAtomValue(effectSettingsAtom)
  const settingsRef = useRef(settings)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const render = (time: number) => {
      const currentSettings = settingsRef.current
      if (!canvas.width || !canvas.height) {
        animationRef.current = requestAnimationFrame(render)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.dataset.theme === 'dark'

      // Slow floating backlight
      const backLightX = canvas.width * (0.5 + Math.sin(time * 0.0001) * 0.4)
      const backLightY = canvas.height * (0.5 + Math.cos(time * 0.00008) * 0.3)

      const radius = Math.max(canvas.width, canvas.height) * 0.4

      const bgGradient = ctx.createRadialGradient(
        backLightX,
        backLightY,
        0,
        backLightX,
        backLightY,
        radius,
      )

      if (isDark) {
        const baseColorDark = chroma(currentSettings.backlight.colorDark)
        bgGradient.addColorStop(0, baseColorDark.alpha(0.3).css())
        bgGradient.addColorStop(0.5, baseColorDark.alpha(0.15).css())
        bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      } else {
        const baseColorLight = chroma(currentSettings.backlight.colorLight)
        bgGradient.addColorStop(0, baseColorLight.alpha(0.7).css())
        bgGradient.addColorStop(0.5, baseColorLight.alpha(0.4).css())
        bgGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      }
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      animationRef.current = requestAnimationFrame(render)
    }

    animationRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={clsxm(
        'pointer-events-none absolute left-0 right-0 top-0 h-[80vh] w-screen transition-opacity duration-1000',
        visible && settings.backlight.enabled ? 'opacity-100' : 'opacity-0',
      )}
      style={{
        zIndex: 0,
        WebkitMaskImage:
          'linear-gradient(to bottom, black 0%, transparent 100%)',
        maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
      }}
    />
  )
}
