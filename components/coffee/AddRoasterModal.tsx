'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import type { Roaster } from '@/types'
import presetRoasters from '@/data/preset-roasters.json'

interface PresetRoaster {
  slug: string
  name: string
  url: string
  country: string
  rest_days: number | null
  default_weight_grams: number | null
  peak_start_days: number | null
  peak_end_days: number | null
  notes: string
}

interface AddRoasterModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editRoaster?: Roaster | null
}

export function AddRoasterModal({ open, onClose, onSuccess, editRoaster }: AddRoasterModalProps) {
  const { toast } = useToast()
  const isEdit = !!editRoaster

  const [name, setName] = useState(editRoaster?.name ?? '')
  const [website, setWebsite] = useState(editRoaster?.website ?? '')
  const [country, setCountry] = useState(editRoaster?.country ?? '')
  const [notes, setNotes] = useState(editRoaster?.notes ?? '')
  const [restDays, setRestDays] = useState(String(editRoaster?.default_rest_days ?? 7))
  const [peakStartDays, setPeakStartDays] = useState(editRoaster?.default_peak_start_days ? String(editRoaster.default_peak_start_days) : '')
  const [peakEndDays, setPeakEndDays] = useState(String(editRoaster?.default_peak_end_days ?? 30))
  const [defaultWeight, setDefaultWeight] = useState(editRoaster?.default_weight_grams ? String(editRoaster.default_weight_grams) : '')
  const [loading, setLoading] = useState(false)
  const [presetSearch, setPresetSearch] = useState('')
  const [showPresets, setShowPresets] = useState(false)
  const presetRef = useRef<HTMLDivElement>(null)

  const filteredPresets = useMemo(() => {
    if (!presetSearch.trim()) return presetRoasters as PresetRoaster[]
    const q = presetSearch.toLowerCase()
    return (presetRoasters as PresetRoaster[]).filter(r =>
      r.name.toLowerCase().includes(q) || r.country.toLowerCase().includes(q)
    )
  }, [presetSearch])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
        setShowPresets(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function applyPreset(preset: PresetRoaster) {
    setName(preset.name)
    setWebsite(preset.url.replace(/^https?:\/\//, ''))
    setCountry(preset.country)
    if (preset.rest_days != null) setRestDays(String(preset.rest_days))
    if (preset.peak_start_days != null) setPeakStartDays(String(preset.peak_start_days))
    if (preset.peak_end_days != null) setPeakEndDays(String(preset.peak_end_days))
    if (preset.default_weight_grams != null) setDefaultWeight(String(preset.default_weight_grams))
    setPresetSearch('')
    setShowPresets(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      name: name.trim(),
      website: website.trim() || null,
      country: country.trim() || null,
      notes: notes.trim() || null,
      default_rest_days: parseInt(restDays) || 7,
      default_peak_start_days: peakStartDays ? parseInt(peakStartDays) : null,
      default_peak_end_days: parseInt(peakEndDays) || 30,
      default_weight_grams: defaultWeight ? parseInt(defaultWeight) : null,
    }

    let err
    if (isEdit) {
      const { error } = await supabase.from('roasters').update(payload).eq('id', editRoaster!.id)
      err = error
    } else {
      const { error } = await supabase.from('roasters').insert(payload)
      err = error
    }

    setLoading(false)
    if (err) { toast(err.message, 'error'); return }
    toast(isEdit ? 'Roaster updated!' : 'Roaster added!', 'success')
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? 'Edit Roaster' : 'Add Roaster'} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Preset picker — only show when adding, not editing */}
        {!isEdit && (
          <div ref={presetRef} className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Start from a known roaster…"
                value={presetSearch}
                onFocus={() => setShowPresets(true)}
                onChange={e => { setPresetSearch(e.target.value); setShowPresets(true) }}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-[--bg-elevated] border border-[--border] text-[--text-primary] placeholder:text-[--text-muted] focus:border-[--accent] focus:outline-none transition-colors"
              />
              {presetSearch && (
                <button
                  type="button"
                  onClick={() => { setPresetSearch(''); setShowPresets(false) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[--text-muted] hover:text-[--text-primary]"
                >
                  ✕
                </button>
              )}
            </div>
            {showPresets && (
              <div
                className="absolute z-50 top-full mt-1 w-full rounded-xl overflow-hidden max-h-52 overflow-y-auto"
                style={{
                  backgroundColor: '#1a1208',
                  border: '1px solid #3a2a18',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                }}
              >
                {filteredPresets.length === 0 ? (
                  <p className="text-xs text-[--text-muted] px-3 py-3">No roasters found</p>
                ) : (
                  filteredPresets.map(preset => (
                    <button
                      key={preset.slug}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between gap-3"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2e2212')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span className="text-sm text-[--text-primary] truncate">{preset.name}</span>
                      <span className="text-xs text-[--text-muted] shrink-0">{preset.country}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <Input
          label="Roaster Name *"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          placeholder="e.g. Shoebox Coffee Roasters"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Country"
            value={country}
            onChange={e => setCountry(e.target.value)}
            placeholder="e.g. Colombia"
          />
          <Input
            label="Website"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="shoeboxcoffee.com"
          />
        </div>

        <div className="bg-[--bg-surface] border border-[--border] rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs font-medium text-[--text-secondary] uppercase tracking-wide">
            Default Brew Windows
          </p>
          <p className="text-xs text-[--text-muted] -mt-1">
            These auto-fill when you add a coffee from this roaster
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Default Rest Days"
              type="number"
              min={0}
              value={restDays}
              onChange={e => setRestDays(e.target.value)}
              hint="Days before drinkable"
            />
            <Input
              label="Default Weight (g)"
              type="number"
              min={1}
              value={defaultWeight}
              onChange={e => setDefaultWeight(e.target.value)}
              placeholder="e.g. 250"
            />
            <Input
              label="Peak Window Start"
              type="number"
              min={1}
              value={peakStartDays}
              onChange={e => setPeakStartDays(e.target.value)}
              placeholder="e.g. 14"
              hint="Days from roast"
            />
            <Input
              label="Peak Window End"
              type="number"
              min={1}
              value={peakEndDays}
              onChange={e => setPeakEndDays(e.target.value)}
              hint="Days from roast"
            />
          </div>
        </div>

        <Textarea
          label="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Focus on naturals from Ethiopia and Colombia"
          rows={2}
        />

        <div className="flex gap-3 mt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">
            {isEdit ? 'Save Changes' : 'Add Roaster'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
