import { createPageMetadata } from '@/lib/seo'
import { PricingClient } from './pricing-client'

export const metadata = createPageMetadata({
  title: 'Pricing',
  description:
    'Simple, honest pricing. One person is free forever. Add your team when you need to no trials, no surprise charges.',
  path: '/pricing'
})

export default function PricingPage () {
  return <PricingClient />
}
