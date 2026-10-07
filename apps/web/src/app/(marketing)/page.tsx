import { ChronosFeatureCard } from '@/components/marketing/chronos-feature-card'
import { ChronosSignupBand } from '@/components/marketing/chronos-signup-band'
import { DashboardPreview } from '@/components/marketing/dashboard-preview'
import { LogoStrip } from '@/components/marketing/logo-strip'
import { JsonLd } from '@/components/seo/json-ld'
import { ElevatedButtonLink } from '@/components/ui/elevated'
import { FadeIn } from '@/components/ui/fade-in'
import {
  COMPETITOR_COMPARISON,
  CORE_CAPABILITIES,
  SAAS_MODULES
} from '@/content/product-features'
import { createPageMetadata, siteConfig } from '@/lib/seo'
import { ArrowRight, Check, Star, X } from 'lucide-react'

export const metadata = createPageMetadata({
  title: 'Home',
  description:
    'Privacy-first workforce intelligence real-time presence, on-device privacy blur, AI insights, payroll APIs, and a 3 MB desktop agent.',
  path: '/'
})

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Chronos',
  url: siteConfig.url,
  logo: `${siteConfig.url}/brand/icon-512.png`,
  description: siteConfig.description,
  sameAs: ['https://twitter.com/chronosapp', 'https://github.com/chronos']
}

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Chronos',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Windows, macOS, Linux',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
}

const TESTIMONIALS = [
  {
    quote:
      'We switched from Tahometer. Same proof-of-work features, but real-time dashboards and privacy blur our team actually trusts.',
    author: 'Sarah Chen',
    role: 'Head of Ops, Latticeflow'
  },
  {
    quote:
      'The on-device blur sold our legal team. Payroll export plus Deel API ended our Friday CSV ritual.',
    author: 'Marcus Webb',
    role: 'CTO, Parallel'
  }
]

export default function HomePage () {
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={softwareSchema} />
      <section className='relative overflow-hidden border-b border-border'>
        <div className='hero-glow' />
        <div className='bg-dot-pattern absolute inset-0 opacity-40' />

        <div className='container-main relative pt-16 pb-10 md:pt-24 md:pb-14'>
          <div className='mx-auto max-w-3xl text-center'>
            <FadeIn>
              <div className='mb-8 inline-flex items-center gap-2.5 rounded-full border-2 border-[var(--elevated-ink)] bg-surface px-5 py-2 text-sm font-medium shadow-[0_3px_0_0_var(--elevated-ink)]'>
                <span className='h-2 w-2 rounded-full bg-success' />
                <span className='text-text-secondary'>
                  Full Tahometer parity built for 2026
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={0.05}>
              <h1 className='heading-hero text-balance text-text-primary'>
                The time tracker your{' '}
                <span className='text-brand'>team can trust</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.1}>
              <p className='prose-body mx-auto mt-6 max-w-xl text-pretty'>
                Workforce intelligence with on-device privacy blur, live
                presence, automated payroll, public API, and seven dashboard
                modules Summary, Activity, Tasks, Projects, Users, Reports &amp;
                Comments.
              </p>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className='mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row'>
                <ElevatedButtonLink href='/sign-up' tone='primary' size='lg'>
                  Start for free
                  <ArrowRight className='h-4 w-4' />
                </ElevatedButtonLink>
                <ElevatedButtonLink href='/features' tone='secondary' size='lg'>
                  All features
                </ElevatedButtonLink>
              </div>
              <p className='mt-4 text-sm text-text-tertiary'>
                Free for one person. No credit card. Win / Mac / Linux agent.
              </p>
            </FadeIn>
          </div>

          <FadeIn delay={0.2} className='relative mx-auto mt-14 max-w-5xl'>
            <DashboardPreview />
          </FadeIn>
        </div>
      </section>

      <LogoStrip />

      <section className='border-b border-border py-20 md:py-28'>
        <div className='container-main'>
          <FadeIn className='mb-12 text-center md:mb-14'>
            <p className='label-caps mb-3 text-brand'>Capabilities</p>
            <h2 className='heading-section text-text-primary'>
              Everything Tahometer has improved
            </h2>
            <p className='prose-body mx-auto mt-4 max-w-lg'>
              Offline sync, screenshots, reports, public API, and admin controls
              plus AI, real-time presence, and privacy-first architecture.
            </p>
          </FadeIn>

          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {CORE_CAPABILITIES.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.04}>
                <ChronosFeatureCard
                  icon={<item.icon className='h-7 w-7' strokeWidth={1.75} />}
                  title={item.title}
                  description={item.description}
                  variant={item.variant}
                  tag={item.tag}
                />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className='border-b border-border bg-surface/50 py-20 md:py-28'>
        <div className='container-main'>
          <FadeIn className='mb-12 text-center'>
            <p className='label-caps mb-3 text-brand'>SaaS platform</p>
            <h2 className='heading-section text-text-primary'>
              Seven dashboard modules
            </h2>
            <p className='prose-body mx-auto mt-4 max-w-lg'>
              Full workforce management in one subscription from calendar
              summary to payroll-ready reports.
            </p>
          </FadeIn>

          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {SAAS_MODULES.map((mod, i) => (
              <FadeIn key={mod.name} delay={i * 0.04}>
                <div className='h-full rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-5 shadow-[0_4px_0_0_var(--elevated-ink)]'>
                  <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--elevated-ink)] bg-brand/10 text-brand'>
                    <mod.icon className='h-5 w-5' />
                  </div>
                  <h3 className='font-semibold text-text-primary'>
                    {mod.name}
                  </h3>
                  <p className='mt-1.5 text-sm leading-relaxed text-text-secondary'>
                    {mod.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className='border-b border-border py-20 md:py-28'>
        <div className='container-main'>
          <div className='grid items-center gap-12 lg:grid-cols-2'>
            <FadeIn>
              <p className='label-caps mb-3 text-brand'>Why Chronos</p>
              <h2 className='heading-section text-text-primary'>
                Tahometer parity. Modern stack.
              </h2>
              <p className='prose-body mt-4'>
                Same proof-of-work, offline time, CSV payroll, and public API —
                with 10× lighter agent, real-time sync, and AI that saves hours
                every week.
              </p>
              <ElevatedButtonLink
                href='/pricing'
                tone='secondary'
                size='md'
                className='mt-8'
              >
                View pricing
                <ArrowRight className='h-4 w-4' />
              </ElevatedButtonLink>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className='overflow-hidden rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface shadow-[0_6px_0_0_var(--elevated-ink)]'>
                <div className='grid grid-cols-3 border-b-2 border-[var(--elevated-ink)] bg-surface-elevated px-5 py-3 text-xs font-semibold uppercase tracking-wide'>
                  <span className='text-text-tertiary'>Feature</span>
                  <span className='text-center text-brand'>Chronos</span>
                  <span className='text-center text-text-tertiary'>
                    Tahometer
                  </span>
                </div>
                {COMPETITOR_COMPARISON.map(row => (
                  <div
                    key={row.feature}
                    className='grid grid-cols-3 items-center border-b border-border px-5 py-3.5 last:border-0'
                  >
                    <span className='text-sm text-text-secondary'>
                      {row.feature}
                    </span>
                    <CellValue value={row.chronos} positive />
                    <CellValue value={row.tahometer} />
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className='py-20 md:py-28'>
        <div className='container-main'>
          <FadeIn className='mb-10 text-center'>
            <p className='label-caps mb-3 text-text-tertiary'>Testimonials</p>
            <h2 className='heading-section text-text-primary'>
              Trusted by ops teams
            </h2>
          </FadeIn>
          <div className='grid gap-6 md:grid-cols-2'>
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={t.author} delay={i * 0.05}>
                <div className='h-full rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-8 shadow-[0_5px_0_0_var(--elevated-ink)]'>
                  <div className='mb-4 flex gap-0.5'>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className='h-4 w-4 fill-brand text-brand' />
                    ))}
                  </div>
                  <p className='text-base leading-relaxed text-text-primary'>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className='mt-6 flex items-center gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--elevated-ink)] bg-brand/10 text-sm font-semibold text-brand'>
                      {t.author[0]}
                    </div>
                    <div>
                      <p className='text-sm font-semibold text-text-primary'>
                        {t.author}
                      </p>
                      <p className='text-xs text-text-tertiary'>{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className='border-y border-border bg-surface/50 py-14'>
        <div className='container-main'>
          <div className='grid grid-cols-2 gap-8 md:grid-cols-4'>
            {[
              { value: '3 MB', label: 'Agent binary' },
              { value: '<1s', label: 'Presence latency' },
              { value: '7', label: 'Dashboard modules' },
              { value: '99.9%', label: 'Uptime SLA' }
            ].map((m, i) => (
              <FadeIn key={m.label} delay={i * 0.05} className='text-center'>
                <p className='font-mono text-3xl font-bold text-text-primary md:text-4xl'>
                  {m.value}
                </p>
                <p className='mt-1 text-sm text-text-tertiary'>{m.label}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className='py-20 md:py-28'>
        <div className='container-main'>
          <FadeIn>
            <ChronosSignupBand />
          </FadeIn>
        </div>
      </section>
    </>
  )
}

function CellValue ({
  value,
  positive = false
}: {
  value: boolean | string
  positive?: boolean
}) {
  if (typeof value === 'string') {
    return (
      <span
        className={`text-center text-xs font-semibold ${
          positive ? 'text-brand' : 'text-text-tertiary'
        }`}
      >
        {value}
      </span>
    )
  }
  return (
    <span className='flex justify-center'>
      {value ? (
        <Check
          className={`h-4 w-4 ${positive ? 'text-brand' : 'text-success'}`}
        />
      ) : (
        <X className='h-4 w-4 text-text-tertiary' />
      )}
    </span>
  )
}
