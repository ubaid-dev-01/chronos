import { FadeIn } from '@/components/ui/fade-in'
import { ElevatedButtonLink } from '@/components/ui/elevated'
import { BlogCard } from '@/components/marketing/blog-card'
import { BLOG_POSTS, getFeaturedPost } from '@/content/blog-posts'
import { createPageMetadata } from '@/lib/seo'
import type { BlogCategory } from '@/content/blog-posts'

export const metadata = createPageMetadata({
  title: 'Blog',
  description:
    'Product thinking, engineering decisions, and how we build Chronos. Notes from the team.',
  path: '/blog'
})

const CATEGORIES: BlogCategory[] = ['Engineering', 'Product', 'Company']

export default function BlogPage () {
  const featured = getFeaturedPost()
  const rest = BLOG_POSTS.filter(p => p.slug !== featured.slug)

  return (
    <>
      {/* Hero */}
      <section className='relative overflow-hidden border-b border-border'>
        <div className='bg-dot-pattern absolute inset-0 opacity-30' />
        <div className='container-main relative py-20 md:py-28'>
          <FadeIn className='mx-auto max-w-2xl text-center'>
            <p className='label-caps label-caps-brand mb-4'>Blog</p>
            <h1 className='heading-display text-text-primary'>
              Notes from the team
            </h1>
            <p className='prose-body mx-auto mt-6'>
              Product thinking, engineering decisions, and how we build Chronos.
            </p>
          </FadeIn>

          {/* Category pills */}
          <FadeIn delay={0.05} className='mt-10 flex flex-wrap justify-center gap-2'>
            {CATEGORIES.map(cat => (
              <span
                key={cat}
                className='rounded-full border-2 border-[var(--elevated-ink)] bg-surface px-4 py-1.5 text-xs font-bold text-text-primary shadow-[0_2px_0_0_var(--elevated-ink)]'
              >
                {cat}
              </span>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* Featured post */}
      <section className='border-b border-border py-12 md:py-16'>
        <div className='container-main'>
          <FadeIn>
            <BlogCard post={featured} variant='featured' />
          </FadeIn>
        </div>
      </section>

      {/* Post grid */}
      <section className='py-12 md:py-20'>
        <div className='container-main'>
          <FadeIn className='mb-10'>
            <h2 className='heading-subsection text-text-primary'>
              Latest articles
            </h2>
            <p className='prose-muted mt-2'>
              {BLOG_POSTS.length} articles on building privacy-first workforce
              analytics.
            </p>
          </FadeIn>

          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {rest.map((post, i) => (
              <FadeIn key={post.slug} delay={i * 0.05}>
                <BlogCard post={post} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className='border-t border-border bg-surface/50 py-16 md:py-20'>
        <div className='container-narrow'>
          <FadeIn>
            <div className='rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-8 text-center shadow-[0_6px_0_0_var(--elevated-ink)] md:p-12'>
              <p className='label-caps label-caps-brand mb-3'>Stay updated</p>
              <h2 className='heading-subsection text-text-primary'>
                Get new posts in your inbox
              </h2>
              <p className='prose-muted mx-auto mt-3 max-w-md'>
                Engineering deep-dives, product updates, and team notes. No spam,
                unsubscribe anytime.
              </p>
              <div className='mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row'>
                <input
                  type='email'
                  placeholder='you@company.com'
                  className='h-11 flex-1 rounded-xl border-2 border-[var(--elevated-ink)] bg-surface-elevated px-4 text-sm font-medium text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none'
                  readOnly
                />
                <ElevatedButtonLink href='/sign-up' tone='primary' size='md'>
                  Subscribe
                </ElevatedButtonLink>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  )
}
