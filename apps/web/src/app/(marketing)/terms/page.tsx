import { LegalDocument } from '@/components/marketing/legal-document'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Terms of Service',
  description:
    'The agreement between you and Chronos governing use of our workforce analytics platform.',
  path: '/terms'
})

const SECTIONS = [
  {
    id: 'acceptance',
    title: 'Acceptance of terms',
    paragraphs: [
      'By accessing or using Chronos ("the Service"), you agree to be bound by these Terms of Service. If you are using Chronos on behalf of an organization, you represent that you have authority to bind that organization to these terms.',
      'If you do not agree to these terms, you may not use the Service.'
    ]
  },
  {
    id: 'service',
    title: 'Service description',
    paragraphs: [
      'Chronos provides workforce analytics software including time tracking, screenshot capture with on-device privacy processing, real-time team presence, AI-powered burnout detection, and reporting tools.',
      'We reserve the right to modify, suspend, or discontinue any part of the Service with reasonable notice to paying customers.'
    ]
  },
  {
    id: 'accounts',
    title: 'Accounts and responsibilities',
    paragraphs: [
      'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.',
      'Organization administrators are responsible for how the Service is used within their workspace, including ensuring compliance with applicable employment and privacy laws in their jurisdiction.'
    ],
    bullets: [
      'Notify us immediately of any unauthorized access',
      'Ensure team members are informed about data collection practices',
      'Configure capture settings appropriately for your organization',
      'Do not share admin credentials with unauthorized persons'
    ]
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    paragraphs: [
      'You agree to use Chronos only for lawful purposes and in accordance with these terms. You may not:'
    ],
    bullets: [
      'Use the Service to harass, surveil, or monitor employees without appropriate notice and consent',
      'Attempt to access unblurred screenshots or circumvent privacy protections',
      'Reverse engineer, decompile, or attempt to extract source code from the agent',
      'Use automated systems to scrape or overload our infrastructure',
      'Resell or sublicense the Service without written permission'
    ]
  },
  {
    id: 'billing',
    title: 'Billing and subscriptions',
    paragraphs: [
      'Paid plans are billed monthly in advance. Prices are listed on our pricing page and may change with 30 days notice to existing subscribers.',
      'Upgrades take effect immediately and are prorated. Downgrades apply at the end of the current billing period. The free plan requires no payment method.',
      'Refunds are handled on a case-by-case basis within 14 days of charge. Contact billing@chronos.app for billing inquiries.'
    ]
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual property',
    paragraphs: [
      'Chronos and its original content, features, and functionality are owned by Chronos and protected by international copyright, trademark, and other intellectual property laws.',
      'You retain ownership of your workspace data. By using the Service, you grant us a limited license to process your data solely to provide the Service.'
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy',
    paragraphs: [
      'Your use of the Service is also governed by our Privacy Policy, which describes how we collect, use, and protect your information.',
      'By using Chronos, you consent to the data practices described in the Privacy Policy.'
    ]
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    paragraphs: [
      'The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.',
      'We do not warrant that the Service will be uninterrupted, error-free, or completely secure.'
    ]
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    paragraphs: [
      'To the maximum extent permitted by law, Chronos shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill.',
      'Our total liability for any claim arising from these terms or the Service shall not exceed the amount you paid us in the 12 months preceding the claim.'
    ]
  },
  {
    id: 'termination',
    title: 'Termination',
    paragraphs: [
      'You may cancel your account at any time from the dashboard or by contacting support. We may suspend or terminate your access if you violate these terms.',
      'Upon termination, your right to use the Service ceases immediately. We will retain your data for 30 days to allow export, after which it will be deleted unless legally required to retain it.'
    ]
  },
  {
    id: 'governing-law',
    title: 'Governing law',
    paragraphs: [
      'These terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.',
      'Any disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except where prohibited by law.'
    ]
  }
]

export default function TermsPage () {
  return (
    <LegalDocument
      label='Legal'
      title='Terms of Service'
      description='The agreement between you and Chronos governing use of our workforce analytics platform.'
      lastUpdated='July 7, 2026'
      contactEmail='legal@chronos.app'
      relatedLink={{ href: '/privacy', label: 'Privacy Policy' }}
      sections={SECTIONS}
    />
  )
}
