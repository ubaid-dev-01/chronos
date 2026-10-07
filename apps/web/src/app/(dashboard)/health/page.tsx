"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, HeartPulse, ListChecks, Users } from "lucide-react";
import { useApiClient } from "@/hooks/use-api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ProjectHealth {
  projectId: string;
  name: string;
  colorHex: string;
  status: "green" | "yellow" | "red";
  healthScore: number;
  hoursLogged: number;
  budgetHours: number | null;
  budgetUsedPercent: number | null;
  taskCompletionRate: number | null;
  totalTasks: number;
  completedTasks: number;
  avgBurnoutScore: number | null;
  contributorCount: number;
}

function getMonthAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toISOString().split("T")[0];
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

const STATUS_STYLES: Record<ProjectHealth["status"], { dot: string; ring: string; label: string }> = {
  green: { dot: "bg-success", ring: "border-l-success", label: "Healthy" },
  yellow: { dot: "bg-warning", ring: "border-l-warning", label: "At risk" },
  red: { dot: "bg-danger", ring: "border-l-danger", label: "Needs attention" },
};

export default function ProjectHealthPage() {
  const { apiFetch } = useApiClient();
  const [startDate, setStartDate] = useState(getMonthAgo);
  const [endDate, setEndDate] = useState(getToday);
  const [projects, setProjects] = useState<ProjectHealth[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await apiFetch<{ data: ProjectHealth[] }>(
        `/analytics/project-health?${params}`
      );
      setProjects(res.data);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, startDate, endDate]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchHealth();
    });
  }, [fetchHealth]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Health"
        description="Budget burn, task completion, and contributor burnout risk per project"
      />

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
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      ) : projects.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <HeartPulse className="mb-4 h-10 w-10 text-text-tertiary" />
          <p className="text-sm font-medium text-text-primary">
            No active projects with tracked time in this range
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const style = STATUS_STYLES[p.status];
            return (
              <Card
                key={p.projectId}
                padding="md"
                className={`border-l-4 ${style.ring}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: p.colorHex }}
                    />
                    <p className="font-medium text-text-primary">{p.name}</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {style.label}
                  </span>
                </div>

                <p className="mt-3 font-mono text-3xl font-medium tracking-tight text-text-primary">
                  {p.healthScore}
                  <span className="text-sm text-text-tertiary">/100</span>
                </p>

                <div className="mt-4 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Hours logged</span>
                    <span className="font-mono text-text-primary">
                      {p.hoursLogged}h
                      {p.budgetHours != null && (
                        <span className="text-text-tertiary">
                          {" "}
                          / {p.budgetHours}h ({p.budgetUsedPercent}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      <ListChecks className="h-3.5 w-3.5" /> Tasks
                    </span>
                    <span className="font-mono text-text-primary">
                      {p.totalTasks > 0
                        ? `${p.completedTasks}/${p.totalTasks} (${p.taskCompletionRate}%)`
                        : "No tasks"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      <Users className="h-3.5 w-3.5" /> Contributors
                    </span>
                    <span className="font-mono text-text-primary">
                      {p.contributorCount}
                      {p.avgBurnoutScore != null && (
                        <span className="text-text-tertiary">
                          {" "}
                          · avg burnout {p.avgBurnoutScore}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
