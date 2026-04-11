import { ThemeSwitcher } from '~/components/ui/theme-switcher'
import { EffectSettings } from '~/components/ui/theme-switcher/EffectSettings'

import { FooterInfo } from './FooterInfo'
import { LocaleSwitcher } from './LocaleSwitcher'

export const Footer = () => (
  <footer
    data-hide-print
    className="relative z-[1] mt-32 border-t bg-[var(--footer-bg)] py-6 text-base-content/80"
  >
    <div className="px-4 sm:px-8">
      <div className="relative mx-auto max-w-7xl lg:px-8">
        <FooterInfo />

        <div className="mt-6 flex flex-col items-center gap-4 md:absolute md:bottom-0 md:right-0 md:mt-0 md:flex-row">
          <LocaleSwitcher />
          <ThemeSwitcher />
          <EffectSettings />
        </div>
      </div>
    </div>
  </footer>
)
