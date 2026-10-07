import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { getCurrentUser } from '@/lib/auth'
import { connectDB, Project, TimeLog } from '@chronos/db'
import { FolderKanban } from 'lucide-react'
import { redirect } from 'next/navigation'
import { ProjectActions } from './project-actions'

interface LeanProject {
  _id: { toString(): string }
  name: string
  description?: string
  colorHex?: string
  isActive: boolean
}

interface ProjectStat {
  _id: { toString(): string }
  totalMs: number
  sessions: number
}

export default async function ProjectsPage () {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  await connectDB()

  const projects = (await Project.find({ orgId: user.orgId })
    .sort({ isActive: -1, createdAt: -1 })
    .lean()) as unknown as LeanProject[]

  // Server Component rendered once per request `Date.now()` here is a
  // deliberate "as of now" snapshot, not a purity violation in practice.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const projectStats = (await TimeLog.aggregate([
    {
      $match: {
        projectId: { $in: projects.map(p => p._id) },
        startTime: { $gte: today.getTime() }
      }
    },
    {
      $group: {
        _id: '$projectId',
        totalMs: {
          $sum: {
            $subtract: [{ $ifNull: ['$endTime', now] }, '$startTime']
          }
        },
        sessions: { $sum: 1 }
      }
    }
  ])) as ProjectStat[]

  const statsMap = new Map(projectStats.map(s => [s._id.toString(), s]))

  const serializedProjects = projects.map(p => {
    const stats = statsMap.get(p._id.toString())
    return {
      _id: String(p._id),
      name: p.name,
      description: p.description || '',
      colorHex: p.colorHex || '#52525b',
      isActive: p.isActive,
      todayHours: stats ? Math.round((stats.totalMs / 3600000) * 10) / 10 : 0,
      todaySessions: stats?.sessions || 0
    }
  })

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Projects'
        description={`${projects.length} project${
          projects.length !== 1 ? 's' : ''
        }`}
      >
        <ProjectActions userRole={user.role} projects={serializedProjects} />
      </PageHeader>

      {projects.length === 0 ? (
        <Card className='py-16 text-center'>
          <FolderKanban className='mx-auto mb-4 h-10 w-10 text-text-tertiary' />
          <h3 className='text-sm font-medium text-text-primary'>
            No projects yet
          </h3>
          <p className='mx-auto mt-1 max-w-sm text-sm text-text-secondary'>
            Create your first project to organize time entries.
          </p>
        </Card>
      ) : (
        <div className='space-y-2'>
          {serializedProjects.map(project => (
            <Card
              key={project._id}
              padding='sm'
              className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
                !project.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className='flex items-center gap-3'>
                <div
                  className='h-3 w-3 shrink-0 rounded-full'
                  style={{ backgroundColor: project.colorHex }}
                />
                <div>
                  <h3 className='text-sm font-medium text-text-primary'>
                    {project.name}
                    {!project.isActive && (
                      <span className='ml-2 rounded border border-border px-1.5 py-0.5 text-[10px] text-text-tertiary'>
                        Archived
                      </span>
                    )}
                  </h3>
                  {project.description && (
                    <p className='mt-0.5 text-xs text-text-tertiary'>
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
              <div className='flex items-center gap-4 pl-6 sm:gap-6 sm:pl-0'>
                <div className='text-right'>
                  <p className='font-mono text-sm font-medium text-text-primary'>
                    {project.todayHours}h
                  </p>
                  <p className='text-[11px] text-text-tertiary'>Today</p>
                </div>
                <div className='text-right'>
                  <p className='font-mono text-sm font-medium text-text-primary'>
                    {project.todaySessions}
                  </p>
                  <p className='text-[11px] text-text-tertiary'>Sessions</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
