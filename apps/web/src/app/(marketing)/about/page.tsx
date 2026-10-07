import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'
import { FadeIn } from '@/components/ui/fade-in'
import { ElevatedButtonLink } from '@/components/ui/elevated'
import { ChronosIllustration } from '@/components/marketing/chronos-illustration'
import { createPageMetadata } from '@/lib/seo'
import {
  ChronosShieldIcon,
  ChronosPresenceIcon,
  ChronosCpuIcon
} from '@/components/marketing/chronos-icons'

export const metadata = createPageMetadata({
  title: 'About',
  description:
    'Built for teams who care how work feels. Learn about Chronos values, team, and mission.',
  path: '/about'
})

const VALUES = [
  {
    title: 'Transparency over surveillance',
    body: 'We believe managers deserve visibility and employees deserve dignity. Chronos is designed so both can be true.',
    icon: ChronosPresenceIcon
  },
  {
    title: 'Privacy as architecture',
    body: 'Sensitive data is processed on-device before it ever syncs. We cannot read unblurred screenshots by design.',
    icon: ChronosShieldIcon
  },
  {
    title: 'Software that respects resources',
    body: "Your team's machines are for work, not for bloated background agents. We optimize for minimal footprint.",
    icon: ChronosCpuIcon
  }
]

const TEAM = [
  { value: '8', label: 'Engineering' },
  { value: '3', label: 'Design' },
  { value: '4', label: 'Countries', suffix: 'distributed' }
]

export default function AboutPage () {
  return (
    <>
      {/* Hero */}
      <section className='relative overflow-hidden border-b border-border'>
        <div className='bg-dot-pattern absolute inset-0 opacity-30' />
        <div className='container-main relative py-20 md:py-28'>
          <div className='grid items-center gap-12 lg:grid-cols-2 lg:gap-16'>
            <FadeIn>
              <p className='label-caps label-caps-brand mb-4'>About</p>
              <h1 className='heading-display text-text-primary'>
                Built for teams who care how work feels.
              </h1>
              <p className='prose-body mt-6 max-w-lg'>
                Chronos started when we saw teams forced to choose between
                visibility and trust. We built something that does not make you
                pick.
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <ChronosIllustration
                name='about'
                alt='Chronos team collaborating on workforce analytics'
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className='border-b border-border py-20 md:py-28'>
        <div className='container-main'>
          <FadeIn className='mb-12 text-center md:mb-14'>
            <p className='label-caps label-caps-brand mb-3'>Our values</p>
            <h2 className='heading-section text-text-primary'>
              What we stand for
            </h2>
          </FadeIn>

          <div className='grid gap-6 md:grid-cols-3'>
            {VALUES.map((value, i) => {
              const Icon = value.icon
              return (
                <FadeIn key={value.title} delay={i * 0.05}>
                  <div className='flex h-full flex-col rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-8 shadow-[0_5px_0_0_var(--elevated-ink)]'>
                    <div className='icon-box mb-6 h-14 w-14 text-brand'>
                      <Icon size={30} />
                    </div>
                    <h3 className='heading-subsection mb-3 text-text-primary'>
                      {value.title}
                    </h3>
                    <p className='prose-muted flex-1'>{value.body}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team stats */}
      <section className='border-b border-border bg-surface/50 py-16 md:py-20'>
        <div className='container-main'>
          <FadeIn className='mb-10 text-center'>
            <p className='label-caps label-caps-brand mb-3'>The team</p>
            <h2 className='heading-section text-text-primary'>
              Small team, big ambition
            </h2>
          </FadeIn>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
            {TEAM.map((item, i) => (
              <FadeIn key={item.label} delay={i * 0.05}>
                <div className='rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface px-8 py-10 text-center shadow-[0_5px_0_0_var(--elevated-ink)]'>
                  <p className='font-mono text-4xl font-bold text-brand md:text-5xl'>
                    {item.value}
                  </p>
                  <p className='mt-2 text-base font-semibold text-text-primary'>
                    {item.label}
                  </p>
                  {item.suffix && (
                    <p className='mt-0.5 text-sm font-medium text-text-secondary'>
                      {item.suffix}
                    </p>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='py-20 md:py-28'>
        <div className='container-narrow'>
          <FadeIn>
            <div className='rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-10 text-center shadow-[0_6px_0_0_var(--elevated-ink)] md:p-14'>
              <h2 className='heading-section text-text-primary'>
                Want to work with us?
              </h2>
              <p className='prose-body mx-auto mt-4 max-w-md'>
                We are a small team building tools for how work should feel. If
                that resonates, we would like to hear from you.
              </p>
              <div className='mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
                <ElevatedButtonLink href='/careers' tone='primary' size='lg'>
                  View careers
                  <ArrowRight className='h-4 w-4' />
                </ElevatedButtonLink>
                <Link
                  href='mailto:hello@chronos.app'
                  className='inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary'
                >
                  <Mail className='h-4 w-4' />
                  hello@chronos.app
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  )
}
