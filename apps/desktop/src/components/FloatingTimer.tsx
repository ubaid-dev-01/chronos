import { useEffect, useState } from "react";
import ChronosLogoMark from "./ChronosLogoMark";
import TimerDisplay from "./TimerDisplay";
import { getAuthStatus, invokeCommand, isTauri } from "../lib/tauri";
import type { TrackerStatus } from "../App";

/** Compact always-on-top floating timer view (`?view=timer`). */
export default function FloatingTimer() {
  const [status, setStatus] = useState<TrackerStatus | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    getAuthStatus()
      .then((a) => setEmail(a.email || ""))
      .catch(() => {});

    if (!isTauri()) return;
    const id = setInterval(async () => {
      try {
        setStatus(await invokeCommand<TrackerStatus>("get_tracking_status"));
      } catch {}
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const state = status?.state ?? "Idle";

  return (
    <div className="flex h-screen items-center gap-3 bg-background px-3">
      <ChronosLogoMark size="sm" />
      <div className="min-w-0 flex-1">
        <TimerDisplay seconds={status?.elapsed_seconds ?? 0} state={state} />
        {email && (
          <p className="truncate text-center text-[10px] text-muted">{email}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {state === "Active" && (
          <>
            <button
              className="rounded bg-warning/20 px-2 py-1 text-[10px] text-warning"
              onClick={() => invokeCommand("pause_tracking")}
            >
              Pause
            </button>
            <button
              className="rounded bg-danger/20 px-2 py-1 text-[10px] text-danger"
              onClick={() => invokeCommand("stop_tracking")}
            >
              Stop
            </button>
          </>
        )}
        {(state === "Paused" || state === "AwayIdle") && (
          <>
            <button
              className="rounded bg-success/20 px-2 py-1 text-[10px] text-success"
              onClick={() => invokeCommand("resume_tracking")}
            >
              Resume
            </button>
            <button
              className="rounded bg-danger/20 px-2 py-1 text-[10px] text-danger"
              onClick={() => invokeCommand("stop_tracking")}
            >
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
