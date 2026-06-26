'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, CalendarDays, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { JournalLogo } from '@/components/ui/journal-logo'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/inventory', icon: Package, label: 'Inventory' },
  { href: '/calendar', icon: CalendarDays, label: 'Schedule' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden sm:flex flex-col gap-1 w-56 shrink-0 p-4 border-r border-[--border]">
        <div className="flex items-center px-3 py-3 mb-4">
          <JournalLogo className="h-7 w-auto text-[--text-primary]" />
        </div>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                active
                  ? 'bg-[--accent-dim] text-[--accent] font-medium'
                  : 'text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-hover]'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Mobile bottom bar */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-[--border] backdrop-blur-md"
        style={{ backgroundColor: 'color-mix(in srgb, var(--bg-surface) 80%, transparent)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors',
                active ? 'text-[--accent]' : 'text-[--text-muted]'
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
