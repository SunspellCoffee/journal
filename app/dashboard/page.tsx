import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: coffees }, { data: settings }, { data: brews }] = await Promise.all([
    supabase.from('coffees').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
    supabase.from('brews').select('*, coffee:coffees(name,color)').eq('user_id', user.id).order('brew_date', { ascending: false }).limit(10),
  ])

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
      <DashboardClient
        coffees={coffees ?? []}
        settings={settings ?? defaultSettings}
        recentBrews={brews ?? []}
        userId={user.id}
      />
    </AppShell>
  )
}
