import Image from 'next/image'
import { cn } from '@/lib/utils'

const ILLUSTRATIONS = {
  hero: '/images/illustrations/hero-workforce.png',
  about: '/images/illustrations/about-team.png',
  privacy: '/images/illustrations/feature-privacy.png',
  presence: '/images/illustrations/feature-presence.png',
  analytics: '/images/illustrations/feature-analytics.png',
  agent: '/images/illustrations/feature-agent.png'
} as const

export type IllustrationKey = keyof typeof ILLUSTRATIONS

interface ChronosIllustrationProps {
  name: IllustrationKey
  alt: string
  className?: string
  priority?: boolean
  framed?: boolean
}

export function ChronosIllustration ({
  name,
  alt,
  className,
  priority = false,
  framed = true
}: ChronosIllustrationProps) {
  const src = ILLUSTRATIONS[name]

  const image = (
    <Image
      src={src}
      alt={alt}
      width={name === 'hero' ? 1200 : 800}
      height={name === 'hero' ? 675 : 600}
      priority={priority}
      className={cn('h-auto w-full object-cover', className)}
    />
  )

  if (!framed) return image

  return (
    <div className={cn('illustration-frame', className)}>
      {image}
    </div>
  )
}
