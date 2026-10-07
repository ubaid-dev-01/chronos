use crate::storage::sqlite::Database;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;

#[derive(Debug, Deserialize)]
struct ApiEnvelope<T> {
    success: bool,
    data: T,
}

#[derive(Debug, Deserialize)]
pub struct AuthTokens {
    #[serde(rename = "accessToken")]
    pub access_token: String,
    #[serde(rename = "refreshToken")]
    pub refresh_token: String,
    #[serde(rename = "expiresIn")]
    pub expires_in: u64,
}

#[derive(Debug, Deserialize)]
pub struct UserProfile {
    #[serde(rename = "_id")]
    pub id: String,
    pub email: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub permissions: UserPermissions,
}

#[derive(Debug, Deserialize)]
pub struct UserPermissions {
    #[serde(rename = "screenshotsEnabled", default)]
    pub screenshots_enabled: bool,
    #[serde(rename = "tasksEnabled", default = "default_true")]
    pub tasks_enabled: bool,
    #[serde(rename = "showPopupTimer", default)]
    pub show_popup_timer: bool,
    #[serde(rename = "canTrackOffline", default = "default_true")]
    pub can_track_offline: bool,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentProject {
    pub id: String,
    pub name: String,
    #[serde(rename = "colorHex")]
    pub color_hex: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTask {
    pub id: String,
    pub title: String,
    #[serde(rename = "listName")]
    pub list_name: String,
    #[serde(rename = "projectId")]
    pub project_id: Option<String>,
    #[serde(rename = "projectName")]
    pub project_name: Option<String>,
}

pub struct ApiClient {
    db: Arc<Database>,
    http: reqwest::Client,
    api_base: String,
}

impl ApiClient {
    pub fn new(db: Arc<Database>) -> Self {
        Self {
            db,
            http: reqwest::Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .expect("HTTP client"),
            api_base: std::env::var("API_URL")
                .unwrap_or_else(|_| "http://localhost:4000/v1".to_string()),
        }
    }

    pub fn api_base(&self) -> &str {
        &self.api_base
    }

    pub async fn login(&self, email: &str, password: &str) -> Result<UserProfile, String> {
        let response = self
            .http
            .post(format!("{}/auth/login", self.api_base))
            .json(&serde_json::json!({ "email": email, "password": password }))
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        if !response.status().is_success() {
            let body = response.text().await.unwrap_or_default();
            return Err(parse_error(&body));
        }

        let tokens: ApiEnvelope<AuthTokens> = response
            .json()
            .await
            .map_err(|e| format!("Parse error: {}", e))?;

        self.db
            .save_auth_session(&tokens.data.access_token, &tokens.data.refresh_token)?;

        self.fetch_profile().await
    }

    pub async fn fetch_profile(&self) -> Result<UserProfile, String> {
        let token = self.ensure_access_token().await?;
        let response = self
            .http
            .get(format!("{}/auth/me", self.api_base))
            .bearer_auth(&token)
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        if !response.status().is_success() {
            if response.status() == reqwest::StatusCode::UNAUTHORIZED {
                let token = self.refresh_tokens().await?;
                let retry = self
                    .http
                    .get(format!("{}/auth/me", self.api_base))
                    .bearer_auth(&token)
                    .send()
                    .await
                    .map_err(|e| format!("Network error: {}", e))?;
                if !retry.status().is_success() {
                    return Err("Failed to load profile".into());
                }
                let profile: ApiEnvelope<UserProfile> = retry
                    .json()
                    .await
                    .map_err(|e| format!("Parse error: {}", e))?;
                return self.store_profile(profile.data);
            }
            return Err("Failed to load profile".into());
        }

        let profile: ApiEnvelope<UserProfile> = response
            .json()
            .await
            .map_err(|e| format!("Parse error: {}", e))?;

        self.store_profile(profile.data)
    }

    fn store_profile(&self, profile: UserProfile) -> Result<UserProfile, String> {
        self.db.save_auth_value("user_id", &profile.id)?;
        self.db.save_auth_value("email", &profile.email)?;
        self.db.save_auth_value("display_name", &profile.display_name)?;
        self.db.save_auth_value(
            "screenshots_enabled",
            if profile.permissions.screenshots_enabled {
                "1"
            } else {
                "0"
            },
        )?;
        self.db.save_auth_value(
            "tasks_enabled",
            if profile.permissions.tasks_enabled {
                "1"
            } else {
                "0"
            },
        )?;
        self.db.save_auth_value(
            "show_popup_timer",
            if profile.permissions.show_popup_timer {
                "1"
            } else {
                "0"
            },
        )?;
        self.db.save_auth_value(
            "can_track_offline",
            if profile.permissions.can_track_offline {
                "1"
            } else {
                "0"
            },
        )?;

        Ok(profile)
    }

    pub async fn ensure_access_token(&self) -> Result<String, String> {
        if let Some(token) = self.db.get_auth_value("access_token")? {
            return Ok(token);
        }
        Err("Not authenticated".into())
    }

    pub async fn refresh_tokens(&self) -> Result<String, String> {
        let refresh = self
            .db
            .get_auth_value("refresh_token")?
            .ok_or_else(|| "Not authenticated".to_string())?;

        let response = self
            .http
            .post(format!("{}/auth/refresh", self.api_base))
            .json(&serde_json::json!({ "refreshToken": refresh }))
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        if !response.status().is_success() {
            self.db.clear_auth()?;
            return Err("Session expired please sign in again".into());
        }

        let tokens: ApiEnvelope<AuthTokens> = response
            .json()
            .await
            .map_err(|e| format!("Parse error: {}", e))?;

        self.db
            .save_auth_session(&tokens.data.access_token, &tokens.data.refresh_token)?;
        Ok(tokens.data.access_token)
    }

    pub async fn refresh_tokens_if_needed(&self) -> Result<String, String> {
        self.refresh_tokens().await
    }

    pub async fn logout(&self) -> Result<(), String> {
        let refresh = self.db.get_auth_value("refresh_token")?;
        if let Some(refresh_token) = refresh {
            let _ = self
                .http
                .post(format!("{}/auth/logout", self.api_base))
                .json(&serde_json::json!({ "refreshToken": refresh_token }))
                .send()
                .await;
        }
        self.db.clear_auth()?;
        Ok(())
    }

    pub async fn authorized_get(&self, path: &str) -> Result<reqwest::Response, String> {
        let mut token = self.ensure_access_token().await?;
        let url = format!("{}{}", self.api_base, path);
        let response = self
            .http
            .get(&url)
            .bearer_auth(&token)
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        if response.status() == reqwest::StatusCode::UNAUTHORIZED {
            token = self.refresh_tokens().await?;
            return self
                .http
                .get(&url)
                .bearer_auth(&token)
                .send()
                .await
                .map_err(|e| format!("Network error: {}", e));
        }

        Ok(response)
    }

    pub async fn fetch_projects(&self) -> Result<Vec<AgentProject>, String> {
        let response = self.authorized_get("/projects").await?;
        if !response.status().is_success() {
            return Err("Failed to load projects".into());
        }
        let json: ApiEnvelope<Vec<serde_json::Value>> = response
            .json()
            .await
            .map_err(|e| format!("Parse error: {}", e))?;

        Ok(json
            .data
            .into_iter()
            .filter_map(|p| {
                Some(AgentProject {
                    id: p.get("_id")?.as_str()?.to_string(),
                    name: p.get("name")?.as_str()?.to_string(),
                    color_hex: p
                        .get("colorHex")
                        .and_then(|v| v.as_str())
                        .unwrap_or("#6C2BD9")
                        .to_string(),
                })
            })
            .collect())
    }

    /// Fire-and-forget presence ping so Team Pulse (web dashboard) reflects a
    /// start/stop/idle transition within ~1s instead of waiting on the next
    /// 60s `/timelogs/sync` batch. Failures are logged but never propagated -
    /// presence is a nice-to-have, not something that should block tracking.
    pub async fn ping_presence(&self, status: &str, project_id: Option<&str>, task_id: Option<&str>) {
        let mut token = match self.ensure_access_token().await {
            Ok(t) => t,
            Err(_) => return,
        };

        let mut body = serde_json::json!({ "status": status });
        if let Some(pid) = project_id {
            body["projectId"] = serde_json::Value::String(pid.to_string());
        }
        if let Some(tid) = task_id {
            body["taskId"] = serde_json::Value::String(tid.to_string());
        }

        let url = format!("{}/activity/presence", self.api_base);
        let mut result = self
            .http
            .post(&url)
            .bearer_auth(&token)
            .json(&body)
            .send()
            .await;

        if let Ok(ref response) = result {
            if response.status() == reqwest::StatusCode::UNAUTHORIZED {
                if let Ok(new_token) = self.refresh_tokens().await {
                    token = new_token;
                    result = self
                        .http
                        .post(&url)
                        .bearer_auth(&token)
                        .json(&body)
                        .send()
                        .await;
                }
            }
        }

        if let Err(e) = result {
            log::debug!("Presence ping failed (non-fatal): {}", e);
        }
    }

    pub async fn fetch_my_tasks(&self) -> Result<Vec<AgentTask>, String> {
        let response = self.authorized_get("/tasks/mine").await?;
        if !response.status().is_success() {
            return Err("Failed to load tasks".into());
        }
        let json: ApiEnvelope<Vec<serde_json::Value>> = response
            .json()
            .await
            .map_err(|e| format!("Parse error: {}", e))?;

        Ok(json
            .data
            .into_iter()
            .filter_map(|t| {
                Some(AgentTask {
                    id: t.get("_id")?.as_str()?.to_string(),
                    title: t.get("title")?.as_str()?.to_string(),
                    list_name: t
                        .get("listName")
                        .and_then(|v| v.as_str())
                        .unwrap_or("Tasks")
                        .to_string(),
                    project_id: t
                        .get("projectId")
                        .and_then(|v| v.as_str())
                        .map(String::from),
                    project_name: t
                        .get("projectName")
                        .and_then(|v| v.as_str())
                        .map(String::from),
                })
            })
            .collect())
    }
}

fn parse_error(body: &str) -> String {
    serde_json::from_str::<serde_json::Value>(body)
        .ok()
        .and_then(|v| v.get("error").and_then(|e| e.as_str()).map(String::from))
        .unwrap_or_else(|| "Login failed".to_string())
}
