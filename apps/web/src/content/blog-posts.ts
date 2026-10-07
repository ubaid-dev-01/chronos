import type { IllustrationKey } from '@/components/marketing/chronos-illustration'

export type BlogCategory = 'Engineering' | 'Product' | 'Company'

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: BlogCategory
  author: {
    name: string
    role: string
  }
  image: IllustrationKey
  featured?: boolean
  content: BlogSection[]
}

export type BlogSection =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string; attribution?: string }

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'on-device-blur',
    title: 'Why we blur screenshots on-device',
    excerpt:
      'The architectural decision behind Chronos privacy and why server-side blur was never an option.',
    date: 'Jun 12, 2026',
    readTime: '6 min read',
    category: 'Engineering',
    author: { name: 'Marcus Webb', role: 'CTO' },
    image: 'privacy',
    featured: true,
    content: [
      {
        type: 'paragraph',
        text: 'When we started building Chronos, the first question from every prospect was the same: "What happens to screenshots?" It is a fair question. Screenshot capture is the feature people love to hate in time tracking software.'
      },
      {
        type: 'paragraph',
        text: 'Our answer was simple but technically demanding: sensitive content must be blurred before it ever leaves the employee\'s machine. Not after upload. Not in a background job. On-device, synchronously, before the network stack is involved.'
      },
      {
        type: 'heading',
        text: 'Why server-side blur fails'
      },
      {
        type: 'paragraph',
        text: 'Server-side blur means the raw screenshot travels over the wire first. Even with TLS, you are trusting that the unblurred image never sits on a disk you do not control, never appears in a log, never gets cached by a CDN edge node.'
      },
      {
        type: 'list',
        items: [
          'Raw screenshots pass through your infrastructure a compliance liability',
          'Blur quality depends on network latency and queue depth',
          'Employees cannot verify what left their machine',
          'A single misconfigured bucket exposes everything'
        ]
      },
      {
        type: 'heading',
        text: 'Blur on every workstation'
      },
      {
        type: 'paragraph',
        text: 'Chronos applies a full-frame Gaussian blur inside the desktop agent, on the same machine that captured the screenshot, before the image is ever serialized or queued for upload. Text becomes unreadable while overall layout and color stay visible enough for proof-of-work, not enough to read a Slack message.'
      },
      {
        type: 'quote',
        text: 'We designed the system so that even we cannot retrieve an unblurred screenshot. That is not a policy statement it is an architectural guarantee.',
        attribution: 'Marcus Webb, CTO'
      },
      {
        type: 'paragraph',
        text: 'The blur runs in a few milliseconds on average hardware. Employees can define capture windows, exclude specific applications, and pause tracking entirely. Legal teams get the audit trail they need without the surveillance optics. Selective, ML-based redaction of specific regions (faces, form fields) is on our roadmap.'
      }
    ]
  },
  {
    slug: 'lightweight-agent',
    title: 'Building a 3 MB time tracker',
    excerpt:
      'How Tauri and Rust let us ship an agent that uses less RAM than a browser tab.',
    date: 'May 28, 2026',
    readTime: '5 min read',
    category: 'Engineering',
    author: { name: 'Alex Kim', role: 'Lead Engineer' },
    image: 'agent',
    content: [
      {
        type: 'paragraph',
        text: 'Most desktop time trackers ship Electron bundles north of 200 MB. They idle at 150–300 MB RAM and spin up multiple Chromium processes just to show a tray icon. Your team did not sign up for that.'
      },
      {
        type: 'heading',
        text: 'Tauri over Electron'
      },
      {
        type: 'paragraph',
        text: 'We chose Tauri 2 with a Rust backend and no embedded browser for the agent UI. The settings panel loads a minimal webview only when opened. Day-to-day tracking runs as a native system tray process.'
      },
      {
        type: 'list',
        items: [
          'Binary size: 3.1 MB (Windows), 3.4 MB (macOS)',
          'Idle RAM: ~15 MB including the ML model',
          'Cold start: under 200ms',
          'Silent background updates via Tauri updater'
        ]
      },
      {
        type: 'heading',
        text: 'Offline-first by default'
      },
      {
        type: 'paragraph',
        text: 'Activity events are written to a local SQLite database first. When connectivity returns, a background sync worker batches uploads with exponential backoff. Your team keeps working on flights, in coffee shops, and during ISP outages.'
      },
      {
        type: 'quote',
        text: 'If your time tracker needs more resources than the work it is tracking, something is wrong.',
        attribution: 'Alex Kim, Lead Engineer'
      }
    ]
  },
  {
    slug: 'realtime-presence',
    title: 'Presence without polling',
    excerpt:
      'WebSocket architecture for sub-second team status updates across time zones.',
    date: 'May 3, 2026',
    readTime: '7 min read',
    category: 'Engineering',
    author: { name: 'Jordan Lee', role: 'Backend Engineer' },
    image: 'presence',
    content: [
      {
        type: 'paragraph',
        text: 'Managers do not want a dashboard that says someone was active "12 minutes ago." They want to know who is working right now especially across distributed teams in four or more time zones.'
      },
      {
        type: 'heading',
        text: 'The polling problem'
      },
      {
        type: 'paragraph',
        text: 'Polling every 30 seconds means stale data, wasted requests, and battery drain on laptops. Polling every 5 seconds does not scale past a few hundred users. We needed push-based updates with guaranteed delivery.'
      },
      {
        type: 'heading',
        text: 'WebSocket presence channels'
      },
      {
        type: 'paragraph',
        text: 'Each workspace gets a dedicated presence channel. When an agent detects activity state changes focused, idle, away, offline it pushes an event through a persistent WebSocket connection. The dashboard subscribes and renders updates in under one second.'
      },
      {
        type: 'list',
        items: [
          'Sub-second latency for status changes',
          'Automatic reconnection with state reconciliation',
          'Timezone-aware "working hours" indicators',
          'No polling zero idle network traffic'
        ]
      },
      {
        type: 'paragraph',
        text: 'Presence is a Pro plan feature because it requires persistent connections per workspace. For smaller teams, the activity feed with 5-minute granularity on Starter is usually enough.'
      }
    ]
  },
  {
    slug: 'burnout-signals',
    title: 'Detecting burnout before it escalates',
    excerpt:
      'How we use work-cadence patterns to surface overtime trends without surveillance.',
    date: 'Apr 18, 2026',
    readTime: '5 min read',
    category: 'Product',
    author: { name: 'Sarah Chen', role: 'Head of Product' },
    image: 'analytics',
    content: [
      {
        type: 'paragraph',
        text: 'Burnout does not announce itself. It shows up as gradually longer days, weekend logins, and shrinking focus blocks. Chronos watches for these patterns so managers can intervene early with empathy, not surveillance.'
      },
      {
        type: 'heading',
        text: 'Signals we track'
      },
      {
        type: 'list',
        items: [
          'Week-over-week increase in total hours',
          'Rising ratio of after-hours activity',
          'Declining average focus session length',
          'Irregular schedule shifts across consecutive weeks'
        ]
      },
      {
        type: 'paragraph',
        text: 'These signals appear as weekly digest emails to managers and as optional dashboard alerts. Employees always see their own data first. Managers see team-level aggregates, never individual screenshots tied to burnout flags.'
      },
      {
        type: 'quote',
        text: 'The goal is a conversation starter, not a performance review input.',
        attribution: 'Sarah Chen, Head of Product'
      }
    ]
  },
  {
    slug: 'free-tier-philosophy',
    title: 'Why one person is free forever',
    excerpt:
      'Our pricing philosophy: let individuals and freelancers prove value before asking for a credit card.',
    date: 'Apr 2, 2026',
    readTime: '4 min read',
    category: 'Company',
    author: { name: 'Sarah Chen', role: 'Head of Product' },
    image: 'hero',
    content: [
      {
        type: 'paragraph',
        text: 'We do not believe in 14-day trials that auto-convert. If you are a freelancer tracking your own time, Chronos should be useful on day one without a credit card, without a sales call, and without an expiration date.'
      },
      {
        type: 'heading',
        text: 'What free includes'
      },
      {
        type: 'list',
        items: [
          'Unlimited time tracking for one user',
          'One active project',
          '7-day activity history',
          'Desktop agent for all platforms',
          'Basic weekly reports'
        ]
      },
      {
        type: 'paragraph',
        text: 'When you hire your first teammate, you upgrade to Starter. When you need screenshots and privacy blur, you are already on Starter. The free tier is not a demo it is a complete product for solo workers.'
      }
    ]
  },
  {
    slug: 'distributed-team-playbook',
    title: 'A playbook for distributed team visibility',
    excerpt:
      'Practical guidelines for using Chronos across time zones without creating surveillance culture.',
    date: 'Mar 15, 2026',
    readTime: '8 min read',
    category: 'Product',
    author: { name: 'Maya Rodriguez', role: 'Customer Success' },
    image: 'about',
    content: [
      {
        type: 'paragraph',
        text: 'Distributed teams need visibility into who is available, not surveillance into what people are doing. After onboarding hundreds of remote teams, we have seen what works and what creates resentment.'
      },
      {
        type: 'heading',
        text: 'Set expectations upfront'
      },
      {
        type: 'list',
        items: [
          'Tell your team why you are using Chronos and what you will not monitor',
          'Disable screenshot capture unless there is a clear business need',
          'Use presence for coordination, not for measuring productivity',
          'Review weekly reports in 1:1s, not in public channels'
        ]
      },
      {
        type: 'heading',
        text: 'Timezone-aware scheduling'
      },
      {
        type: 'paragraph',
        text: 'Chronos marks each team member\'s working hours based on their local timezone. The dashboard shows who is in their focus window, who is on break, and who has ended their day without exposing keystroke counts or app-level detail.'
      },
      {
        type: 'quote',
        text: 'The best teams use Chronos to reduce Slack pings, not to increase them.',
        attribution: 'Maya Rodriguez, Customer Success'
      }
    ]
  }
]

export function getPostBySlug (slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.slug === slug)
}

export function getFeaturedPost (): BlogPost {
  return BLOG_POSTS.find(p => p.featured) ?? BLOG_POSTS[0]
}

export function getRelatedPosts (slug: string, limit = 3): BlogPost[] {
  const current = getPostBySlug(slug)
  if (!current) return BLOG_POSTS.slice(0, limit)
  return BLOG_POSTS.filter(
    p => p.slug !== slug && p.category === current.category
  ).slice(0, limit)
}
