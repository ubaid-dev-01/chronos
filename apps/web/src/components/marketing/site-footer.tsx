import Link from 'next/link'
import { Github, Linkedin, Mail, Twitter } from 'lucide-react'
import { ElevatedButtonLink } from '@/components/ui/elevated'
import { ChronosLogoMark } from '@/components/marketing/chronos-logo-mark'

const footerLinks = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Download', href: '/download' },
    { label: 'Dashboard', href: '/dashboard' }
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' }
  ],
  Legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' }
  ]
}

const socialLinks = [
  { label: 'Twitter', href: 'https://twitter.com', icon: Twitter },
  { label: 'GitHub', href: 'https://github.com', icon: Github },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
  { label: 'Email', href: 'mailto:hello@chronos.app', icon: Mail }
]

export function SiteFooter () {
  return (
    <footer className='border-t-2 border-[var(--elevated-ink)] bg-surface'>
      {/* CTA strip */}
      <div className='border-b border-border bg-brand/5'>
        <div className='container-main flex flex-col items-center justify-between gap-6 py-10 md:flex-row'>
          <div>
            <p className='text-lg font-semibold text-text-primary'>
              Ready to track time your team can trust?
            </p>
            <p className='mt-1 text-sm font-medium text-text-secondary'>
              Free for one person. No credit card required.
            </p>
          </div>
          <div className='flex shrink-0 gap-3'>
            <ElevatedButtonLink href='/sign-up' tone='primary' size='md'>
              Start for free
            </ElevatedButtonLink>
            <ElevatedButtonLink href='/pricing' tone='secondary' size='md'>
              View pricing
            </ElevatedButtonLink>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className='container-main py-14 md:py-18'>
        <div className='grid gap-12 lg:grid-cols-[1.2fr_2fr]'>
          {/* Brand column */}
          <div>
            <Link href='/' className='group inline-flex items-center gap-2.5'>
              <ChronosLogoMark
                size='md'
                className='transition-transform group-hover:-translate-y-px group-hover:translate-x-px'
              />
              <span className='text-xl font-bold tracking-tight'>Chronos</span>
            </Link>
            <p className='mt-4 max-w-xs text-base leading-relaxed text-text-secondary'>
              Workforce analytics that respects your team. Privacy-first time
              tracking for modern companies.
            </p>

            {/* Social links */}
            <div className='mt-6 flex gap-2'>
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={label}
                  className='flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--elevated-ink)] bg-surface-elevated text-text-secondary shadow-[0_2px_0_0_var(--elevated-ink)] transition-all hover:translate-y-px hover:text-brand hover:shadow-[0_1px_0_0_var(--elevated-ink)]'
                >
                  <Icon className='h-4 w-4' />
                </a>
              ))}
            </div>

            {/* Status badge */}
            <div className='mt-6 inline-flex items-center gap-2 rounded-full border-2 border-[var(--elevated-ink)] bg-surface px-4 py-2 shadow-[0_2px_0_0_var(--elevated-ink)]'>
              <span className='h-2 w-2 rounded-full bg-success' />
              <span className='text-xs font-semibold text-text-primary'>
                All systems operational
              </span>
            </div>
          </div>

          {/* Link columns */}
          <div className='grid grid-cols-2 gap-8 sm:grid-cols-3'>
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <p className='label-caps mb-4 text-text-primary'>{category}</p>
                <ul className='space-y-3'>
                  {links.map(link => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className='text-sm font-semibold text-text-secondary transition-colors hover:text-brand'
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className='border-t-2 border-[var(--elevated-ink)] bg-surface-elevated/50'>
        <div className='container-main flex flex-col items-start justify-between gap-4 py-6 sm:flex-row sm:items-center'>
          <span className='text-sm font-medium text-text-secondary'>
            © {new Date().getFullYear()} Chronos. All rights reserved.
          </span>
          <div className='flex flex-wrap items-center gap-x-6 gap-y-2'>
            <p className='text-sm font-medium text-text-secondary'>
              Built for teams who value clarity over surveillance.
            </p>
            <Link
              href='/privacy'
              className='text-sm font-semibold text-text-secondary hover:text-brand'
            >
              Privacy
            </Link>
            <Link
              href='/terms'
              className='text-sm font-semibold text-text-secondary hover:text-brand'
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
