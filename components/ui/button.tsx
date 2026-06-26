'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 cursor-pointer select-none',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          {
            'bg-[--accent] text-[--bg] hover:bg-[--accent-hover] active:scale-[0.98]': variant === 'primary',
            'bg-[--bg-elevated] text-[--text-primary] border border-[--border] hover:bg-[--bg-hover] active:scale-[0.98]': variant === 'secondary',
            'text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-hover] active:scale-[0.98]': variant === 'ghost',
            'border border-[--border] text-[--text-primary] hover:bg-[--bg-hover] active:scale-[0.98]': variant === 'outline',
            'bg-red-900/40 text-red-400 border border-red-900/50 hover:bg-red-900/60 active:scale-[0.98]': variant === 'danger',
          },
          {
            'px-3 py-1.5 text-xs': size === 'sm',
            'px-4 py-2.5 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
            'p-2.5': size === 'icon',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
