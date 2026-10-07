"use client";

import { useEffect, useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Bell, Download, X, Monitor, Apple, Terminal, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/sidebar-context";
import { TimerBar } from "@/components/dashboard/timer-bar";
import { useWebSocket } from "@/providers/websocket-provider";
import { getApiOrigin } from "@/lib/api-url";
import Link from "next/link";

interface PlatformDownload {
  name: string;
  file: string;
  url: string;
  version: string;
  arch: string;
  size: string;
}

interface DownloadsData {
  version: string;
  platforms: {
    windows: PlatformDownload;
    macos: PlatformDownload;
    linux: PlatformDownload;
  };
}

const PLATFORM_META = [
  { key: "windows" as const, icon: Monitor, note: "Windows 10+ (64-bit)" },
  { key: "macos" as const, icon: Apple, note: "macOS 12+ (Apple Silicon & Intel)" },
  { key: "linux" as const, icon: Terminal, note: "Ubuntu 20.04+, Fedora 36+" },
];

const API_BASE = getApiOrigin();

export function TopBar() {
  const { logout } = useAuth();
  const { setMobileOpen } = useSidebar();
  const { activityFeed } = useWebSocket();
  const [showDownload, setShowDownload] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [downloads, setDownloads] = useState<DownloadsData | null>(null);
  const [downloadsLoading, setDownloadsLoading] = useState(false);

  useEffect(() => {
    if (!showDownload || downloads) return;
    let cancelled = false;
    setDownloadsLoading(true);
    fetch(`${API_BASE}/v1/downloads`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) setDownloads(json.data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load download links");
      })
      .finally(() => {
        if (!cancelled) setDownloadsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showDownload, downloads]);

  function handleDownload(platform: PlatformDownload) {
    if (!platform.url) {
      toast.info(`${platform.name} build is not published yet.`);
      return;
    }
    window.open(platform.url, "_blank", "noopener,noreferrer");
    setShowDownload(false);
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <TimerBar />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowDownload(!showDownload);
              setShowNotifications(false);
            }}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-md border border-border px-3 text-[13px] text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary",
              showDownload && "bg-surface-elevated text-text-primary"
            )}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download agent</span>
          </button>

          {showDownload && (
            <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-72 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-text-primary">
                  Desktop agent
                </p>
                <button
                  type="button"
                  onClick={() => setShowDownload(false)}
                  className="text-text-tertiary hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-1.5">
                {PLATFORM_META.map((meta) => {
                  const Icon = meta.icon;
                  const platform = downloads?.platforms[meta.key];
                  return (
                    <button
                      key={meta.key}
                      type="button"
                      disabled={downloadsLoading}
                      onClick={() => {
                        if (platform) handleDownload(platform);
                        else toast.info("Download links are still loading…");
                      }}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-surface-elevated disabled:opacity-50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background">
                        <Icon className="h-3.5 w-3.5 text-text-secondary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text-primary">
                          {platform?.name ?? meta.key}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {platform
                            ? `${platform.arch} · ${platform.size}`
                            : meta.note}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-2">
                <p className="text-xs text-text-tertiary">
                  v{downloads?.version ?? "…"} · Tauri/Rust
                </p>
                <Link
                  href="/download"
                  className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
                  onClick={() => setShowDownload(false)}
                >
                  All platforms
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowDownload(false);
            }}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary",
              showNotifications && "bg-surface-elevated text-text-primary"
            )}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {activityFeed.length > 0 && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-80 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-text-primary">
                  Notifications
                </p>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-text-tertiary hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {activityFeed.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="mx-auto mb-2 h-6 w-6 text-text-tertiary" />
                    <p className="text-sm text-text-secondary">All caught up</p>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Team pulse events will appear here as people track time.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {activityFeed.slice(0, 12).map((event) => (
                      <li key={event.id} className="px-4 py-3">
                        <p className="text-sm text-text-primary">
                          {event.userName} {event.message}
                        </p>
                        <p className="mt-0.5 text-xs text-text-tertiary">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
