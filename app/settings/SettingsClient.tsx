'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Coffee, Scale, AlertTriangle, LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import type { UserSettings } from '@/types'

interface SettingsClientProps {
  settings: UserSettings
  email: string
}

export function SettingsClient({ settings, email }: SettingsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [brewsPerDay, setBrewsPerDay] = useState(String(settings.brews_per_day))
  const [brewSize, setBrewSize] = useState(String(settings.brew_size_grams))
  const [threshold, setThreshold] = useState(String(settings.low_stock_threshold_brews))
  const [notifyLow, setNotifyLow] = useState(settings.notify_low_stock)
  const [notifyReady, setNotifyReady] = useState(settings.notify_ready_to_drink)
  const [loading, setLoading] = useState(false)
  const [notifSupported, setNotifSupported] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setNotifSupported(true)
      setNotifPermission(Notification.permission)
    }
  }, [])

  async function requestNotifications() {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setNotifPermission(perm)
    if (perm === 'granted') {
      toast('Notifications enabled!', 'success')
      new Notification('Journal', { body: "You'll be notified when coffee is running low." })
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const payload = {
      user_id: settings.user_id,
      brews_per_day: parseInt(brewsPerDay) || 2,
      brew_size_grams: parseInt(brewSize) || 20,
      low_stock_threshold_brews: parseInt(threshold) || 3,
      notify_low_stock: notifyLow,
      notify_ready_to_drink: notifyReady,
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' })

    setLoading(false)
    if (error) { toast(error.message, 'error'); return }
    toast('Settings saved!', 'success')
    router.refresh()
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Preview calculations
  const totalGrams = parseInt(brewSize) || 20
  const perDay = parseInt(brewsPerDay) || 2
  const gramsPerDay = totalGrams * perDay
  const bag250 = Math.floor(250 / totalGrams)
  const bag500 = Math.floor(500 / totalGrams)

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-4 border-b border-[--border]">
        <h1 className="text-xl font-bold text-[--text-primary]">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-md">
          {/* Account */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <User size={15} className="text-[--text-muted]" />
              <h2 className="text-sm font-semibold text-[--text-secondary] uppercase tracking-wide">Account</h2>
            </div>
            <div className="bg-[--bg-surface] border border-[--border] rounded-2xl p-4">
              <p className="text-xs text-[--text-muted]">Signed in as</p>
              <p className="text-sm text-[--text-primary] font-medium mt-0.5">{email}</p>
            </div>
          </section>

          {/* Brew settings */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Coffee size={15} className="text-[--text-muted]" />
              <h2 className="text-sm font-semibold text-[--text-secondary] uppercase tracking-wide">Brew Preferences</h2>
            </div>
            <div className="bg-[--bg-surface] border border-[--border] rounded-2xl p-4 flex flex-col gap-4">
              <Input
                label="Brews per day"
                type="number"
                min={1}
                max={10}
                value={brewsPerDay}
                onChange={e => setBrewsPerDay(e.target.value)}
                hint="How many different coffees you brew each day"
              />
              <Input
                label="Brew size (grams)"
                type="number"
                min={5}
                max={100}
                value={brewSize}
                onChange={e => setBrewSize(e.target.value)}
                hint={`${gramsPerDay}g used per day`}
              />

              {/* Preview */}
              <div className="bg-[--bg-elevated] rounded-xl p-3 flex flex-col gap-1.5">
                <p className="text-xs font-medium text-[--text-muted] uppercase tracking-wide">Brew count preview</p>
                <div className="flex justify-between text-xs">
                  <span className="text-[--text-muted]">250g bag</span>
                  <span className="text-[--text-secondary]">{bag250} brews</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[--text-muted]">500g bag</span>
                  <span className="text-[--text-secondary]">{bag500} brews</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[--text-muted]">Daily usage</span>
                  <span className="text-[--text-secondary]">{gramsPerDay}g ({perDay} brews × {totalGrams}g)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Bell size={15} className="text-[--text-muted]" />
              <h2 className="text-sm font-semibold text-[--text-secondary] uppercase tracking-wide">Notifications</h2>
            </div>
            <div className="bg-[--bg-surface] border border-[--border] rounded-2xl p-4 flex flex-col gap-4">
              <Input
                label="Low stock alert threshold (brews)"
                type="number"
                min={1}
                max={20}
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                hint={`Alert when fewer than ${threshold} brews remain in a bag`}
              />

              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-sm text-[--text-primary]">Low stock alerts</p>
                    <p className="text-xs text-[--text-muted]">Notify when a bag is nearly empty</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifyLow}
                    onClick={() => setNotifyLow(v => !v)}
                    className={`w-11 h-6 rounded-full transition-colors shrink-0 ${notifyLow ? 'bg-[--accent]' : 'bg-[--bg-elevated]'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${notifyLow ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </label>
                <div className="h-px bg-[--border]" />
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-sm text-[--text-primary]">Ready to drink alerts</p>
                    <p className="text-xs text-[--text-muted]">Notify when a bag finishes resting</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifyReady}
                    onClick={() => setNotifyReady(v => !v)}
                    className={`w-11 h-6 rounded-full transition-colors shrink-0 ${notifyReady ? 'bg-[--accent]' : 'bg-[--bg-elevated]'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${notifyReady ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </label>
              </div>

              {notifSupported && notifPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={requestNotifications}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-[--border] text-[--text-secondary] hover:bg-[--bg-hover] transition-colors"
                >
                  <Bell size={14} />
                  {notifPermission === 'denied' ? 'Notifications blocked (check browser settings)' : 'Enable browser notifications'}
                </button>
              )}
              {notifSupported && notifPermission === 'granted' && (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-pulse" />
                  Browser notifications enabled
                </p>
              )}
            </div>
          </section>

          <Button type="submit" size="lg" loading={loading} className="w-full">
            Save Settings
          </Button>

          {/* Sign out */}
          <div className="pt-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full text-[--text-muted] hover:text-[--danger]"
              onClick={handleSignOut}
            >
              <LogOut size={15} />
              Sign out
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
