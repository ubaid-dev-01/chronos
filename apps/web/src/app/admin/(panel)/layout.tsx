import { redirect } from 'next/navigation'
import { getSuperAdminSession } from '@/lib/superadmin'
import { SuperAdminSidebar } from '@/components/superadmin/sidebar'
import { SuperAdminMobileHeader } from '@/components/superadmin/mobile-header'
import { SidebarProvider } from '@/components/layout/sidebar-context'

export default async function SuperAdminPanelLayout ({
  children
}: {
  children: React.ReactNode
}) {
  const session = await getSuperAdminSession()
  if (!session) {
    redirect('/admin/login')
  }

  return (
    <SidebarProvider>
      <div className='flex min-h-screen bg-background'>
        <SuperAdminSidebar
          displayName={session.displayName}
          email={session.email}
        />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <SuperAdminMobileHeader />
          <main className='flex-1 overflow-y-auto p-4 sm:p-6 md:p-8'>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
