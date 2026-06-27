import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, subDays } from 'date-fns'
import { AppShell } from '@/components/layout/AppShell'
import { CalendarClient } from './CalendarClient'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const threeDaysAgo = format(subDays(new Date(), 3), 'yyyy-MM-dd')

  const [{ data: coffees }, { data: settings }, { data: schedule }, { data: recentBrews }] = await Promise.all([
    supabase.from('coffees').select('*').eq('user_id', user.id).in('status', ['active', 'on_order']),
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
    supabase.from('brew_schedule').select('*').eq('user_id', user.id).order('scheduled_date').order('brew_index'),
    supabase.from('brews').select('coffee_id, brew_date').eq('user_id', user.id).gte('brew_date', threeDaysAgo),
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
      <CalendarClient
        coffees={coffees ?? []}
        settings={settings ?? defaultSettings}
        savedSchedule={schedule ?? []}
        recentBrews={recentBrews ?? []}
        userId={user.id}
      />
    </AppShell>
  )
}
