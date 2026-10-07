import { ChronosIllustration } from '@/components/marketing/chronos-illustration'
import { ElevatedButtonLink } from '@/components/ui/elevated'
import { FadeIn } from '@/components/ui/fade-in'
import { createPageMetadata } from '@/lib/seo'
import {
  ArrowRight,
  Clock,
  Globe,
  Heart,
  Laptop,
  Mail,
  MapPin
} from 'lucide-react'
import Link from 'next/link'

export const metadata = createPageMetadata({
  title: 'Careers',
  description:
    'Join the Chronos team. Remote-first roles in engineering, design, and growth. Help us build better ways to work.',
  path: '/careers'
})

const BENEFITS = [
  {
    icon: Globe,
    title: 'Remote-first',
    description:
      'Work from anywhere. We are distributed across 4 countries with async-friendly culture.'
  },
  {
    icon: Laptop,
    title: 'Equipment budget',
    description:
      '$2,000 setup allowance plus annual refresh for the tools you need to do your best work.'
  },
  {
    icon: Clock,
    title: 'Flexible hours',
    description:
      'Core overlap hours only. We care about output, not when you start your day.'
  },
  {
    icon: Heart,
    title: 'Health & wellness',
    description:
      'Comprehensive health coverage and a monthly wellness stipend for gym, therapy, or hobbies.'
  }
]

const ROLES = [
  {
    title: 'Senior Rust Engineer',
    location: 'Remote · EU/US',
    type: 'Full-time',
    department: 'Engineering',
    description:
      'Build the Tauri desktop agent screenshot capture, on-device privacy blur, offline sync, and silent updates. You will own the agent architecture end to end, including our roadmap toward on-device ML-based redaction.',
    requirements: [
      '5+ years systems programming experience',
      'Strong Rust and familiarity with Tauri or similar frameworks',
      'Interest in on-device/edge ML deployment (ONNX or similar) a plus',
      'Comfort with cross-platform desktop development'
    ]
  },
  {
    title: 'Product Designer',
    location: 'Remote',
    type: 'Full-time',
    department: 'Design',
    description:
      'Shape how managers and employees experience workforce analytics. You will own the dashboard, agent UI, and marketing site with a focus on trust and clarity.',
    requirements: [
      '4+ years product design experience in B2B SaaS',
      'Strong systems thinking and information architecture skills',
      'Portfolio demonstrating complex data visualization',
      'Experience designing for privacy-sensitive products'
    ]
  },
  {
    title: 'Full-stack Engineer',
    location: 'Remote · EU',
    type: 'Full-time',
    department: 'Engineering',
    description:
      'Next.js dashboard, real-time WebSocket infrastructure, and API design for a growing platform. You will work across the stack from MongoDB to React.',
    requirements: [
      '3+ years full-stack experience with TypeScript',
      'Next.js App Router and React Server Components',
      'WebSocket or real-time systems experience',
      'Familiarity with MongoDB and Express'
    ]
  },
  {
    title: 'Developer Advocate',
    location: 'Remote · US/EU',
    type: 'Full-time',
    department: 'Growth',
    description:
      'Write technical content, build integrations, and represent Chronos in the developer community. You will bridge engineering and go-to-market.',
    requirements: [
      'Strong technical writing and public speaking skills',
      'Experience with developer tools or B2B SaaS',
      'Active presence in developer communities',
      'Ability to create demos, tutorials, and sample apps'
    ]
  }
]

const VALUES = [
  'Craft over speed we ship thoughtfully',
  'Transparency in how we build and communicate',
  'Privacy is a feature, not a checkbox',
  'Small team, high ownership'
]

export default function CareersPage () {
  return (
    <>
      {/* Hero */}
      <section className='relative overflow-hidden border-b border-border'>
        <div className='bg-dot-pattern absolute inset-0 opacity-30' />
        <div className='container-main relative py-20 md:py-28'>
          <div className='grid items-center gap-12 lg:grid-cols-2 lg:gap-16'>
            <FadeIn>
              <p className='label-caps label-caps-brand mb-4'>Careers</p>
              <h1 className='heading-display text-text-primary'>
                Help us build better ways to{' '}
                <span className='text-brand'>work</span>
              </h1>
              <p className='prose-body mt-6 max-w-lg'>
                We are a small, remote-first team building workforce analytics
                that respects people. If you care about craft, clarity, and
                privacy we would like to meet you.
              </p>
              <div className='mt-8'>
                <ElevatedButtonLink href='#open-roles' tone='primary' size='lg'>
                  View open roles
                  <ArrowRight className='h-4 w-4' />
                </ElevatedButtonLink>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <ChronosIllustration
                name='about'
                alt='Chronos team building workforce analytics'
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className='border-b border-border bg-surface/50 py-20 md:py-28'>
        <div className='container-main'>
          <FadeIn className='mb-12 text-center'>
            <p className='label-caps label-caps-brand mb-3'>Benefits</p>
            <h2 className='heading-section text-text-primary'>
              How we support our team
            </h2>
          </FadeIn>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {BENEFITS.map((benefit, i) => {
              const Icon = benefit.icon
              return (
                <FadeIn key={benefit.title} delay={i * 0.05}>
                  <div className='flex h-full flex-col rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-6 shadow-[0_4px_0_0_var(--elevated-ink)]'>
                    <div className='icon-box mb-4 h-12 w-12 text-brand'>
                      <Icon className='h-5 w-5' />
                    </div>
                    <h3 className='mb-2 font-semibold text-text-primary'>
                      {benefit.title}
                    </h3>
                    <p className='prose-muted text-sm'>{benefit.description}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className='border-b border-border py-16 md:py-20'>
        <div className='container-main'>
          <FadeIn className='text-center'>
            <p className='label-caps label-caps-brand mb-6'>Our culture</p>
            <div className='flex flex-wrap justify-center gap-3'>
              {VALUES.map(value => (
                <span
                  key={value}
                  className='rounded-full border-2 border-[var(--elevated-ink)] bg-surface px-5 py-2.5 text-sm font-semibold text-text-primary shadow-[0_2px_0_0_var(--elevated-ink)]'
                >
                  {value}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Open roles */}
      <section id='open-roles' className='py-16 md:py-24 scroll-mt-20'>
        <div className='container-main'>
          <FadeIn className='mb-10'>
            <p className='label-caps label-caps-brand mb-3'>Open roles</p>
            <h2 className='heading-section text-text-primary'>
              {ROLES.length} positions available
            </h2>
          </FadeIn>

          <div className='space-y-6'>
            {ROLES.map((role, i) => (
              <FadeIn key={role.title} delay={i * 0.05}>
                <article className='rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-8 shadow-[0_5px_0_0_var(--elevated-ink)]'>
                  <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div>
                      <div className='mb-2 flex flex-wrap gap-2'>
                        <span className='rounded-full bg-brand/15 px-3 py-1 text-xs font-bold text-brand'>
                          {role.department}
                        </span>
                        <span className='rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-semibold text-text-secondary'>
                          {role.type}
                        </span>
                      </div>
                      <h3 className='heading-subsection text-text-primary'>
                        {role.title}
                      </h3>
                      <p className='mt-1 flex items-center gap-1.5 text-sm font-medium text-text-secondary'>
                        <MapPin className='h-3.5 w-3.5' />
                        {role.location}
                      </p>
                    </div>
                    <ElevatedButtonLink
                      href={`mailto:careers@chronos.app?subject=Application: ${encodeURIComponent(
                        role.title
                      )}`}
                      tone='primary'
                      size='sm'
                    >
                      Apply now
                    </ElevatedButtonLink>
                  </div>

                  <p className='prose-muted mt-5 max-w-2xl'>
                    {role.description}
                  </p>

                  <div className='mt-5'>
                    <p className='mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary'>
                      Requirements
                    </p>
                    <ul className='grid gap-2 sm:grid-cols-2'>
                      {role.requirements.map(req => (
                        <li
                          key={req}
                          className='flex items-start gap-2 text-sm font-medium text-text-secondary'
                        >
                          <span className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand' />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* General application */}
      <section className='border-t border-border py-20 md:py-28'>
        <div className='container-narrow'>
          <FadeIn>
            <div className='rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-10 text-center shadow-[0_6px_0_0_var(--elevated-ink)] md:p-14'>
              <h2 className='heading-section text-text-primary'>
                Don&apos;t see a fit?
              </h2>
              <p className='prose-body mx-auto mt-4 max-w-md'>
                We are always interested in meeting thoughtful people. Send us
                your resume and tell us what you would build at Chronos.
              </p>
              <div className='mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
                <ElevatedButtonLink
                  href='mailto:careers@chronos.app'
                  tone='primary'
                  size='lg'
                >
                  <Mail className='h-4 w-4' />
                  careers@chronos.app
                </ElevatedButtonLink>
                <Link
                  href='/about'
                  className='text-sm font-semibold text-text-secondary hover:text-text-primary'
                >
                  Learn about our team →
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  )
}
