'use client'
import { useState, useEffect } from 'react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { Edit2, Trash2, Coffee, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddCoffeeModal } from './AddCoffeeModal'
import { BrewModal } from './BrewModal'
import { useToast } from '@/components/ui/toast'
import { getStatusLabel, getStatusColor, formatWeight } from '@/lib/utils'
import type { CoffeeWithStatus, UserSettings, Brew } from '@/types'

interface CoffeeDetailModalProps {
  open: boolean
  onClose: () => void
  coffee: CoffeeWithStatus
  settings: UserSettings
  onSuccess: () => void
}

export function CoffeeDetailModal({ open, onClose, coffee, settings, onSuccess }: CoffeeDetailModalProps) {
  const { toast } = useToast()
  const [showEdit, setShowEdit] = useState(false)
  const [showBrew, setShowBrew] = useState(false)
  const [brews, setBrews] = useState<Brew[]>([])
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [loadingBrews, setLoadingBrews] = useState(true)
  const [brewMode, setBrewMode] = useState<'concurrent' | 'stretch'>(coffee.brew_mode ?? 'concurrent')
  const [savingBrewMode, setSavingBrewMode] = useState(false)

  async function handleBrewModeChange(mode: 'concurrent' | 'stretch') {
    if (mode === brewMode) return
    setSavingBrewMode(true)
    const supabase = createClient()
    const { error } = await supabase.from('coffees').update({ brew_mode: mode }).eq('id', coffee.id)
    if (error) {
      toast(error.message, 'error')
    } else {
      setBrewMode(mode)
      onSuccess()
    }
    setSavingBrewMode(false)
  }

  useEffect(() => {
    if (!open) return
    async function loadBrews() {
      setLoadingBrews(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('brews')
        .select('*')
        .eq('coffee_id', coffee.id)
        .order('brew_date', { ascending: false })
      setBrews(data ?? [])
      const rated = (data ?? []).filter(b => b.rating)
      if (rated.length > 0) {
        setAvgRating(Math.round((rated.reduce((s, b) => s + b.rating!, 0) / rated.length) * 10) / 10)
      }
      setLoadingBrews(false)
    }
    loadBrews()
  }, [open, coffee.id])

  async function handleDelete() {
    if (!confirm(`Delete "${coffee.name}"? This cannot be undone.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('coffees').delete().eq('id', coffee.id)
    if (error) { toast(error.message, 'error'); return }
    toast('Coffee deleted', 'success')
    onSuccess()
    onClose()
  }

  async function handleDuplicate() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('coffees').insert({
      user_id: user.id,
      name: `${coffee.name} (copy)`,
      supplier: coffee.supplier,
      origin: coffee.origin,
      process: coffee.process,
      cultivar: coffee.cultivar,
      roast_level: coffee.roast_level,
      flavor_notes: coffee.flavor_notes,
      weight_grams: coffee.weight_grams,
      remaining_grams: coffee.weight_grams,
      roast_date: coffee.roast_date,
      rest_days: coffee.rest_days,
      peak_end_days: coffee.peak_end_days,
      status: 'active',
      color: coffee.color,
      roaster_id: coffee.roaster_id ?? null,
    })
    if (error) { toast(error.message, 'error'); return }
    toast('Coffee duplicated!', 'success')
    onSuccess()
    onClose()
  }

  const statusLabel = getStatusLabel(coffee.computed_status)
  const statusColor = getStatusColor(coffee.computed_status)

  const peakWindowDays = differenceInDays(parseISO(coffee.peak_end_date), parseISO(coffee.ready_date))
  const stretchBrews = coffee.brews_remaining
  const stretchPace = peakWindowDays > 0 && stretchBrews > 0
    ? stretchBrews >= peakWindowDays
      ? `${(stretchBrews / peakWindowDays).toFixed(1)} brews/day`
      : `1 brew every ${Math.round(peakWindowDays / stretchBrews)} days`
    : null

  return (
    <>
      <Dialog open={open && !showEdit && !showBrew} onClose={onClose} title="Coffee Information" size="lg">
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center"
              style={{ backgroundColor: coffee.color + '22', border: `2px solid ${coffee.color}44` }}
            >
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: coffee.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-[--text-primary] leading-snug">{coffee.name}</h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {coffee.supplier && <span className="text-sm text-[--text-secondary]">{coffee.supplier}</span>}
                {coffee.origin && <><span className="text-[--border-light]">·</span><span className="text-sm text-[--text-muted]">{coffee.origin}</span></>}
                {coffee.process && <><span className="text-[--border-light]">·</span><span className="text-sm text-[--text-muted]">{coffee.process}</span></>}
                {coffee.cultivar.length > 0 && <><span className="text-[--border-light]">·</span><span className="text-sm text-[--text-muted]">{coffee.cultivar.join(', ')}</span></>}
              </div>
            </div>
          </div>

          {/* Status + stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[--bg-elevated] rounded-xl p-3 text-center">
              <p className={`text-base font-bold ${statusColor}`}>{statusLabel}</p>
              <p className="text-[10px] text-[--text-muted] mt-0.5">Status</p>
            </div>
            <div className="bg-[--bg-elevated] rounded-xl p-3 text-center">
              <p className="text-base font-bold text-[--text-primary]">{formatWeight(coffee.remaining_grams)}</p>
              <p className="text-[10px] text-[--text-muted] mt-0.5">{coffee.brews_remaining} brews left</p>
            </div>
            <div className="bg-[--bg-elevated] rounded-xl p-3 text-center">
              {avgRating ? (
                <>
                  <p className="text-base font-bold text-amber-400">{avgRating}/10</p>
                  <p className="text-[10px] text-[--text-muted] mt-0.5">Avg rating</p>
                </>
              ) : (
                <>
                  <p className="text-base font-bold text-[--text-muted]">—</p>
                  <p className="text-[10px] text-[--text-muted] mt-0.5">No ratings</p>
                </>
              )}
            </div>
          </div>

          {/* Flavor notes */}
          {coffee.flavor_notes.length > 0 && (
            <div>
              <p className="text-xs text-[--text-muted] mb-2">Flavor Notes</p>
              <div className="flex flex-wrap gap-1.5">
                {coffee.flavor_notes.map(note => (
                  <span key={note} className="px-2.5 py-1 rounded-full text-xs bg-[--bg-elevated] border border-[--border] text-[--text-secondary]">
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-[--bg-elevated] rounded-xl p-4 flex flex-col gap-2">
            <p className="text-xs font-medium text-[--text-secondary] uppercase tracking-wide mb-1">Timeline</p>
            <div className="flex justify-between text-xs">
              <span className="text-[--text-muted]">Roasted</span>
              <span className="text-[--text-primary]">{format(parseISO(coffee.roast_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[--text-muted]">Ready to drink</span>
              <span className="text-emerald-400">{format(parseISO(coffee.ready_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[--text-muted]">Peak window ends</span>
              <span className="text-amber-400">{format(parseISO(coffee.peak_end_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[--text-muted]">Roast level</span>
              <span className="text-[--text-secondary] capitalize">{coffee.roast_level ?? 'Unknown'}</span>
            </div>
            {coffee.cultivar.length > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-[--text-muted]">Cultivar</span>
                <span className="text-[--text-secondary]">{coffee.cultivar.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Brew Mode */}
          {coffee.computed_status !== 'finished' && (
            <div className="bg-[--bg-elevated] rounded-xl p-4 flex flex-col gap-3">
              <p className="text-xs font-medium text-[--text-secondary] uppercase tracking-wide">Brew Mode</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBrewModeChange('concurrent')}
                  disabled={savingBrewMode}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                    brewMode === 'concurrent'
                      ? 'bg-[--accent] text-white'
                      : 'bg-[--bg-surface] border border-[--border] text-[--text-muted] hover:text-[--text-primary]'
                  }`}
                >
                  Concurrent
                </button>
                <button
                  onClick={() => handleBrewModeChange('stretch')}
                  disabled={savingBrewMode}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                    brewMode === 'stretch'
                      ? 'bg-[--accent] text-white'
                      : 'bg-[--bg-surface] border border-[--border] text-[--text-muted] hover:text-[--text-primary]'
                  }`}
                >
                  Stretch
                </button>
              </div>
              {brewMode === 'stretch' && stretchPace && (
                <div className="flex flex-col gap-1.5 pt-1 border-t border-[--border]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[--text-muted]">Peak window</span>
                    <span className="text-[--text-secondary]">{peakWindowDays} days</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[--text-muted]">Pace to finish in peak</span>
                    <span className="text-[--accent] font-medium">{stretchPace}</span>
                  </div>
                </div>
              )}
              {brewMode === 'concurrent' && (
                <p className="text-xs text-[--text-muted]">This coffee joins the daily rotation alongside other active bags.</p>
              )}
            </div>
          )}

          {/* Brew history */}
          <div>
            <p className="text-xs font-medium text-[--text-secondary] uppercase tracking-wide mb-2">
              Brew History ({brews.length})
            </p>
            {loadingBrews ? (
              <p className="text-xs text-[--text-muted]">Loading...</p>
            ) : brews.length === 0 ? (
              <p className="text-xs text-[--text-muted]">No brews logged yet</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {brews.map(brew => (
                  <div key={brew.id} className="flex items-start gap-3 bg-[--bg-elevated] rounded-xl px-3 py-2.5">
                    <Coffee size={13} className="text-[--text-muted] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[--text-secondary]">
                          {format(parseISO(brew.brew_date + 'T12:00:00'), 'MMM d, yyyy')}
                        </span>
                        {brew.rating && (
                          <span className="text-xs text-amber-400">{brew.rating}/10 ★</span>
                        )}
                      </div>
                      {brew.notes && (
                        <p className="text-xs text-[--text-muted] mt-1">{brew.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-1">
            <Button variant="danger" size="icon" onClick={handleDelete} title="Delete">
              <Trash2 size={13} />
            </Button>
            <Button variant="secondary" size="icon" onClick={handleDuplicate} title="Duplicate">
              <Copy size={13} />
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setShowEdit(true)}>
              <Edit2 size={13} />
              Edit
            </Button>
            <Button className="flex-1" onClick={() => setShowBrew(true)}>
              <Coffee size={13} />
              Log Brew
            </Button>
          </div>
        </div>
      </Dialog>

      <AddCoffeeModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSuccess={() => { onSuccess(); setShowEdit(false); onClose() }}
        editCoffee={coffee}
      />
      <BrewModal
        open={showBrew}
        onClose={() => setShowBrew(false)}
        onSuccess={() => { onSuccess(); setShowBrew(false) }}
        coffee={coffee}
        brewSize={settings.brew_size_grams}
      />
    </>
  )
}
