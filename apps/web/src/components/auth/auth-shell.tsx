import Link from 'next/link';
import { ChronosLogoMark } from '@/components/marketing/chronos-logo-mark';

export function AuthShell ({ children }: { children: React.ReactNode }) {
  return (
    <div className='relative flex min-h-screen flex-col overflow-hidden bg-background'>
      <div className='hero-glow' />
      <div className='bg-dot-pattern absolute inset-0 opacity-30' />

      <header className='relative z-10 border-b border-border/60 bg-background/70 backdrop-blur-xl'>
        <div className='container-main flex h-14 items-center'>
          <Link href='/' className='group flex items-center gap-3'>
            <ChronosLogoMark
              size='nav'
              className='transition-transform group-hover:-translate-y-px group-hover:translate-x-px'
            />
            <span className='text-lg font-bold tracking-tight text-text-primary'>
              Chronos
            </span>
          </Link>
        </div>
      </header>

      <main className='relative z-10 flex flex-1 items-center justify-center px-4 py-10'>
        {children}
      </main>
    </div>
  );
}
