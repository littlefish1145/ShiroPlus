'use client'

import { AnimatePresence,m } from 'motion/react'
import * as React from 'react'
import { useCallback,useEffect, useRef, useState } from 'react'

import { clsxm } from '~/lib/helper'

interface PhysicsParticlesProps {
  particleCount?: number
  className?: string
  windSpeed?: number
  windDirection?: number
  gravity?: number
  turbulence?: number
  depthBlur?: number
  debug?: boolean
}

interface Snowflake {
  x: number
  y: number
  z: number // 0 to 1, depth
  radius: number
  vx: number
  vy: number
  angle: number
  vAngle: number
  opacity: number
  type: number // index of pre-rendered canvas
}

const SNOWFLAKE_TYPES = 6
const BLUR_LEVELS = 5

export const PhysicsParticles = ({
  particleCount: initialParticleCount = 80,
  className = '',
  windSpeed: initialWindSpeed = 0.5,
  windDirection: initialWindDirection = 1, // coefficient for x direction
  gravity: initialGravity = 0.2,
  turbulence: initialTurbulence = 0.5,
  depthBlur: initialDepthBlur = 5,
  debug: initialDebug = false,
}: PhysicsParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [params, setParams] = useState({
    particleCount: initialParticleCount,
    windSpeed: initialWindSpeed,
    windDirection: initialWindDirection,
    gravity: initialGravity,
    turbulence: initialTurbulence,
    depthBlur: initialDepthBlur,
  })
  const [showDebug, setShowDebug] = useState(initialDebug)
  const particles = useRef<Snowflake[]>([])
  const offscreenCanvases = useRef<HTMLCanvasElement[][]>([]) // [type][blurLevel]
  const animationRef = useRef<number>(0)
  const lastTime = useRef<number>(0)

  // Pre-render snowflakes
  useEffect(() => {
    const types: HTMLCanvasElement[][] = []
    for (let t = 0; t < SNOWFLAKE_TYPES; t++) {
      const blurLevels: HTMLCanvasElement[] = []
      const baseRadius = 15 // Base size for pre-rendering

      for (let b = 0; b < BLUR_LEVELS; b++) {
        const offscreen = document.createElement('canvas')
        const size = (baseRadius + b * 4) * 2
        offscreen.width = size
        offscreen.height = size
        const ctx = offscreen.getContext('2d')
        if (!ctx) continue

        ctx.translate(size / 2, size / 2)

        // Draw snowflake (6-fold symmetry)
        const radius = baseRadius
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1.2
        ctx.lineCap = 'round'

        if (b > 0) {
          ctx.shadowBlur = b * 2
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
        }

        const seed = t * 1337
        const branches = 4 + (seed % 3)

        for (let i = 0; i < 6; i++) {
          ctx.save()
          ctx.rotate((i * Math.PI) / 3)

          // Main axis
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(0, -radius)
          ctx.stroke()

          // Side branches
          for (let j = 1; j <= branches; j++) {
            const y = (-radius * j) / (branches + 1)
            const bLen = radius * 0.4 * (1 - j / (branches + 2))

            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(bLen, y - bLen * 0.8)
            ctx.moveTo(0, y)
            ctx.lineTo(-bLen, y - bLen * 0.8)
            ctx.stroke()

            // Sub-branches for higher precision
            if (j < branches && j % 2 === 0) {
              const subLen = bLen * 0.5
              ctx.beginPath()
              ctx.moveTo(bLen * 0.5, y - bLen * 0.4)
              ctx.lineTo(bLen * 0.5 + subLen, y - bLen * 0.4 - subLen * 0.5)
              ctx.moveTo(-bLen * 0.5, y - bLen * 0.4)
              ctx.lineTo(-bLen * 0.5 - subLen, y - bLen * 0.4 - subLen * 0.5)
              ctx.stroke()
            }
          }
          ctx.restore()
        }
        blurLevels.push(offscreen)
      }
      types.push(blurLevels)
    }
    offscreenCanvases.current = types
  }, [])

  const initParticles = useCallback(
    (count: number, width: number, height: number) => {
      const newParticles: Snowflake[] = []
      const isMobile = width < 768
      const actualCount = isMobile ? Math.min(count, 40) : count

      for (let i = 0; i < actualCount; i++) {
        const z = Math.random()
        newParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          radius: (1 + z * 2) * 2,
          vx: 0,
          vy: 0,
          angle: Math.random() * Math.PI * 2,
          vAngle: (Math.random() - 0.5) * 0.05,
          opacity: 0.2 + z * 0.6,
          type: Math.floor(Math.random() * SNOWFLAKE_TYPES),
        })
      }
      particles.current = newParticles
    },
    [],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles(params.particleCount, canvas.width, canvas.height)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    const animate = (time: number) => {
      const deltaTime = (time - lastTime.current) / 16
      lastTime.current = time

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.dataset.theme === 'dark'

      // Use screen for dark mode, source-over for light mode to maintain visibility
      if (isDark) {
        ctx.globalCompositeOperation = 'screen'
      } else {
        ctx.globalCompositeOperation = 'source-over'
      }

      particles.current.forEach((p) => {
        // Physics update
        const turbX = Math.sin(time * 0.002 + p.x * 0.01) * params.turbulence
        const turbY = Math.cos(time * 0.002 + p.y * 0.01) * params.turbulence

        p.vx = params.windSpeed * params.windDirection + turbX * (1 - p.z)
        p.vy = params.gravity * (0.5 + p.z * 1.5) + turbY * 0.2

        p.x += p.vx * deltaTime
        p.y += p.vy * deltaTime
        p.angle += p.vAngle * deltaTime

        // Wrap around
        if (p.y > canvas.height + 20) {
          p.y = -20
          p.x = Math.random() * canvas.width
        }
        if (p.x > canvas.width + 20) p.x = -20
        else if (p.x < -20) p.x = canvas.width + 20

        // Render
        const blurLevel = Math.floor(p.z * (BLUR_LEVELS - 1))
        const snowflakeImg = offscreenCanvases.current[p.type]?.[blurLevel]

        if (snowflakeImg) {
          const size = p.radius * 4
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.angle)
          // In light mode, we can use a slightly blue/grey tint for better visibility
          if (!isDark) {
            ctx.filter =
              'brightness(0.7) sepia(0.2) hue-rotate(180deg) saturate(2)'
          }

          ctx.globalAlpha = isDark ? p.opacity : p.opacity * 1.2
          ctx.drawImage(snowflakeImg, -size / 2, -size / 2, size, size)
          ctx.restore()
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [params, initParticles])

  const updateParam = (key: keyof typeof params, val: number) => {
    setParams((prev) => ({ ...prev, [key]: val }))
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className={clsxm(
          'pointer-events-none absolute inset-0 z-0 h-full w-full opacity-60 transition-opacity duration-1000',
          className,
        )}
      />

      {/* Debug UI */}
      {initialDebug && (
        <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20"
          >
            <i
              className={
                showDebug
                  ? 'i-mingcute-settings-6-fill'
                  : 'i-mingcute-settings-6-line'
              }
            />
          </button>

          <AnimatePresence>
            {showDebug && (
              <m.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex w-64 flex-col gap-4 rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white backdrop-blur-md"
              >
                <div className="flex flex-col gap-1">
                  <label className="flex justify-between">
                    <span>Density ({params.particleCount})</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="10"
                    value={params.particleCount}
                    onChange={(e) =>
                      updateParam('particleCount', +e.target.value)
                    }
                    onMouseUp={() =>
                      initParticles(
                        params.particleCount,
                        window.innerWidth,
                        window.innerHeight,
                      )
                    }
                    className="accent-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="flex justify-between">
                    <span>Wind Speed ({params.windSpeed.toFixed(1)})</span>
                  </label>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={params.windSpeed}
                    onChange={(e) => updateParam('windSpeed', +e.target.value)}
                    className="accent-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="flex justify-between">
                    <span>Gravity ({params.gravity.toFixed(1)})</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={params.gravity}
                    onChange={(e) => updateParam('gravity', +e.target.value)}
                    className="accent-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="flex justify-between">
                    <span>Turbulence ({params.turbulence.toFixed(1)})</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={params.turbulence}
                    onChange={(e) => updateParam('turbulence', +e.target.value)}
                    className="accent-blue-500"
                  />
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  )
}
