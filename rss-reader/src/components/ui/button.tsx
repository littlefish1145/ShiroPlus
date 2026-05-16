import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react'
import { cn } from '~/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  asChild?: boolean
}

const variantStyles = {
  primary: 'bg-accent text-zinc-100 hover:contrast-[1.10] active:contrast-125 font-semibold',
  secondary: 'bg-gradient-to-b from-zinc-50/50 to-white/90 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur transition dark:from-zinc-900/50 dark:to-zinc-800/90 dark:ring-white/10',
  ghost: 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
  outline: 'border border-border bg-transparent hover:bg-accent/10',
}

const sizeStyles = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex cursor-default items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium outline-offset-2 transition active:transition-none',
          'disabled:cursor-not-allowed disabled:bg-accent/40 disabled:opacity-80',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="loading-spinner h-4 w-4" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
