'use client'

import * as Slider from '@radix-ui/react-slider'
import { useAtom } from 'jotai'
import { AnimatePresence, m } from 'motion/react'
import * as React from 'react'

import { effectSettingsAtom } from '~/atoms/settings'
import { FloatPopover } from '~/components/ui/float-popover'
import { LabelSwitch } from '~/components/ui/switch'
import { clsxm } from '~/lib/helper'

const PRESET_COLORS_LIGHT = [
  '#f84483',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#10b981',
]
const PRESET_COLORS_DARK = [
  '#2878ff',
  '#ec4899',
  '#a855f7',
  '#fbbf24',
  '#34d399',
]

const SettingItem = ({
  label,
  icon,
  children,
  className,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}) => (
  <div className={clsxm('flex flex-col gap-2.5', className)}>
    <div className="flex items-center gap-1.5 opacity-40">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">
        {label}
      </span>
    </div>
    {children}
  </div>
)

const ColorPicker = ({
  value,
  onChange,
  presets,
}: {
  value: string
  onChange: (v: string) => void
  presets: string[]
}) => (
  <div className="flex items-center gap-2">
    <div className="flex flex-wrap gap-1.5 flex-1">
      {presets.map((color) => (
        <m.button
          key={color}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(color)}
          className={clsxm(
            'size-5 rounded-full border-2 transition-all p-0.5',
            value === color
              ? 'border-accent scale-110 shadow-sm'
              : 'border-transparent',
          )}
        >
          <div
            className="size-full rounded-full shadow-inner"
            style={{ backgroundColor: color }}
          />
        </m.button>
      ))}
    </div>
    <div className="relative group size-6 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-200/50 dark:border-zinc-700/50 hover:border-accent/40 transition-colors">
      <input
        type="color"
        className="absolute inset-0 size-full opacity-0 cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-40"
      >
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l5 5" />
        <path d="M9.5 14.5L16 18" />
      </svg>
    </div>
  </div>
)

export const EffectSettings = () => {
  const [settings, setSettings] = useAtom(effectSettingsAtom)

  const updateSettings = (partial: any) => {
    setSettings((prev) => ({ ...prev, ...partial }))
  }

  const updateBacklight = (partial: any) => {
    updateSettings({ backlight: { ...settings.backlight, ...partial } })
  }

  const updateSnowfall = (partial: any) => {
    updateSettings({ snowfall: { ...settings.snowfall, ...partial } })
  }

  return (
    <FloatPopover
      trigger="click"
      TriggerComponent={() => (
        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-full inline-flex h-8 w-8 items-center justify-center border border-zinc-200/50 text-base-content/60 dark:border-zinc-700/50 bg-base-100/50 backdrop-blur-md shadow-sm transition-all hover:text-accent hover:border-accent/30"
          type="button"
          aria-label="Effect Settings"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </m.button>
      )}
      popoverWrapperClassNames="z-[100]"
    >
      <div className="flex w-72 flex-col gap-6 p-3 text-sm text-base-content selection:bg-accent/20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-[0.2em] opacity-30">
            Effect Hub
          </span>
          <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        </div>

        {/* Backlight Section */}
        <div className="space-y-5 rounded-2xl bg-zinc-500/5 p-4 border border-white/5">
          <LabelSwitch
            label="Ambient Backlight"
            checked={settings.backlight.enabled}
            onCheckedChange={(checked) => updateBacklight({ enabled: checked })}
            className="font-bold text-xs"
          />

          <div className="space-y-4 pt-1">
            <SettingItem label="Light Colorset">
              <ColorPicker
                value={settings.backlight.colorLight}
                onChange={(c) => updateBacklight({ colorLight: c })}
                presets={PRESET_COLORS_LIGHT}
              />
            </SettingItem>
            <SettingItem label="Dark Colorset">
              <ColorPicker
                value={settings.backlight.colorDark}
                onChange={(c) => updateBacklight({ colorDark: c })}
                presets={PRESET_COLORS_DARK}
              />
            </SettingItem>
          </div>
        </div>

        {/* Snowfall Section */}
        <div className="space-y-6 rounded-2xl bg-zinc-500/5 p-4 border border-white/5">
          <div className="flex items-center justify-between">
            <LabelSwitch
              label="Snow Particles"
              checked={settings.snowfall.enabled}
              onCheckedChange={(checked) =>
                updateSnowfall({ enabled: checked })
              }
              className="font-bold text-xs"
            />
            <m.button
              whileHover={{ rotate: 180, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() =>
                updateSnowfall({ reloadKey: settings.snowfall.reloadKey + 1 })
              }
              className="p-1.5 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors opacity-30 hover:opacity-100"
              title="Force Reload WebGPU"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
            </m.button>
          </div>

          <AnimatePresence mode="wait">
            {settings.snowfall.enabled && (
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-6 overflow-hidden"
              >
                <SettingItem
                  label="Snowflake Density"
                  icon={
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <circle cx="19" cy="5" r="2" />
                      <circle cx="5" cy="19" r="2" />
                      <circle cx="18" cy="18" r="1.5" />
                      <circle cx="6" cy="6" r="1.5" />
                    </svg>
                  }
                >
                  <div className="flex items-center gap-4">
                    <Slider.Root
                      className="relative flex h-4 grow touch-none select-none items-center"
                      value={[settings.snowfall.count]}
                      max={2000}
                      min={100}
                      step={50}
                      onValueChange={(val) => updateSnowfall({ count: val[0] })}
                    >
                      <Slider.Track className="relative h-1 grow rounded-full bg-base-content/10">
                        <Slider.Range className="absolute h-full rounded-full bg-accent" />
                      </Slider.Track>
                      <Slider.Thumb className="block size-3 rounded-full bg-white shadow-md border border-zinc-200/50 hover:scale-125 transition-transform focus:outline-none" />
                    </Slider.Root>
                    <span className="text-[10px] font-mono opacity-40 w-8 text-right font-bold">
                      {settings.snowfall.count}
                    </span>
                  </div>
                </SettingItem>

                <SettingItem
                  label="Crystal Scale"
                  icon={
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  }
                >
                  <div className="flex items-center gap-4">
                    <Slider.Root
                      className="relative flex h-4 grow touch-none select-none items-center"
                      value={[settings.snowfall.size]}
                      max={3}
                      min={0.1}
                      step={0.1}
                      onValueChange={(val) => updateSnowfall({ size: val[0] })}
                    >
                      <Slider.Track className="relative h-1 grow rounded-full bg-base-content/10">
                        <Slider.Range className="absolute h-full rounded-full bg-accent" />
                      </Slider.Track>
                      <Slider.Thumb className="block size-3 rounded-full bg-white shadow-md border border-zinc-200/50 hover:scale-125 transition-transform focus:outline-none" />
                    </Slider.Root>
                    <span className="text-[10px] font-mono opacity-40 w-8 text-right font-bold">
                      {settings.snowfall.size.toFixed(1)}
                    </span>
                  </div>
                </SettingItem>

                <SettingItem
                  label="Falling Motion"
                  icon={
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  }
                >
                  <div className="flex items-center gap-4">
                    <Slider.Root
                      className="relative flex h-4 grow touch-none select-none items-center"
                      value={[settings.snowfall.speed]}
                      max={5}
                      min={0.1}
                      step={0.1}
                      onValueChange={(val) => updateSnowfall({ speed: val[0] })}
                    >
                      <Slider.Track className="relative h-1 grow rounded-full bg-base-content/10">
                        <Slider.Range className="absolute h-full rounded-full bg-accent" />
                      </Slider.Track>
                      <Slider.Thumb className="block size-3 rounded-full bg-white shadow-md border border-zinc-200/50 hover:scale-125 transition-transform focus:outline-none" />
                    </Slider.Root>
                    <span className="text-[10px] font-mono opacity-40 w-8 text-right font-bold">
                      {settings.snowfall.speed.toFixed(1)}
                    </span>
                  </div>
                </SettingItem>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </FloatPopover>
  )
}
