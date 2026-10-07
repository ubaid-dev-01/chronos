"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useApiClient } from "@/hooks/use-api-client";
import { QueryError } from "@/components/ui/query-error";

interface TimesheetRow {
  date: string;
  user: string;
  project: string;
  hours: number;
  activity: number;
}

interface TimesheetEntry {
  date?: string;
  startTime: number;
  employee?: string;
  userName?: string;
  user?: string;
  projectName?: string;
  project?: string;
  hoursWorked?: number | string;
  hours?: number | string;
  activityScore?: number | string;
  activity?: number | string;
}

export default function ReportsPage() {
  const { apiFetch, apiFetchBlob } = useApiClient();
  const [startDate, setStartDate] = useState(getWeekAgo());
  const [endDate, setEndDate] = useState(getToday());
  const [format, setFormat] = useState<"csv" | "excel">("excel");
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<TimesheetRow[]>([]);
  const [error, setError] = useState("");

  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true);
    setError("");
    try {
      const json = await apiFetch<{ data?: TimesheetEntry[] }>(
        `/reports/timesheet?startDate=${startDate}&endDate=${endDate}`
      );
      const rows: TimesheetRow[] = (json.data || []).map((entry) => {
        const hoursRaw =
          typeof entry.hoursWorked === "number"
            ? entry.hoursWorked
            : typeof entry.hours === "number"
              ? entry.hours
              : parseFloat(String(entry.hoursWorked ?? entry.hours ?? "0"));
        const activityRaw =
          typeof entry.activityScore === "number"
            ? entry.activityScore
            : typeof entry.activity === "number"
              ? entry.activity
              : parseInt(String(entry.activityScore ?? entry.activity ?? "0"), 10);
        return {
          date: entry.date || new Date(entry.startTime).toLocaleDateString(),
          user: entry.employee || entry.userName || entry.user || "Unknown",
          project: entry.projectName || entry.project || "Unassigned",
          hours: Number.isFinite(hoursRaw) ? hoursRaw : 0,
          activity: Number.isFinite(activityRaw) ? Math.round(activityRaw) : 0,
        };
      });
      setPreviewData(rows);
    } catch (err: unknown) {
      setPreviewData([]);
      setError(err instanceof Error ? err.message : "Failed to load report preview");
    } finally {
      setPreviewLoading(false);
    }
  }, [apiFetch, startDate, endDate]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchPreview();
    });
  }, [fetchPreview]);

  async function handleExport() {
    setLoading(true);
    setError("");
    try {
      const blob = await apiFetchBlob(
        `/reports/export?startDate=${startDate}&endDate=${endDate}&format=${format}`
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chronos-report-${startDate}-to-${endDate}.${
        format === "csv" ? "csv" : "xlsx"
      }`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to export report";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const totalHours = previewData.reduce((sum, r) => sum + r.hours, 0);
  const avgActivity =
    previewData.length > 0
      ? Math.round(
          previewData.reduce((sum, r) => sum + r.activity, 0) /
            previewData.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
        <p className="text-text-secondary">
          Generate and export timesheet reports
        </p>
      </div>

      {/* Export Card */}
      <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Export Timesheet</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              max={getToday()}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-surface-elevated border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              max={getToday()}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-surface-elevated border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">
              Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "csv" | "excel")}
              className="w-full bg-surface-elevated border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary"
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
            </select>
          </div>
        </div>

        {error && (
          <QueryError message={error} onRetry={fetchPreview} />
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-background hover:opacity-90 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export Report
          </button>
          <button
            onClick={fetchPreview}
            disabled={previewLoading}
            className="flex items-center gap-2 px-4 py-2 border border-border hover:bg-surface-elevated rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${previewLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {previewData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-text-secondary">Total Hours</p>
            <p className="text-2xl font-bold text-text-primary">
              {totalHours.toFixed(1)}h
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-text-secondary">Avg Activity</p>
            <p className="text-2xl font-bold text-text-primary">{avgActivity}%</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-text-secondary">Entries</p>
            <p className="text-2xl font-bold text-text-primary">
              {previewData.length}
            </p>
          </div>
        </div>
      )}

      {/* Report Preview Table */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Report Preview
        </h2>
        {previewLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">
                    Employee
                  </th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">
                    Project
                  </th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">
                    Hours
                  </th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">
                    Activity
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-text-secondary"
                    >
                      <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>No timesheet data for the selected date range.</p>
                      <p className="text-xs mt-1">
                        Data will appear once your team starts tracking with the
                        desktop agent.
                      </p>
                    </td>
                  </tr>
                ) : (
                  previewData.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-white/5 hover:bg-white/[0.02]"
                    >
                      <td className="py-3 px-4 text-text-primary">{row.date}</td>
                      <td className="py-3 px-4 text-text-primary">{row.user}</td>
                      <td className="py-3 px-4 text-text-primary">{row.project}</td>
                      <td className="py-3 px-4 text-right text-text-primary font-medium">
                        {row.hours.toFixed(1)}h
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            row.activity >= 70
                              ? "border-success/50 text-success"
                              : row.activity >= 40
                              ? "border-warning/50 text-warning"
                              : "border-danger/50 text-danger"
                          }`}
                        >
                          {row.activity}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getWeekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}
