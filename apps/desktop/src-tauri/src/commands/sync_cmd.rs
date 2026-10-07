use crate::AppState;
use crate::sync::manager::SyncStatus;
use tauri::State;

#[tauri::command]
pub async fn trigger_sync(
    state: State<'_, AppState>,
) -> Result<SyncStatus, String> {
    state.sync_manager.sync_pending().await
}

#[tauri::command]
pub async fn get_sync_status(
    state: State<'_, AppState>,
) -> Result<SyncStatus, String> {
    let (pending_timelogs, pending_screenshots) = state.db.count_pending()?;
    let last_sync_at = state
        .db
        .get_auth_value("last_sync_at")?
        .and_then(|v| v.parse::<i64>().ok());
    let last_error = state
        .db
        .get_auth_value("last_sync_error")?
        .filter(|v| !v.is_empty());

    Ok(SyncStatus {
        pending_timelogs,
        pending_screenshots,
        last_sync_at,
        is_syncing: false,
        last_error,
    })
}

#[tauri::command]
pub async fn set_network_status(
    offline: bool,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    state
        .db
        .save_auth_value("network_offline", if offline { "1" } else { "0" })?;
    Ok(true)
}
