import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { addDays, parseISO, differenceInDays, format, isAfter, isBefore } from 'date-fns'
import type { Coffee, CoffeeWithStatus, CoffeeStatus, UserSettings } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCoffeeStatus(coffee: Coffee): CoffeeStatus {
  const today = new Date()
  const roastDate = parseISO(coffee.roast_date)
  const readyDate = addDays(roastDate, coffee.rest_days)
  const peakEndDate = addDays(roastDate, coffee.peak_end_days)

  if (coffee.remaining_grams <= 0 || coffee.status === 'finished') return 'finished'
  if (isBefore(today, readyDate)) return 'resting'
  if (isAfter(today, peakEndDate)) return 'fading'

  const peakStartDays = coffee.rest_days
  const totalPeakDays = coffee.peak_end_days - peakStartDays
  const daysIntoPeak = differenceInDays(today, readyDate)

  if (daysIntoPeak <= totalPeakDays * 0.4) return 'ready'
  return 'peak'
}

export function enrichCoffee(coffee: Coffee, settings: UserSettings, brewsCompleted = 0): CoffeeWithStatus {
  const today = new Date()
  const roastDate = parseISO(coffee.roast_date)
  const readyDate = addDays(roastDate, coffee.rest_days)
  const peakEndDate = addDays(roastDate, coffee.peak_end_days)

  const totalBrews = Math.floor(coffee.weight_grams / settings.brew_size_grams)
  const brewsRemaining = Math.floor(coffee.remaining_grams / settings.brew_size_grams)
  const daysUntilReady = Math.max(0, differenceInDays(readyDate, today))
  const daysInPeak = Math.max(0, differenceInDays(peakEndDate, today))

  return {
    ...coffee,
    computed_status: getCoffeeStatus(coffee),
    ready_date: format(readyDate, 'yyyy-MM-dd'),
    peak_end_date: format(peakEndDate, 'yyyy-MM-dd'),
    brews_remaining: brewsRemaining,
    total_brews: totalBrews,
    brews_completed: brewsCompleted,
    days_until_ready: daysUntilReady,
    days_in_peak: daysInPeak,
  }
}

export function getStatusLabel(status: CoffeeStatus): string {
  switch (status) {
    case 'resting': return 'Resting'
    case 'ready': return 'Ready'
    case 'peak': return 'Peak'
    case 'fading': return 'Past Peak'
    case 'finished': return 'Finished'
  }
}

export function getStatusColor(status: CoffeeStatus): string {
  switch (status) {
    case 'resting': return 'text-blue-400'
    case 'ready': return 'text-emerald-400'
    case 'peak': return 'text-amber-400'
    case 'fading': return 'text-orange-500'
    case 'finished': return 'text-zinc-500'
  }
}

export function generateSchedule(
  coffees: CoffeeWithStatus[],
  settings: UserSettings,
  existingSchedule: Map<string, string[]>, // date -> coffee_ids
  days = 42
): Map<string, string[]> {
  const today = new Date()
  const result = new Map<string, string[]>()

  // Include resting bags too — they just can't be scheduled until their ready_date
  const allBags = coffees
    .filter(c => c.computed_status !== 'finished' && c.remaining_grams >= settings.brew_size_grams)
    .sort((a, b) => new Date(a.peak_end_date).getTime() - new Date(b.peak_end_date).getTime())

  if (allBags.length === 0) return result

  const stretchBags = allBags.filter(b => b.brew_mode === 'stretch')
  const concurrentBags = allBags.filter(b => b.brew_mode !== 'stretch')

  const remaining = new Map(allBags.map(b => [b.id, b.remaining_grams]))
  let bagIndex = 0

  for (let d = 0; d < days; d++) {
    const date = addDays(today, d)
    const dateStr = format(date, 'yyyy-MM-dd')

    if (existingSchedule.has(dateStr)) {
      result.set(dateStr, existingSchedule.get(dateStr)!)
      continue
    }

    const dayBags: string[] = []

    // Stretch bags: brew on a fixed interval derived from peak window
    for (const bag of stretchBags) {
      if (bag.ready_date > dateStr) continue
      const rem = remaining.get(bag.id) ?? 0
      if (rem < settings.brew_size_grams) continue

      const peakWindowDays = differenceInDays(parseISO(bag.peak_end_date), parseISO(bag.ready_date))
      const totalBrews = Math.max(1, Math.floor(bag.weight_grams / settings.brew_size_grams))
      const interval = Math.max(1, Math.round(peakWindowDays / totalBrews))
      const daysSinceReady = differenceInDays(date, parseISO(bag.ready_date))

      if (daysSinceReady >= 0 && daysSinceReady % interval === 0) {
        dayBags.push(bag.id)
        remaining.set(bag.id, rem - settings.brew_size_grams)
      }
    }

    // Concurrent bags: fill remaining brew slots in rotation
    const concurrentAvailable = concurrentBags.filter(b => b.ready_date <= dateStr)
    const remainingSlots = Math.max(0, settings.brews_per_day - dayBags.length)

    for (let b = 0; b < remainingSlots; b++) {
      if (concurrentAvailable.length === 0) break
      let attempts = 0
      while (attempts < concurrentAvailable.length) {
        const idx = (bagIndex + attempts) % concurrentAvailable.length
        const bag = concurrentAvailable[idx]
        const rem = remaining.get(bag.id) ?? 0

        if (rem >= settings.brew_size_grams) {
          dayBags.push(bag.id)
          remaining.set(bag.id, rem - settings.brew_size_grams)
          bagIndex = (idx + 1) % concurrentAvailable.length
          break
        }
        attempts++
      }
    }

    if (dayBags.length > 0) {
      result.set(dateStr, dayBags)
    }
  }

  return result
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)}kg`
  return `${grams}g`
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
