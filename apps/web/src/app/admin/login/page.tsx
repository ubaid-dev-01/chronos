import { redirect } from 'next/navigation'
import { getSuperAdminSession } from '@/lib/superadmin'
import { SuperAdminLoginForm } from '@/components/superadmin/login-form'

export default async function SuperAdminLoginPage () {
  const session = await getSuperAdminSession()
  if (session) {
    redirect('/admin')
  }

  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4'>
      <div className='hero-glow' />
      <div className='bg-dot-pattern absolute inset-0 opacity-30' />
      <div className='relative z-10'>
        <SuperAdminLoginForm />
      </div>
    </div>
  )
}
