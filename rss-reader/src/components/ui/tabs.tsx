import * as TabsPrimitive from '@radix-ui/react-tabs'
import { motion } from 'motion/react'
import { cn } from '~/lib/utils'

export const Tabs = TabsPrimitive.Root

export const TabsList = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn('inline-flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800', className)}
    {...props}
  />
)

export const TabsTrigger = ({
  className,
  selected,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { selected?: boolean }) => (
  <TabsPrimitive.Trigger
    className={cn(
      'relative flex px-3 py-1.5 text-sm font-medium transition-colors',
      'text-zinc-600 dark:text-zinc-400',
      'data-[state=active]:text-accent',
      className
    )}
    {...props}
  >
    <span className="z-10 inline-flex items-center gap-1.5">
      {props.children}
    </span>
    {selected && (
      <motion.div
        layoutId="tabs-indicator"
        className="absolute inset-0 -z-0 rounded-md bg-base-100 shadow-sm dark:bg-zinc-700"
        transition={{ type: 'spring', duration: 0.4 }}
      />
    )}
  </TabsPrimitive.Trigger>
)

export const TabsContent = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content
    className={cn('mt-2 min-h-0 flex-1 overflow-auto focus-visible:outline-none', className)}
    {...props}
  />
)
