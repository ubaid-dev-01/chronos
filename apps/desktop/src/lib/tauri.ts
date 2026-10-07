const API_BASE =
  (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ?.VITE_API_URL || "http://localhost:4000/v1";

const APP_URL =
  (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ?.VITE_APP_URL || "http://localhost:3000";

const TOKEN_KEY = "chronos_desktop_access_token";
const REFRESH_KEY = "chronos_desktop_refresh_token";
const USER_KEY = "chronos_desktop_user";

export type AuthStatus = {
  authenticated: boolean;
  email?: string;
  display_name?: string;
};

export type AgentPermissions = {
  screenshots_enabled: boolean;
  tasks_enabled: boolean;
  show_popup_timer: boolean;
  can_track_offline: boolean;
};

export type AgentSettings = {
  screenshots_capture: boolean;
  notifications_enabled: boolean;
  sensitive_keywords: string;
};

export type TodaySummary = {
  tracked_seconds: number;
  last_window: string | null;
};

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function invokeCommand<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (!isTauri()) {
    throw new Error(
      "Desktop shell unavailable. Run with `pnpm tauri dev`."
    );
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

function saveBrowserSession(
  accessToken: string,
  refreshToken: string,
  user: { email: string; displayName?: string }
) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearBrowserSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getBrowserAuthStatus(): AuthStatus {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return { authenticated: false };
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "{}") as {
      email?: string;
      displayName?: string;
    };
    return {
      authenticated: true,
      email: user.email,
      display_name: user.displayName,
    };
  } catch {
    return { authenticated: true };
  }
}

async function refreshBrowserAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      data?: { accessToken?: string; refreshToken?: string };
    };
    if (!res.ok || !body.data?.accessToken) {
      clearBrowserSession();
      return null;
    }
    localStorage.setItem(TOKEN_KEY, body.data.accessToken);
    if (body.data.refreshToken) {
      localStorage.setItem(REFRESH_KEY, body.data.refreshToken);
    }
    return body.data.accessToken;
  } catch {
    return null;
  }
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit & { auth?: boolean }
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (init?.auth !== false) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401 && init?.auth !== false) {
    const next = await refreshBrowserAccessToken();
    if (next) {
      headers.set("Authorization", `Bearer ${next}`);
      res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    }
  }

  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    error?: string | { message?: string };
    message?: string;
  };

  if (!res.ok || body.success === false) {
    const errMsg =
      typeof body.error === "string"
        ? body.error
        : body.error?.message || body.message || `Request failed (${res.status})`;
    throw new Error(errMsg);
  }
  return body.data as T;
}

export async function login(
  email: string,
  password: string
): Promise<AuthStatus> {
  if (isTauri()) {
    return invokeCommand<AuthStatus>("login", { email, password });
  }

  const tokens = await apiFetch<{
    accessToken: string;
    refreshToken: string;
  }>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });

  saveBrowserSession(tokens.accessToken, tokens.refreshToken, { email });

  const me = await apiFetch<{
    email?: string;
    displayName?: string;
  }>("/auth/me").catch(() => ({ email, displayName: undefined }));

  saveBrowserSession(tokens.accessToken, tokens.refreshToken, {
    email: me.email || email,
    displayName: me.displayName,
  });

  return {
    authenticated: true,
    email: me.email || email,
    display_name: me.displayName,
  };
}

export async function logout(): Promise<void> {
  if (isTauri()) {
    await invokeCommand("logout");
    return;
  }
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (refreshToken) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }
  clearBrowserSession();
}

export async function getAuthStatus(): Promise<AuthStatus> {
  if (isTauri()) {
    return invokeCommand<AuthStatus>("get_auth_status");
  }

  const cached = getBrowserAuthStatus();
  if (!cached.authenticated) return cached;

  try {
    const me = await apiFetch<{
      email?: string;
      displayName?: string;
    }>("/auth/me");
    const email = me.email || cached.email;
    const displayName = me.displayName || cached.display_name;
    const access = localStorage.getItem(TOKEN_KEY);
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (access && refresh && email) {
      saveBrowserSession(access, refresh, {
        email,
        displayName,
      });
    }
    return {
      authenticated: true,
      email,
      display_name: displayName,
    };
  } catch {
    clearBrowserSession();
    return { authenticated: false };
  }
}

export async function fetchProjects(): Promise<
  { id: string; name: string; color_hex: string }[]
> {
  if (isTauri()) {
    return invokeCommand("fetch_projects");
  }
  const projects = await apiFetch<
    { _id?: string; id?: string; name: string; colorHex?: string }[]
  >("/projects");
  return (projects || []).map((p) => ({
    id: String(p.id || p._id || ""),
    name: p.name,
    color_hex: p.colorHex || "#4f46e5",
  }));
}

export async function fetchMyTasks(): Promise<
  {
    id: string;
    title: string;
    list_name: string;
    project_id?: string | null;
    project_name?: string | null;
  }[]
> {
  if (isTauri()) {
    return invokeCommand("fetch_my_tasks");
  }
  const tasks = await apiFetch<
    {
      _id?: string;
      id?: string;
      title: string;
      listName?: string;
      projectId?: string | null;
      projectName?: string | null;
    }[]
  >("/tasks/mine");
  return (tasks || []).map((t) => ({
    id: t.id || t._id || "",
    title: t.title,
    list_name: t.listName || "Tasks",
    project_id: t.projectId,
    project_name: t.projectName,
  }));
}

export async function getPermissions(): Promise<AgentPermissions> {
  if (isTauri()) {
    return invokeCommand<AgentPermissions>("get_permissions");
  }
  return {
    screenshots_enabled: true,
    tasks_enabled: true,
    show_popup_timer: false,
    can_track_offline: true,
  };
}

export async function getAgentSettings(): Promise<AgentSettings> {
  if (isTauri()) {
    return invokeCommand<AgentSettings>("get_agent_settings");
  }
  return {
    screenshots_capture: true,
    notifications_enabled: true,
    sensitive_keywords:
      "bank,paypal,password,1password,lastpass,bitwarden,wallet,private,incognito",
  };
}

export async function setAgentSettings(settings: AgentSettings): Promise<void> {
  if (isTauri()) {
    await invokeCommand("set_agent_settings", { settings });
    return;
  }
}

export async function getTodaySummary(): Promise<TodaySummary> {
  if (isTauri()) {
    return invokeCommand<TodaySummary>("get_today_summary");
  }
  return { tracked_seconds: 0, last_window: null };
}

export async function openDashboard(path = "/dashboard"): Promise<void> {
  const url = `${APP_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  if (isTauri()) {
    await invokeCommand("open_dashboard", { path });
    return;
  }
  window.open(url, "_blank");
}
