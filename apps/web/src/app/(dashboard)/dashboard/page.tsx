import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectDB, TimeLog, mongoose } from "@chronos/db";
import { StatCards } from "@/components/dashboard/stat-cards";
import { PresenceGrid } from "@/components/dashboard/presence-grid";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { RecentScreenshots } from "@/components/dashboard/recent-screenshots";

async function getWeeklyActivity(orgId: string) {
  await connectDB();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const now = Date.now();
    const logs = await TimeLog.aggregate([
      {
        $match: {
          orgId: new mongoose.Types.ObjectId(orgId),
          startTime: { $gte: start.getTime(), $lt: end.getTime() },
        },
      },
      {
        $group: {
          _id: null,
          totalMs: {
            $sum: { $subtract: [{ $ifNull: ["$endTime", now] }, "$startTime"] },
          },
          avgActivity: { $avg: "$activityScore" },
        },
      },
    ]);

    const totalHours = (logs[0]?.totalMs || 0) / 3600000;
    const avgActivity = logs[0]?.avgActivity || 0;
    const activeHours = Math.round(totalHours * avgActivity * 10) / 10;
    const idleHours = Math.round((totalHours - activeHours) * 10) / 10;

    days.push({
      date: start.toLocaleDateString("en", { weekday: "short" }),
      activeHours: Math.max(0, activeHours),
      idleHours: Math.max(0, idleHours),
    });
  }
  return days;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const activityData = await getWeeklyActivity(user.orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium tracking-tight text-text-primary">
          Overview
        </h1>
        <p className="mt-0.5 text-sm text-text-secondary">
          Real-time snapshot of your team
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <StatCards orgId={user.orgId} />
      </Suspense>

      <PresenceGrid />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart data={activityData} />
        </div>
        <RecentScreenshots />
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-lg border border-border bg-surface"
        />
      ))}
    </div>
  );
}
