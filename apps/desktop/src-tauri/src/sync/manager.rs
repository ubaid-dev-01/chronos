use crate::storage::sqlite::Database;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use base64::Engine as _;
use base64::engine::general_purpose::STANDARD as BASE64;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SyncBatchPayload {
    batches: Vec<SyncBatchItem>,
    agent_version: String,
    platform: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SyncBatchItem {
    start_time: i64,
    end_time: i64,
    project_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    task_id: Option<String>,
    activity_score: f64,
    is_offline: bool,
    window_title: Option<String>,
    process_name: Option<String>,
    screenshot: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    sha256_hash: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SyncApiResponse {
    success: bool,
    synced_count: usize,
    failed_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatus {
    pub pending_timelogs: usize,
    pub pending_screenshots: usize,
    pub last_sync_at: Option<i64>,
    pub is_syncing: bool,
    pub last_error: Option<String>,
}

pub struct SyncManager {
    db: Arc<Database>,
    client: reqwest::Client,
    api_base: String,
    batch_size: usize,
    sync_interval_secs: u64,
}

impl SyncManager {
    pub fn new(db: Arc<Database>) -> Self {
        Self {
            db,
            client: reqwest::Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .expect("Failed to create HTTP client"),
            api_base: std::env::var("API_URL")
                .unwrap_or_else(|_| "http://localhost:4000/v1".to_string()),
            batch_size: 10,
            sync_interval_secs: 60,
        }
    }

    pub async fn start_sync_loop(&self) {
        log::info!("Sync loop started (interval: {}s)", self.sync_interval_secs);
        loop {
            tokio::time::sleep(Duration::from_secs(self.sync_interval_secs)).await;
            if let Err(e) = self.sync_pending().await {
                log::error!("Sync failed: {}", e);
                let _ = self.db.save_auth_value("network_offline", "1");
                let _ = self.db.save_auth_value("last_sync_error", &e);
            } else {
                let _ = self.db.save_auth_value("network_offline", "0");
                let _ = self.db.save_auth_value(
                    "last_sync_at",
                    &chrono::Utc::now().timestamp().to_string(),
                );
                let _ = self.db.save_auth_value("last_sync_error", "");
            }
        }
    }

    pub async fn sync_pending(&self) -> Result<SyncStatus, String> {
        let token = self.ensure_token().await?;

        let timelogs = self.db.get_unsynced_timelogs(self.batch_size)?;
        if timelogs.is_empty() {
            return Ok(SyncStatus {
                pending_timelogs: 0,
                pending_screenshots: 0,
                last_sync_at: Some(chrono::Utc::now().timestamp()),
                is_syncing: false,
                last_error: None,
            });
        }

        let screenshots = self.db.get_unsynced_screenshots(self.batch_size)?;

        let mut batch_items: Vec<SyncBatchItem> = Vec::new();
        for log in &timelogs {
            let shot = screenshots.iter().find(|s| s.timelog_id == log.id);
            let screenshot_data = shot.map(|s| BASE64.encode(&s.image_data));
            let sha256_hash = shot.and_then(|s| s.sha256_hash.clone());

            batch_items.push(SyncBatchItem {
                start_time: log.start_time,
                end_time: log.end_time,
                project_id: log.project_id.clone(),
                task_id: log.task_id.clone(),
                activity_score: log.activity_score,
                is_offline: log.is_offline,
                window_title: log.window_title.clone(),
                process_name: log.process_name.clone(),
                screenshot: screenshot_data,
                sha256_hash,
            });
        }

        let payload = SyncBatchPayload {
            batches: batch_items,
            agent_version: env!("CARGO_PKG_VERSION").to_string(),
            platform: platform_name(),
        };

        let response = self
            .client
            .post(format!("{}/timelogs/sync", self.api_base))
            .bearer_auth(&token)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        if response.status() == reqwest::StatusCode::UNAUTHORIZED {
            let token = self.refresh_token().await?;
            return self.sync_with_token(token).await;
        }

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("Server error {}: {}", status, body));
        }

        self.finish_sync(response, &timelogs, &screenshots, &token)
            .await
    }

    async fn sync_with_token(&self, token: String) -> Result<SyncStatus, String> {
        let timelogs = self.db.get_unsynced_timelogs(self.batch_size)?;
        let screenshots = self.db.get_unsynced_screenshots(self.batch_size)?;
        let mut batch_items: Vec<SyncBatchItem> = Vec::new();
        for log in &timelogs {
            let shot = screenshots.iter().find(|s| s.timelog_id == log.id);
            let screenshot_data = shot.map(|s| BASE64.encode(&s.image_data));
            let sha256_hash = shot.and_then(|s| s.sha256_hash.clone());
            batch_items.push(SyncBatchItem {
                start_time: log.start_time,
                end_time: log.end_time,
                project_id: log.project_id.clone(),
                task_id: log.task_id.clone(),
                activity_score: log.activity_score,
                is_offline: log.is_offline,
                window_title: log.window_title.clone(),
                process_name: log.process_name.clone(),
                screenshot: screenshot_data,
                sha256_hash,
            });
        }
        let payload = SyncBatchPayload {
            batches: batch_items,
            agent_version: env!("CARGO_PKG_VERSION").to_string(),
            platform: platform_name(),
        };
        let response = self
            .client
            .post(format!("{}/timelogs/sync", self.api_base))
            .bearer_auth(&token)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;
        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("Server error {}: {}", status, body));
        }
        self.finish_sync(response, &timelogs, &screenshots, &token)
            .await
    }

    async fn finish_sync(
        &self,
        response: reqwest::Response,
        timelogs: &[crate::storage::sqlite::PendingTimeLog],
        screenshots: &[crate::storage::sqlite::PendingScreenshot],
        token: &str,
    ) -> Result<SyncStatus, String> {
        let sync_response: SyncApiResponse = response
            .json()
            .await
            .map_err(|e| format!("Parse error: {}", e))?;

        if sync_response.success {
            for log in timelogs {
                self.db.mark_timelog_synced(log.id)?;
            }
            for screenshot in screenshots {
                self.db.mark_screenshot_synced(screenshot.id)?;
            }

            let activity_events: Vec<serde_json::Value> = timelogs
                .iter()
                .map(|log| {
                    let status = if log.is_offline {
                        "offline"
                    } else if log.activity_score >= 0.2 {
                        "active"
                    } else {
                        "idle"
                    };
                    serde_json::json!({
                        "status": status,
                        "timestamp": log.end_time,
                        "windowTitle": log.window_title,
                        "processName": log.process_name,
                    })
                })
                .collect();

            if !activity_events.is_empty() {
                let _ = self
                    .client
                    .post(format!("{}/activity/sync", self.api_base))
                    .bearer_auth(token)
                    .json(&serde_json::json!({
                        "events": activity_events,
                        "agentVersion": env!("CARGO_PKG_VERSION"),
                        "platform": platform_name(),
                    }))
                    .send()
                    .await;
            }
        }

        Ok(SyncStatus {
            pending_timelogs: 0,
            pending_screenshots: 0,
            last_sync_at: Some(chrono::Utc::now().timestamp()),
            is_syncing: false,
            last_error: if sync_response.failed_count > 0 {
                Some(format!("{} items failed", sync_response.failed_count))
            } else {
                None
            },
        })
    }

    async fn ensure_token(&self) -> Result<String, String> {
        if let Some(token) = self.db.get_auth_value("access_token")? {
            return Ok(token);
        }
        self.refresh_token().await
    }

    async fn refresh_token(&self) -> Result<String, String> {
        let refresh = self
            .db
            .get_auth_value("refresh_token")?
            .ok_or_else(|| "Not authenticated".to_string())?;

        let response = self
            .client
            .post(format!("{}/auth/refresh", self.api_base))
            .json(&serde_json::json!({ "refreshToken": refresh }))
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        if !response.status().is_success() {
            self.db.clear_auth()?;
            return Err("Session expired".into());
        }

        #[derive(Deserialize)]
        struct TokenData {
            #[serde(rename = "accessToken")]
            access_token: String,
            #[serde(rename = "refreshToken")]
            refresh_token: String,
        }
        #[derive(Deserialize)]
        struct TokenEnvelope {
            data: TokenData,
        }

        let tokens: TokenEnvelope = response
            .json()
            .await
            .map_err(|e| format!("Parse error: {}", e))?;

        self.db
            .save_auth_session(&tokens.data.access_token, &tokens.data.refresh_token)?;
        Ok(tokens.data.access_token)
    }
}

fn platform_name() -> String {
    match std::env::consts::OS {
        "windows" => "windows",
        "macos" => "macos",
        "linux" => "linux",
        _ => "linux",
    }
    .to_string()
}
