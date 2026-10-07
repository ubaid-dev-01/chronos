import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { getCurrentUser } from '@/lib/auth'
import { Invite, User, connectDB } from '@chronos/db'
import { Users } from 'lucide-react'
import { redirect } from 'next/navigation'
import { EditMemberButton, MemberActions } from './member-actions'
import { RevokeInviteButton } from './invite-actions'

interface LeanMember {
  _id: { toString(): string }
  displayName: string
  email: string
  role: string
  isActive: boolean
  lastActiveAt?: Date | null
  permissions?: Record<string, boolean>
}

interface LeanInvite {
  _id: { toString(): string }
  email: string
  role: string
  expiresAt?: Date | null
}

export default async function MembersPage () {
  // Server Component rendered once per request `Date.now()` here is a
  // deliberate "as of now" snapshot, not a purity violation in practice.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/sign-in')
  if (currentUser.role !== 'admin' && currentUser.role !== 'manager')
    redirect('/dashboard')

  await connectDB()

  const members = (await User.find({ orgId: currentUser.orgId })
    .sort({ role: 1, displayName: 1 })
    .lean()) as unknown as LeanMember[]

  const pendingInvites = (await Invite.find({
    orgId: currentUser.orgId,
    acceptedAt: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  })
    .sort({ createdAt: -1 })
    .lean()) as unknown as LeanInvite[]

  const serializedMembers = members.map(m => ({
    _id: String(m._id),
    displayName: m.displayName,
    email: m.email,
    role: m.role,
    isActive: m.isActive,
    lastActiveAt: m.lastActiveAt?.toISOString() || null,
    permissions: (m.permissions as Record<string, boolean> | undefined) ?? {}
  }))

  const serializedInvites = pendingInvites.map(inv => ({
    _id: String(inv._id),
    email: inv.email,
    role: inv.role,
    expiresAt: inv.expiresAt?.toISOString() || ''
  }))

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Members'
        description={`${members.length} member${
          members.length !== 1 ? 's' : ''
        }${
          pendingInvites.length > 0 ? ` · ${pendingInvites.length} pending` : ''
        }`}
      >
        <MemberActions userRole={currentUser.role} />
      </PageHeader>

      <Card padding='none' className='overflow-hidden'>
        <div className='border-b border-border px-5 py-3'>
          <p className='text-xs font-medium text-text-tertiary'>Team members</p>
        </div>
        {serializedMembers.length === 0 ? (
          <div className='flex flex-col items-center px-6 py-12 text-center'>
            <Users className='mb-4 h-10 w-10 text-text-tertiary' />
            <h3 className='text-sm font-medium text-text-primary'>
              Just you for now
            </h3>
            <p className='mt-1 max-w-sm text-sm text-text-secondary'>
              Invite team members to collaborate and track time together.
            </p>
          </div>
        ) : (
          <div className='divide-y divide-border'>
            {serializedMembers.map(member => {
              const initials = (member.displayName || '?')
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
              const isOnline =
                member.lastActiveAt &&
                new Date(member.lastActiveAt).getTime() > now - 15 * 60 * 1000

              return (
                <div
                  key={member._id}
                  className='flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between'
                >
                  <div className='flex items-center gap-3'>
                    <div className='relative'>
                      <div className='flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated text-xs font-medium text-text-secondary'>
                        {initials}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-surface ${
                          isOnline ? 'bg-success' : 'bg-text-tertiary'
                        }`}
                      />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-text-primary'>
                        {member.displayName}
                        {!member.isActive && (
                          <span className='ml-2 text-xs text-danger'>
                            Deactivated
                          </span>
                        )}
                      </p>
                      <p className='text-xs text-text-tertiary'>
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='w-fit rounded border border-border px-2 py-0.5 text-[11px] capitalize text-text-tertiary'>
                      {member.role}
                    </span>
                    <EditMemberButton
                      userRole={currentUser.role}
                      member={member}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {serializedInvites.length > 0 && (
        <Card padding='none' className='overflow-hidden'>
          <div className='border-b border-border px-5 py-3'>
            <p className='text-xs font-medium text-text-tertiary'>
              Pending invitations
            </p>
          </div>
          <div className='divide-y divide-border'>
            {serializedInvites.map(inv => (
              <div
                key={inv._id}
                className='flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between'
              >
                <div>
                  <p className='text-sm text-text-primary'>{inv.email}</p>
                  <p className='text-xs text-text-tertiary'>
                    Expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='w-fit rounded border border-warning/30 px-2 py-0.5 text-[11px] capitalize text-warning'>
                    {inv.role} · pending
                  </span>
                  {(currentUser.role === 'admin' || inv.role !== 'admin') && (
                    <RevokeInviteButton inviteId={inv._id} email={inv.email} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
