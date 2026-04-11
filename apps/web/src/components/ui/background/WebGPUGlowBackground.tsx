'use client'

import { useEffect, useRef } from 'react'

interface GlowOrb {
  x: number
  y: number
  baseY: number
  radius: number
  speed: number
  phase: number
  floatRange: number
}

export const WebGPUGlowBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const orbsRef = useRef<GlowOrb[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.warn('[WebGPUGlowBackground] Canvas ref not found')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.warn('[WebGPUGlowBackground] 2D context not available')
      return
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const orbCount = 8
    orbsRef.current = Array.from({ length: orbCount }, (_, i) => ({
      x: 0.1 + (i * 1) / orbCount,
      y: 0.1 + Math.sin(i) * 0.3 + (i % 2) * 0.4,
      baseY: 0.1 + Math.sin(i) * 0.3 + (i % 2) * 0.4,
      radius: 0.1 + Math.random() * 0.08,
      speed: 0.0001 + Math.random() * 0.0002,
      phase: Math.random() * Math.PI * 2,
      floatRange: 0.01 + Math.random() * 0.02,
    }))

    const render = (time: number) => {
      // 清除画布为透明背景
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.dataset.theme === 'dark'

      const lightColors = [
        { r: 160, g: 110, b: 80 },
        { r: 170, g: 80, b: 140 },
        { r: 160, g: 150, b: 100 },
        { r: 170, g: 100, b: 150 },
        { r: 160, g: 130, b: 120 },
        { r: 170, g: 120, b: 140 },
        { r: 165, g: 140, b: 100 },
        { r: 175, g: 110, b: 150 },
      ]

      const darkColors = [
        { r: 255, g: 160, b: 100 },
        { r: 255, g: 100, b: 160 },
        { r: 255, g: 180, b: 120 },
        { r: 255, g: 120, b: 180 },
        { r: 255, g: 170, b: 140 },
        { r: 255, g: 140, b: 170 },
        { r: 255, g: 190, b: 120 },
        { r: 255, g: 130, b: 170 },
      ]

      const colors = isDark ? darkColors : lightColors

      orbsRef.current.forEach((orb, i) => {
        orb.y =
          orb.baseY + Math.sin(time * orb.speed + orb.phase) * orb.floatRange

        const x = orb.x * canvas.width
        const y = orb.y * canvas.height
        const pulse = Math.sin(time * 0.0003 + orb.phase) * 0.15 + 0.85
        const radius =
          orb.radius * Math.min(canvas.width, canvas.height) * pulse

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        const color = colors[i % colors.length]
        // 统一透明度，亮色和暗色一样
        const alpha = 1

        gradient.addColorStop(
          0,
          `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`,
        )
        gradient.addColorStop(
          0.3,
          `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.6})`,
        )
        gradient.addColorStop(
          0.6,
          `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.2})`,
        )
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`)

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      })

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
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{
        zIndex: 0,
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        position: 'fixed',
        WebkitMaskImage:
          'linear-gradient(to bottom, black 0%, transparent 70%)',
        maskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)',
      }}
    />
  )
}
