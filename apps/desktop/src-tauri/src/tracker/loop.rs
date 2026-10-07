use crate::api::client::ApiClient;
use crate::screenshot::blur::{encode_png, sha256_hex, BlurEngine};
use crate::screenshot::capture::{capture_primary_screen, random_delay_secs};
use crate::storage::sqlite::{Database, PendingScreenshot, PendingTimeLog};
use crate::tracker::engine::{TrackerEngine, TrackerState};
use crate::tracker::idle::get_idle_seconds;
use crate::tracker::input::InputSampler;
use crate::tracker::window::{get_current_window, is_sensitive_window};
use parking_lot::Mutex;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

const CHUNK_INTERVAL_SECS: u64 = 600;
const SCREENSHOT_INTERVAL_MIN_MINS: u64 = 3;
const SCREENSHOT_INTERVAL_MAX_MINS: u64 = 10;

pub struct TrackingLoop {
    tracker: Arc<Mutex<TrackerEngine>>,
    db: Arc<Database>,
    blur: BlurEngine,
    api_client: Arc<ApiClient>,
    app: AppHandle,
    next_screenshot_at: Mutex<Option<u64>>,
    last_chunk_flush_at: Mutex<Option<u64>>,
    last_seen_state: Mutex<TrackerState>,
    input: Mutex<InputSampler>,
}

impl TrackingLoop {
    pub fn new(
        tracker: Arc<Mutex<TrackerEngine>>,
        db: Arc<Database>,
        api_client: Arc<ApiClient>,
        app: AppHandle,
    ) -> Self {
        Self {
            tracker,
            db,
            blur: BlurEngine::new(),
            api_client,
            app,
            next_screenshot_at: Mutex::new(None),
            last_chunk_flush_at: Mutex::new(None),
            last_seen_state: Mutex::new(TrackerState::Idle),
            input: Mutex::new(InputSampler::new()),
        }
    }

    pub async fn run(self: Arc<Self>) {
        log::info!("Background tracking loop started");
        loop {
            self.tick_once();
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
    }

    fn tick_once(&self) {
        let mut tracker = self.tracker.lock();
        let state = tracker.state().clone();

        if state == TrackerState::Idle {
            *self.next_screenshot_at.lock() = None;
            *self.last_chunk_flush_at.lock() = None;
            *self.last_seen_state.lock() = TrackerState::Idle;
            return;
        }

        let (clicks, keys) = self.input.lock().sample_delta();
        if clicks > 0 || keys > 0 {
            tracker.record_input(clicks, keys);
        }

        let idle_secs = get_idle_seconds();
        tracker.check_idle(idle_secs);
        tracker.tick();

        let keywords = self.sensitive_keywords();
        if let Some(window) = get_current_window() {
            if !is_sensitive_window(&window.title, &window.process_name, &keywords) {
                tracker.update_window(window.title, window.process_name);
            }
        }

        let new_state = tracker.state();
        self.handle_state_transition(&tracker, new_state.clone());

        let now = now_secs();
        let session_started = tracker.session_started_secs().unwrap_or(now);

        {
            let mut last_flush = self.last_chunk_flush_at.lock();
            if last_flush.is_none() {
                *last_flush = Some(session_started);
            }
            let last_flush_secs = last_flush.unwrap_or(session_started);
            if now.saturating_sub(last_flush_secs) >= CHUNK_INTERVAL_SECS {
                drop(tracker);
                if let Err(e) = self.flush_current_chunk() {
                    log::error!("Chunk flush failed: {}", e);
                }
                *self.last_chunk_flush_at.lock() = Some(now);
                tracker = self.tracker.lock();
            }
        }

        if self.screenshots_enabled() && tracker.state() == TrackerState::Active {
            let mut next_at = self.next_screenshot_at.lock();
            if next_at.is_none() {
                let delay = random_delay_secs(
                    SCREENSHOT_INTERVAL_MIN_MINS,
                    SCREENSHOT_INTERVAL_MAX_MINS,
                );
                *next_at = Some(now + delay);
            }
            if let Some(target) = *next_at {
                if now >= target {
                    drop(tracker);
                    if let Err(e) = self.capture_screenshot() {
                        log::warn!("Screenshot capture failed: {}", e);
                    }
                    *self.next_screenshot_at.lock() = None;
                }
            }
        }
    }

    fn handle_state_transition(&self, tracker: &TrackerEngine, new_state: TrackerState) {
        let mut last_seen = self.last_seen_state.lock();
        if *last_seen == new_state {
            return;
        }
        let previous = last_seen.clone();
        *last_seen = new_state.clone();
        drop(last_seen);

        let status = tracker.get_status();
        let project_id = status.session.as_ref().map(|s| s.project_id.clone());
        let task_id = status.session.as_ref().and_then(|s| s.task_id.clone());

        match (previous, new_state) {
            (TrackerState::Active, TrackerState::AwayIdle) => {
                if self.notifications_enabled() {
                    notify(
                        &self.app,
                        "Chronos",
                        "You've gone idle — timer paused until activity resumes.",
                    );
                }
                spawn_presence_ping(self.api_client.clone(), "idle", project_id, task_id);
            }
            (TrackerState::AwayIdle, TrackerState::Active) => {
                if self.notifications_enabled() {
                    notify(&self.app, "Chronos", "Welcome back — tracking resumed.");
                }
                spawn_presence_ping(self.api_client.clone(), "active", project_id, task_id);
            }
            _ => {}
        }
    }

    pub fn flush_current_chunk(&self) -> Result<Option<i64>, String> {
        let tracker = self.tracker.lock();
        let chunk = match tracker.chunk_snapshot() {
            Some(c) => c,
            None => return Ok(None),
        };
        drop(tracker);

        if chunk.end_time <= chunk.start_time {
            return Ok(None);
        }

        let log = PendingTimeLog {
            id: 0,
            user_id: self.db.get_auth_value("user_id")?.unwrap_or_default(),
            project_id: chunk.project_id,
            task_id: chunk.task_id,
            start_time: chunk.start_time,
            end_time: chunk.end_time,
            activity_score: chunk.activity_score,
            is_offline: self
                .db
                .get_auth_value("network_offline")
                .ok()
                .flatten()
                .map(|v| v == "1")
                .unwrap_or(false),
            window_title: chunk.window_title,
            process_name: chunk.process_name,
        };

        let id = self.db.insert_timelog(&log)?;
        self.tracker.lock().set_last_chunk_timelog_id(id);
        Ok(Some(id))
    }

    fn capture_screenshot(&self) -> Result<(), String> {
        if let Err(e) = self.flush_current_chunk() {
            log::warn!("Pre-screenshot chunk flush: {}", e);
        }

        let timelog_id = self
            .tracker
            .lock()
            .last_chunk_timelog_id()
            .or_else(|| self.db.get_latest_open_timelog_id().ok().flatten());

        let timelog_id = match timelog_id {
            Some(id) => id,
            None => return Ok(()),
        };

        let image = capture_primary_screen()?;
        let blurred = self.blur.blur_screenshot(&image);
        let png = encode_png(&blurred)?;
        let hash = sha256_hex(&png);

        self.db.insert_screenshot(&PendingScreenshot {
            id: 0,
            timelog_id,
            image_data: png,
            timestamp: chrono::Utc::now().timestamp_millis(),
            is_blurred: true,
            sha256_hash: Some(hash),
        })?;

        log::info!("Screenshot captured for timelog {}", timelog_id);
        Ok(())
    }

    fn screenshots_enabled(&self) -> bool {
        let org_ok = self
            .db
            .get_auth_value("screenshots_enabled")
            .ok()
            .flatten()
            .map(|v| v != "0")
            .unwrap_or(true);
        let user_ok = self
            .db
            .get_auth_value("settings_screenshots_capture")
            .ok()
            .flatten()
            .map(|v| v != "0")
            .unwrap_or(true);
        org_ok && user_ok
    }

    fn notifications_enabled(&self) -> bool {
        self.db
            .get_auth_value("settings_notifications")
            .ok()
            .flatten()
            .map(|v| v != "0")
            .unwrap_or(true)
    }

    fn sensitive_keywords(&self) -> Vec<String> {
        let raw = self
            .db
            .get_auth_value("settings_sensitive_keywords")
            .ok()
            .flatten()
            .unwrap_or_else(|| {
                "bank,paypal,venmo,password,1password,lastpass,bitwarden,keychain,wallet,private,incognito"
                    .into()
            });
        raw.split(',')
            .map(|s| s.trim().to_lowercase())
            .filter(|s| !s.is_empty())
            .collect()
    }
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

pub fn notify(app: &AppHandle, title: &str, body: &str) {
    if let Err(e) = app.notification().builder().title(title).body(body).show() {
        log::warn!("Failed to show notification: {}", e);
    }
}

fn spawn_presence_ping(
    api_client: Arc<ApiClient>,
    status: &'static str,
    project_id: Option<String>,
    task_id: Option<String>,
) {
    tauri::async_runtime::spawn(async move {
        api_client
            .ping_presence(status, project_id.as_deref(), task_id.as_deref())
            .await;
    });
}
