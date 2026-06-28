'use client'
import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays, subDays, startOfWeek, parseISO, isToday, isPast, isSameDay, differenceInDays } from 'date-fns'
import { ChevronLeft, ChevronRight, RefreshCw, RotateCcw, Coffee as CoffeeIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { enrichCoffee, generateSchedule } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BrewModal } from '@/components/coffee/BrewModal'
import { useToast } from '@/components/ui/toast'
import type { Coffee, UserSettings, BrewScheduleEntry, CoffeeWithStatus } from '@/types'

interface CalendarClientProps {
  coffees: Coffee[]
  settings: UserSettings
  savedSchedule: BrewScheduleEntry[]
  recentBrews: { coffee_id: string; brew_date: string }[]
  userId: string
}

interface DragState {
  coffeeId: string
  fromDate: string
  brewIndex: number
}

export function CalendarClient({ coffees, settings, savedSchedule, recentBrews, userId }: CalendarClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [scheduleOverrides, setScheduleOverrides] = useState<Map<string, string[]>>(
    () => {
      const map = new Map<string, string[]>()
      savedSchedule.forEach(s => {
        const existing = map.get(s.scheduled_date) ?? []
        existing[s.brew_index] = s.coffee_id
        map.set(s.scheduled_date, existing)
      })
      return map
    }
  )
  const [dragging, setDragging] = useState<DragState | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [brewTarget, setBrewTarget] = useState<CoffeeWithStatus | null>(null)

  const enriched = useMemo(() =>
    coffees.map(c => enrichCoffee(c, settings)),
    [coffees, settings]
  )

  const coffeeMap = useMemo(() =>
    new Map(enriched.map(c => [c.id, c])),
    [enriched]
  )

  const schedule = useMemo(() =>
    generateSchedule(enriched, settings, scheduleOverrides, 56),
    [enriched, settings, scheduleOverrides]
  )

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const brewedSet = useMemo(() => new Set(recentBrews.map(b => `${b.brew_date}:${b.coffee_id}`)), [recentBrews])
  const brewedTodayIds = useMemo(() => new Set(recentBrews.filter(b => b.brew_date === todayStr).map(b => b.coffee_id)), [recentBrews, todayStr])

  // Rollover: coffees from the past 2 days in saved schedule that were never brewed
  const rolloverIds = useMemo(() => {
    const ids: string[] = []
    for (let d = 1; d <= 2; d++) {
      const pastDate = format(subDays(new Date(), d), 'yyyy-MM-dd')
      const pastScheduled = scheduleOverrides.get(pastDate) ?? []
      for (const id of pastScheduled) {
        if (!brewedSet.has(`${pastDate}:${id}`) && !ids.includes(id) && coffeeMap.has(id)) {
          ids.push(id)
        }
      }
    }
    return ids
  }, [scheduleOverrides, brewedSet, coffeeMap])

  // Today's display: rollover first, then today's scheduled, then any extra brews made today
  // All shown — brewed ones are darkened in the UI, unbrewed ones show the Log button
  const todayDisplayCoffees = useMemo(() => {
    const todayScheduledIds = schedule.get(todayStr) ?? []
    // Extra coffees brewed today that weren't in today's schedule
    const extraBrewedIds = [...brewedTodayIds].filter(
      id => !todayScheduledIds.includes(id) && !rolloverIds.includes(id) && coffeeMap.has(id)
    )
    return [...new Set([...rolloverIds, ...todayScheduledIds, ...extraBrewedIds])]
      .filter(id => coffeeMap.has(id))
      .map(id => coffeeMap.get(id)!)
  }, [schedule, todayStr, rolloverIds, brewedTodayIds, coffeeMap])

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const prevWeek = () => setWeekStart(d => subDays(d, 7))
  const nextWeek = () => setWeekStart(d => addDays(d, 7))
  const goToToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  function getDayCoffees(date: Date): CoffeeWithStatus[] {
    const dateStr = format(date, 'yyyy-MM-dd')
    if (dateStr === todayStr) return todayDisplayCoffees
    const ids = schedule.get(dateStr) ?? []
    return ids.map(id => coffeeMap.get(id)).filter(Boolean) as CoffeeWithStatus[]
  }

  function handleDragStart(e: React.DragEvent, coffeeId: string, fromDate: string, brewIndex: number) {
    setDragging({ coffeeId, fromDate, brewIndex })
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, dateStr: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(dateStr)
  }

  function handleDrop(e: React.DragEvent, toDate: string) {
    e.preventDefault()
    setDragOver(null)
    if (!dragging || dragging.fromDate === toDate) { setDragging(null); return }

    // Move the coffee from fromDate to toDate in the schedule
    setScheduleOverrides(prev => {
      const newMap = new Map(prev)
      const fromIds = [...(schedule.get(dragging.fromDate) ?? [])]
      const toIds = [...(schedule.get(toDate) ?? [])]

      // Remove from source
      fromIds.splice(dragging.brewIndex, 1)

      // Add to target
      toIds.push(dragging.coffeeId)

      newMap.set(dragging.fromDate, fromIds)
      newMap.set(toDate, toIds)
      return newMap
    })
    setDragging(null)
  }

  async function saveSchedule() {
    setSaving(true)
    const supabase = createClient()

    // Delete existing future schedule
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    await supabase.from('brew_schedule')
      .delete()
      .eq('user_id', userId)
      .gte('scheduled_date', todayStr)

    // Insert new schedule
    const entries: Omit<BrewScheduleEntry, 'id' | 'created_at' | 'coffee'>[] = []
    schedule.forEach((coffeeIds, dateStr) => {
      if (dateStr >= todayStr) {
        coffeeIds.forEach((coffeeId, index) => {
          entries.push({
            user_id: userId,
            coffee_id: coffeeId,
            scheduled_date: dateStr,
            brew_index: index,
            completed: false,
          })
        })
      }
    })

    if (entries.length > 0) {
      const { error } = await supabase.from('brew_schedule').insert(entries)
      if (error) { toast(error.message, 'error'); setSaving(false); return }
    }

    toast('Schedule saved!', 'success')
    setSaving(false)
    router.refresh()
  }

  async function resetSchedule() {
    setScheduleOverrides(new Map())
    toast('Schedule reset to auto', 'info')
  }

  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-[--border]">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-[--text-primary]">Schedule</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={resetSchedule} title="Reset to auto">
              <RotateCcw size={15} />
            </Button>
            <Button size="sm" loading={saving} onClick={saveSchedule}>
              <RefreshCw size={13} />
              Save
            </Button>
          </div>
        </div>

        {/* Week nav */}
        <div className="flex items-center gap-3">
          <button onClick={prevWeek} className="p-1.5 rounded-lg text-[--text-muted] hover:text-[--text-primary] hover:bg-[--bg-elevated] transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 text-center">
            <button
              onClick={goToToday}
              className={`text-sm font-medium transition-colors ${isCurrentWeek ? 'text-[--accent]' : 'text-[--text-secondary] hover:text-[--text-primary]'}`}
            >
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </button>
          </div>
          <button onClick={nextWeek} className="p-1.5 rounded-lg text-[--text-muted] hover:text-[--text-primary] hover:bg-[--bg-elevated] transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-col gap-2">
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayCoffees = getDayCoffees(day)
            const past = isPast(day) && !isToday(day)
            const today = isToday(day)

            return (
              <div
                key={dateStr}
                className={`rounded-2xl border transition-all ${
                  today
                    ? 'border-[--accent] bg-[--bg-surface]'
                    : dragOver === dateStr
                    ? 'border-[--accent]/50 bg-[--bg-hover]'
                    : 'border-[--border] bg-[--bg-surface]'
                } ${past ? 'opacity-60' : ''}`}
                onDragOver={e => !past && handleDragOver(e, dateStr)}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => !past && handleDrop(e, dateStr)}
              >
                <div className="px-4 pt-3 pb-2">
                  {/* Day header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`flex items-center gap-2 ${today ? 'text-[--accent]' : 'text-[--text-secondary]'}`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {format(day, 'EEE')}
                      </span>
                      <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        today ? 'bg-[--accent] text-[--bg]' : ''
                      }`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    {dayCoffees.length === 0 && !past && (
                      <span className="text-xs text-[--text-muted]">No brews scheduled</span>
                    )}
                  </div>

                  {/* Coffee pills */}
                  {dayCoffees.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {dayCoffees.map((coffee, idx) => {
                        const isBrewed = today && brewedTodayIds.has(coffee.id)
                        const isDragging = dragging?.coffeeId === coffee.id && dragging.fromDate === dateStr && dragging.brewIndex === idx
                        return (
                          <div
                            key={`${coffee.id}-${idx}`}
                            draggable={!past && !isBrewed}
                            onDragStart={e => handleDragStart(e, coffee.id, dateStr, idx)}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 select-none transition-opacity ${
                              isBrewed ? 'opacity-35 cursor-default' : isDragging ? 'opacity-40 cursor-grabbing' : 'opacity-100 cursor-grab active:cursor-grabbing'
                            }`}
                            style={{
                              backgroundColor: coffee.color + '22',
                              borderLeft: `3px solid ${coffee.color}`,
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-[--text-primary] truncate block">
                                {coffee.name}
                              </span>
                              <span className="text-[10px] text-[--text-muted]">
                                {coffee.remaining_grams}g · {coffee.brews_remaining} brews left · {differenceInDays(parseISO(dateStr), parseISO(coffee.roast_date))}d rested this day
                              </span>
                            </div>
                            {!isBrewed ? (
                              <button
                                onClick={e => { e.stopPropagation(); setBrewTarget(coffee) }}
                                className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
                                style={{ backgroundColor: coffee.color + '33', color: coffee.color }}
                                title="Log brew"
                              >
                                <CoffeeIcon size={10} />
                                Log
                              </button>
                            ) : (
                              <span className="shrink-0 text-[10px] text-[--text-muted]">Brewed</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        {enriched.filter(c => c.status === 'active').length > 0 && (
          <div className="mt-6 px-1">
            <p className="text-xs text-[--text-muted] mb-3 uppercase tracking-wide font-medium">Active Coffees</p>
            <div className="flex flex-wrap gap-2">
              {enriched.filter(c => c.status === 'active').map(c => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                  style={{ backgroundColor: c.color + '1a', border: `1px solid ${c.color}33` }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-[--text-secondary] truncate max-w-24">{c.name}</span>
                  <span style={{ color: c.color }}>{c.brews_remaining}b</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {enriched.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-[--text-muted]">
            <span className="text-4xl mb-4 opacity-30">📅</span>
            <p className="text-sm">Add coffees to generate a schedule</p>
          </div>
        )}
      </div>

      {brewTarget && (
        <BrewModal
          open={!!brewTarget}
          onClose={() => setBrewTarget(null)}
          onSuccess={() => { setBrewTarget(null); router.refresh() }}
          coffee={brewTarget}
          brewSize={settings.brew_size_grams}
        />
      )}
    </div>
  )
}
