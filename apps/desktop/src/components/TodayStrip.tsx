import { useEffect, useState } from "react";
import { getTodaySummary, isTauri } from "../lib/tauri";

function formatSeconds(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function TodayStrip() {
  const [seconds, setSeconds] = useState(0);
  const [lastWindow, setLastWindow] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const summary = await getTodaySummary();
        setSeconds(summary.tracked_seconds);
        setLastWindow(summary.last_window);
      } catch {
        setSeconds(0);
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  if (!isTauri() && seconds === 0) {
    return (
      <div className="chronos-card mb-3 px-3 py-2 text-xs text-muted">
        Today · open the desktop agent to sync local time
      </div>
    );
  }

  return (
    <div className="chronos-card mb-3 flex items-center justify-between px-3 py-2">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-light">
          Today
        </div>
        <div className="font-mono text-sm font-semibold tabular-nums">
          {formatSeconds(seconds)}
        </div>
      </div>
      <div className="max-w-[55%] truncate text-right text-xs text-muted">
        {lastWindow || "No recent window"}
      </div>
    </div>
  );
}
