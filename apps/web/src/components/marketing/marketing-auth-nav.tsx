'use client'

import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { ElevatedButtonLink } from '@/components/ui/elevated'
import { Button } from '@/components/ui/button'

export function MarketingAuthNav () {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return <div className='h-8 w-24' />
  }

  if (user) {
    return (
      <>
        <ElevatedButtonLink href='/dashboard' tone='secondary' size='sm'>
          Dashboard
        </ElevatedButtonLink>
        <Button variant='secondary' size='sm' onClick={() => logout()}>
          Sign out
        </Button>
      </>
    )
  }

  return (
    <>
      <Link
        href='/sign-in'
        className='hidden rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary sm:inline-flex'
      >
        Sign in
      </Link>
      <ElevatedButtonLink href='/sign-up' tone='primary' size='sm'>
        Get started
      </ElevatedButtonLink>
    </>
  )
}
