'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[--text-secondary] uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2.5 rounded-xl text-sm bg-[--bg-elevated] border border-[--border]',
            'text-[--text-primary] placeholder:text-[--text-muted]',
            'focus:border-[--accent] focus:outline-none transition-colors',
            error && 'border-[--danger]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[--danger]">{error}</p>}
        {hint && !error && <p className="text-xs text-[--text-muted]">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[--text-secondary] uppercase tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2.5 rounded-xl text-sm bg-[--bg-elevated] border border-[--border]',
            'text-[--text-primary] placeholder:text-[--text-muted]',
            'focus:border-[--accent] focus:outline-none transition-colors resize-none',
            error && 'border-[--danger]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[--danger]">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
