import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { MyTimerCard } from '@/components/dashboard/my-timer-card'
import { getCurrentUser } from '@/lib/auth'
import { connectDB, TimeLog } from '@chronos/db'
import { Activity, Clock, FolderKanban } from 'lucide-react'
import { redirect } from 'next/navigation'

interface LeanTimeLog {
  _id: { toString(): string }
  startTime: number
  endTime?: number
  activityScore?: number
  projectId?: { name?: string; colorHex?: string } | null
}

export default async function MyTimePage () {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  await connectDB()

  // Server Component rendered once per request `Date.now()` here is a
  // deliberate "as of now" snapshot, not a purity violation in practice.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const timelogs = (await TimeLog.find({
    userId: user._id,
    startTime: { $gte: today.getTime() }
  })
    .populate('projectId', 'name colorHex')
    .sort({ startTime: -1 })
    .lean()) as unknown as LeanTimeLog[]

  const totalMs = timelogs.reduce(
    (sum: number, log) => sum + ((log.endTime || now) - log.startTime),
    0
  )
  const totalHours = (totalMs / 3600000).toFixed(1)
  const avgActivity =
    timelogs.length > 0
      ? timelogs.reduce(
          (sum: number, log) => sum + (log.activityScore || 0),
          0
        ) / timelogs.length
      : 0

  const stats = [
    { icon: Clock, value: `${totalHours}h`, label: 'Hours today' },
    {
      icon: Activity,
      value: `${Math.round(avgActivity * 100)}%`,
      label: 'Avg activity'
    },
    { icon: FolderKanban, value: String(timelogs.length), label: 'Sessions' }
  ]

  return (
    <div className='space-y-6'>
      <PageHeader
        title='My time'
        description='Your tracking activity for today'
      />

      <MyTimerCard />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        {stats.map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label} padding='md'>
              <div className='flex items-start justify-between'>
                <div>
                  <p className='font-mono text-2xl font-medium text-text-primary'>
                    {s.value}
                  </p>
                  <p className='mt-1 text-sm text-text-secondary'>{s.label}</p>
                </div>
                <div className='flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface-elevated'>
                  <Icon className='h-3.5 w-3.5 text-text-tertiary' />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <h2 className='mb-4 text-sm font-medium text-text-primary'>
          Today&apos;s sessions
        </h2>
        {timelogs.length === 0 ? (
          <p className='py-10 text-center text-sm text-text-secondary'>
            No sessions tracked today. Start the timer above, or open the
            desktop agent to track automatically.
          </p>
        ) : (
          <div className='space-y-2'>
            {timelogs.map(log => {
              const duration = ((log.endTime || now) - log.startTime) / 3600000
              const startTime = new Date(log.startTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })
              const endTime = log.endTime
                ? new Date(log.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'In progress'

              const actScore = Math.round((log.activityScore || 0) * 100)

              return (
                <div
                  key={log._id.toString()}
                  className='flex items-center justify-between rounded-md border border-border bg-surface-elevated/50 p-3'
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className='h-2.5 w-2.5 rounded-full'
                      style={{
                        backgroundColor: log.projectId?.colorHex || '#52525b'
                      }}
                    />
                    <div>
                      <p className='text-sm font-medium text-text-primary'>
                        {log.projectId?.name || 'Unknown project'}
                      </p>
                      <p className='text-xs text-text-tertiary'>
                        {startTime} – {endTime}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-4'>
                    <span className='font-mono text-xs text-text-tertiary'>
                      {actScore}%
                    </span>
                    <span className='w-14 text-right font-mono text-sm text-text-primary'>
                      {duration.toFixed(1)}h
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
