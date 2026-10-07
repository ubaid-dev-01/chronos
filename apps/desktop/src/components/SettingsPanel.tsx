import { useEffect, useState } from "react";
import {
  getAgentSettings,
  openDashboard,
  setAgentSettings,
  type AgentSettings,
} from "../lib/tauri";

interface Props {
  open: boolean;
  onClose: () => void;
  screenshotsAllowed: boolean;
}

export default function SettingsPanel({
  open,
  onClose,
  screenshotsAllowed,
}: Props) {
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    getAgentSettings()
      .then(setSettings)
      .catch(() =>
        setSettings({
          screenshots_capture: true,
          notifications_enabled: true,
          sensitive_keywords:
            "bank,paypal,password,1password,lastpass,bitwarden,wallet,private,incognito",
        })
      );
  }, [open]);

  if (!open || !settings) return null;

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      await setAgentSettings(settings);
      setMessage("Saved");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 p-3">
      <div className="chronos-card w-full max-h-[85vh] overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Agent settings</h2>
          <button onClick={onClose} className="chronos-btn-ghost px-2 py-1 text-xs">
            Close
          </button>
        </div>

        <label className="mb-3 flex items-center justify-between gap-3 text-sm">
          <span>
            Screenshot capture
            {!screenshotsAllowed && (
              <span className="mt-0.5 block text-xs text-muted">
                Disabled by org permission
              </span>
            )}
          </span>
          <input
            type="checkbox"
            checked={settings.screenshots_capture && screenshotsAllowed}
            disabled={!screenshotsAllowed}
            onChange={(e) =>
              setSettings({ ...settings, screenshots_capture: e.target.checked })
            }
          />
        </label>

        <label className="mb-3 flex items-center justify-between gap-3 text-sm">
          <span>Idle / resume notifications</span>
          <input
            type="checkbox"
            checked={settings.notifications_enabled}
            onChange={(e) =>
              setSettings({
                ...settings,
                notifications_enabled: e.target.checked,
              })
            }
          />
        </label>

        <div className="mb-3">
          <label className="mb-1 block text-sm text-muted">
            Sensitive app keywords (comma-separated)
          </label>
          <textarea
            value={settings.sensitive_keywords}
            onChange={(e) =>
              setSettings({ ...settings, sensitive_keywords: e.target.value })
            }
            rows={3}
            className="chronos-input resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="chronos-btn-primary flex-1"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => openDashboard("/settings/members")}
            className="chronos-btn-ghost flex-1"
          >
            Web settings
          </button>
        </div>
        {message && <p className="mt-2 text-xs text-muted">{message}</p>}
      </div>
    </div>
  );
}
