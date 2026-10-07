import { NextResponse } from 'next/server'
import { connectDB, User, Organization } from '@chronos/db'
import { requireSuperAdmin } from '@/lib/superadmin'

export async function GET (request: Request) {
  try {
    await requireSuperAdmin()
    await connectDB()

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim().toLowerCase()

    const filter = q
      ? {
          $or: [
            { email: { $regex: q, $options: 'i' } },
            { displayName: { $regex: q, $options: 'i' } }
          ]
        }
      : {}

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    const orgIds = [...new Set(users.map(u => String(u.orgId)))]
    const orgs = await Organization.find({ _id: { $in: orgIds } })
      .select('name slug')
      .lean()
    const orgMap = new Map(orgs.map(o => [String(o._id), o]))

    const data = users.map(user => {
      const org = orgMap.get(String(user.orgId))
      return {
        _id: String(user._id),
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
        orgName: org?.name ?? '—',
        orgSlug: org?.slug ?? '—',
        lastActiveAt: user.lastActiveAt,
        createdAt: user.createdAt
      }
    })

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
}
