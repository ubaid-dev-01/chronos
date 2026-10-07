use crate::tracker::engine::TrackerStatus;
use crate::tracker::r#loop::notify;
use crate::AppState;
use tauri::{AppHandle, Manager, State};

#[tauri::command]
pub async fn start_tracking(
    project_id: String,
    task_id: Option<String>,
    label: Option<String>,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<TrackerStatus, String> {
    let (status, project_id_for_ping, task_id_for_ping) = {
        let mut tracker = state.tracker.lock();
        tracker.start(project_id.clone(), task_id.clone())?;
        (tracker.get_status(), project_id.clone(), task_id.clone())
    };

    let _ = state.db.save_auth_value("last_project_id", &project_id);
    if let Some(ref tid) = task_id {
        let _ = state.db.save_auth_value("last_task_id", tid);
    }
    if let Some(ref l) = label {
        let _ = state.db.save_auth_value("last_label", l);
    }

    let message = match &label {
        Some(l) if !l.is_empty() => format!("Tracking: {}", l),
        _ => "Tracking started".to_string(),
    };
    notify(&app, "Chronos", &message);

    let show_popup = state
        .db
        .get_auth_value("show_popup_timer")
        .ok()
        .flatten()
        .map(|v| v == "1")
        .unwrap_or(false);
    if show_popup {
        if let Some(win) = app.get_webview_window("timer") {
            let _ = win.show();
        }
    }

    let api_client = state.api_client.clone();
    tauri::async_runtime::spawn(async move {
        api_client
            .ping_presence(
                "active",
                Some(project_id_for_ping.as_str()),
                task_id_for_ping.as_deref(),
            )
            .await;
    });

    Ok(status)
}

#[tauri::command]
pub async fn stop_tracking(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<TrackerStatus, String> {
    if let Err(e) = state.tracking_loop.flush_current_chunk() {
        log::warn!("Final chunk flush: {}", e);
    }

    let status = {
        let mut tracker = state.tracker.lock();
        tracker.stop()?;
        tracker.get_status()
    };

    notify(&app, "Chronos", "Stopped tracking");
    if let Some(win) = app.get_webview_window("timer") {
        let _ = win.hide();
    }

    let api_client = state.api_client.clone();
    tauri::async_runtime::spawn(async move {
        api_client.ping_presence("idle", None, None).await;
    });

    let sync_manager = state.sync_manager.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) = sync_manager.sync_pending().await {
            log::warn!("Post-stop sync failed: {}", e);
        }
    });

    Ok(status)
}

#[tauri::command]
pub async fn pause_tracking(state: State<'_, AppState>) -> Result<TrackerStatus, String> {
    let mut tracker = state.tracker.lock();
    tracker.pause()?;
    Ok(tracker.get_status())
}

#[tauri::command]
pub async fn resume_tracking(state: State<'_, AppState>) -> Result<TrackerStatus, String> {
    let mut tracker = state.tracker.lock();
    tracker.resume()?;
    Ok(tracker.get_status())
}

#[tauri::command]
pub async fn get_tracking_status(state: State<'_, AppState>) -> Result<TrackerStatus, String> {
    let tracker = state.tracker.lock();
    Ok(tracker.get_status())
}
