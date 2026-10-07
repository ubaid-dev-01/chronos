import { NextResponse } from 'next/server'
import { connectDB, Organization, User } from '@chronos/db'
import { requireSuperAdmin } from '@/lib/superadmin'

export async function GET () {
  try {
    await requireSuperAdmin()
    await connectDB()

    const organizations = await Organization.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    const orgIds = organizations.map(o => o._id)
    const memberCounts = await User.aggregate<{ _id: unknown; count: number }>([
      { $match: { orgId: { $in: orgIds } } },
      { $group: { _id: '$orgId', count: { $sum: 1 } } }
    ])

    const countMap = new Map(
      memberCounts.map(row => [String(row._id), row.count])
    )

    const data = organizations.map(org => ({
      _id: String(org._id),
      name: org.name,
      slug: org.slug,
      planTier: org.planTier,
      seatLimit: org.seatLimit,
      isActive: org.isActive,
      memberCount: countMap.get(String(org._id)) ?? 0,
      createdAt: org.createdAt
    }))

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
}
