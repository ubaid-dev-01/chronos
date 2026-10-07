import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BlogPost } from '@/content/blog-posts'

const ILLUSTRATION_PATHS: Record<BlogPost['image'], string> = {
  hero: '/images/illustrations/hero-workforce.png',
  about: '/images/illustrations/about-team.png',
  privacy: '/images/illustrations/feature-privacy.png',
  presence: '/images/illustrations/feature-presence.png',
  analytics: '/images/illustrations/feature-analytics.png',
  agent: '/images/illustrations/feature-agent.png'
}

interface BlogCardProps {
  post: BlogPost
  variant?: 'default' | 'featured' | 'compact'
  className?: string
}

export function BlogCard ({
  post,
  variant = 'default',
  className
}: BlogCardProps) {
  const imageSrc = ILLUSTRATION_PATHS[post.image]

  if (variant === 'featured') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className={cn(
          'group grid overflow-hidden rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface shadow-[0_6px_0_0_var(--elevated-ink)] transition-transform hover:translate-y-px hover:shadow-[0_5px_0_0_var(--elevated-ink)] lg:grid-cols-2',
          className
        )}
      >
        <div className='relative aspect-[16/10] overflow-hidden lg:aspect-auto'>
          <Image
            src={imageSrc}
            alt={post.title}
            fill
            className='object-cover transition-transform duration-300 group-hover:scale-[1.02]'
            priority
          />
        </div>
        <div className='flex flex-col justify-center p-8 md:p-10'>
          <div className='mb-4 flex flex-wrap items-center gap-3'>
            <span className='rounded-full bg-brand/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand'>
              Featured
            </span>
            <span className='rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-semibold text-text-secondary'>
              {post.category}
            </span>
          </div>
          <h2 className='heading-subsection text-text-primary transition-colors group-hover:text-brand'>
            {post.title}
          </h2>
          <p className='prose-muted mt-3 line-clamp-3'>{post.excerpt}</p>
          <div className='mt-6 flex items-center justify-between'>
            <BlogMeta post={post} />
            <span className='inline-flex items-center gap-1 text-sm font-semibold text-brand'>
              Read article
              <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
            </span>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className={cn(
          'group flex gap-4 rounded-xl border-2 border-[var(--elevated-ink)] bg-surface p-4 shadow-[0_3px_0_0_var(--elevated-ink)] transition-transform hover:translate-y-px',
          className
        )}
      >
        <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border'>
          <Image src={imageSrc} alt='' fill className='object-cover' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-semibold text-text-primary group-hover:text-brand'>
            {post.title}
          </p>
          <p className='mt-0.5 text-xs font-medium text-text-secondary'>
            {post.date}
          </p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface shadow-[0_5px_0_0_var(--elevated-ink)] transition-transform hover:translate-y-px hover:shadow-[0_4px_0_0_var(--elevated-ink)]',
        className
      )}
    >
      <div className='relative aspect-[16/10] overflow-hidden border-b-2 border-[var(--elevated-ink)]'>
        <Image
          src={imageSrc}
          alt={post.title}
          fill
          className='object-cover transition-transform duration-300 group-hover:scale-[1.02]'
        />
        <span className='absolute left-4 top-4 rounded-full border-2 border-[var(--elevated-ink)] bg-surface px-3 py-1 text-xs font-bold text-text-primary shadow-[0_2px_0_0_var(--elevated-ink)]'>
          {post.category}
        </span>
      </div>
      <div className='flex flex-1 flex-col p-6'>
        <BlogMeta post={post} />
        <h2 className='mt-3 text-lg font-semibold leading-snug text-text-primary transition-colors group-hover:text-brand'>
          {post.title}
        </h2>
        <p className='prose-muted mt-2 line-clamp-2 flex-1'>{post.excerpt}</p>
        <span className='mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand'>
          Read more
          <ArrowRight className='h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5' />
        </span>
      </div>
    </Link>
  )
}

function BlogMeta ({ post }: { post: BlogPost }) {
  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-text-secondary'>
      <time>{post.date}</time>
      <span className='text-border'>·</span>
      <span className='inline-flex items-center gap-1'>
        <Clock className='h-3 w-3' />
        {post.readTime}
      </span>
      <span className='text-border'>·</span>
      <span>{post.author.name}</span>
    </div>
  )
}
