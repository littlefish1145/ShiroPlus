import type { ScriptProps } from 'next/script'

declare global {
  interface Navigator {
    gpu: GPU
  }

  interface GPUDevice {
    destroy(): void
    createShaderModule(descriptor: { code: string }): GPUShaderModule
    createBuffer(descriptor: {
      size: number
      usage: number
      mappedAtCreation?: boolean
    }): GPUBuffer
    createBindGroupLayout(descriptor: {
      entries: {
        binding: number
        visibility: number
        buffer?: { type: string }
      }[]
    }): GPUBindGroupLayout
    createPipelineLayout(descriptor: {
      bindGroupLayouts: GPUBindGroupLayout[]
    }): GPUPipelineLayout
    createComputePipeline(descriptor: {
      layout: GPUPipelineLayout
      compute: { module: GPUShaderModule; entryPoint: string }
    }): GPUComputePipeline
    createRenderPipeline(descriptor: {
      layout: GPUPipelineLayout
      vertex: { module: GPUShaderModule; entryPoint: string }
      fragment: {
        module: GPUShaderModule
        entryPoint: string
        targets: {
          format: string
          blend?: {
            color: { srcFactor: string; dstFactor: string; operation: string }
            alpha: { srcFactor: string; dstFactor: string; operation: string }
          }
        }[]
      }
      primitive: { topology: string }
    }): GPURenderPipeline
    createBindGroup(descriptor: {
      layout: GPUBindGroupLayout
      entries: { binding: number; resource: { buffer: GPUBuffer } }[]
    }): GPUBindGroup
    createCommandEncoder(): GPUCommandEncoder
    queue: GPUQueue
  }

  interface GPU {
    requestAdapter(): Promise<GPUAdapter | null>
    getPreferredCanvasFormat(): string
  }

  interface GPUAdapter {
    requestDevice(): Promise<GPUDevice | null>
  }

  interface GPUCanvasContext {
    configure(configuration: {
      device: GPUDevice
      format: string
      alphaMode?: string
    }): void
    getCurrentTexture(): GPUTexture
  }

  interface GPUTexture {
    createView(): GPUTextureView
  }

  interface GPUTextureView {}

  interface GPUBuffer {
    getMappedRange(): ArrayBuffer
    unmap(): void
  }

  interface GPUShaderModule {}

  interface GPUBindGroupLayout {}

  interface GPUPipelineLayout {}

  interface GPUComputePipeline {}

  interface GPURenderPipeline {}

  interface GPUBindGroup {}

  interface GPUCommandEncoder {
    beginComputePass(): GPUComputePassEncoder
    beginRenderPass(descriptor: {
      colorAttachments: {
        view: GPUTextureView
        clearValue: { r: number; g: number; b: number; a: number }
        loadOp: string
        storeOp: string
      }[]
    }): GPURenderPassEncoder
    finish(): GPUCommandBuffer
  }

  interface GPUComputePassEncoder {
    setPipeline(pipeline: GPUComputePipeline): void
    setBindGroup(index: number, group: GPUBindGroup): void
    dispatchWorkgroups(x: number): void
    end(): void
  }

  interface GPURenderPassEncoder {
    setPipeline(pipeline: GPURenderPipeline): void
    setBindGroup(index: number, group: GPUBindGroup): void
    draw(vertexCount: number, instanceCount?: number): void
    end(): void
  }

  interface GPUCommandBuffer {}

  interface GPUQueue {
    writeBuffer(buffer: GPUBuffer, offset: number, data: BufferSource): void
    submit(buffers: GPUCommandBuffer[]): void
  }

  export interface AppThemeConfig {
    config: AppConfig
    footer: FooterConfig
  }

  export interface AccentColor {
    light: string[]
    dark: string[]
  }

  export interface AppConfig {
    site: Site
    hero: Hero
    module: Module
    color?: AccentColor

    custom?: Custom

    poweredBy?: {
      vercel?: boolean
    }
  }

  export interface LinkSection {
    name: string
    links: {
      name: string
      href: string
      external?: boolean
    }[]
  }

  export interface OtherInfo {
    date: string
    icp?: {
      text: string
      link: string
    }
  }

  export interface Custom {
    css: string[]
    js: string[]
    styles: string[]
    scripts: ScriptProps[]
  }

  export interface Site {
    favicon: string
    faviconDark?: string
  }
  export interface Hero {
    title: Title
    description: string
    hitokoto?: {
      random?: boolean
      custom?: string
    }
  }
  export interface Title {
    template: TemplateItem[]
  }
  export interface TemplateItem {
    type: string
    text?: string
    class?: string
  }

  type RSSCustomElements = Array<Record<string, RSSCustomElements | string>>
  export interface Module {
    subscription: {
      tg?: string
    }
    og: {
      avatar?: string
    }
    donate: Donate
    bilibili: Bilibili
    activity: {
      enable: boolean
      endpoint: string
    }
    openpanel: {
      enable: boolean
      id: string
      url: string
    }
    rss: {
      custom_elements: RSSCustomElements
      noRSS?: boolean
    }

    signature: Signature

    posts: {
      mode: 'loose' | 'compact'
    }
    github: {
      username: string
    }
  }
  export interface Donate {
    enable: boolean
    link: string
    qrcode: string[]
  }
  export interface Bilibili {
    liveId: number
  }

  export interface Signature {
    svg: string
    animated?: boolean
  }
}
