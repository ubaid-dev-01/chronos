export function DashboardPreview() {
  const team = [
    { name: "Alex Kim", role: "Design", hours: "6.2h", active: true, project: "Brand refresh" },
    { name: "Maya R.", role: "Engineering", hours: "7.1h", active: true, project: "API v2" },
    { name: "Jordan L.", role: "Product", hours: "4.8h", active: false, project: "Roadmap" },
    { name: "Taylor S.", role: "Support", hours: "5.5h", active: true, project: "Onboarding" },
  ];

  const chartBars = [42, 68, 55, 82, 71, 48, 76];

  return (
    <div className="product-frame card-glow">
      <div className="product-frame-bar">
        <span className="product-dot" />
        <span className="product-dot" />
        <span className="product-dot" />
        <span className="ml-3 font-mono text-[11px] font-medium text-text-secondary">
          chronos.app/dashboard
        </span>
      </div>

      <div className="flex min-h-[420px] bg-surface">
        {/* Sidebar */}
        <div className="hidden w-44 shrink-0 border-r border-border bg-surface-elevated/50 p-3 sm:block">
          <div className="mb-4 flex items-center gap-2 px-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-[10px] font-bold text-white">
              C
            </div>
            <span className="text-xs font-semibold">Chronos</span>
          </div>
          <div className="space-y-0.5">
            {["Overview", "Team", "Projects", "Reports"].map((item, i) => (
              <div
                key={item}
                className={`rounded-md px-2 py-1.5 text-[11px] ${
                  i === 0
                    ? "bg-brand/10 font-medium text-brand"
                    : "text-text-secondary"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">Overview</p>
              <p className="text-[11px] font-medium text-text-secondary">Tuesday, Jul 7</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-2.5 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              <span className="text-[10px] font-medium text-text-secondary">
                12 online
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: "Hours today", value: "47.2h" },
              { label: "Active now", value: "12" },
              { label: "Projects", value: "5" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border bg-surface-elevated/60 p-2.5"
              >
                <p className="font-mono text-sm font-semibold text-text-primary">
                  {stat.value}
                </p>
                <p className="text-[10px] font-medium text-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            {/* Chart */}
            <div className="rounded-lg border border-border bg-surface-elevated/40 p-3 sm:col-span-3">
              <p className="mb-3 text-[10px] font-semibold text-text-secondary">
                Weekly activity
              </p>
              <div className="flex h-20 items-end gap-1">
                {chartBars.map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-sm ${i === 3 ? "bg-brand" : "bg-border"}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Team mini */}
            <div className="rounded-lg border border-border bg-surface-elevated/40 p-3 sm:col-span-2">
              <p className="mb-2 text-[10px] font-medium text-text-tertiary">
                Live presence
              </p>
              <div className="space-y-1.5">
                {team.slice(0, 3).map((m) => (
                  <div key={m.name} className="flex items-center gap-2">
                    <div className="relative">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-border text-[8px] font-medium">
                        {m.name[0]}
                      </div>
                      {m.active && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-surface bg-success" />
                      )}
                    </div>
                    <span className="flex-1 truncate text-[10px] font-medium text-text-primary">
                      {m.name}
                    </span>
                    <span className="font-mono text-[10px] font-medium text-text-secondary">
                      {m.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team list */}
          <div className="mt-3 rounded-lg border border-border bg-surface-elevated/30">
            {team.map((m, i) => (
              <div
                key={m.name}
                className={`flex items-center justify-between px-3 py-2 ${
                  i < team.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-border text-[9px] font-medium">
                      {m.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-surface ${
                        m.active ? "bg-success" : "bg-warning"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-primary">
                      {m.name}
                    </p>
                    <p className="text-[9px] font-medium text-text-secondary">{m.project}</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-text-secondary">
                  {m.hours}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
