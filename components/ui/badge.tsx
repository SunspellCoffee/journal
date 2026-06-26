import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        {
          'bg-[--bg-elevated] text-[--text-secondary] border border-[--border]': variant === 'default',
          'bg-emerald-900/40 text-emerald-400 border border-emerald-900/50': variant === 'success',
          'bg-amber-900/40 text-amber-400 border border-amber-900/50': variant === 'warning',
          'bg-red-900/40 text-red-400 border border-red-900/50': variant === 'danger',
          'bg-blue-900/40 text-blue-400 border border-blue-900/50': variant === 'info',
          'bg-transparent text-[--text-muted]': variant === 'muted',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
