use crate::screenshot::capture::capture_primary_screen;

#[derive(serde::Serialize)]
pub struct PermissionStatus {
    pub screen_capture_ok: bool,
    pub platform: String,
    pub message: String,
}

#[tauri::command]
pub fn check_permissions() -> PermissionStatus {
    let platform = std::env::consts::OS.to_string();
    match capture_primary_screen() {
        Ok(_) => PermissionStatus {
            screen_capture_ok: true,
            platform,
            message: "Screen capture is available".into(),
        },
        Err(e) => PermissionStatus {
            screen_capture_ok: false,
            platform,
            message: format!(
                "Screen capture unavailable: {}. On macOS enable Screen Recording for Chronos in System Settings → Privacy.",
                e
            ),
        },
    }
}
