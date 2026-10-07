'use client'

import {
  AuthCard,
  AuthField,
  AuthHeader,
  authInputClassName
} from '@/components/auth/auth-card'
import { PasswordInput } from '@/components/auth/password-input'
import { ElevatedButton } from '@/components/ui/elevated'
import { useAuth } from '@/providers/auth-provider'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function SignUpPage () {
  const router = useRouter()
  const { refresh } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit (e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, displayName })
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Registration failed')
        return
      }
      toast.success('Account created')
      await refresh()
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <AuthHeader
        title='Create your account'
        description='Start tracking time with Chronos free for one person'
      />
      <form onSubmit={handleSubmit} className='space-y-4'>
        <AuthField label='Full name' htmlFor='displayName'>
          <input
            id='displayName'
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder='Jane Doe'
            required
            className={authInputClassName}
          />
        </AuthField>
        <AuthField label='Email' htmlFor='email'>
          <input
            id='email'
            type='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder='you@company.com'
            autoComplete='email'
            required
            className={authInputClassName}
          />
        </AuthField>
        <AuthField label='Password' htmlFor='password'>
          <PasswordInput
            id='password'
            value={password}
            onChange={setPassword}
            minLength={8}
            autoComplete='new-password'
            required
          />
          <p className='mt-1.5 text-xs text-text-tertiary'>
            Minimum 8 characters
          </p>
        </AuthField>
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
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </ElevatedButton>
      </form>
      <p className='mt-6 text-center text-sm text-text-secondary'>
        Already have an account?{' '}
        <Link
          href='/sign-in'
          className='font-semibold text-brand hover:underline'
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}
