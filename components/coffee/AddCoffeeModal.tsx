'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { COFFEE_COLORS, ROAST_LEVELS } from '@/types'
import type { Roaster } from '@/types'
import { X } from 'lucide-react'

interface EditCoffeeData {
  id: string
  name: string
  supplier: string | null
  origin: string | null
  process: string | null
  cultivar: string | null
  roast_level: string | null
  flavor_notes: string[]
  weight_grams: number
  remaining_grams: number
  roast_date: string
  rest_days: number
  peak_end_days: number
  status: string
  color: string
  roaster_id: string | null
}

interface AddCoffeeModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editCoffee?: EditCoffeeData | null
  roasters?: Roaster[]
}

export function AddCoffeeModal({ open, onClose, onSuccess, editCoffee, roasters = [] }: AddCoffeeModalProps) {
  const { toast } = useToast()
  const isEdit = !!editCoffee

  const [name, setName] = useState(editCoffee?.name ?? '')
  const [supplier, setSupplier] = useState(editCoffee?.supplier ?? '')
  const [origin, setOrigin] = useState(editCoffee?.origin ?? '')
  const [process, setProcess] = useState(editCoffee?.process ?? '')
  const [cultivar, setCultivar] = useState(editCoffee?.cultivar ?? '')
  const [roastLevel, setRoastLevel] = useState(editCoffee?.roast_level ?? 'light')
  const [flavorInput, setFlavorInput] = useState('')
  const [flavorNotes, setFlavorNotes] = useState<string[]>(editCoffee?.flavor_notes ?? [])
  const [weightGrams, setWeightGrams] = useState(String(editCoffee?.weight_grams ?? 250))
  const [roastDate, setRoastDate] = useState(editCoffee?.roast_date ?? format(new Date(), 'yyyy-MM-dd'))
  const [restDays, setRestDays] = useState(String(editCoffee?.rest_days ?? 7))
  const [peakEndDays, setPeakEndDays] = useState(String(editCoffee?.peak_end_days ?? 30))
  const [status, setStatus] = useState(editCoffee?.status ?? 'active')
  const [selectedColor, setSelectedColor] = useState(editCoffee?.color ?? COFFEE_COLORS[0])
  const [selectedRoasterId, setSelectedRoasterId] = useState(editCoffee?.roaster_id ?? '')
  const [loading, setLoading] = useState(false)

  function handleRoasterChange(roasterId: string) {
    setSelectedRoasterId(roasterId)
    if (!roasterId) return
    const roaster = roasters.find(r => r.id === roasterId)
    if (roaster) {
      if (!supplier || supplier === '') setSupplier(roaster.name)
      setRestDays(String(roaster.default_rest_days))
      setPeakEndDays(String(roaster.default_peak_end_days))
      if (roaster.default_weight_grams) setWeightGrams(String(roaster.default_weight_grams))
    }
  }

  function addFlavorNote() {
    const note = flavorInput.trim()
    if (note && !flavorNotes.includes(note)) {
      setFlavorNotes(prev => [...prev, note])
      setFlavorInput('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const weight = parseInt(weightGrams) || 250
    const consumed = isEdit ? editCoffee!.weight_grams - editCoffee!.remaining_grams : 0
    const remaining = isEdit ? Math.max(0, weight - consumed) : weight
    const payload = {
      user_id: user.id,
      name: name.trim(),
      supplier: supplier.trim() || null,
      origin: origin.trim() || null,
      process: process.trim() || null,
      cultivar: cultivar.trim() || null,
      roast_level: roastLevel || null,
      flavor_notes: flavorNotes,
      weight_grams: weight,
      remaining_grams: remaining,
      roast_date: roastDate,
      rest_days: parseInt(restDays) || 7,
      peak_end_days: parseInt(peakEndDays) || 30,
      status,
      color: selectedColor,
      roaster_id: selectedRoasterId || null,
    }

    let err
    if (isEdit) {
      const { error } = await supabase.from('coffees').update(payload).eq('id', editCoffee!.id)
      err = error
    } else {
      const { error } = await supabase.from('coffees').insert(payload)
      err = error
    }

    setLoading(false)
    if (err) { toast(err.message, 'error'); return }
    toast(isEdit ? 'Coffee updated!' : 'Coffee added!', 'success')
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? 'Edit Coffee' : 'Add Coffee'} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Color picker */}
        <div>
          <p className="text-xs font-medium text-[--text-secondary] uppercase tracking-wide mb-2">Color</p>
          <div className="flex gap-2 flex-wrap">
            {COFFEE_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className="w-7 h-7 rounded-full transition-all"
                style={{
                  backgroundColor: color,
                  boxShadow: selectedColor === color ? `0 0 0 2px #0e0a06, 0 0 0 4px ${color}` : 'none',
                  transform: selectedColor === color ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Roaster selector */}
        {roasters.length > 0 && (
          <Select
            label="Roaster (auto-fills rest, peak & weight)"
            value={selectedRoasterId}
            onChange={e => handleRoasterChange(e.target.value)}
            options={[
              { value: '', label: '— None —' },
              ...roasters.map(r => ({ value: r.id, label: r.name })),
            ]}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input label="Coffee Name *" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Marlon Bolaños Aji" />
          </div>
          <Input label="Supplier / Roaster" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="e.g. Shoebox Coffee" />
          <Input label="Origin" value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. Colombia" />
          <Input label="Process" value={process} onChange={e => setProcess(e.target.value)} placeholder="e.g. Washed" />
          <Input label="Cultivar" value={cultivar} onChange={e => setCultivar(e.target.value)} placeholder="e.g. Gesha" />
          <Select
            label="Roast Level"
            value={roastLevel}
            onChange={e => setRoastLevel(e.target.value)}
            options={ROAST_LEVELS}
          />
        </div>

        {/* Flavor notes */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-[--text-secondary] uppercase tracking-wide">Flavor Notes</p>
          <div className="flex gap-2">
            <input
              value={flavorInput}
              onChange={e => setFlavorInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFlavorNote() } }}
              placeholder="e.g. Golden Kiwi"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-[--bg-elevated] border border-[--border] text-[--text-primary] placeholder:text-[--text-muted] focus:border-[--accent] focus:outline-none transition-colors"
            />
            <Button type="button" variant="secondary" onClick={addFlavorNote} size="md">Add</Button>
          </div>
          {flavorNotes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {flavorNotes.map(note => (
                <span key={note} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[--bg-elevated] border border-[--border] text-[--text-secondary]">
                  {note}
                  <button type="button" onClick={() => setFlavorNotes(prev => prev.filter(n => n !== note))}>
                    <X size={10} className="text-[--text-muted] hover:text-[--text-primary]" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Weight (g) *"
            type="number"
            min={1}
            value={weightGrams}
            onChange={e => setWeightGrams(e.target.value)}
            required
            placeholder="250"
          />
          <Input
            label="Roast Date *"
            type="date"
            value={roastDate}
            onChange={e => setRoastDate(e.target.value)}
            required
          />
          <Input
            label="Rest Days"
            type="number"
            min={0}
            value={restDays}
            onChange={e => setRestDays(e.target.value)}
            hint="Days before ready to drink"
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

        <Select
          label="Status"
          value={status}
          onChange={e => setStatus(e.target.value)}
          options={[
            { value: 'active', label: 'Active (in hand)' },
            { value: 'on_order', label: 'On Order' },
            { value: 'finished', label: 'Finished' },
          ]}
        />

        <div className="flex gap-3 mt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">
            {isEdit ? 'Save Changes' : 'Add Coffee'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
