'use client'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Dialog({ open, onClose, title, children, className, size = 'md' }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(4, 2, 1, 0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />
      <div
        className={cn(
          'relative w-full border shadow-2xl slide-up',
          'rounded-t-2xl sm:rounded-2xl',
          'max-h-[90dvh] flex flex-col',
          {
            'sm:max-w-sm': size === 'sm',
            'sm:max-w-md': size === 'md',
            'sm:max-w-lg': size === 'lg',
            'sm:max-w-2xl': size === 'xl',
          },
          className
        )}
        style={{
          background: 'rgba(28, 20, 10, 0.97)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderColor: 'rgba(74, 56, 32, 0.7)',
        }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-8 h-1 rounded-full bg-[--border-light]" />
        </div>

        {/* Header — always rendered, title optional */}
        <div className={cn(
          'flex items-center justify-between px-5 shrink-0',
          title ? 'py-4 border-b border-[--border]' : 'pt-3 pb-1'
        )}>
          {title
            ? <h2 className="text-base font-semibold text-[--text-primary]">{title}</h2>
            : <div />
          }
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[--text-muted] hover:text-[--text-primary] hover:bg-[--bg-hover] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto">
          <div className="px-5 pt-4 pb-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
