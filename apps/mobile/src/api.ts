import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/v1";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

async function getTokens(): Promise<AuthTokens | null> {
  const accessToken = await SecureStore.getItemAsync("access_token");
  const refreshToken = await SecureStore.getItemAsync("refresh_token");
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

async function saveTokens(tokens: AuthTokens) {
  await SecureStore.setItemAsync("access_token", tokens.accessToken);
  await SecureStore.setItemAsync("refresh_token", tokens.refreshToken);
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  if (!tokens) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });

  if (!res.ok) {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    return null;
  }

  const json = await res.json();
  await saveTokens(json.data);
  return json.data.accessToken as string;
}

async function authorizedFetch(path: string, init: RequestInit = {}) {
  let accessToken = (await getTokens())?.accessToken;
  if (!accessToken) throw new Error("Not authenticated");

  let res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401) {
    accessToken = (await refreshAccessToken()) ?? undefined;
    if (!accessToken) throw new Error("Session expired");
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers ?? {}),
      },
    });
  }

  return res;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Login failed");
  await saveTokens(json.data);
}

export async function logout() {
  await SecureStore.deleteItemAsync("access_token");
  await SecureStore.deleteItemAsync("refresh_token");
}

export async function isLoggedIn() {
  return !!(await getTokens())?.accessToken;
}

export interface AgentTask {
  _id: string;
  title: string;
  listName: string;
  projectId?: string;
  projectName?: string;
}

export async function fetchMyTasks(): Promise<AgentTask[]> {
  const res = await authorizedFetch("/tasks/mine");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load tasks");
  return json.data;
}

export async function syncTimeBatch(input: {
  projectId: string;
  taskId?: string;
  startTime: number;
  endTime: number;
  activityScore?: number;
}) {
  const res = await authorizedFetch("/timelogs/sync", {
    method: "POST",
    body: JSON.stringify({
      batches: [
        {
          startTime: input.startTime,
          endTime: input.endTime,
          projectId: input.projectId,
          taskId: input.taskId,
          activityScore: input.activityScore ?? 1,
          isOffline: false,
        },
      ],
      agentVersion: "0.1.0-mobile",
      platform: Platform.OS === "ios" ? "ios" : "android",
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Sync failed");
  return json;
}
