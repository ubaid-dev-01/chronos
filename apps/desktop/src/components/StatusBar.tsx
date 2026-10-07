import type { TrackerStatus } from "../App";

interface Props {
  status: TrackerStatus | null;
}

export default function StatusBar({ status }: Props) {
  if (!status || status.state === "Idle") return null;

  return (
    <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted">
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            status.state === "Active"
              ? "bg-success"
              : status.state === "Paused"
                ? "bg-warning"
                : "bg-danger"
          }`}
        />
        {status.session?.current_window
          ? status.session.current_window.slice(0, 30)
          : "No window detected"}
      </div>
      <div>
        {status.session?.mouse_clicks ?? 0} clicks ·{" "}
        {status.session?.key_presses ?? 0} keys
      </div>
    </div>
  );
}
