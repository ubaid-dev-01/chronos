import { LegalDocument } from '@/components/marketing/legal-document'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Privacy Policy',
  description:
    'How Chronos collects, uses, stores, and protects your data. Privacy-first by design.',
  path: '/privacy'
})

const SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    paragraphs: [
      'Chronos ("we", "our", "us") provides workforce analytics software including time tracking, screenshot capture with on-device privacy processing, real-time presence, and reporting tools.',
      'This Privacy Policy explains what information we collect, how we use it, and the choices you have. We designed Chronos so that sensitive data is processed on your device before it ever reaches our servers.'
    ]
  },
  {
    id: 'information-collected',
    title: 'Information we collect',
    paragraphs: [
      'We collect information you provide directly and data generated through use of the service:'
    ],
    bullets: [
      'Account information: name, email address, organization name, and role',
      'Workspace data: time logs, project assignments, activity scores, and blurred screenshots',
      'Device data: agent version, operating system, and timezone for sync',
      'Usage analytics: feature usage and performance metrics to improve the product',
      'Billing information: processed by Stripe; we do not store full card numbers'
    ]
  },
  {
    id: 'screenshots',
    title: 'How screenshots are handled',
    paragraphs: [
      'Screenshots are blurred on your device before upload using a local Gaussian blur no image data is sent anywhere for processing. The unblurred image never leaves your machine.',
      'Blurred screenshots are encrypted in transit (TLS 1.3) and at rest (AES-256). Access is provided via time-limited presigned URLs. Organization admins can configure capture windows and excluded applications.'
    ]
  },
  {
    id: 'how-we-use',
    title: 'How we use your information',
    paragraphs: ['We use collected information to:'],
    bullets: [
      'Provide, maintain, and improve the Chronos service',
      'Generate reports and analytics for your organization',
      'Send transactional emails (invitations, billing receipts, security alerts)',
      'Detect and prevent fraud, abuse, and security incidents',
      'Comply with legal obligations'
    ]
  },
  {
    id: 'data-retention',
    title: 'Data retention',
    paragraphs: [
      'Retention periods depend on your subscription plan. Free plans retain activity data for 7 days. Starter plans retain data for 30 days. Pro and Enterprise plans have unlimited retention.',
      'You may request deletion of your personal data at any time. Organization admins can delete workspace data from the dashboard or by contacting support.'
    ]
  },
  {
    id: 'third-parties',
    title: 'Third-party services',
    paragraphs: [
      'We use trusted third-party providers to operate Chronos. Each is bound by data processing agreements:'
    ],
    bullets: [
      'Clerk authentication and user management',
      'Stripe payment processing and subscription billing',
      'AWS S3 encrypted storage for blurred screenshots and exports',
      'MongoDB Atlas encrypted database hosting for workspace data'
    ]
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    paragraphs: [
      'Depending on your location, you may have the right to access, correct, delete, or export your personal data. EU and UK residents have additional rights under GDPR including data portability and the right to object to processing.',
      'To exercise any of these rights, contact privacy@chronos.app. We will respond within 30 days.'
    ]
  },
  {
    id: 'security',
    title: 'Security',
    paragraphs: [
      'We implement industry-standard security measures including encryption at rest and in transit, regular security audits, and access controls. Our infrastructure is hosted in SOC 2 compliant data centers.',
      'Despite our efforts, no method of transmission over the Internet is 100% secure. We encourage you to use strong passwords and enable two-factor authentication through Clerk.'
    ]
  },
  {
    id: 'children',
    title: "Children's privacy",
    paragraphs: [
      'Chronos is not intended for use by individuals under 16. We do not knowingly collect personal information from children. If you believe we have collected data from a child, contact us immediately.'
    ]
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. We will notify organization admins of material changes via email or in-app notification at least 14 days before they take effect.',
      'Continued use of Chronos after changes constitutes acceptance of the updated policy.'
    ]
  }
]

export default function PrivacyPage () {
  return (
    <LegalDocument
      label='Legal'
      title='Privacy Policy'
      description='How Chronos collects, uses, stores, and protects your data and the choices you have.'
      lastUpdated='July 7, 2026'
      contactEmail='privacy@chronos.app'
      relatedLink={{ href: '/terms', label: 'Terms of Service' }}
      sections={SECTIONS}
    />
  )
}
