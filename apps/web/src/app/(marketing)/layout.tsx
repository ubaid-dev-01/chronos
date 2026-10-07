import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { SiteFooter } from '@/components/marketing/site-footer'
import { NavCompanyMenu } from '@/components/marketing/nav-company-menu'
import { ChronosLogoMark } from '@/components/marketing/chronos-logo-mark'
import { MarketingAuthNav } from '@/components/marketing/marketing-auth-nav'
import { NAV_LINKS, COMPANY_LINKS } from '@/lib/nav-links'

export default function MarketingLayout ({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className='min-h-screen bg-background'>
      <div className='border-b border-sky-200/80 bg-sky-100 dark:border-sky-800/50 dark:bg-sky-950/40'>
        <div className='container-main flex h-8 items-center justify-center gap-2 px-4 text-center'>
          <span className='rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand'>
            New
          </span>
          <p className='text-xs font-medium text-text-primary'>
            Desktop agent for Windows is now in beta.{' '}
            <Link
              href='/download'
              className='font-semibold underline decoration-brand/40 underline-offset-2 hover:decoration-brand'
            >
              Download →
            </Link>
          </p>
        </div>
      </div>

      <header className='sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl backdrop-saturate-150'>
        <div className='container-main grid h-14 grid-cols-[1fr_auto_1fr] items-center'>
          <Link href='/' className='group flex w-fit items-center gap-3'>
            <ChronosLogoMark
              size='nav'
              className='transition-transform group-hover:-translate-y-px group-hover:translate-x-px'
            />
            <span className='text-lg font-bold tracking-tight'>Chronos</span>
          </Link>

          <nav className='hidden items-center justify-center gap-0.5 md:flex'>
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className='rounded-lg px-3.5 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary'
              >
                {link.label}
              </Link>
            ))}
            <NavCompanyMenu />
          </nav>

          <div className='flex items-center justify-end gap-2'>
            <ThemeToggle className='!h-8 !w-8' />
            <MarketingAuthNav />
          </div>
        </div>

        <nav className='flex flex-wrap items-center justify-center gap-1 border-t border-border px-3 py-1.5 md:hidden'>
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className='rounded-md px-2.5 py-2 text-center text-sm font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
            >
              {link.label}
            </Link>
          ))}
          {COMPANY_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className='rounded-md px-2.5 py-2 text-center text-sm font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main>{children}</main>

      <SiteFooter />
    </div>
  )
}
