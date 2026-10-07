import { ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { getCurrentUser } from '@/lib/auth'
import { TimeLog, User, connectDB } from '@chronos/db'
import { Users } from 'lucide-react'
import { redirect } from 'next/navigation'

interface LeanTeamUser {
  _id: { toString(): string }
  displayName: string
  email: string
  role: string
  lastActiveAt?: Date | null
}

interface UserStat {
  _id: { toString(): string }
  totalMs: number
  avgActivity: number
}

export default async function TeamPage () {
  // Server Component rendered once per request `Date.now()` here is a
  // deliberate "as of now" snapshot, not a purity violation in practice.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/sign-in')
  await connectDB()

  const users = (await User.find({ orgId: currentUser.orgId, isActive: true })
    .sort({ displayName: 1 })
    .lean()) as unknown as LeanTeamUser[]

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const userStats = (await TimeLog.aggregate([
    {
      $match: {
        userId: { $in: users.map(u => u._id) },
        startTime: { $gte: today.getTime() }
      }
    },
    {
      $group: {
        _id: '$userId',
        totalMs: {
          $sum: {
            $subtract: [{ $ifNull: ['$endTime', now] }, '$startTime']
          }
        },
        avgActivity: { $avg: '$activityScore' }
      }
    }
  ])) as UserStat[]

  const statsMap = new Map(userStats.map(s => [s._id.toString(), s]))

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Team'
        description={`${users.length} member${users.length !== 1 ? 's' : ''}`}
      >
        {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
          <ButtonLink href='/settings/members' size='sm'>
            Invite members
          </ButtonLink>
        )}
      </PageHeader>

      {users.length === 0 ? (
        <Card className='py-16 text-center'>
          <Users className='mx-auto mb-4 h-10 w-10 text-text-tertiary' />
          <h3 className='text-sm font-medium text-text-primary'>
            No team members yet
          </h3>
          <p className='mt-1 text-sm text-text-secondary'>
            Invite your team to start tracking together.
          </p>
        </Card>
      ) : (
        <div className='space-y-2'>
          {users.map(user => {
            const stats = statsMap.get(user._id.toString())
            const hours = stats ? (stats.totalMs / 3600000).toFixed(1) : '0.0'
            const activity = stats ? Math.round(stats.avgActivity * 100) : 0
            const isOnline =
              user.lastActiveAt &&
              new Date(user.lastActiveAt).getTime() > now - 15 * 60 * 1000

            return (
              <Card
                key={user._id.toString()}
                padding='sm'
                className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
              >
                <div className='flex items-center gap-3'>
                  <div className='relative'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated text-xs font-medium text-text-secondary'>
                      {(user.displayName || '?')
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface ${
                        isOnline ? 'bg-success' : 'bg-text-tertiary'
                      }`}
                    />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-text-primary'>
                      {user.displayName}
                    </p>
                    <p className='text-xs text-text-tertiary'>{user.email}</p>
                  </div>
                </div>

                <div className='flex items-center gap-4 pl-11 sm:gap-6 sm:pl-0'>
                  <div className='text-right'>
                    <p className='font-mono text-sm font-medium text-text-primary'>
                      {hours}h
                    </p>
                    <p className='text-[11px] text-text-tertiary'>Today</p>
                  </div>
                  <div className='text-right'>
                    <p className='font-mono text-sm font-medium text-text-primary'>
                      {activity}%
                    </p>
                    <p className='text-[11px] text-text-tertiary'>Activity</p>
                  </div>
                  <span className='rounded border border-border px-2 py-0.5 text-[11px] capitalize text-text-tertiary'>
                    {user.role}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
