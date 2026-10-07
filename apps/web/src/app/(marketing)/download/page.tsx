import { createPageMetadata } from '@/lib/seo'
import { DownloadClient } from './download-client'

export const metadata = createPageMetadata({
  title: 'Download',
  description:
    'Download the Chronos desktop agent for Windows, macOS, and Linux. Task-based time tracking with on-device privacy blur.',
  path: '/download'
})

export default function DownloadPage () {
  return <DownloadClient />
}
