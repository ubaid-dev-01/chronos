"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Clock,
  Camera,
  FileBarChart,
  Settings,
  CreditCard,
  CalendarDays,
  ListTodo,
  MessageSquare,
  Monitor,
  Gauge,
  Radio,
  HeartPulse,
  Trophy,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSidebar } from "@/components/layout/sidebar-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  /** Hide this item unless the current user's permission flag is true */
  permission?:
    | "tasksEnabled"
    | "screenshotsEnabled"
    | "activityEnabled"
    | "reportsEnabled"
    | "commentsEnabled"
    | "insightsEnabled";
}

const NAV_MAIN: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/summary", label: "Summary", icon: CalendarDays },
  {
    href: "/activity",
    label: "Activity",
    icon: Monitor,
    permission: "activityEnabled",
  },
  { href: "/team", label: "Team", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListTodo, permission: "tasksEnabled" },
  {
    href: "/screenshots",
    label: "Screenshots",
    icon: Camera,
    permission: "screenshotsEnabled",
  },
  {
    href: "/comments",
    label: "Comments",
    icon: MessageSquare,
    permission: "commentsEnabled",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: FileBarChart,
    permission: "reportsEnabled",
  },
];

const NAV_INSIGHTS: NavItem[] = [
  {
    href: "/focus",
    label: "Focus score",
    icon: Gauge,
    permission: "insightsEnabled",
  },
  {
    href: "/pulse",
    label: "Team pulse",
    icon: Radio,
    permission: "insightsEnabled",
  },
  {
    href: "/health",
    label: "Project health",
    icon: HeartPulse,
    permission: "insightsEnabled",
  },
  {
    href: "/achievements",
    label: "Achievements",
    icon: Trophy,
    permission: "insightsEnabled",
  },
];

const NAV_PERSONAL: NavItem[] = [
  { href: "/my", label: "My time", icon: Clock },
];

const NAV_ADMIN: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
  {
    href: "/settings/members",
    label: "Members",
    icon: Users,
    roles: ["admin", "manager"],
  },
  {
    href: "/settings/billing",
    label: "Billing",
    icon: CreditCard,
    roles: ["admin"],
  },
];

interface SidebarProps {
  userName: string;
  userRole: string;
  orgName: string;
  planTier: string;
  permissions?: {
    tasksEnabled?: boolean;
    screenshotsEnabled?: boolean;
    activityEnabled?: boolean;
    reportsEnabled?: boolean;
    commentsEnabled?: boolean;
    insightsEnabled?: boolean;
  };
}

function NavLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
        isActive
          ? "bg-surface-elevated font-medium text-text-primary"
          : "text-text-secondary hover:bg-surface-elevated/60 hover:text-text-primary"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" />
      {item.label}
    </Link>
  );
}

export function Sidebar({
  userName,
  userRole,
  orgName,
  planTier,
  permissions,
}: SidebarProps) {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebar();

  const adminItems = NAV_ADMIN.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  function canSee(item: NavItem) {
    if (!item.permission) return true;
    // Admins/managers always see menu items so they can manage the product;
    // members only see items when the flag is enabled (default true).
    if (userRole === "admin" || userRole === "manager") return true;
    return permissions?.[item.permission] !== false;
  }

  const mainItems = NAV_MAIN.filter(canSee);
  const insightItems = NAV_INSIGHTS.filter(canSee);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 ease-in-out",
          "lg:static lg:z-auto lg:w-56 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <span className="flex h-5 w-5 items-center justify-center rounded border border-border bg-background text-[10px] font-mono font-medium">
          C
        </span>
        <span className="text-sm font-medium tracking-tight">Chronos</span>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-border px-4 py-3">
        <p className="truncate text-sm font-medium text-text-primary">
          {orgName}
        </p>
        <p className="text-xs capitalize text-text-tertiary">{planTier} plan</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          <p className="label-caps mb-2 px-2.5 text-text-tertiary">Workspace</p>
          {mainItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {insightItems.length > 0 && (
          <div className="space-y-0.5">
            <p className="label-caps mb-2 px-2.5 text-text-tertiary">Insights</p>
            {insightItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        )}

        <div className="space-y-0.5">
          <p className="label-caps mb-2 px-2.5 text-text-tertiary">Personal</p>
          {NAV_PERSONAL.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {adminItems.length > 0 && (
          <div className="space-y-0.5">
            <p className="label-caps mb-2 px-2.5 text-text-tertiary">Admin</p>
            {adminItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              {userName}
            </p>
            <p className="text-xs capitalize text-text-tertiary">{userRole}</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
      </aside>
    </>
  );
}
