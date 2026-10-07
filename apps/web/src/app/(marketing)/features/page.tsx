import {
  ChronosChartIcon,
  ChronosCpuIcon,
  ChronosPresenceIcon,
  ChronosShieldIcon
} from '@/components/marketing/chronos-icons'
import { ChronosIllustration } from '@/components/marketing/chronos-illustration'
import { ElevatedButtonLink } from '@/components/ui/elevated'
import { FadeIn } from '@/components/ui/fade-in'
import { FEATURE_SECTIONS, SAAS_MODULES } from '@/content/product-features'
import { createPageMetadata } from '@/lib/seo'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = createPageMetadata({
  title: 'Features',
  description:
    'Full workforce platform: on-device privacy blur, real-time presence, AI insights, payroll APIs, offline sync, public API, and seven dashboard modules.',
  path: '/features'
})

const HERO_HIGHLIGHTS = [
  { label: 'On-device blur', icon: ChronosShieldIcon },
  { label: 'Live presence', icon: ChronosPresenceIcon },
  { label: 'AI + payroll', icon: ChronosChartIcon },
  { label: '3 MB agent', icon: ChronosCpuIcon }
]

export default function FeaturesPage () {
  return (
    <>
      <section className='relative overflow-hidden border-b border-border'>
        <div className='hero-glow' />
        <div className='bg-dot-pattern absolute inset-0 opacity-30' />

        <div className='container-main relative py-20 md:py-28'>
          <div className='grid items-center gap-12 lg:grid-cols-2 lg:gap-16'>
            <FadeIn>
              <div className='mb-6 inline-flex items-center gap-2.5 rounded-full border-2 border-[var(--elevated-ink)] bg-surface px-4 py-2 text-sm font-semibold shadow-[0_3px_0_0_var(--elevated-ink)]'>
                <span className='h-2 w-2 rounded-full bg-success' />
                <span className='text-text-primary'>
                  Tahometer parity + AI + real-time
                </span>
              </div>

              <p className='label-caps label-caps-brand mb-4'>Features</p>
              <h1 className='heading-display text-balance text-text-primary'>
                Complete SaaS{' '}
                <span className='text-brand'>workforce platform.</span>
              </h1>
              <p className='prose-body mt-6 max-w-lg'>
                Time tracking, screenshots, reports, tasks, projects, user
                management, comments, offline sync, public API, and automated
                payroll in one modern subscription.
              </p>

              <div className='mt-8 flex flex-col gap-3 sm:flex-row sm:items-center'>
                <ElevatedButtonLink href='/pricing' tone='primary' size='lg'>
                  View pricing
                  <ArrowRight className='h-4 w-4' />
                </ElevatedButtonLink>
                <Link
                  href='/download'
                  className='inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary'
                >
                  Download agent
                  <ArrowUpRight className='h-3.5 w-3.5' />
                </Link>
              </div>

              <div className='mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4'>
                {HERO_HIGHLIGHTS.map(({ label, icon: Icon }) => (
                  <div
                    key={label}
                    className='flex items-center gap-2.5 rounded-xl border-2 border-[var(--elevated-ink)] bg-surface px-3 py-2.5 shadow-[0_2px_0_0_var(--elevated-ink)]'
                  >
                    <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand'>
                      <Icon size={18} />
                    </div>
                    <span className='text-xs font-semibold leading-tight text-text-primary'>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <ChronosIllustration
                name='hero'
                alt='Chronos workforce analytics capabilities illustration'
                priority
              />
            </FadeIn>
          </div>
        </div>
      </section>

      <section className='border-b border-border bg-surface/50 py-16'>
        <div className='container-main'>
          <FadeIn className='mb-10 text-center'>
            <p className='label-caps mb-3 text-brand'>Dashboard modules</p>
            <h2 className='heading-section text-text-primary'>
              Seven modules, one workspace
            </h2>
          </FadeIn>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {SAAS_MODULES.map((mod, i) => (
              <FadeIn key={mod.name} delay={i * 0.04}>
                <div className='rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-5 shadow-[0_3px_0_0_var(--elevated-ink)]'>
                  <mod.icon className='mb-3 h-6 w-6 text-brand' />
                  <h3 className='font-semibold text-text-primary'>
                    {mod.name}
                  </h3>
                  <p className='mt-1 text-sm text-text-secondary'>
                    {mod.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className='py-4'>
        <div className='container-main'>
          {FEATURE_SECTIONS.map((feature, i) => (
            <FadeIn key={feature.id} delay={i * 0.05}>
              <article
                className={`grid items-center gap-10 border-b border-border py-16 md:grid-cols-2 md:gap-16 md:py-20 ${
                  i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div>
                  <p className='label-caps label-caps-brand mb-4'>
                    {feature.label}
                  </p>
                  <h2 className='heading-section mb-4 text-text-primary'>
                    {feature.title}
                  </h2>
                  <p className='prose-body mb-6'>{feature.description}</p>
                  <ul className='space-y-2.5'>
                    {feature.points.map(point => (
                      <li
                        key={point}
                        className='flex items-center gap-2.5 text-sm font-medium text-text-secondary'
                      >
                        <span className='h-1.5 w-1.5 rounded-full bg-brand' />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <ChronosIllustration
                  name={feature.illustration}
                  alt={feature.title}
                />
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className='border-t border-border py-20 md:py-28'>
        <div className='container-narrow text-center'>
          <FadeIn>
            <h2 className='heading-section mb-4 text-text-primary'>
              See what fits your team
            </h2>
            <p className='prose-body mx-auto mb-8 max-w-sm'>
              Start free with one person. Full features unlock as you scale.
            </p>
            <div className='flex flex-wrap items-center justify-center gap-3'>
              <ElevatedButtonLink href='/pricing' size='lg' tone='primary'>
                View pricing
              </ElevatedButtonLink>
              <Link
                href='/download'
                className='inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary'
              >
                Download agent
                <ArrowUpRight className='h-3.5 w-3.5' />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  )
}
