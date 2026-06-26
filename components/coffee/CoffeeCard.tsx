'use client'
import { getStatusLabel, getStatusColor, formatWeight } from '@/lib/utils'
import type { CoffeeWithStatus } from '@/types'

interface CoffeeCardProps {
  coffee: CoffeeWithStatus
  onClick?: () => void
  brewSize?: number
}

export function CoffeeCard({ coffee, onClick, brewSize = 20 }: CoffeeCardProps) {
  const statusLabel = getStatusLabel(coffee.computed_status)
  const statusColor = getStatusColor(coffee.computed_status)

  const progressPercent = coffee.total_brews > 0
    ? Math.round(((coffee.total_brews - coffee.brews_remaining) / coffee.total_brews) * 100)
    : 0

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[--bg-surface] border border-[--border] rounded-2xl p-4 hover:bg-[--bg-hover] hover:border-[--border-light] transition-all active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        {/* Color indicator */}
        <div
          className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
          style={{ backgroundColor: coffee.color + '22', border: `2px solid ${coffee.color}44` }}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: coffee.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm text-[--text-primary] leading-snug truncate pr-1">
              {coffee.name}
            </h3>
            <span className={`text-xs font-medium shrink-0 ${statusColor}`}>
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {coffee.supplier && (
              <span className="text-xs text-[--text-muted]">{coffee.supplier}</span>
            )}
            {coffee.origin && (
              <>
                <span className="text-[--border-light] text-xs">·</span>
                <span className="text-xs text-[--text-muted]">{coffee.origin}</span>
              </>
            )}
            {coffee.process && (
              <>
                <span className="text-[--border-light] text-xs">·</span>
                <span className="text-xs text-[--text-muted]">{coffee.process}</span>
              </>
            )}
            {coffee.cultivar && (
              <>
                <span className="text-[--border-light] text-xs">·</span>
                <span className="text-xs text-[--text-muted]">{coffee.cultivar}</span>
              </>
            )}
          </div>

          {/* Flavor notes */}
          {coffee.flavor_notes.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {coffee.flavor_notes.slice(0, 4).map(note => (
                <span key={note} className="px-2 py-0.5 rounded-full text-[10px] bg-[--bg-elevated] border border-[--border] text-[--text-secondary]">
                  {note}
                </span>
              ))}
              {coffee.flavor_notes.length > 4 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] text-[--text-muted]">
                  +{coffee.flavor_notes.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-[--text-muted]">
                Brew {coffee.total_brews - coffee.brews_remaining} of {coffee.total_brews}
              </span>
              <span className="text-xs font-medium text-[--text-secondary]">
                {formatWeight(coffee.remaining_grams)} left
              </span>
            </div>
            <div className="h-1.5 bg-[--bg-elevated] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: coffee.color,
                }}
              />
            </div>
          </div>

          {/* Status info */}
          {coffee.computed_status === 'resting' && coffee.days_until_ready > 0 && (
            <p className="text-xs text-blue-400 mt-2">
              Ready in {coffee.days_until_ready} day{coffee.days_until_ready !== 1 ? 's' : ''}
            </p>
          )}
          {coffee.computed_status === 'peak' && coffee.days_in_peak > 0 && (
            <p className="text-xs text-amber-400 mt-2">
              {coffee.days_in_peak} days remaining in peak
            </p>
          )}
          {coffee.computed_status === 'fading' && (
            <p className="text-xs text-orange-500 mt-2">Past peak window</p>
          )}
        </div>
      </div>
    </button>
  )
}
