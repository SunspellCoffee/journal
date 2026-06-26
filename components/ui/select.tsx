'use client'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-[--text-secondary] uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'w-full px-3 py-2.5 pr-9 rounded-xl text-sm bg-[--bg-elevated] border border-[--border]',
            'text-[--text-primary] appearance-none cursor-pointer',
            'focus:border-[--accent] focus:outline-none transition-colors',
            error && 'border-[--danger]',
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-[#1a1208]">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--text-muted] pointer-events-none" />
      </div>
      {error && <p className="text-xs text-[--danger]">{error}</p>}
    </div>
  )
}
