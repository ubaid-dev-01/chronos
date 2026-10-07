'use client'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useApiClient } from '@/hooks/use-api-client'
import { Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface RevokeInviteButtonProps {
  inviteId: string
  email: string
}

export function RevokeInviteButton ({ inviteId, email }: RevokeInviteButtonProps) {
  const router = useRouter()
  const { apiFetch } = useApiClient()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRevoke () {
    setLoading(true)
    try {
      await apiFetch(`/users/invites/${inviteId}`, { method: 'DELETE' })
      toast.success(`Invitation to ${email} cancelled`)
      setShowConfirm(false)
      router.refresh()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to cancel invitation'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        size='sm'
        variant='ghost'
        className='h-6 gap-1 px-2 text-[11px] text-text-tertiary hover:text-danger'
        onClick={() => setShowConfirm(true)}
      >
        <X className='h-3 w-3' />
        Remove
      </Button>

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title='Cancel invitation'
      >
        <div className='space-y-4'>
          <p className='text-sm text-text-secondary'>
            Cancel the pending invitation to{' '}
            <span className='font-medium text-text-primary'>{email}</span>?
            They will no longer be able to join using this invite link.
          </p>
          <div className='flex gap-2 pt-2'>
            <Button
              variant='secondary'
              className='flex-1'
              onClick={() => setShowConfirm(false)}
              disabled={loading}
            >
              Keep invite
            </Button>
            <Button
              className='flex-1 bg-danger text-white hover:opacity-90'
              onClick={handleRevoke}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Cancel invite'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
