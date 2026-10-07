'use client'

import { ElevatedButton } from '@/components/ui/elevated'
import { Loader2, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SuperAdminLoginForm () {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit (e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Login failed')
        return
      }

      router.push('/admin')
      router.refresh()
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='w-full max-w-md rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-8 shadow-[0_6px_0_0_var(--elevated-ink)]'>
      <div className='mb-6 flex items-center gap-3'>
        <div className='flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[var(--elevated-ink)] bg-brand/10 text-brand'>
          <Shield className='h-5 w-5' />
        </div>
        <div>
          <h1 className='text-lg font-bold text-text-primary'>
            Platform Superadmin
          </h1>
          <p className='text-sm text-text-tertiary'>Chronos control panel</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label
            htmlFor='email'
            className='mb-1.5 block text-sm font-medium text-text-secondary'
          >
            Email
          </label>
          <input
            id='email'
            type='email'
            autoComplete='username'
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className='w-full rounded-xl border-2 border-[var(--elevated-ink)] bg-surface-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-brand'
          />
        </div>
        <div>
          <label
            htmlFor='password'
            className='mb-1.5 block text-sm font-medium text-text-secondary'
          >
            Password
          </label>
          <input
            id='password'
            type='password'
            autoComplete='current-password'
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className='w-full rounded-xl border-2 border-[var(--elevated-ink)] bg-surface-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-brand'
          />
        </div>

        {error && (
          <p className='rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger'>
            {error}
          </p>
        )}

        <ElevatedButton
          type='submit'
          tone='primary'
          size='lg'
          className='w-full'
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin' />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </ElevatedButton>
      </form>
    </div>
  )
}
