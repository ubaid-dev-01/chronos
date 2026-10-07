"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Monitor } from "lucide-react";
import { useApiClient } from "@/hooks/use-api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QueryError } from "@/components/ui/query-error";
import {
  TeamMemberSelect,
  useCurrentUser,
} from "@/components/dashboard/team-member-select";

interface AppUsage {
  processName: string;
  totalMs: number;
  totalHours: string;
  percent: number;
  windows: Array<{ windowTitle: string; totalHours: string }>;
}

interface ActivityData {
  totalHours: string;
  apps: AppUsage[];
  timeline: Array<{
    status: string;
    timestamp: number;
    processName?: string;
    windowTitle?: string;
  }>;
}

function getWeekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().split("T")[0];
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function ActivityPage() {
  const { apiFetch } = useApiClient();
  const { user, isManager, loading: userLoading } = useCurrentUser();
  const [startDate, setStartDate] = useState(getWeekAgo);
  const [endDate, setEndDate] = useState(getToday);
  const [userId, setUserId] = useState("");
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      if (user && !userId) setUserId(user._id);
    });
  }, [user, userId]);

  const fetchUsage = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        userId,
      });
      const res = await apiFetch<{ data: ActivityData }>(
        `/activity/usage?${params}`
      );
      setData(res.data);
      setError("");
    } catch (err: unknown) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, startDate, endDate, userId]);

  useEffect(() => {
    queueMicrotask(() => {
      if (userId) fetchUsage();
    });
  }, [fetchUsage, userId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="Application and window usage from tracked time"
      />

      {error && <QueryError message={error} onRetry={fetchUsage} />}

      <Card padding="sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1.5 block text-xs text-text-tertiary">
              From
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-text-tertiary">
              To
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto"
            />
          </div>
          {isManager && !userLoading && (
            <div className="min-w-[180px]">
              <label className="mb-1.5 block text-xs text-text-tertiary">
                Team member
              </label>
              <TeamMemberSelect value={userId} onChange={setUserId} />
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      ) : !data || data.apps.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <Monitor className="mb-4 h-10 w-10 text-text-tertiary" />
          <p className="text-sm font-medium text-text-primary">
            No app usage data
          </p>
          <p className="mt-1 max-w-sm text-sm text-text-secondary">
            Usage appears when the desktop agent tracks time with window titles.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2" padding="none">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-medium text-text-tertiary">
                Applications · {data.totalHours} total
              </p>
            </div>
            <ul className="divide-y divide-border">
              {data.apps.map((app) => (
                <li key={app.processName} className="px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        {app.processName}
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${app.percent}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">
                        {app.totalHours}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {app.percent}%
                      </p>
                    </div>
                  </div>
                  {app.windows.length > 0 && (
                    <ul className="mt-3 space-y-1 border-l border-border pl-3">
                      {app.windows.map((w) => (
                        <li
                          key={w.windowTitle}
                          className="flex justify-between gap-2 text-xs text-text-secondary"
                        >
                          <span className="truncate">{w.windowTitle}</span>
                          <span className="shrink-0 tabular-nums">
                            {w.totalHours}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="sm">
            <p className="mb-3 text-xs font-medium text-text-tertiary">
              Recent events
            </p>
            {data.timeline.length === 0 ? (
              <p className="text-sm text-text-tertiary">
                No granular activity events yet
              </p>
            ) : (
              <ul className="max-h-[480px] space-y-2 overflow-y-auto">
                {data.timeline.map((e, i) => (
                  <li
                    key={i}
                    className="rounded border border-border px-2 py-1.5 text-xs"
                  >
                    <span className="capitalize text-text-tertiary">
                      {e.status}
                    </span>
                    <p className="truncate font-medium text-text-primary">
                      {e.processName ?? "—"}
                    </p>
                    <p className="truncate text-text-secondary">
                      {e.windowTitle ?? "—"}
                    </p>
                    <p className="text-text-tertiary">
                      {new Date(e.timestamp).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
