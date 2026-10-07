'use client'

import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useApiClient } from '@/hooks/use-api-client'
import {
  PERMISSION_OPTIONS,
  defaultPermissionsForRole
} from '@/lib/member-permissions'
import { Loader2, Pencil, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface MemberActionsProps {
  userRole: string
}

function PermissionsChecklist ({
  userRole,
  permissions,
  onToggle
}: {
  userRole: string
  permissions: Record<string, boolean>
  onToggle: (key: string) => void
}) {
  const menus = PERMISSION_OPTIONS.filter(o => o.group === 'menus')
  const tracking = PERMISSION_OPTIONS.filter(o => o.group === 'tracking')
  const admin = PERMISSION_OPTIONS.filter(o => o.group === 'admin')

  function renderGroup (title: string, options: typeof PERMISSION_OPTIONS) {
    return (
      <div>
        <p className='mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-tertiary'>
          {title}
        </p>
        <div className='space-y-1 rounded-md border border-border bg-surface-elevated/40 p-2'>
          {options.map(option => {
            const disabled = option.adminOnly && userRole !== 'admin'
            return (
              <label
                key={option.key}
                className={`flex items-start gap-2.5 rounded-md px-1.5 py-1 ${
                  disabled
                    ? 'opacity-40'
                    : 'cursor-pointer hover:bg-surface-elevated'
                }`}
              >
                <input
                  type='checkbox'
                  className='mt-0.5 h-3.5 w-3.5 shrink-0 accent-current'
                  checked={!!permissions[option.key]}
                  disabled={disabled}
                  onChange={() => onToggle(option.key)}
                />
                <span>
                  <span className='block text-xs font-medium text-text-primary'>
                    {option.label}
                    {option.adminOnly && (
                      <span className='ml-1.5 text-[10px] font-normal uppercase text-text-tertiary'>
                        Admin only
                      </span>
                    )}
                  </span>
                  <span className='block text-[11px] text-text-tertiary'>
                    {option.description}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      {renderGroup('Menus & pages', menus)}
      {renderGroup('Tracking', tracking)}
      {renderGroup('Admin capabilities', admin)}
    </div>
  )
}

export function MemberActions ({ userRole }: MemberActionsProps) {
  const router = useRouter()
  const { apiFetch } = useApiClient()
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    defaultPermissionsForRole('member')
  )
  const [loading, setLoading] = useState(false)

  if (userRole !== 'admin' && userRole !== 'manager') return null

  function handleRoleChange (nextRole: string) {
    setRole(nextRole)
    setPermissions(defaultPermissionsForRole(nextRole))
  }

  function togglePermission (key: string) {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleInvite () {
    if (!email.trim()) return
    setLoading(true)
    try {
      const json = await apiFetch<{
        data?: {
          token?: string
          inviteUrl?: string
          emailSent?: boolean
        }
      }>('/users/invite', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), role, permissions })
      })
      if (json.data?.emailSent) {
        toast.success(`Invitation email sent to ${email}`)
      } else {
        toast.success(`Invitation created for ${email}`)
        const link =
          json.data?.inviteUrl ??
          (json.data?.token
            ? `${window.location.origin}/invite/${json.data.token}`
            : '')
        if (link) {
          navigator.clipboard.writeText(link).catch(() => {})
          toast.info('SMTP not configured invite link copied to clipboard')
        }
      }
      setShowModal(false)
      setEmail('')
      setRole('member')
      setPermissions(defaultPermissionsForRole('member'))
      router.refresh()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send invitation'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size='sm' onClick={() => setShowModal(true)}>
        <Plus className='h-3.5 w-3.5' />
        Invite member
      </Button>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title='Invite member'
      >
        <div className='max-h-[70vh] space-y-4 overflow-y-auto pr-1'>
          <div>
            <label className='mb-1.5 block text-xs text-text-tertiary'>
              Email
            </label>
            <Input
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='colleague@company.com'
              autoFocus
            />
          </div>

          <div>
            <label className='mb-1.5 block text-xs text-text-tertiary'>
              Role
            </label>
            <Select value={role} onChange={e => handleRoleChange(e.target.value)}>
              <option value='member'>Member</option>
              <option value='manager'>Manager</option>
              {userRole === 'admin' && <option value='admin'>Admin</option>}
            </Select>
          </div>

          <PermissionsChecklist
            userRole={userRole}
            permissions={permissions}
            onToggle={togglePermission}
          />

          <div className='flex gap-2 pt-2'>
            <Button
              variant='secondary'
              className='flex-1'
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              className='flex-1'
              onClick={handleInvite}
              disabled={!email.trim() || loading}
            >
              {loading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Send invite'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

interface EditMemberButtonProps {
  userRole: string
  member: {
    _id: string
    displayName: string
    email: string
    role: string
    permissions?: Record<string, boolean>
  }
}

export function EditMemberButton ({
  userRole,
  member
}: EditMemberButtonProps) {
  const router = useRouter()
  const { apiFetch } = useApiClient()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState(member.role)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    ...defaultPermissionsForRole(member.role),
    ...(member.permissions ?? {})
  })
  const [loading, setLoading] = useState(false)

  if (userRole !== 'admin' && userRole !== 'manager') return null
  if (member.role === 'admin' && userRole !== 'admin') return null

  function openModal () {
    setRole(member.role)
    setPermissions({
      ...defaultPermissionsForRole(member.role),
      ...(member.permissions ?? {})
    })
    setOpen(true)
  }

  function handleRoleChange (nextRole: string) {
    setRole(nextRole)
    setPermissions(prev => ({
      ...defaultPermissionsForRole(nextRole),
      // keep menu flags the admin already toggled unless role defaults override admin caps
      ...Object.fromEntries(
        Object.entries(prev).filter(([k]) =>
          !['canManageTeam', 'canLockTimetable', 'canDeleteScreenshots'].includes(k)
        )
      ),
      canManageTeam: nextRole === 'admin' || nextRole === 'manager',
      canLockTimetable: nextRole === 'admin',
      canDeleteScreenshots: nextRole !== 'member' ? true : prev.canDeleteScreenshots
    }))
  }

  async function handleSave () {
    setLoading(true)
    try {
      await apiFetch(`/users/${member._id}`, {
        method: 'PUT',
        body: JSON.stringify({ role, permissions })
      })
      toast.success(`Updated ${member.displayName}`)
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size='sm' variant='secondary' onClick={openModal}>
        <Pencil className='h-3.5 w-3.5' />
        Edit
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Edit ${member.displayName}`}
      >
        <div className='max-h-[70vh] space-y-4 overflow-y-auto pr-1'>
          <p className='text-xs text-text-tertiary'>{member.email}</p>

          <div>
            <label className='mb-1.5 block text-xs text-text-tertiary'>
              Role
            </label>
            <Select value={role} onChange={e => handleRoleChange(e.target.value)}>
              <option value='member'>Member</option>
              <option value='manager'>Manager</option>
              {userRole === 'admin' && <option value='admin'>Admin</option>}
            </Select>
          </div>

          <PermissionsChecklist
            userRole={userRole}
            permissions={permissions}
            onToggle={key =>
              setPermissions(prev => ({ ...prev, [key]: !prev[key] }))
            }
          />

          <div className='flex gap-2 pt-2'>
            <Button
              variant='secondary'
              className='flex-1'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button className='flex-1' onClick={handleSave} disabled={loading}>
              {loading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
