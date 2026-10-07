interface Props {
  seconds: number;
  state: string;
}

export default function TimerDisplay({ seconds, state }: Props) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  const stateColors: Record<string, string> = {
    Idle: "text-muted",
    Active: "text-success",
    Paused: "text-warning",
    AwayIdle: "text-danger",
  };

  const stateLabels: Record<string, string> = {
    Idle: "Ready",
    Active: "Tracking",
    Paused: "Paused",
    AwayIdle: "Away",
  };

  return (
    <div className="text-center">
      <div
        className={`font-mono text-5xl font-bold tabular-nums ${stateColors[state] ?? "text-white"}`}
      >
        {pad(hours)}:{pad(minutes)}:{pad(secs)}
      </div>
      <div className="mt-2 text-sm uppercase tracking-wider text-muted">
        {stateLabels[state] ?? state}
      </div>
    </div>
  );
}
