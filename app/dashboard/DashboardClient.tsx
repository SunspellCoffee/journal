'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Plus, AlertTriangle, Coffee as CoffeeIcon, TrendingUp, Package } from 'lucide-react'
import { enrichCoffee, getStatusColor, getStatusLabel, generateSchedule } from '@/lib/utils'
import { AddCoffeeModal } from '@/components/coffee/AddCoffeeModal'
import { BrewModal } from '@/components/coffee/BrewModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Coffee, UserSettings, Brew, BrewScheduleEntry, CoffeeWithStatus } from '@/types'

interface DashboardClientProps {
  coffees: Coffee[]
  settings: UserSettings
  recentBrews: (Brew & { coffee?: { name: string; color: string } | null })[]
  savedSchedule: BrewScheduleEntry[]
  userId: string
}

export function DashboardClient({ coffees, settings, recentBrews, savedSchedule, userId }: DashboardClientProps) {
  const router = useRouter()
  const [showAddModal, setShowAddModal] = useState(false)
  const [brewTarget, setBrewTarget] = useState<Coffee | null>(null)

  const enriched = coffees.map(c => enrichCoffee(c, settings))
  const active = enriched.filter(c => c.status === 'active')
  const lowStock = active.filter(c => c.brews_remaining <= settings.low_stock_threshold_brews && c.brews_remaining > 0)
  const restingCount = active.filter(c => c.computed_status === 'resting').length

  // Today's schedule — use saved overrides so dashboard matches the Schedule screen
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const scheduleOverrides = new Map<string, string[]>()
  savedSchedule.forEach(s => {
    const existing = scheduleOverrides.get(s.scheduled_date) ?? []
    existing[s.brew_index] = s.coffee_id
    scheduleOverrides.set(s.scheduled_date, existing)
  })
  const schedule = generateSchedule(enriched, settings, scheduleOverrides, 7)

  // Subtract brews already logged today
  const brewedTodayCount = recentBrews.filter(b => b.brew_date === todayStr).length
  const remainingToday = Math.max(0, settings.brews_per_day - brewedTodayCount)

  const todaysBags = (schedule.get(todayStr) ?? [])
    .slice(0, remainingToday)
    .map(id => enriched.find(c => c.id === id))
    .filter(Boolean) as CoffeeWithStatus[]

  const refresh = useCallback(() => router.refresh(), [router])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-[--border]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[--text-muted]">{format(new Date(), 'EEEE, MMMM d')}</p>
            <h1 className="text-xl font-bold text-[--text-primary] mt-0.5">Dashboard</h1>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} />
            Add Coffee
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[--bg-surface] border border-[--border] rounded-2xl p-3 flex flex-col gap-1">
            <Package size={16} className="text-[--text-muted]" />
            <span className="text-2xl font-bold text-[--text-primary]">{active.length}</span>
            <span className="text-xs text-[--text-muted]">Active bags</span>
          </div>
          <div className="bg-[--bg-surface] border border-[--border] rounded-2xl p-3 flex flex-col gap-1">
            <CoffeeIcon size={16} className="text-[--text-muted]" />
            <span className="text-2xl font-bold text-[--text-primary]">{settings.brews_per_day}</span>
            <span className="text-xs text-[--text-muted]">Brews today</span>
          </div>
          <div className="bg-[--bg-surface] border border-[--border] rounded-2xl p-3 flex flex-col gap-1">
            <TrendingUp size={16} className="text-[--text-muted]" />
            <span className="text-2xl font-bold text-[--text-primary]">{recentBrews.length}</span>
            <span className="text-xs text-[--text-muted]">Recent brews</span>
          </div>
        </div>

        {/* Alerts */}
        {(lowStock.length > 0 || restingCount > 0) && (
          <div className="flex flex-col gap-2">
            {lowStock.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-amber-950/30 border border-amber-900/50 rounded-xl px-4 py-3">
                <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-200 truncate">{c.name}</p>
                  <p className="text-xs text-amber-400/70">
                    Only {c.brews_remaining} brew{c.brews_remaining !== 1 ? 's' : ''} remaining
                  </p>
                </div>
                <Button size="sm" onClick={() => setBrewTarget(c)}>Log</Button>
              </div>
            ))}
            {restingCount > 0 && (
              <div className="flex items-center gap-3 bg-blue-950/30 border border-blue-900/50 rounded-xl px-4 py-3">
                <span className="text-blue-400 shrink-0 text-sm">⏳</span>
                <p className="text-sm text-blue-200">
                  {restingCount} bag{restingCount !== 1 ? 's' : ''} still resting
                </p>
              </div>
            )}
          </div>
        )}

        {/* Today's brew queue */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[--text-secondary] uppercase tracking-wide">Today&apos;s Queue</h2>
            <Badge variant={remainingToday > 0 ? 'success' : 'muted'}>
              {brewedTodayCount}/{settings.brews_per_day} done
            </Badge>
          </div>
          {todaysBags.length > 0 ? (
            <div className="flex flex-col gap-2">
              {todaysBags.map((c, i) => (
                <button
                  key={`${c.id}-${i}`}
                  onClick={() => setBrewTarget(c)}
                  className="flex items-center gap-3 bg-[--bg-surface] border border-[--border] rounded-xl px-4 py-3 hover:bg-[--bg-hover] transition-colors w-full text-left active:scale-[0.99]"
                >
                  <div className="w-2 h-8 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[--text-primary] truncate">{c.name}</p>
                    <p className="text-xs text-[--text-muted]">
                      {c.remaining_grams}g left · {c.brews_remaining} brews remaining
                    </p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${getStatusColor(c.computed_status)}`}>
                    {getStatusLabel(c.computed_status)}
                  </span>
                </button>
              ))}
            </div>
          ) : active.length === 0 ? (
            <div className="text-center py-8 text-[--text-muted]">
              <CoffeeIcon size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No coffees yet.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-[--accent] text-sm mt-1 hover:underline"
              >
                Add your first bag
              </button>
            </div>
          ) : (
            <p className="text-sm text-[--text-muted] text-center py-4">
              All bags are resting — check back soon!
            </p>
          )}
        </div>

        {/* Recent brew log */}
        {recentBrews.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[--text-secondary] uppercase tracking-wide mb-3">Recent Brews</h2>
            <div className="flex flex-col gap-2">
              {recentBrews.slice(0, 5).map(brew => (
                <div key={brew.id} className="flex items-center gap-3 bg-[--bg-surface] border border-[--border] rounded-xl px-4 py-3">
                  {brew.coffee && (
                    <div className="w-2 h-6 rounded-full shrink-0" style={{ backgroundColor: brew.coffee.color }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[--text-primary] truncate">{brew.coffee?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-[--text-muted]">{format(new Date(brew.brew_date + 'T12:00:00'), 'MMM d')}</p>
                  </div>
                  {brew.rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400 text-xs">★</span>
                      <span className="text-xs text-[--text-secondary]">{brew.rating}/10</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AddCoffeeModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refresh}
      />
      {brewTarget && (
        <BrewModal
          open={!!brewTarget}
          onClose={() => setBrewTarget(null)}
          onSuccess={refresh}
          coffee={brewTarget}
          brewSize={settings.brew_size_grams}
        />
      )}
    </div>
  )
}
