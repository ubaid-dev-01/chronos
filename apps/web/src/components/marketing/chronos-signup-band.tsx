import { ChronosClockIcon } from '@/components/marketing/chronos-icons'
import { ElevatedButtonLink } from '@/components/ui/elevated'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function ChronosSignupBand () {
  return (
    <div className='overflow-hidden rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface shadow-[0_8px_0_0_var(--elevated-ink)]'>
      <div className='flex flex-col items-stretch gap-8 p-8 lg:flex-row lg:items-center lg:gap-10 lg:p-10'>
        <div className='icon-box h-20 w-20 shrink-0 self-center text-brand lg:self-auto'>
          <ChronosClockIcon size={44} />
        </div>

        <div className='flex-1 text-center lg:text-left'>
          <h3 className='text-xl font-semibold tracking-tight text-text-primary md:text-2xl'>
            Ready in under two minutes
          </h3>
          <p className='mt-2 text-base leading-relaxed text-text-secondary'>
            Create a workspace, invite your team, and install the desktop agent.
            Free for one person no credit card required.
          </p>
          <Link
            href='/sign-up'
            className='mt-4 inline-flex h-11 w-full max-w-sm items-center rounded-xl border-2 border-[var(--elevated-ink)] bg-surface-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-brand hover:text-text-primary sm:w-auto'
          >
            you@company.com
          </Link>
          <p className='mt-3 text-sm text-text-secondary'>
            By continuing you agree to our{' '}
            <Link
              href='/terms'
              className='font-medium text-text-primary underline'
            >
              Terms
            </Link>{' '}
            and{' '}
            <Link
              href='/privacy'
              className='font-medium text-text-primary underline'
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className='flex shrink-0 flex-col items-center gap-3'>
          <ElevatedButtonLink href='/sign-up' tone='primary' size='lg'>
            Start for free
            <ArrowRight className='h-4 w-4' />
          </ElevatedButtonLink>
          <Link
            href='/sign-in'
            className='text-sm font-medium text-text-secondary underline hover:text-text-primary'
          >
            Already have an account?
          </Link>
        </div>
      </div>
    </div>
  )
}
