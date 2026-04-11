import { atomWithStorage } from 'jotai/utils'

export interface EffectSettings {
  backlight: {
    enabled: boolean
    colorLight: string
    colorDark: string
  }
  snowfall: {
    enabled: boolean
    size: number
    speed: number
    count: number
    reloadKey: number
  }
}

export const effectSettingsAtom = atomWithStorage<EffectSettings>(
  'effect-settings',
  {
    backlight: {
      enabled: true,
      colorLight: '#f84483', // Hex to match '248, 68, 131'
      colorDark: '#2878ff', // Hex to match '40, 120, 255'
    },
    snowfall: {
      enabled: true,
      size: 1,
      speed: 1,
      count: 400,
      reloadKey: 0,
    },
  },
)
