'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { JournalLogo } from '@/components/ui/journal-logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-5 bg-[--bg]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center mb-10">
          <JournalLogo className="h-7 w-auto text-[--text-primary]" />
        </div>

        <h2 className="text-2xl font-bold text-[--text-primary] mb-1">Welcome back</h2>
        <p className="text-sm text-[--text-secondary] mb-8">Sign in to your account to continue</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && (
            <p className="text-sm text-[--danger] bg-red-950/40 border border-red-900/50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
            Sign in
          </Button>
        </form>

        <p className="text-sm text-[--text-secondary] text-center mt-6">
          No account?{' '}
          <Link href="/auth/signup" className="text-[--accent] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
