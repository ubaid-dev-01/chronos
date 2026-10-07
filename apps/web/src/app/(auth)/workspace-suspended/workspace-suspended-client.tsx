'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/auth-provider'
import { Building2 } from 'lucide-react'

interface WorkspaceSuspendedClientProps {
  orgName: string
  email: string
}

export function WorkspaceSuspendedClient ({
  orgName,
  email
}: WorkspaceSuspendedClientProps) {
  const { logout } = useAuth()

  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <div className='w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-xs'>
        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-elevated'>
          <Building2 className='h-6 w-6 text-text-tertiary' />
        </div>
        <h1 className='text-lg font-medium text-text-primary'>
          Workspace suspended
        </h1>
        <p className='mt-2 text-sm text-text-secondary'>
          <span className='font-medium'>{orgName}</span> has been suspended.
          Signed in as {email} dashboard access is disabled until an
          administrator reactivates the organization.
        </p>
        <p className='mt-4 text-xs text-text-tertiary'>
          Contact Chronos support or your platform administrator.
        </p>
        <div className='mt-6'>
          <Button
            variant='secondary'
            className='w-full'
            onClick={() => logout()}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
