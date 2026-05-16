import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '~/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'min-w-0 flex-auto appearance-none rounded-lg border border-border bg-base-100 px-3 py-[calc(.5rem-1px)] text-sm ring-accent/20 transition',
          'placeholder:text-zinc-400 focus:outline-none focus:ring-2 dark:bg-zinc-700/[0.15] dark:text-zinc-200 dark:placeholder:text-zinc-500',
          'focus:border-accent/80 focus:bg-accent/5',
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
