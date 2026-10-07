import { Card } from '@/components/ui/card'
import { Project, TimeLog, User, connectDB, mongoose } from '@chronos/db'
import { Clock, FolderKanban, Users } from 'lucide-react'

interface Props {
  orgId: string
}

export async function StatCards ({ orgId }: Props) {
  await connectDB()

  // Server Component rendered once per request `Date.now()` here is a
  // deliberate "as of now" snapshot, not a purity violation in practice.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()

  const [activeUsers, todayAgg, activeProjects, totalUsers] = await Promise.all(
    [
      User.countDocuments({
        orgId,
        isActive: true,
        lastActiveAt: { $gte: new Date(now - 15 * 60 * 1000) }
      }),
      // NB: scoped to this org an earlier version of this aggregation matched
      // TimeLog documents across every organization.
      TimeLog.aggregate([
        {
          $match: {
            orgId: new mongoose.Types.ObjectId(orgId),
            startTime: { $gte: todayMs }
          }
        },
        {
          $group: {
            _id: null,
            totalMs: {
              $sum: {
                $subtract: [{ $ifNull: ['$endTime', now] }, '$startTime']
              }
            }
          }
        }
      ]),
      Project.countDocuments({ orgId, isActive: true }),
      User.countDocuments({ orgId, isActive: true })
    ]
  )

  const todayHours = ((todayAgg[0]?.totalMs || 0) / 3600000).toFixed(1)

  const stats = [
    {
      label: 'Team online',
      value: String(activeUsers),
      sub: `of ${totalUsers} members`,
      icon: Users
    },
    {
      label: 'Hours today',
      value: todayHours,
      sub: 'tracked',
      icon: Clock
    },
    {
      label: 'Active projects',
      value: String(activeProjects),
      sub: 'in progress',
      icon: FolderKanban
    }
  ]

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
      {stats.map(s => {
        const Icon = s.icon
        return (
          <Card key={s.label} padding='md'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='font-mono text-2xl font-medium tracking-tight text-text-primary'>
                  {s.value}
                </p>
                <p className='mt-1 text-sm text-text-secondary'>{s.label}</p>
                <p className='text-xs text-text-tertiary'>{s.sub}</p>
              </div>
              <div className='flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface-elevated'>
                <Icon className='h-3.5 w-3.5 text-text-tertiary' />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
