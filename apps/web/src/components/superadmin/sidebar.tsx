'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  LogOut,
  Shield,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/layout/sidebar-context'

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/organizations', label: 'Organizations', icon: Building2 },
  { href: '/admin/users', label: 'Users', icon: Users }
]

interface SuperAdminSidebarProps {
  displayName: string
  email: string
}

export function SuperAdminSidebar ({
  displayName,
  email
}: SuperAdminSidebarProps) {
  const pathname = usePathname()
  const { mobileOpen, setMobileOpen } = useSidebar()

  async function handleLogout () {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  return (
    <>
      {mobileOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/50 lg:hidden'
          aria-hidden='true'
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r-2 border-[var(--elevated-ink)] bg-surface transition-transform duration-200 ease-in-out',
          'lg:static lg:z-auto lg:w-64 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
      <div className='flex h-16 items-center gap-2 border-b-2 border-[var(--elevated-ink)] px-5'>
        <div className='flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[var(--elevated-ink)] bg-brand/10 text-brand'>
          <Shield className='h-4 w-4' />
        </div>
        <div>
          <p className='text-sm font-bold text-text-primary'>Chronos</p>
          <p className='text-[10px] font-semibold uppercase tracking-wider text-brand'>
            Superadmin
          </p>
        </div>
        <button
          type='button'
          onClick={() => setMobileOpen(false)}
          className='ml-auto flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary lg:hidden'
          aria-label='Close menu'
        >
          <X className='h-4 w-4' />
        </button>
      </div>

      <nav className='flex-1 space-y-1 p-3'>
        {NAV.map(item => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-[var(--elevated-ink)] bg-brand/10 text-brand shadow-[0_2px_0_0_var(--elevated-ink)]'
                  : 'border-transparent text-text-secondary hover:border-border hover:bg-surface-elevated hover:text-text-primary'
              )}
            >
              <Icon className='h-4 w-4' />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className='border-t-2 border-[var(--elevated-ink)] p-4'>
        <p className='truncate text-sm font-semibold text-text-primary'>
          {displayName}
        </p>
        <p className='truncate text-xs text-text-tertiary'>{email}</p>
        <button
          type='button'
          onClick={handleLogout}
          className='mt-3 flex w-full items-center gap-2 rounded-lg border-2 border-[var(--elevated-ink)] px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary'
        >
          <LogOut className='h-4 w-4' />
          Sign out
        </button>
      </div>
      </aside>
    </>
  )
}
