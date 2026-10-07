import Link from 'next/link'
import { FadeIn } from '@/components/ui/fade-in'

export interface LegalSection {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

interface LegalDocumentProps {
  label: string
  title: string
  description: string
  lastUpdated: string
  contactEmail: string
  sections: LegalSection[]
  relatedLink?: { href: string; label: string }
}

export function LegalDocument ({
  label,
  title,
  description,
  lastUpdated,
  contactEmail,
  sections,
  relatedLink
}: LegalDocumentProps) {
  return (
    <>
      <section className='relative overflow-hidden border-b border-border'>
        <div className='bg-dot-pattern absolute inset-0 opacity-25' />
        <div className='container-main relative py-20 md:py-28'>
          <FadeIn className='mx-auto max-w-3xl text-center'>
            <p className='label-caps label-caps-brand mb-4'>{label}</p>
            <h1 className='heading-display text-text-primary'>{title}</h1>
            <p className='prose-body mx-auto mt-6 max-w-xl'>{description}</p>
            <div className='mt-6 inline-flex items-center gap-2 rounded-full border-2 border-[var(--elevated-ink)] bg-surface px-4 py-2 text-xs font-semibold text-text-secondary shadow-[0_2px_0_0_var(--elevated-ink)]'>
              Last updated: {lastUpdated}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className='py-16 md:py-20'>
        <div className='container-main'>
          <div className='grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-16'>
            {/* Table of contents */}
            <FadeIn className='hidden lg:block'>
              <nav className='sticky top-24'>
                <p className='label-caps mb-4 text-text-primary'>On this page</p>
                <ul className='space-y-2 border-l-2 border-border pl-4'>
                  {sections.map(section => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className='text-sm font-medium text-text-secondary transition-colors hover:text-brand'
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
                {relatedLink && (
                  <div className='mt-8 rounded-xl border-2 border-[var(--elevated-ink)] bg-surface-elevated p-4 shadow-[0_3px_0_0_var(--elevated-ink)]'>
                    <p className='text-xs font-semibold text-text-primary'>
                      Related document
                    </p>
                    <Link
                      href={relatedLink.href}
                      className='mt-1 block text-sm font-semibold text-brand hover:underline'
                    >
                      {relatedLink.label} →
                    </Link>
                  </div>
                )}
              </nav>
            </FadeIn>

            {/* Content */}
            <div className='space-y-8'>
              {sections.map((section, i) => (
                <FadeIn key={section.id} delay={i * 0.02}>
                  <article
                    id={section.id}
                    className='scroll-mt-24 rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-8 shadow-[0_4px_0_0_var(--elevated-ink)]'
                  >
                    <h2 className='heading-subsection mb-4 text-text-primary'>
                      {section.title}
                    </h2>
                    <div className='space-y-4'>
                      {section.paragraphs.map((p, j) => (
                        <p key={j} className='prose-muted leading-relaxed'>
                          {p}
                        </p>
                      ))}
                    </div>
                    {section.bullets && (
                      <ul className='mt-4 space-y-2'>
                        {section.bullets.map(item => (
                          <li
                            key={item}
                            className='flex items-start gap-2.5 text-sm font-medium text-text-secondary'
                          >
                            <span className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand' />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                </FadeIn>
              ))}

              <FadeIn delay={0.1}>
                <div className='rounded-2xl border-2 border-brand/30 bg-brand/5 p-8 text-center'>
                  <p className='text-sm font-semibold text-text-primary'>
                    Questions about this document?
                  </p>
                  <a
                    href={`mailto:${contactEmail}`}
                    className='mt-2 inline-block text-sm font-semibold text-brand hover:underline'
                  >
                    {contactEmail}
                  </a>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
