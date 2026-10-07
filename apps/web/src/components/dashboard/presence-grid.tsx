"use client";

import { useWebSocket } from "@/providers/websocket-provider";
import type { WSPresencePayload, ActivityStatus } from "@chronos/types";
import { Card } from "@/components/ui/card";

const STATUS_DOT: Record<ActivityStatus, string> = {
  active: "bg-success",
  idle: "bg-warning",
  offline: "bg-text-tertiary",
};

export function PresenceGrid() {
  const { teamPresence, connected } = useWebSocket();

  const sorted = [...teamPresence].sort((a, b) => {
    const order: Record<ActivityStatus, number> = {
      active: 0,
      idle: 1,
      offline: 2,
    };
    return order[a.status] - order[b.status];
  });

  const onlineCount = sorted.filter((m) => m.status === "active").length;

  return (
    <Card>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-medium text-text-primary">Team presence</h2>
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? "bg-success" : "bg-danger"
            }`}
          />
          <span className="text-xs text-text-tertiary">
            {connected ? `${onlineCount} online` : "Connecting…"}
          </span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="py-10 text-center text-sm text-text-secondary">
          No team members online. Install the desktop agent to start tracking.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {sorted.map((member) => (
            <MemberCard key={member.userId} member={member} />
          ))}
        </div>
      )}
    </Card>
  );
}

function MemberCard({ member }: { member: WSPresencePayload }) {
  const hours = Math.floor(member.activeTime / 60);
  const mins = member.activeTime % 60;
  const initials = member.userId.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-border bg-surface-elevated/50 p-3 transition-colors hover:bg-surface-elevated">
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-xs font-medium text-text-secondary">
          {initials}
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface ${STATUS_DOT[member.status]}`}
        />
      </div>
      <div className="text-center">
        <p className="max-w-[100px] truncate text-xs font-medium text-text-primary">
          {member.userId}
        </p>
        <p className="text-[11px] text-text-tertiary">
          {member.status === "offline" ? "Offline" : `${hours}h ${mins}m`}
        </p>
      </div>
      {member.currentProject && (
        <span className="max-w-full truncate rounded border border-border px-2 py-0.5 text-[10px] text-text-tertiary">
          {member.currentProject}
        </span>
      )}
    </div>
  );
}
