'use client'
import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { enrichCoffee } from '@/lib/utils'
import { CoffeeCard } from '@/components/coffee/CoffeeCard'
import { AddCoffeeModal } from '@/components/coffee/AddCoffeeModal'
import { CoffeeDetailModal } from '@/components/coffee/CoffeeDetailModal'
import { RoastersView } from '@/components/coffee/RoastersView'
import { Button } from '@/components/ui/button'
import type { Coffee, UserSettings, CoffeeWithStatus, Roaster } from '@/types'

type FilterTab = 'all' | 'active' | 'resting' | 'on_order' | 'finished'
type TopTab = 'coffees' | 'roasters'

interface InventoryClientProps {
  coffees: Coffee[]
  settings: UserSettings
  brewCountMap: Record<string, number>
  roasters: Roaster[]
}

export function InventoryClient({ coffees, settings, brewCountMap, roasters }: InventoryClientProps) {
  const router = useRouter()
  const [topTab, setTopTab] = useState<TopTab>('coffees')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addModalKey, setAddModalKey] = useState(0)
  const [selectedCoffee, setSelectedCoffee] = useState<CoffeeWithStatus | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')

  function openAddModal() {
    setAddModalKey(k => k + 1) // force remount so form state resets
    setShowAddModal(true)
  }

  const enriched = useMemo(() =>
    coffees.map(c => enrichCoffee(c, settings, brewCountMap[c.id] ?? 0)),
    [coffees, settings, brewCountMap]
  )

  const filtered = useMemo(() => {
    let result = enriched
    if (filter === 'active') result = result.filter(c => c.status === 'active' && c.computed_status !== 'resting')
    else if (filter === 'resting') result = result.filter(c => c.computed_status === 'resting')
    else if (filter === 'on_order') result = result.filter(c => c.status === 'on_order')
    else if (filter === 'finished') result = result.filter(c => c.status === 'finished')
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.supplier?.toLowerCase().includes(q) ||
        c.origin?.toLowerCase().includes(q) ||
        c.flavor_notes.some(n => n.toLowerCase().includes(q))
      )
    }
    return result
  }, [enriched, filter, search])

  const counts = useMemo(() => ({
    all: enriched.length,
    active: enriched.filter(c => c.status === 'active' && c.computed_status !== 'resting').length,
    resting: enriched.filter(c => c.computed_status === 'resting').length,
    on_order: enriched.filter(c => c.status === 'on_order').length,
    finished: enriched.filter(c => c.status === 'finished').length,
  }), [enriched])

  const refresh = useCallback(() => router.refresh(), [router])

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'active', label: `Ready (${counts.active})` },
    { key: 'resting', label: `Resting (${counts.resting})` },
    { key: 'on_order', label: `On Order (${counts.on_order})` },
    { key: 'finished', label: `Finished (${counts.finished})` },
  ]

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-6 pb-0 border-b border-[--border]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[--text-primary]">Inventory</h1>
          <Button
            size="icon"
            onClick={openAddModal}
            className={topTab !== 'coffees' ? 'invisible pointer-events-none' : ''}
          >
            <Plus size={18} />
          </Button>
        </div>

        {/* Top-level tabs: Coffees | Roasters */}
        <div className="flex">
          {(['coffees', 'roasters'] as TopTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setTopTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 ${
                topTab === tab
                  ? 'border-[--accent] text-[--accent]'
                  : 'border-transparent text-[--text-muted] hover:text-[--text-secondary]'
              }`}
            >
              {tab}
              {tab === 'roasters' && roasters.length > 0 && (
                <span className="ml-1.5 text-xs text-[--text-muted]">({roasters.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {topTab === 'coffees' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search */}
          <div className="px-5 pt-3 pb-1">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search coffees..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-[--bg-elevated] border border-[--border] text-[--text-primary] placeholder:text-[--text-muted] focus:border-[--accent] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 px-5 pt-2 pb-2 overflow-x-auto">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-[--accent] text-[--bg]'
                    : 'text-[--text-muted] hover:text-[--text-secondary] hover:bg-[--bg-elevated]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Coffee list */}
          <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[--text-muted]">
                <span className="text-4xl mb-4 opacity-30">☕</span>
                <p className="text-sm">
                  {search ? 'No coffees match your search' : 'No coffees here yet'}
                </p>
                {!search && (
                  <button onClick={openAddModal} className="text-[--accent] text-sm mt-2 hover:underline">
                    Add a coffee
                  </button>
                )}
              </div>
            ) : (
              filtered.map(coffee => (
                <CoffeeCard
                  key={coffee.id}
                  coffee={coffee}
                  onClick={() => setSelectedCoffee(coffee)}
                  brewSize={settings.brew_size_grams}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <RoastersView roasters={roasters} coffees={coffees} settings={settings} />
      )}

      <AddCoffeeModal
        key={addModalKey}
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refresh}
        roasters={roasters}
      />
      {selectedCoffee && (
        <CoffeeDetailModal
          open={!!selectedCoffee}
          onClose={() => setSelectedCoffee(null)}
          coffee={selectedCoffee}
          settings={settings}
          onSuccess={refresh}
        />
      )}
    </div>
  )
}
