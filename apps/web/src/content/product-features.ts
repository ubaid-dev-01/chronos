import type { LucideIcon } from 'lucide-react'
import {
    BarChart3,
    Calendar,
    Camera,
    Code2,
    Cpu,
    FileBarChart,
    FolderKanban,
    ListTodo,
    Lock,
    MessageSquare,
    Shield,
    Users,
    Wallet,
    WifiOff,
    Zap
} from 'lucide-react'

export interface ProductCapability {
  icon: LucideIcon
  title: string
  description: string
  variant: 'ink' | 'surface'
  tag?: string
}

export interface SaasModule {
  icon: LucideIcon
  name: string
  description: string
}

export interface CompetitorRow {
  feature: string
  chronos: boolean | string
  tahometer: boolean | string
}

/** Hero + capabilities grid (landing page) */
export const CORE_CAPABILITIES: ProductCapability[] = [
  {
    icon: Shield,
    title: 'On-device privacy blur',
    description:
      'Screenshots run through a Gaussian blur on-device before upload. SHA-256 integrity hashes. The unblurred image never leaves the machine.',
    variant: 'ink',
    tag: 'GDPR-ready'
  },
  {
    icon: Zap,
    title: 'Real-time presence',
    description:
      'WebSocket updates under 1 second. Live team grid, idle/focus states, no polling dashboards.',
    variant: 'surface'
  },
  {
    icon: BarChart3,
    title: 'AI workforce intelligence',
    description:
      'Burnout prediction, auto-categorization, anomaly detection, and natural-language report summaries.',
    variant: 'ink'
  },
  {
    icon: Cpu,
    title: '3 MB desktop agent',
    description:
      'Tauri/Rust agent for Windows, macOS, and Linux. Offline SQLite cache, silent auto-updates.',
    variant: 'surface',
    tag: '3–10 MB'
  },
  {
    icon: Wallet,
    title: 'Automated payroll',
    description:
      'CSV/Excel export, hours × rate calculations, Deel/Wise/Payoneer APIs, and approval workflows.',
    variant: 'ink'
  },
  {
    icon: Code2,
    title: 'Public REST API',
    description:
      'Automate payment calculations and reporting. Webhooks and JS/Python SDKs for your stack.',
    variant: 'surface',
    tag: 'API'
  },
  {
    icon: WifiOff,
    title: 'Offline-first tracking',
    description:
      'Work without internet. Local WAL cache syncs automatically when connection returns.',
    variant: 'ink'
  },
  {
    icon: Lock,
    title: 'Enterprise security',
    description:
      'JWT + RBAC, audit logs, AES-256 at rest, zero-trust API. SSO/SAML coming soon on Enterprise.',
    variant: 'surface'
  }
]

/** Full dashboard modules (Tahometer parity + more) */
export const SAAS_MODULES: SaasModule[] = [
  {
    icon: Calendar,
    name: 'Summary',
    description: 'Calendar view, weekly totals, day drill-down, heat-map hours'
  },
  {
    icon: Camera,
    name: 'Activity',
    description: 'Screenshot timeline, keyboard/mouse %, multi-monitor, time lock'
  },
  {
    icon: ListTodo,
    name: 'Tasks',
    description: 'Task lists, assignees, per-list tracking, import/export'
  },
  {
    icon: FolderKanban,
    name: 'Projects',
    description: 'Budget limits, deadlines, team access, offline policy per project'
  },
  {
    icon: Users,
    name: 'Users',
    description: 'Roles, weekly caps, online/offline rates, granular permissions'
  },
  {
    icon: FileBarChart,
    name: 'Reports',
    description: 'Activity reports, user groups, CSV/XLS export, billing amounts'
  },
  {
    icon: MessageSquare,
    name: 'Comments',
    description: 'Manager and worker notes on time blocks and activity'
  }
]

/** Landing comparison vs legacy trackers */
export const COMPETITOR_COMPARISON: CompetitorRow[] = [
  { feature: 'On-device screenshot blur', chronos: true, tahometer: false },
  { feature: 'Real-time presence (<1s)', chronos: true, tahometer: false },
  { feature: 'AI burnout + auto-categorization', chronos: true, tahometer: false },
  { feature: 'Payroll API (Deel/Wise)', chronos: true, tahometer: false },
  { feature: 'Offline SQLite sync', chronos: true, tahometer: true },
  { feature: 'Public REST API', chronos: true, tahometer: true },
  { feature: 'CSV/Excel payroll export', chronos: true, tahometer: true },
  { feature: 'Week timetable lock', chronos: true, tahometer: true },
  { feature: 'Linux desktop agent', chronos: true, tahometer: true },
  { feature: 'Agent size', chronos: '3–10 MB', tahometer: '30 MB+' },
  { feature: 'RAM usage', chronos: '15–50 MB', tahometer: '100–300 MB' }
]

/** Extended features page sections */
export const FEATURE_SECTIONS = [
  {
    id: 'privacy',
    label: 'Privacy',
    title: 'Proof of work without exposing personal data',
    description:
      'Screenshots are Gaussian-blurred on-device before upload. Cryptographic hashes verify integrity. Employees get a privacy dashboard and consent controls.',
    points: [
      'Full-frame blur applied on device before upload',
      'SHA-256 screenshot integrity',
      'Configurable blur strength per organization',
      'AES-256 encrypted storage'
    ],
    illustration: 'privacy' as const
  },
  {
    id: 'presence',
    label: 'Real-time',
    title: 'Live operations, not yesterday\'s batch sync',
    description:
      'WebSocket presence shows who is active, idle, or offline instantly. Managers see activity charts and team grids without refreshing.',
    points: [
      'Sub-second presence updates',
      '7-day activity visualization',
      'Deep work detection',
      'Timezone-aware scheduling'
    ],
    illustration: 'presence' as const
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    title: 'AI that acts before problems escalate',
    description:
      'Burnout risk scores, auto project categorization from window titles, anomaly flags, and daily NL summaries for managers.',
    points: [
      'Burnout prediction engine',
      'Auto time categorization',
      'Fraud & anomaly detection',
      'Natural-language report summaries'
    ],
    illustration: 'analytics' as const
  },
  {
    id: 'payroll',
    label: 'Payroll',
    title: 'From tracked hours to paid contractors',
    description:
      'Online and offline hourly rates, automated amount calculations, CSV/XLS/PDF export, and direct Deel, Wise, Payoneer integration.',
    points: [
      'Dual online/offline rates',
      'One-click payroll export',
      'Manager approval workflows',
      'Public API for automation'
    ],
    illustration: 'analytics' as const
  },
  {
    id: 'agent',
    label: 'Agent',
    title: 'Desktop software your team forgets is running',
    description:
      'Tauri agent: 3 MB binary, ~15 MB RAM, idle detection, offline time entry, multi-monitor capture, silent updates.',
    points: [
      'Windows, macOS, Linux',
      'Offline WAL cache',
      'Configurable screenshot interval',
      'System tray + hotkeys'
    ],
    illustration: 'agent' as const
  },
  {
    id: 'saas',
    label: 'SaaS platform',
    title: 'Seven dashboard modules, one subscription',
    description:
      'Summary, Activity, Tasks, Projects, Users, Reports, and Comments full Tahometer parity with a modern dark UI and role-based access.',
    points: [
      'Admin / Manager / Member roles',
      'Per-user weekly hour limits',
      'Project budget & deadline alerts',
      'Stripe billing with seat limits'
    ],
    illustration: 'hero' as const
  }
]
