import { useState, type FormEvent } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { Button, Input } from '../components/ui/primitives'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas p-6 text-white">
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--color-accent-500), transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-700 font-display text-lg font-bold shadow-glow">
            C
          </div>
          <div className="font-display text-lg font-semibold tracking-tight">Creator OS</div>
          <div className="text-sm text-white/40">Sign in to your newsroom</div>
        </div>

        {!supabaseConfigured ? (
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-300">
            Supabase is not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env,
            then restart the dev server.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-border-subtle bg-surface p-5 shadow-card">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-white/40">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-white/40">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-2 text-xs text-red-300">
                {error}
              </div>
            )}

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-white/30">
          There is no public sign-up. Accounts are created in the Supabase dashboard under
          Authentication → Users.
        </p>
      </div>
    </div>
  )
}
