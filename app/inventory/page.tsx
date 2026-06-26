import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { InventoryClient } from './InventoryClient'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: coffees }, { data: settings }, { data: brewCounts }, { data: roasters }] = await Promise.all([
    supabase.from('coffees').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
    supabase.from('brews').select('coffee_id').eq('user_id', user.id),
    supabase.from('roasters').select('*').eq('user_id', user.id).order('name'),
  ])

  const brewCountMap: Record<string, number> = {}
  brewCounts?.forEach(b => {
    brewCountMap[b.coffee_id] = (brewCountMap[b.coffee_id] ?? 0) + 1
  })

  const defaultSettings = {
    user_id: user.id,
    brews_per_day: 2,
    brew_size_grams: 20,
    low_stock_threshold_brews: 3,
    notify_low_stock: true,
    notify_ready_to_drink: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return (
    <AppShell>
      <InventoryClient
        coffees={coffees ?? []}
        settings={settings ?? defaultSettings}
        brewCountMap={brewCountMap}
        roasters={roasters ?? []}
      />
    </AppShell>
  )
}
