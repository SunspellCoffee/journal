'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { JournalLogo } from '@/components/ui/journal-logo'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-5 bg-[--bg]">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-900/40 border border-emerald-800 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">✉️</span>
          </div>
          <h2 className="text-xl font-bold text-[--text-primary] mb-2">Check your email</h2>
          <p className="text-sm text-[--text-secondary] mb-6">
            We sent a confirmation link to <strong className="text-[--text-primary]">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link href="/auth/login" className="text-[--accent] text-sm hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-5 bg-[--bg]">
      <div className="w-full max-w-sm">
        <div className="flex items-center mb-10">
          <JournalLogo className="h-7 w-auto text-[--text-primary]" />
        </div>

        <h2 className="text-2xl font-bold text-[--text-primary] mb-1">Create account</h2>
        <p className="text-sm text-[--text-secondary] mb-8">Start tracking your specialty coffee</p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
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
            placeholder="Min. 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          {error && (
            <p className="text-sm text-[--danger] bg-red-950/40 border border-red-900/50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
            Create account
          </Button>
        </form>

        <p className="text-sm text-[--text-secondary] text-center mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[--accent] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
