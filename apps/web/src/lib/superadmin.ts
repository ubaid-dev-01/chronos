import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { connectDB, PlatformAdmin } from '@chronos/db'

const COOKIE_NAME = 'chronos_superadmin'
const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours

function getSessionSecret (): string {
  const secret = process.env.SUPERADMIN_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SUPERADMIN_SESSION_SECRET must be at least 32 characters')
  }
  return secret
}

function signPayload (payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export async function createSuperAdminSession (email: string): Promise<void> {
  const secret = getSessionSecret()
  const exp = Date.now() + SESSION_MAX_AGE * 1000
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString(
    'base64url'
  )
  const signature = signPayload(payload, secret)
  const token = `${payload}.${signature}`

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/'
  })
}

export async function getSuperAdminSession (): Promise<{
  email: string
  displayName: string
} | null> {
  try {
    const secret = getSessionSecret()
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null

    const [payload, signature] = token.split('.')
    if (!payload || !signature) return null

    const expected = signPayload(payload, secret)
    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)
    if (sigBuf.length !== expBuf.length) return null
    if (!timingSafeEqual(sigBuf, expBuf)) return null

    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as { email: string; exp: number }

    if (!data.email || data.exp < Date.now()) return null

    await connectDB()
    const admin = (await PlatformAdmin.findOne({
      email: data.email,
      isActive: true
    }).lean()) as { email: string; displayName: string } | null

    if (!admin) return null

    return {
      email: admin.email,
      displayName: admin.displayName
    }
  } catch {
    return null
  }
}

export async function clearSuperAdminSession (): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function requireSuperAdmin (): Promise<{
  email: string
  displayName: string
}> {
  const session = await getSuperAdminSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}
