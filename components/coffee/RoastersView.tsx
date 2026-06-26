'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, Globe, Coffee as CoffeeIcon, ChevronDown, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AddRoasterModal } from './AddRoasterModal'
import { useToast } from '@/components/ui/toast'
import { getStatusColor, getStatusLabel, enrichCoffee } from '@/lib/utils'
import type { Roaster, Coffee, UserSettings } from '@/types'

interface RoastersViewProps {
  roasters: Roaster[]
  coffees: Coffee[]
  settings: UserSettings
}

export function RoastersView({ roasters, coffees, settings }: RoastersViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRoaster, setEditingRoaster] = useState<Roaster | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const refresh = useCallback(() => router.refresh(), [router])

  async function handleDelete(roaster: Roaster) {
    if (!confirm(`Delete "${roaster.name}"? Coffees linked to this roaster will be unlinked.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('roasters').delete().eq('id', roaster.id)
    if (error) { toast(error.message, 'error'); return }
    toast('Roaster deleted', 'success')
    refresh()
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {roasters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[--text-muted]">
            <span className="text-4xl mb-4 opacity-30">🏭</span>
            <p className="text-sm mb-2">No roasters added yet</p>
            <button onClick={() => setShowAddModal(true)} className="text-[--accent] text-sm hover:underline">
              Add your first roaster
            </button>
          </div>
        ) : (
          roasters.map(roaster => {
            const roasterCoffees = coffees.filter(c => c.roaster_id === roaster.id)
            const isExpanded = expandedId === roaster.id
            return (
              <div key={roaster.id} className="bg-[--bg-surface] border border-[--border] rounded-2xl overflow-hidden">
                <div className="p-4 flex gap-3">
                  {/* Avatar — top-aligned, spans full height of content */}
                  <div className="w-10 h-10 rounded-xl bg-[--accent-dim] border border-[--border] flex items-center justify-center shrink-0">
                    <span className="text-[--accent] text-sm font-bold">{roaster.name[0]}</span>
                  </div>

                  {/* Right column: name/meta + stats/actions */}
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    {/* Name + meta */}
                    <div>
                      <h3 className="font-semibold text-sm text-[--text-primary] leading-snug">{roaster.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {roaster.country && (
                          <span className="text-xs text-[--text-muted]">{roaster.country}</span>
                        )}
                        {roaster.country && roaster.website && (
                          <span className="text-[--border-light] text-xs">·</span>
                        )}
                        {roaster.website && (
                          <a
                            href={roaster.website.startsWith('http') ? roaster.website : `https://${roaster.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[--accent] hover:underline flex items-center gap-1"
                            onClick={e => e.stopPropagation()}
                          >
                            <Globe size={10} />
                            {roaster.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Stats + actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[--bg-elevated] border border-[--border] text-xs">
                          <span className="font-semibold text-[--text-primary]">{roaster.default_rest_days}d</span>
                          <span className="text-[--text-muted]">rest</span>
                        </span>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[--bg-elevated] border border-[--border] text-xs">
                          <span className="font-semibold text-[--text-primary]">{roaster.default_peak_end_days}d</span>
                          <span className="text-[--text-muted]">peak end</span>
                        </span>
                        {roasterCoffees.length > 0 && (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[--bg-elevated] border border-[--border] text-xs">
                            <CoffeeIcon size={10} className="text-[--text-muted]" />
                            <span className="font-semibold text-[--text-primary]">{roasterCoffees.length}</span>
                            <span className="text-[--text-muted]">{roasterCoffees.length === 1 ? 'coffee' : 'coffees'}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setEditingRoaster(roaster)}
                          className="p-2 rounded-lg text-[--text-muted] hover:text-[--text-primary] hover:bg-[--bg-hover] transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(roaster)}
                          className="p-2 rounded-lg text-[--text-muted] hover:text-red-400 hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {roaster.notes && (
                      <p className="text-xs text-[--text-muted] italic leading-relaxed">{roaster.notes}</p>
                    )}
                  </div>
                </div>

                {/* Expandable coffee list */}
                {roasterCoffees.length > 0 && (
                  <>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : roaster.id)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-[--border] text-xs text-[--text-muted] hover:bg-[--bg-hover] transition-colors"
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      View coffees from this roaster
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[--border] divide-y divide-[--border]">
                        {roasterCoffees.map(c => {
                          const enriched = enrichCoffee(c, settings)
                          return (
                            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                              <div className="w-2 h-7 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[--text-primary] truncate">{c.name}</p>
                                <p className="text-[10px] text-[--text-muted]">
                                  {c.remaining_grams}g · {enriched.brews_remaining} brews left
                                </p>
                              </div>
                              <span className={`text-[10px] font-medium shrink-0 ${getStatusColor(enriched.computed_status)}`}>
                                {getStatusLabel(enriched.computed_status)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="px-5 pb-4">
        <Button className="w-full" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          Add Roaster
        </Button>
      </div>

      <AddRoasterModal open={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={refresh} />
      {editingRoaster && (
        <AddRoasterModal
          open={!!editingRoaster}
          onClose={() => setEditingRoaster(null)}
          onSuccess={() => { refresh(); setEditingRoaster(null) }}
          editRoaster={editingRoaster}
        />
      )}
    </div>
  )
}
