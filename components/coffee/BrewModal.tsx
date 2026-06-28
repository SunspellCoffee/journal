'use client'
import { useState } from 'react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import type { Coffee } from '@/types'

interface BrewModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  coffee: Coffee
  brewSize: number
}

export function BrewModal({ open, onClose, onSuccess, coffee, brewSize }: BrewModalProps) {
  const { toast } = useToast()
  const [gramsUsed, setGramsUsed] = useState(String(brewSize))
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [brewDate, setBrewDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const grams = parseInt(gramsUsed) || brewSize
    const newRemaining = Math.max(0, coffee.remaining_grams - grams)

    // Insert brew log
    const { error: brewError } = await supabase.from('brews').insert({
      user_id: user.id,
      coffee_id: coffee.id,
      brew_date: brewDate,
      grams_used: grams,
      rating: rating || null,
      notes: notes.trim() || null,
    })

    if (brewError) {
      toast(brewError.message, 'error')
      setLoading(false)
      return
    }

    // Update remaining grams and status
    const updates: Record<string, unknown> = { remaining_grams: newRemaining }
    if (newRemaining === 0) updates.status = 'finished'

    await supabase.from('coffees').update(updates).eq('id', coffee.id)

    toast('Brew logged!', 'success')
    setLoading(false)
    onSuccess()
    onClose()
  }

  const displayRating = hoverRating || rating

  const daysRested = differenceInDays(new Date(), parseISO(coffee.roast_date))

  return (
    <Dialog open={open} onClose={onClose} title={`Log Brew — ${coffee.name}`} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Coffee info */}
        {(coffee.flavor_notes.length > 0 || daysRested > 0) && (
          <div className="flex flex-col gap-2 bg-[--bg-elevated] rounded-xl px-3 py-2.5">
            {daysRested > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[--text-muted]">Days rested</span>
                <span className="text-[--text-secondary] font-medium">{daysRested}d</span>
              </div>
            )}
            {coffee.flavor_notes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {coffee.flavor_notes.map(note => (
                  <span key={note} className="px-2 py-0.5 rounded-full text-[10px] bg-[--bg-surface] border border-[--border] text-[--text-muted]">
                    {note}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Brew Date"
            type="date"
            value={brewDate}
            onChange={e => setBrewDate(e.target.value)}
          />
          <Input
            label="Grams Used"
            type="number"
            min={1}
            max={coffee.remaining_grams}
            value={gramsUsed}
            onChange={e => setGramsUsed(e.target.value)}
          />
        </div>

        {/* Rating */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-[--text-secondary] uppercase tracking-wide">Rating</p>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(rating === n ? 0 : n)}
                className="flex-1 h-8 rounded transition-all"
                style={{
                  backgroundColor: n <= displayRating ? coffee.color : 'var(--bg-elevated)',
                  opacity: n <= displayRating ? 1 : 0.4,
                }}
              />
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs text-[--text-secondary] text-center">{rating}/10</p>
          )}
        </div>

        <Textarea
          label="Notes (optional)"
          placeholder="How did it taste? Any brew adjustments?"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
        />

        <div className="flex items-center justify-between text-xs text-[--text-muted] bg-[--bg-elevated] rounded-xl px-3 py-2">
          <span>Remaining after brew</span>
          <span className="text-[--text-secondary] font-medium">
            {Math.max(0, coffee.remaining_grams - (parseInt(gramsUsed) || brewSize))}g
          </span>
        </div>

        <div className="flex gap-3 mt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">Log Brew</Button>
        </div>
      </form>
    </Dialog>
  )
}
