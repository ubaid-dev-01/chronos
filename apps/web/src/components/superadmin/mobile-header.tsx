'use client'

import { Menu, Shield } from 'lucide-react'
import { useSidebar } from '@/components/layout/sidebar-context'

export function SuperAdminMobileHeader () {
  const { setMobileOpen } = useSidebar()

  return (
    <header className='flex h-14 shrink-0 items-center gap-2 border-b-2 border-[var(--elevated-ink)] bg-surface px-4 lg:hidden'>
      <button
        type='button'
        onClick={() => setMobileOpen(true)}
        className='flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary'
        aria-label='Open menu'
      >
        <Menu className='h-4 w-4' />
      </button>
      <Shield className='h-4 w-4 text-brand' />
      <span className='text-sm font-bold text-text-primary'>
        Chronos Superadmin
      </span>
    </header>
  )
}
