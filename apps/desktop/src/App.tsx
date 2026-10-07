import { useState, useEffect, useCallback } from "react";
import LoginForm from "./components/LoginForm";
import TrackingControls from "./components/TrackingControls";
import TimerDisplay from "./components/TimerDisplay";
import StatusBar from "./components/StatusBar";
import ProjectSelector from "./components/ProjectSelector";
import TaskSelector, { type AgentTask } from "./components/TaskSelector";
import SyncIndicator from "./components/SyncIndicator";
import ChronosLogoMark from "./components/ChronosLogoMark";
import TodayStrip from "./components/TodayStrip";
import SettingsPanel from "./components/SettingsPanel";
import FloatingTimer from "./components/FloatingTimer";
import {
  getAuthStatus,
  getPermissions,
  invokeCommand,
  isTauri,
  logout,
  openDashboard,
  type AgentPermissions,
} from "./lib/tauri";

type TrackerState = "Idle" | "Active" | "Paused" | "AwayIdle";

export interface TrackerStatus {
  state: TrackerState;
  elapsed_seconds: number;
  activity_score: number;
  session: {
    project_id: string;
    task_id?: string | null;
    current_window: string | null;
    mouse_clicks: number;
    key_presses: number;
  } | null;
}

function MainApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [status, setStatus] = useState<TrackerStatus | null>(null);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [permissionWarning, setPermissionWarning] = useState("");
  const [permissions, setPermissions] = useState<AgentPermissions>({
    screenshots_enabled: true,
    tasks_enabled: true,
    show_popup_timer: false,
    can_track_offline: true,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);

  const handleTaskSelect = useCallback((task: AgentTask | null) => {
    setSelectedTask(task);
    if (task?.project_id) {
      setSelectedProject(task.project_id);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    const auth = await getAuthStatus();
    setIsAuthenticated(auth.authenticated);
    setAuthEmail(auth.email || auth.display_name || "");
    if (auth.authenticated) {
      try {
        setPermissions(await getPermissions());
      } catch {}
    }
  }, []);

  useEffect(() => {
    refreshAuth().catch(() => {});

    const onOnline = () => {
      setOffline(false);
      if (isTauri()) {
        invokeCommand("set_network_status", { offline: false }).catch(() => {});
        invokeCommand("trigger_sync").catch(() => {});
      }
    };
    const onOffline = () => {
      setOffline(true);
      if (isTauri()) {
        invokeCommand("set_network_status", { offline: true }).catch(() => {});
      }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    if (!isTauri()) {
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }

    invokeCommand<{ screen_capture_ok: boolean; message: string }>(
      "check_permissions"
    )
      .then((p) => {
        if (!p.screen_capture_ok) setPermissionWarning(p.message);
      })
      .catch(() => {});

    const interval = setInterval(async () => {
      try {
        const s = await invokeCommand<TrackerStatus>("get_tracking_status");
        setStatus(s);
      } catch {}
    }, 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refreshAuth]);

  // Remember last project for tray quick-start
  useEffect(() => {
    if (!isTauri() || !selectedProject) return;
    invokeCommand("set_last_selection", {
      projectId: selectedProject,
      taskId: selectedTask?.id ?? null,
      label: selectedTask?.title ?? null,
    }).catch(() => {});
  }, [selectedProject, selectedTask]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setIsAuthenticated(false);
      setAuthEmail("");
      setStatus(null);
    }
  };

  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => refreshAuth()} />;
  }

  const trackingActive =
    status?.state === "Active" ||
    status?.state === "Paused" ||
    status?.state === "AwayIdle";

  return (
    <div className="chronos-shell">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ChronosLogoMark size="sm" />
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">Chronos</div>
            <div className="truncate text-[11px] text-muted">{authEmail}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SyncIndicator offline={offline} />
          <button
            onClick={() => setSettingsOpen(true)}
            className="chronos-btn-ghost px-2 py-1 text-xs"
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="chronos-btn-ghost px-2 py-1 text-xs"
          >
            Logout
          </button>
        </div>
      </div>

      {!isTauri() && (
        <p className="mb-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Browser preview — full tracking needs the Tauri desktop shell.
        </p>
      )}

      {permissionWarning && (
        <p className="mb-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          {permissionWarning}
        </p>
      )}

      {offline && (
        <p className="mb-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          {permissions.can_track_offline
            ? "You are offline — time will sync when connection returns."
            : "You are offline and offline tracking is disabled for your account."}
        </p>
      )}

      <TodayStrip />

      <div className="mb-3 shrink-0 py-4">
        <TimerDisplay
          seconds={status?.elapsed_seconds ?? 0}
          state={status?.state ?? "Idle"}
        />
      </div>

      {status?.state !== "Idle" && (
        <div className="mb-4 shrink-0">
          <div className="mb-1 flex justify-between text-sm text-muted">
            <span>Activity</span>
            <span>{Math.round((status?.activity_score ?? 0) * 100)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-elevated">
            <div
              className="h-2 rounded-full bg-success transition-all duration-500"
              style={{ width: `${(status?.activity_score ?? 0) * 100}%` }}
            />
          </div>
        </div>
      )}

      <TaskSelector
        selectedTaskId={selectedTask?.id ?? ""}
        onSelect={handleTaskSelect}
        disabled={trackingActive}
        hidden={!permissions.tasks_enabled}
      />

      <ProjectSelector
        selected={selectedProject}
        onSelect={setSelectedProject}
        disabled={trackingActive || !!selectedTask?.project_id}
        hidden={!!selectedTask?.project_id}
      />

      <TrackingControls
        state={status?.state ?? "Idle"}
        projectId={selectedProject}
        taskId={selectedTask?.id}
        taskLabel={selectedTask?.title}
        onStatusChange={setStatus}
        canTrackOffline={permissions.can_track_offline}
        offline={offline}
      />

      <button
        onClick={() => openDashboard("/dashboard")}
        className="chronos-btn-ghost mb-2 w-full shrink-0 text-xs"
      >
        Open web dashboard
      </button>

      <StatusBar status={status} />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        screenshotsAllowed={permissions.screenshots_enabled}
      />
    </div>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") === "timer") {
    return <FloatingTimer />;
  }
  return <MainApp />;
}
