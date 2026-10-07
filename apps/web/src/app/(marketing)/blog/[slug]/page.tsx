import { BlogArticleBody } from '@/components/marketing/blog-article'
import { BlogCard } from '@/components/marketing/blog-card'
import { ChronosSignupBand } from '@/components/marketing/chronos-signup-band'
import { JsonLd } from '@/components/seo/json-ld'
import { createPageMetadata, siteConfig } from '@/lib/seo'
import { FadeIn } from '@/components/ui/fade-in'
import {
  BLOG_POSTS,
  getPostBySlug,
  getRelatedPosts,
  type BlogSection
} from '@/content/blog-posts'
import { ArrowLeft, Clock, Share2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const ILLUSTRATION_PATHS = {
  hero: '/images/illustrations/hero-workforce.png',
  about: '/images/illustrations/about-team.png',
  privacy: '/images/illustrations/feature-privacy.png',
  presence: '/images/illustrations/feature-presence.png',
  analytics: '/images/illustrations/feature-analytics.png',
  agent: '/images/illustrations/feature-agent.png'
} as const

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams () {
  return BLOG_POSTS.map(post => ({ slug: post.slug }))
}

export async function generateMetadata ({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Post not found' }
  return createPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`
  })
}

function getTableOfContents (sections: BlogSection[]) {
  return sections
    .map((section, i) =>
      section.type === 'heading'
        ? { id: `section-${i}`, title: section.text }
        : null
    )
    .filter(Boolean) as { id: string; title: string }[]
}

export default async function BlogPostPage ({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const related = getRelatedPosts(slug)
  const imageSrc = ILLUSTRATION_PATHS[post.image]
  const toc = getTableOfContents(post.content)

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role
    },
    publisher: {
      '@type': 'Organization',
      name: 'Chronos',
      logo: { '@type': 'ImageObject', url: `${siteConfig.url}/brand/icon-512.png` }
    },
    image: `${siteConfig.url}${imageSrc}`,
    mainEntityOfPage: `${siteConfig.url}/blog/${slug}`
  }

  return (
    <>
      <JsonLd data={articleSchema} />
      {/* Article header */}
      <section className='relative overflow-hidden border-b border-border'>
        <div className='bg-dot-pattern absolute inset-0 opacity-20' />
        <div className='container-main relative py-12 md:py-16'>
          <FadeIn>
            <Link
              href='/blog'
              className='mb-8 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text-secondary transition-colors hover:border-brand hover:text-text-primary'
            >
              <ArrowLeft className='h-4 w-4' />
              Back to blog
            </Link>

            <div className='mx-auto max-w-3xl'>
              <div className='mb-6 flex flex-wrap items-center gap-3'>
                <span className='rounded-full border-2 border-[var(--elevated-ink)] bg-brand/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand shadow-[0_2px_0_0_var(--elevated-ink)]'>
                  {post.category}
                </span>
                <time className='text-sm font-medium text-text-secondary'>
                  {post.date}
                </time>
                <span className='text-text-tertiary'>·</span>
                <span className='inline-flex items-center gap-1 text-sm font-medium text-text-secondary'>
                  <Clock className='h-3.5 w-3.5' />
                  {post.readTime}
                </span>
              </div>

              <h1 className='heading-display text-balance text-text-primary'>
                {post.title}
              </h1>
              <p className='prose-body mt-6'>{post.excerpt}</p>

              <div className='mt-8 flex items-center justify-between gap-4'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--elevated-ink)] bg-brand/15 text-sm font-bold text-brand'>
                    {post.author.name[0]}
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-text-primary'>
                      {post.author.name}
                    </p>
                    <p className='text-sm font-medium text-text-secondary'>
                      {post.author.role}
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  className='hidden items-center gap-2 rounded-xl border-2 border-[var(--elevated-ink)] bg-surface px-4 py-2 text-xs font-semibold text-text-secondary shadow-[0_2px_0_0_var(--elevated-ink)] transition-colors hover:text-text-primary sm:inline-flex'
                  aria-label='Share article'
                >
                  <Share2 className='h-3.5 w-3.5' />
                  Share
                </button>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Cover image */}
        <div className='container-main relative pb-12 md:pb-16'>
          <FadeIn delay={0.05}>
            <div className='illustration-frame mx-auto max-w-4xl overflow-hidden'>
              <Image
                src={imageSrc}
                alt={post.title}
                width={1200}
                height={675}
                className='h-auto w-full object-cover'
                priority
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Article body with sidebar */}
      <section className='py-12 md:py-16'>
        <div className='container-main'>
          <div className='grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-16'>
            {/* Sidebar TOC */}
            {toc.length > 0 && (
              <FadeIn className='hidden lg:block'>
                <nav className='sticky top-24'>
                  <p className='label-caps mb-4 text-text-primary'>
                    In this article
                  </p>
                  <ul className='space-y-2 border-l-2 border-border pl-4'>
                    {toc.map(item => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className='text-sm font-medium text-text-secondary transition-colors hover:text-brand'
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>

                  <div className='mt-8 rounded-xl border-2 border-[var(--elevated-ink)] bg-brand/5 p-4 shadow-[0_3px_0_0_var(--elevated-ink)]'>
                    <p className='text-xs font-bold text-text-primary'>
                      Try Chronos free
                    </p>
                    <p className='mt-1 text-xs font-medium text-text-secondary'>
                      Privacy-first time tracking for your team.
                    </p>
                    <Link
                      href='/sign-up'
                      className='mt-3 inline-block text-xs font-bold text-brand hover:underline'
                    >
                      Start for free →
                    </Link>
                  </div>
                </nav>
              </FadeIn>
            )}

            {/* Content */}
            <div className='max-w-2xl lg:max-w-none'>
              <FadeIn>
                <div className='rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-8 shadow-[0_4px_0_0_var(--elevated-ink)] md:p-10'>
                  <BlogArticleBody sections={post.content} />
                </div>
              </FadeIn>

              {/* Author card */}
              <FadeIn delay={0.05} className='mt-8'>
                <div className='flex items-center gap-4 rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface-elevated p-6 shadow-[0_3px_0_0_var(--elevated-ink)]'>
                  <div className='flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--elevated-ink)] bg-brand/15 text-lg font-bold text-brand'>
                    {post.author.name[0]}
                  </div>
                  <div>
                    <p className='text-xs font-bold uppercase tracking-wider text-text-secondary'>
                      Written by
                    </p>
                    <p className='font-semibold text-text-primary'>
                      {post.author.name}
                    </p>
                    <p className='text-sm font-medium text-text-secondary'>
                      {post.author.role} at Chronos
                    </p>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Related posts */}
      {related.length > 0 && (
        <section className='border-t border-border bg-surface/50 py-16 md:py-20'>
          <div className='container-main'>
            <FadeIn className='mb-8'>
              <p className='label-caps label-caps-brand mb-2'>Keep reading</p>
              <h2 className='heading-subsection text-text-primary'>
                Related articles
              </h2>
            </FadeIn>
            <div className='grid gap-4 md:grid-cols-3'>
              {related.map((relatedPost, i) => (
                <FadeIn key={relatedPost.slug} delay={i * 0.05}>
                  <BlogCard post={relatedPost} variant='compact' />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className='py-16 md:py-20'>
        <div className='container-main'>
          <FadeIn>
            <ChronosSignupBand />
          </FadeIn>
        </div>
      </section>
    </>
  )
}
