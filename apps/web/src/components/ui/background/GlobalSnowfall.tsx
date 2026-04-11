'use client'

import { useAtomValue } from 'jotai'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'

import { effectSettingsAtom } from '~/atoms/settings'

const HEIGHT_MAP_RES = 1024

const BASE_WGSL = `
struct Particle {
  pos: vec2f,
  vel: vec2f,
  angle: f32,
  angularVel: f32,
  scale: f32,
  id: u32,
};

struct Params {
  width: f32,
  height: f32,
  time: f32,
  deltaTime: f32,
  wind: f32,
  gravity: f32,
  docHeight: f32,
  scrollPos: f32,
  mouseX: f32,
  mouseY: f32,
  mouseRadius: f32,
  mouseStrength: f32,
  sizeMult: f32,
  pad1: f32,
  pad2: f32,
  pad3: f32,
};

@group(0) @binding(0) var<uniform> params: Params;

fn hash(u: u32) -> f32 {
    var x = u;
    x = ((x >> 16) ^ x) * 0x45d9f3bu;
    x = ((x >> 16) ^ x) * 0x45d9f3bu;
    x = (x >> 16) ^ x;
    return f32(x) / 4294967295.0;
}

fn rand(n: vec2f) -> f32 {
    return fract(sin(dot(n, vec2f(12.9898, 4.1414))) * 43758.5453);
}

fn sdHexagon(p: vec2f, r: f32) -> f32 {
    let k = vec3f(-0.866025404, 0.5, 0.577350269);
    var q = abs(p);
    q = q - 2.0 * min(dot(k.xy, q), 0.0) * k.xy;
    q = q - vec2f(clamp(q.x, -k.z * r, k.z * r), r);
    return length(q) * sign(q.y);
}

fn sdSegment(p: vec2f, a: vec2f, b: vec2f) -> f32 {
    let pa = p - a; let ba = b - a;
    let h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
    return length(pa - ba * h);
}

fn fold_hex_30(p_in: vec2f) -> vec2f {
    var p = vec2f(p_in.x, abs(p_in.y));
    let n60 = vec2f(0.8660254, -0.5);
    p -= 2.0 * min(dot(p, n60), 0.0) * n60; p.y = abs(p.y);
    let n30 = vec2f(0.5, -0.8660254);
    p -= 2.0 * min(dot(p, n30), 0.0) * n30;
    return vec2f(p.x, abs(p.y));
}
`

const getComputeWGSL = (count: number) =>
  `${BASE_WGSL 
  }
@group(1) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(1) @binding(1) var<storage, read_write> heightMap: array<f32>;

@compute @workgroup_size(64)
fn update(@builtin(global_invocation_id) id: vec3u) {
    let idx = id.x;
    if (idx >= u32(${count})) { return; }
    var p = particles[idx];
    let dtSeconds = params.deltaTime * 0.001;
    let flutter = sin(params.time * 0.003 + p.pos.y * 0.01) * 0.15;
    p.pos.x += (params.wind + (flutter * 30.0)) * dtSeconds;
    p.pos.y += (params.gravity * (0.8 + p.scale * 1.5)) * params.deltaTime;
    p.angle += p.angularVel * dtSeconds;
    if (p.pos.x < -100.0) { p.pos.x = params.width + 100.0; }
    if (p.pos.x > params.width + 100.0) { p.pos.x = -100.0; }
    let hIdx = u32(clamp(p.pos.x / params.width * f32(${HEIGHT_MAP_RES}), 0.0, f32(${HEIGHT_MAP_RES}-1.0)));
    let floorY = params.docHeight - heightMap[hIdx];
    if (p.pos.y > floorY) {
        if (heightMap[hIdx] < 120.0) { 
            heightMap[hIdx] += 0.5 * p.scale * params.sizeMult; 
        }
        let seed = vec2f(f32(idx), params.time);
        p.pos.y = -rand(seed) * 200.0 - 50.0;
        p.pos.x = rand(seed + vec2f(1.0, 0.0)) * params.width;
        p.angularVel = select(0.0, (rand(seed + vec2f(1.1, 1.1)) - 0.5) * 1.5, rand(seed + vec2f(0.0, 1.0)) > 0.7);
    }
    particles[idx] = p;
}

@compute @workgroup_size(64)
fn processHeightMap(@builtin(global_invocation_id) id: vec3u) {
    let idx = id.x;
    if (idx >= u32(${HEIGHT_MAP_RES})) { return; }
    var h = heightMap[idx];
    let worldX = (f32(idx) / f32(${HEIGHT_MAP_RES})) * params.width;
    let distMouse = abs(worldX - params.mouseX);
    let distFromBottom = abs((params.docHeight - h) - params.mouseY);
    if (distMouse < params.mouseRadius && distFromBottom < params.mouseRadius * 3.0) {
        let force = (1.0 - distMouse / params.mouseRadius) * params.mouseStrength * params.deltaTime;
        h = max(0.0, h - force);
    }
    if (idx > 0u && idx < u32(${HEIGHT_MAP_RES}-1u)) {
        let avg = (heightMap[idx - 1] + heightMap[idx + 1]) * 0.5;
        h = mix(h, avg, 0.02 * params.deltaTime); 
    }
    heightMap[idx] = h;
}
`

const getRenderWGSL = () =>
  `${BASE_WGSL 
  }
@group(1) @binding(0) var<storage, read> particles: array<Particle>;
@group(1) @binding(1) var<storage, read> heightMap: array<f32>;

struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) opacity: f32,
};

@vertex
fn vs(@builtin(vertex_index) vIdx: u32, @builtin(instance_index) iIdx: u32) -> VSOutput {
    let p = particles[iIdx];
    var pos = array<vec2f, 6>(vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0), vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0));
    let vPos = pos[vIdx];
    let size = (p.scale * 1.33 + 4.33) * params.sizeMult;
    let s = sin(p.angle); let c = cos(p.angle);
    let rotatedPos = vec2f(vPos.x * c - vPos.y * s, vPos.x * s + vPos.y * c);
    let viewY = p.pos.y - params.scrollPos;
    let outPos = vec2f(p.pos.x + rotatedPos.x * size, viewY + rotatedPos.y * size);
    var out: VSOutput;
    out.position = vec4f(outPos.x / params.width * 2.0 - 1.0, 1.0 - outPos.y / params.height * 2.0, 0.0, 1.0);
    out.uv = vPos;
    out.opacity = 0.3 + p.scale * 0.5;
    return out;
}

@fragment
fn fs(in: VSOutput) -> @location(0) vec4f {
    let r = length(in.uv); if (r > 1.0) { discard; }
    let p = fold_hex_30(in.uv * 1.1);
    var d = 100.0;
    d = min(d, abs(sdHexagon(in.uv * 1.1, 0.12)) - 0.005);
    d = min(d, sdSegment(p, vec2f(0.1, 0.0), vec2f(0.9, 0.0)));
    d = min(d, sdSegment(p, vec2f(0.7, 0.0), vec2f(0.88, 0.15)));
    
    let thickness = 0.02;
    let softness = 1.0 / max(in.opacity * 60.0, 1.0);
    var alpha = 1.0 - smoothstep(thickness, thickness + softness, d);
    
    let finalAlpha = clamp(alpha * in.opacity, 0.0, 1.0);
    return vec4f(vec3f(finalAlpha), finalAlpha);
}

@vertex
fn vsHeight(@builtin(vertex_index) vIdx: u32) -> @builtin(position) vec4f {
    let x_idx = vIdx / 2; let is_top = vIdx % 2 == 0;
    let x_norm = f32(x_idx) / f32(${HEIGHT_MAP_RES}-1);
    let h = heightMap[x_idx];
    let y_page = params.docHeight - select(0.0, h, is_top);
    return vec4f(x_norm * 2.0 - 1.0, 1.0 - (y_page - params.scrollPos) / params.height * 2.0, 0.0, 1.0);
}

@fragment
fn fsHeight() -> @location(0) vec4f {
    return vec4f(vec3f(0.3), 0.3);
}
`

export const GlobalSnowfall = () => {
  const { theme, resolvedTheme } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const deviceRef = useRef<GPUDevice | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const mousePos = useRef({ x: -1000, y: -1000 })
  const setupIdRef = useRef(0)
  const settings = useAtomValue(effectSettingsAtom)
  const settingsRef = useRef(settings)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const [isClient, setIsClient] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setMounted(true)
    const handleMouse = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY + window.scrollY }
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark')

  useEffect(() => {
    if (!mounted || !isDark || !settings.snowfall.enabled) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      if (deviceRef.current) {
        const d = deviceRef.current
        deviceRef.current = null
        try {
          d.destroy()
        } catch {}
      }
      return
    }

    const currentSetupId = ++setupIdRef.current
    const particleCount = settings.snowfall.count
    let effectActive = true

    async function initWebGPU() {
      // Small debounce delay to ensure previous cleanup is finished
      await new Promise((r) => setTimeout(r, 50))
      if (
        !canvasRef.current ||
        !effectActive ||
        currentSetupId !== setupIdRef.current
      )
        return

      const adapter = await navigator.gpu?.requestAdapter()
      const device = await adapter?.requestDevice()

      if (!device || !effectActive || currentSetupId !== setupIdRef.current) {
        device?.destroy()
        return
      }

      // If there's an old device still hanging around in the ref, destroy it now
      if (deviceRef.current) {
        try {
          deviceRef.current.destroy()
        } catch {}
      }
      deviceRef.current = device

      const cModule = device.createShaderModule({
        code: getComputeWGSL(particleCount),
      })
      const rModule = device.createShaderModule({ code: getRenderWGSL() })

      const {GPUBufferUsage} = (window as any)
      const {GPUShaderStage} = (window as any)

      const particleData = new Float32Array(particleCount * 8)
      for (let i = 0; i < particleCount; i++) {
        particleData[i * 8 + 0] = Math.random() * window.innerWidth
        particleData[i * 8 + 1] =
          Math.random() * document.documentElement.scrollHeight
        particleData[i * 8 + 4] = Math.random() * Math.PI * 2
        particleData[i * 8 + 5] = (Math.random() - 0.5) * 2
        particleData[i * 8 + 6] = 0.5 + Math.random() * 1.5
        particleData[i * 8 + 7] = i
      }

      const pBuffer = device.createBuffer({
        size: particleData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      })
      new Float32Array(pBuffer.getMappedRange()).set(particleData)
      pBuffer.unmap()

      const hBuffer = device.createBuffer({
        size: HEIGHT_MAP_RES * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      })
      const uBuffer = device.createBuffer({
        size: 128,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })

      const uLayout = device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' },
          },
        ],
      })
      const cLayout = device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' },
          },
        ],
      })
      const rLayout = device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'read-only-storage' },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'read-only-storage' },
          },
        ],
      })

      const cpUpdate = device.createComputePipeline({
        layout: device.createPipelineLayout({
          bindGroupLayouts: [uLayout, cLayout],
        }),
        compute: { module: cModule, entryPoint: 'update' },
      })
      const cpHeight = device.createComputePipeline({
        layout: device.createPipelineLayout({
          bindGroupLayouts: [uLayout, cLayout],
        }),
        compute: { module: cModule, entryPoint: 'processHeightMap' },
      })

      const rpSnow = device.createRenderPipeline({
        layout: device.createPipelineLayout({
          bindGroupLayouts: [uLayout, rLayout],
        }),
        vertex: { module: rModule, entryPoint: 'vs' },
        fragment: {
          module: rModule,
          entryPoint: 'fs',
          targets: [
            {
              format: navigator.gpu.getPreferredCanvasFormat(),
              blend: {
                color: {
                  srcFactor: 'one',
                  dstFactor: 'one-minus-src-alpha',
                  operation: 'add',
                },
                alpha: {
                  srcFactor: 'one',
                  dstFactor: 'one-minus-src-alpha',
                  operation: 'add',
                },
              },
            },
          ],
        },
        primitive: { topology: 'triangle-list' },
      })

      const rpHeight = device.createRenderPipeline({
        layout: device.createPipelineLayout({
          bindGroupLayouts: [uLayout, rLayout],
        }),
        vertex: { module: rModule, entryPoint: 'vsHeight' },
        fragment: {
          module: rModule,
          entryPoint: 'fsHeight',
          targets: [
            {
              format: navigator.gpu.getPreferredCanvasFormat(),
              blend: {
                color: {
                  srcFactor: 'one',
                  dstFactor: 'one-minus-src-alpha',
                  operation: 'add',
                },
                alpha: {
                  srcFactor: 'one',
                  dstFactor: 'one-minus-src-alpha',
                  operation: 'add',
                },
              },
            },
          ],
        },
        primitive: { topology: 'triangle-strip' },
      })

      const uBG = device.createBindGroup({
        layout: uLayout,
        entries: [{ binding: 0, resource: { buffer: uBuffer } }],
      })
      const cBG = device.createBindGroup({
        layout: cLayout,
        entries: [
          { binding: 0, resource: { buffer: pBuffer } },
          { binding: 1, resource: { buffer: hBuffer } },
        ],
      })
      const rBG = device.createBindGroup({
        layout: rLayout,
        entries: [
          { binding: 0, resource: { buffer: pBuffer } },
          { binding: 1, resource: { buffer: hBuffer } },
        ],
      })

      const canvas = canvasRef.current!
      const ctx = canvas.getContext('webgpu')!

      let lastT = performance.now()
      const frame = (time: number) => {
        if (
          !effectActive ||
          currentSetupId !== setupIdRef.current ||
          !deviceRef.current
        )
          return
        const dt = Math.min(time - lastT, 32)
        lastT = time
        const w = window.innerWidth
        const h = window.innerHeight
        const dH = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
        )

        if (w <= 0 || h <= 0) {
          rafIdRef.current = requestAnimationFrame(frame)
          return
        }

        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w
          canvas.height = h
          try {
            ctx.configure({
              device: deviceRef.current,
              format: navigator.gpu.getPreferredCanvasFormat(),
              alphaMode: 'premultiplied',
            })
          } catch (e) {
            console.warn('Context config failed', e)
          }
        }

        const currentSettings = settingsRef.current
        deviceRef.current.queue.writeBuffer(
          uBuffer,
          0,
          new Float32Array([
            w,
            h,
            time,
            dt,
            0.01 * currentSettings.snowfall.speed,
            0.02 * currentSettings.snowfall.speed,
            dH,
            window.scrollY,
            mousePos.current.x,
            mousePos.current.y,
            80,
            0.2, // mouse params
            currentSettings.snowfall.size,
            0,
            0,
            0,
          ]),
        )

        const encoder = deviceRef.current.createCommandEncoder()
        const cPass = encoder.beginComputePass()
        cPass.setPipeline(cpUpdate)
        cPass.setBindGroup(0, uBG)
        cPass.setBindGroup(1, cBG)
        cPass.dispatchWorkgroups(Math.ceil(particleCount / 64))
        cPass.setPipeline(cpHeight)
        cPass.dispatchWorkgroups(Math.ceil(HEIGHT_MAP_RES / 64))
        cPass.end()

        const rPass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: ctx.getCurrentTexture().createView(),
              clearValue: { r: 0, g: 0, b: 0, a: 0 },
              loadOp: 'clear',
              storeOp: 'store',
            },
          ],
        })
        rPass.setPipeline(rpSnow)
        rPass.setBindGroup(0, uBG)
        rPass.setBindGroup(1, rBG)
        rPass.draw(6, particleCount)
        rPass.setPipeline(rpHeight)
        rPass.setBindGroup(0, uBG)
        rPass.setBindGroup(1, rBG)
        rPass.draw(HEIGHT_MAP_RES * 2)
        rPass.end()

        deviceRef.current.queue.submit([encoder.finish()])
        rafIdRef.current = requestAnimationFrame(frame)
      }
      rafIdRef.current = requestAnimationFrame(frame)
    }

    initWebGPU()
    return () => {
      effectActive = false
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      if (deviceRef.current) {
        const d = deviceRef.current
        deviceRef.current = null
        try {
          d.destroy()
        } catch {}
      }
    }
  }, [
    theme,
    resolvedTheme,
    mounted,
    isDark,
    settings.snowfall.enabled,
    settings.snowfall.reloadKey,
    settings.snowfall.count,
  ])

  if (!isClient || !isDark || !settings.snowfall.enabled) return null

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-10 h-full w-full"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
