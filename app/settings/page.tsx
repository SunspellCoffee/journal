import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single()

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
      <SettingsClient settings={settings ?? defaultSettings} email={user.email ?? ''} />
    </AppShell>
  )
}
