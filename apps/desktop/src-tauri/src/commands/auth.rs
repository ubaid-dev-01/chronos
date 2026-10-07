use crate::AppState;
use tauri::State;

#[derive(serde::Serialize)]
pub struct AuthStatus {
    pub authenticated: bool,
    pub email: Option<String>,
    pub display_name: Option<String>,
}

#[tauri::command]
pub async fn login(
    email: String,
    password: String,
    state: State<'_, AppState>,
) -> Result<AuthStatus, String> {
    let profile = state
        .api_client
        .login(&email, &password)
        .await?;

    log::info!("User logged in: {}", profile.email);
    Ok(AuthStatus {
        authenticated: true,
        email: Some(profile.email),
        display_name: Some(profile.display_name),
    })
}

#[tauri::command]
pub async fn logout(state: State<'_, AppState>) -> Result<bool, String> {
    {
        let mut tracker = state.tracker.lock();
        let _ = tracker.stop();
    }
    let _ = state.tracking_loop.flush_current_chunk();
    if let Err(e) = state.api_client.logout().await {
        log::warn!("Server logout failed: {}", e);
        state.db.clear_auth()?;
    }
    log::info!("User logged out");
    Ok(true)
}

#[tauri::command]
pub async fn get_auth_status(state: State<'_, AppState>) -> Result<AuthStatus, String> {
    let token = state.db.get_auth_value("access_token")?;
    if token.is_none() {
        return Ok(AuthStatus {
            authenticated: false,
            email: None,
            display_name: None,
        });
    }

    match state.api_client.fetch_profile().await {
        Ok(profile) => Ok(AuthStatus {
            authenticated: true,
            email: Some(profile.email),
            display_name: Some(profile.display_name),
        }),
        Err(_) => {
            // Offline / API down — still treat stored session as authenticated.
            Ok(AuthStatus {
                authenticated: true,
                email: state.db.get_auth_value("email")?,
                display_name: state.db.get_auth_value("display_name")?,
            })
        }
    }
}
