'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import type { Roaster } from '@/types'

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
  const [peakEndDays, setPeakEndDays] = useState(String(editRoaster?.default_peak_end_days ?? 30))
  const [defaultWeight, setDefaultWeight] = useState(editRoaster?.default_weight_grams ? String(editRoaster.default_weight_grams) : '')
  const [loading, setLoading] = useState(false)

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
            />
            <Input
              label="Peak Window End (days)"
              type="number"
              min={1}
              value={peakEndDays}
              onChange={e => setPeakEndDays(e.target.value)}
            />
            <Input
              label="Default Weight (g)"
              type="number"
              min={1}
              value={defaultWeight}
              onChange={e => setDefaultWeight(e.target.value)}
              placeholder="e.g. 250"
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
