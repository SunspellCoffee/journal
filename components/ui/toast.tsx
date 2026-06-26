'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 sm:bottom-6 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl slide-up',
              {
                'bg-emerald-950 border-emerald-800 text-emerald-200': t.type === 'success',
                'bg-red-950 border-red-800 text-red-200': t.type === 'error',
                'bg-blue-950 border-blue-800 text-blue-200': t.type === 'info',
              }
            )}
          >
            {t.type === 'success' && <CheckCircle size={16} className="mt-0.5 shrink-0" />}
            {t.type === 'error' && <AlertCircle size={16} className="mt-0.5 shrink-0" />}
            {t.type === 'info' && <Info size={16} className="mt-0.5 shrink-0" />}
            <p className="text-sm flex-1">{t.message}</p>
            <button
              onClick={() => setToasts(prev => prev.filter(t2 => t2.id !== t.id))}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
