'use client'

import { ChronosPricingCard } from '@/components/marketing/chronos-pricing-card'
import { ChronosSignupBand } from '@/components/marketing/chronos-signup-band'
import { FadeIn } from '@/components/ui/fade-in'
import { PLANS } from '@chronos/types'
import { Check, Minus, Shield, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const TRUST_POINTS = [
  { icon: Shield, label: 'No credit card for free plan' },
  { icon: Zap, label: 'Upgrade or downgrade anytime' },
  { icon: Users, label: 'Pay only for active seats' }
]

const COMPARISON = [
  { feature: 'Time tracking', values: [true, true, true, true] },
  { feature: 'Screenshots', values: [false, true, true, true] },
  { feature: 'Privacy blur (on-device)', values: [false, true, true, true] },
  { feature: 'Real-time presence', values: [false, false, true, true] },
  { feature: 'AI burnout detection', values: [false, false, true, true] },
  { feature: 'Auto-categorization', values: [false, false, true, true] },
  { feature: 'CSV/Excel export', values: [false, true, true, true] },
  { feature: 'Payroll integrations', values: [false, false, true, true] },
  { feature: 'SSO / SAML', values: [false, false, false, 'Coming soon'] },
  {
    feature: 'Data retention',
    values: ['7 days', '30 days', 'Unlimited', 'Unlimited']
  },
  {
    feature: 'Support',
    values: ['Community', 'Email', 'Priority', 'Dedicated']
  }
]

const FAQ = [
  {
    q: 'Is there really a free plan?',
    a: 'Yes. One user, one project, basic time tracking forever. No credit card, no time limit, no trial expiration. When you hire your first teammate, upgrade to Starter.'
  },
  {
    q: 'How does the privacy blur work?',
    a: 'Screenshots are Gaussian-blurred on your device before upload, so text and fine detail are unreadable while general layout and color stay visible for proof-of-work. The unblurred image never leaves the machine we cannot access it by design.'
  },
  {
    q: 'Can I switch plans later?',
    a: 'Anytime. Upgrades take effect immediately and are prorated. Downgrades apply at the end of your current billing period. Your data is never deleted when downgrading only retention limits change.'
  },
  {
    q: 'What platforms does the agent support?',
    a: 'Windows 10+, macOS 12 Monterey+, and Ubuntu 20.04+. The agent is about 3 MB and uses roughly 15 MB of RAM lighter than most browser tabs.'
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Not yet. Monthly billing keeps things simple and lets you scale seats as your team grows. Annual plans with a discount are on the roadmap for Q4 2026.'
  },
  {
    q: 'Is my data encrypted?',
    a: 'All data is encrypted in transit with TLS 1.3 and at rest with AES-256. Screenshots are accessed via time-limited presigned URLs. We use SOC 2 compliant infrastructure.'
  },
  {
    q: 'What happens if I exceed my seat limit?',
    a: 'You cannot invite new members beyond your plan limit. Existing members are never removed. Upgrade your plan to add more seats changes take effect immediately.'
  },
  {
    q: 'Do you offer discounts for nonprofits?',
    a: 'Yes. Registered nonprofits and educational institutions receive 30% off all paid plans. Contact hello@chronos.app with your organization details.'
  }
]

export function PricingClient () {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <>
      <section className='relative overflow-hidden border-b border-border'>
        <div className='hero-glow' />
        <div className='bg-dot-pattern absolute inset-0 opacity-30' />
        <div className='container-main relative py-20 md:py-28'>
          <FadeIn className='mx-auto max-w-2xl text-center'>
            <p className='label-caps label-caps-brand mb-4'>Pricing</p>
            <h1 className='heading-display text-text-primary'>
              Simple, <span className='text-brand'>honest</span> pricing
            </h1>
            <p className='prose-body mx-auto mt-6 max-w-lg'>
              One person is free forever. Add your team when you need to no
              trials, no surprise charges, no sales calls.
            </p>
            <div className='mt-8 flex flex-wrap justify-center gap-3'>
              {TRUST_POINTS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className='inline-flex items-center gap-2 rounded-full border-2 border-[var(--elevated-ink)] bg-surface px-4 py-2 text-xs font-semibold text-text-primary shadow-[0_2px_0_0_var(--elevated-ink)]'
                >
                  <Icon className='h-3.5 w-3.5 text-brand' />
                  {label}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className='py-16 md:py-24'>
        <div className='container-main'>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {PLANS.map((plan, i) => (
              <FadeIn key={plan.id} delay={i * 0.05}>
                <ChronosPricingCard
                  plan={plan}
                  highlighted={plan.tier === 'pro'}
                />
              </FadeIn>
            ))}
          </div>
          <p className='mt-8 text-center text-sm font-medium text-text-secondary'>
            All plans include the desktop agent for Windows, macOS, and Linux.
          </p>
        </div>
      </section>

      <section className='border-t border-border bg-surface/50 py-20 md:py-28'>
        <div className='container-main'>
          <FadeIn className='mb-10 text-center'>
            <p className='label-caps label-caps-brand mb-3'>Compare</p>
            <h2 className='heading-section text-text-primary'>
              Every plan, side by side
            </h2>
          </FadeIn>
          <FadeIn delay={0.05}>
            <div className='overflow-hidden rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface shadow-[0_6px_0_0_var(--elevated-ink)]'>
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[640px] text-sm'>
                  <thead>
                    <tr className='border-b-2 border-[var(--elevated-ink)] bg-surface-elevated'>
                      <th className='px-5 py-4 text-left font-bold text-text-secondary'>
                        Feature
                      </th>
                      {PLANS.map(plan => (
                        <th
                          key={plan.id}
                          className={`px-4 py-4 text-center font-bold ${
                            plan.tier === 'pro'
                              ? 'text-brand'
                              : 'text-text-primary'
                          }`}
                        >
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border'>
                    {COMPARISON.map(row => (
                      <tr
                        key={row.feature}
                        className='transition-colors hover:bg-surface-elevated/50'
                      >
                        <td className='px-5 py-3.5 text-sm font-medium text-text-primary'>
                          {row.feature}
                        </td>
                        {row.values.map((val, i) => (
                          <td key={i} className='px-4 py-3.5 text-center'>
                            {val === true ? (
                              <Check
                                className='mx-auto h-4 w-4 text-brand'
                                strokeWidth={2.5}
                              />
                            ) : val === false ? (
                              <Minus className='mx-auto h-4 w-4 text-border' />
                            ) : (
                              <span className='text-sm font-medium text-text-secondary'>
                                {val}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className='border-t border-border py-20 md:py-28'>
        <div className='container-narrow'>
          <FadeIn className='mb-10 text-center'>
            <p className='label-caps label-caps-brand mb-3'>FAQ</p>
            <h2 className='heading-section text-text-primary'>
              Common questions
            </h2>
          </FadeIn>
          <div className='space-y-3'>
            {FAQ.map((item, i) => (
              <FadeIn key={item.q} delay={i * 0.03}>
                <div className='overflow-hidden rounded-xl border-2 border-[var(--elevated-ink)] bg-surface shadow-[0_3px_0_0_var(--elevated-ink)]'>
                  <button
                    type='button'
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className='flex w-full items-start justify-between gap-4 px-6 py-5 text-left'
                  >
                    <h3 className='text-sm font-semibold text-text-primary'>
                      {item.q}
                    </h3>
                    <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-surface-elevated font-mono text-xs font-bold text-text-secondary'>
                      {openFaq === i ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className='border-t border-border px-6 pb-5 pt-1'>
                      <p className='prose-muted leading-relaxed'>{item.a}</p>
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className='border-t border-border py-20 md:py-28'>
        <div className='container-main'>
          <FadeIn>
            <ChronosSignupBand />
          </FadeIn>
          <p className='mt-6 text-center text-sm font-medium text-text-secondary'>
            Enterprise needs?{' '}
            <Link
              href='mailto:hello@chronos.app'
              className='font-semibold text-brand hover:underline'
            >
              Contact sales
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
