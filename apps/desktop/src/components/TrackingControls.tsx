import { useState } from "react";
import type { TrackerStatus } from "../App";
import { invokeCommand, isTauri } from "../lib/tauri";

interface Props {
  state: string;
  projectId: string;
  taskId?: string;
  taskLabel?: string;
  onStatusChange: (status: TrackerStatus) => void;
  canTrackOffline?: boolean;
  offline?: boolean;
}

export default function TrackingControls({
  state,
  projectId,
  taskId,
  taskLabel,
  onStatusChange,
  canTrackOffline = true,
  offline = false,
}: Props) {
  const [error, setError] = useState("");
  const browserPreview = !isTauri();

  const run = async (fn: () => Promise<TrackerStatus>) => {
    setError("");
    try {
      onStatusChange(await fn());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Tracking action failed"
      );
    }
  };

  const handleStart = async () => {
    if (!projectId) return;
    if (browserPreview) {
      setError("Tracking requires the Tauri desktop app (`pnpm tauri dev`).");
      return;
    }
    if (offline && !canTrackOffline) {
      setError("Offline tracking is disabled for your account.");
      return;
    }
    await run(() =>
      invokeCommand<TrackerStatus>("start_tracking", {
        projectId,
        taskId: taskId || null,
        label: taskLabel || null,
      })
    );
  };

  return (
    <div className="mb-3">
      <div className="flex gap-2">
        {state === "Idle" && (
          <button
            onClick={handleStart}
            disabled={!projectId}
            className="chronos-btn-primary flex-1 py-3"
          >
            Start Tracking
          </button>
        )}

        {state === "Active" && (
          <>
            <button
              onClick={() => run(() => invokeCommand("pause_tracking"))}
              className="flex-1 rounded-lg bg-warning/20 py-3 text-sm font-medium text-warning hover:bg-warning/30"
            >
              Pause
            </button>
            <button
              onClick={() => run(() => invokeCommand("stop_tracking"))}
              className="flex-1 rounded-lg bg-danger/20 py-3 text-sm font-medium text-danger hover:bg-danger/30"
            >
              Stop
            </button>
          </>
        )}

        {(state === "Paused" || state === "AwayIdle") && (
          <>
            <button
              onClick={() => run(() => invokeCommand("resume_tracking"))}
              className="flex-1 rounded-lg bg-success/20 py-3 text-sm font-medium text-success hover:bg-success/30"
            >
              Resume
            </button>
            <button
              onClick={() => run(() => invokeCommand("stop_tracking"))}
              className="flex-1 rounded-lg bg-danger/20 py-3 text-sm font-medium text-danger hover:bg-danger/30"
            >
              Stop
            </button>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
