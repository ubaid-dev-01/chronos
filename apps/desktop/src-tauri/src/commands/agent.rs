use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_shell::ShellExt;

#[derive(Debug, Serialize)]
pub struct AgentPermissions {
    pub screenshots_enabled: bool,
    pub tasks_enabled: bool,
    pub show_popup_timer: bool,
    pub can_track_offline: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSettings {
    pub screenshots_capture: bool,
    pub notifications_enabled: bool,
    pub sensitive_keywords: String,
}

#[derive(Debug, Serialize)]
pub struct TodaySummary {
    pub tracked_seconds: u64,
    pub last_window: Option<String>,
}

fn flag(db: &crate::storage::sqlite::Database, key: &str, default: bool) -> bool {
    db.get_auth_value(key)
        .ok()
        .flatten()
        .map(|v| v != "0")
        .unwrap_or(default)
}

#[tauri::command]
pub async fn get_permissions(state: State<'_, AppState>) -> Result<AgentPermissions, String> {
    Ok(AgentPermissions {
        screenshots_enabled: flag(&state.db, "screenshots_enabled", true),
        tasks_enabled: flag(&state.db, "tasks_enabled", true),
        show_popup_timer: flag(&state.db, "show_popup_timer", false),
        can_track_offline: flag(&state.db, "can_track_offline", true),
    })
}

#[tauri::command]
pub async fn get_agent_settings(state: State<'_, AppState>) -> Result<AgentSettings, String> {
    Ok(AgentSettings {
        screenshots_capture: flag(&state.db, "settings_screenshots_capture", true),
        notifications_enabled: flag(&state.db, "settings_notifications", true),
        sensitive_keywords: state
            .db
            .get_auth_value("settings_sensitive_keywords")?
            .unwrap_or_else(|| {
                "bank,paypal,password,1password,lastpass,bitwarden,wallet,private,incognito".into()
            }),
    })
}

#[tauri::command]
pub async fn set_agent_settings(
    settings: AgentSettings,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    state.db.save_auth_value(
        "settings_screenshots_capture",
        if settings.screenshots_capture { "1" } else { "0" },
    )?;
    state.db.save_auth_value(
        "settings_notifications",
        if settings.notifications_enabled { "1" } else { "0" },
    )?;
    state
        .db
        .save_auth_value("settings_sensitive_keywords", &settings.sensitive_keywords)?;
    Ok(true)
}

#[tauri::command]
pub async fn get_today_summary(state: State<'_, AppState>) -> Result<TodaySummary, String> {
    let (tracked_seconds, last_window) = state.db.get_today_tracked_seconds()?;
    Ok(TodaySummary {
        tracked_seconds,
        last_window,
    })
}

#[tauri::command]
pub async fn open_dashboard(path: Option<String>, app: AppHandle) -> Result<(), String> {
    let base = std::env::var("APP_URL").unwrap_or_else(|_| "http://localhost:3000".into());
    let path = path.unwrap_or_else(|| "/dashboard".into());
    let url = format!(
        "{}{}",
        base.trim_end_matches('/'),
        if path.starts_with('/') {
            path
        } else {
            format!("/{}", path)
        }
    );
    app.shell()
        .open(url, None)
        .map_err(|e| format!("Failed to open dashboard: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn set_last_selection(
    project_id: String,
    task_id: Option<String>,
    label: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.db.save_auth_value("last_project_id", &project_id)?;
    if let Some(tid) = task_id {
        state.db.save_auth_value("last_task_id", &tid)?;
    } else {
        state.db.save_auth_value("last_task_id", "")?;
    }
    if let Some(l) = label {
        state.db.save_auth_value("last_label", &l)?;
    }
    Ok(())
}

#[tauri::command]
pub async fn show_floating_timer(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    if !flag(&state.db, "show_popup_timer", false) {
        return Ok(());
    }
    if let Some(win) = app.get_webview_window("timer") {
        let _ = win.show();
        let _ = win.set_focus();
    }
    Ok(())
}

#[tauri::command]
pub async fn hide_floating_timer(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("timer") {
        let _ = win.hide();
    }
    Ok(())
}
