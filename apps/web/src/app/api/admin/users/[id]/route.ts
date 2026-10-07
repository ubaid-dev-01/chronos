import { NextResponse } from 'next/server'
import { connectDB, User } from '@chronos/db'
import type { UserRole } from '@chronos/types'
import { requireSuperAdmin } from '@/lib/superadmin'

const ROLES: UserRole[] = ['admin', 'manager', 'member']

export async function PATCH (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
    const { id } = await params
    const body = await request.json()

    await connectDB()

    const updates: Record<string, unknown> = {}
    if (typeof body.isActive === 'boolean') updates.isActive = body.isActive
    if (typeof body.role === 'string' && ROLES.includes(body.role)) {
      updates.role = body.role
    }
    if (typeof body.displayName === 'string' && body.displayName.trim()) {
      updates.displayName = body.displayName.trim()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const user = (await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).lean()) as {
      _id: unknown
      email: string
      displayName: string
      role: string
      isActive: boolean
      orgId: unknown
    } | null

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: String(user._id),
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
        orgId: String(user.orgId)
      }
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
}
