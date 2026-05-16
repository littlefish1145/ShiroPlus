import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { cn } from '~/lib/utils'

export interface ScrollAreaProps {
  className?: string
  children: React.ReactNode
  type?: 'auto' | 'always' | 'scroll' | 'hover'
}

export function ScrollArea({ className, children, type = 'auto' }: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root type={type} className={cn('overflow-hidden', className)}>
      <ScrollAreaPrimitive.Viewport className="size-full">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="flex touch-none select-none flex-col p-0.5 transition-colors hover:bg-zinc-200/50 data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-row data-[orientation=horizontal]:h-2"
      >
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}
