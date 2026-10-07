import type { Metadata } from 'next'

export const siteConfig = {
  name: 'Chronos',
  tagline: 'Time tracking your team can trust',
  description:
    'Workforce analytics with on-device privacy, real-time presence, and a lightweight desktop agent. Privacy-first time tracking for modern teams.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://chronos.app',
  ogImage: '/brand/og-image.png',
  twitterHandle: '@chronosapp',
  keywords: [
    'time tracking',
    'workforce analytics',
    'employee monitoring',
    'privacy-first',
    'screenshot blur',
    'team presence',
    'remote work',
    'burnout detection',
    'desktop agent',
    'Tauri'
  ]
}

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: 'Chronos', url: siteConfig.url }],
  creator: 'Chronos',
  publisher: 'Chronos',
  applicationName: siteConfig.name,
  category: 'technology',
  icons: {
    icon: [
      { url: '/brand/favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/brand/apple-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/brand/favicon.svg'
  },
  manifest: '/site.webmanifest',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4f46e5' },
    { media: '(prefers-color-scheme: dark)', color: '#818cf8' }
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} ${siteConfig.tagline}`
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: siteConfig.url
  }
}

export function createPageMetadata ({
  title,
  description,
  path = '',
  ogImage,
  noIndex = false
}: {
  title: string
  description: string
  path?: string
  ogImage?: string
  noIndex?: boolean
}): Metadata {
  const url = `${siteConfig.url}${path}`
  const image = ogImage || siteConfig.ogImage

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [image]
    },
    ...(noIndex && { robots: { index: false, follow: false } })
  }
}
