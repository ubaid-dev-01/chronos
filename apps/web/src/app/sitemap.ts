import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'
import { BLOG_POSTS } from '@/content/blog-posts'

export default function sitemap (): MetadataRoute.Sitemap {
  const base = siteConfig.url
  const now = new Date()

  const staticPages = [
    '',
    '/features',
    '/pricing',
    '/download',
    '/about',
    '/blog',
    '/careers',
    '/privacy',
    '/terms'
  ].map(path => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8
  }))

  const blogPages = BLOG_POSTS.map(post => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6
  }))

  return [...staticPages, ...blogPages]
}
