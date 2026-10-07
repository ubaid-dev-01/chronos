import { useState, useEffect } from "react";
import { invokeCommand, isTauri } from "../lib/tauri";

interface SyncStatus {
  pending_timelogs: number;
  pending_screenshots: number;
  is_syncing: boolean;
  last_error?: string | null;
}

interface Props {
  offline?: boolean;
}

export default function SyncIndicator({ offline }: Props) {
  const [status, setStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    if (!isTauri()) return;
    const tick = async () => {
      try {
        const s = await invokeCommand<SyncStatus>("get_sync_status");
        setStatus(s);
      } catch {}
    };
    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isTauri()) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <div className="h-2 w-2 rounded-full bg-muted" />
        Preview
      </div>
    );
  }

  if (offline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-warning">
        <div className="h-2 w-2 animate-pulse rounded-full bg-warning" />
        Offline
      </div>
    );
  }

  const pending =
    (status?.pending_timelogs ?? 0) + (status?.pending_screenshots ?? 0);

  if (status?.is_syncing) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-brand-light">
        <div className="h-2 w-2 animate-pulse rounded-full bg-brand-light" />
        Syncing
      </div>
    );
  }

  if (pending === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-success">
        <div className="h-2 w-2 rounded-full bg-success" />
        Synced
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-warning">
      <div className="h-2 w-2 animate-pulse rounded-full bg-warning" />
      {pending} pending
    </div>
  );
}
