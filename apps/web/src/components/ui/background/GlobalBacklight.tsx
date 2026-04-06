'use client'

import { useEffect, useRef } from 'react'
import { clsxm } from '~/lib/helper'

export const GlobalBacklight = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

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
      if (!canvas.width || !canvas.height) {
        animationRef.current = requestAnimationFrame(render)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark'

      // Slow floating backlight
      const backLightX = canvas.width * (0.5 + Math.sin(time * 0.0001) * 0.4)
      const backLightY = canvas.height * (0.5 + Math.cos(time * 0.00008) * 0.3)
      
      const radius = Math.max(canvas.width, canvas.height) * 0.4

      const bgGradient = ctx.createRadialGradient(
        backLightX, backLightY, 0,
        backLightX, backLightY, radius
      )
      
      if (isDark) {
        bgGradient.addColorStop(0, 'rgba(40, 120, 255, 0.25)')
        bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      } else {
        bgGradient.addColorStop(0, 'rgba(248, 68, 131, 0.35)')
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
      className={clsxm('pointer-events-none fixed inset-0 z-[1] h-screen w-screen')}
    />
  )
}
