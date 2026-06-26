'use client'
import { Navigation } from './Navigation'
import { ToastProvider } from '@/components/ui/toast'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh">
        <Navigation />
        <main className="flex-1 flex flex-col min-h-dvh pb-20 sm:pb-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
