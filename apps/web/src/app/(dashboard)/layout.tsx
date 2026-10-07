import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import type { IUserPermissions } from "@chronos/types";
import { getCurrentUser, getCurrentOrg } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { WebSocketProvider } from "@/providers/websocket-provider";
import { TimerProvider } from "@/providers/timer-provider";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Dashboard",
};

const MEMBER_PERMISSION_ROUTES: Array<[string, keyof IUserPermissions]> = [
  ["/activity", "activityEnabled"],
  ["/reports", "reportsEnabled"],
  ["/screenshots", "screenshotsEnabled"],
  ["/tasks", "tasksEnabled"],
  ["/comments", "commentsEnabled"],
  ["/focus", "insightsEnabled"],
  ["/pulse", "insightsEnabled"],
  ["/health", "insightsEnabled"],
  ["/achievements", "insightsEnabled"],
];

function permissionForPath(pathname: string): keyof IUserPermissions | null {
  for (const [prefix, flag] of MEMBER_PERMISSION_ROUTES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return flag;
  }
  return null;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.isActive) redirect("/account-deactivated");

  const org = await getCurrentOrg();
  if (!org) redirect("/sign-up");
  if (!org.isActive) redirect("/workspace-suspended");

  const pathname = (await headers()).get("x-pathname") || "";
  if (user.role === "member") {
    const flag = permissionForPath(pathname);
    if (flag && user.permissions?.[flag] === false) {
      redirect("/dashboard");
    }
  }

  return (
    <WebSocketProvider orgId={org._id} userId={user._id}>
      <TimerProvider>
        <SidebarProvider>
          <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar
              userName={user.displayName}
              userRole={user.role}
              orgName={org.name}
              planTier={org.planTier}
              permissions={user.permissions}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </TimerProvider>
    </WebSocketProvider>
  );
}
