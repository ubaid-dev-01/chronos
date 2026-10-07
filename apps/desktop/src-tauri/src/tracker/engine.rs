use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TrackerState {
    Idle,
    Active,
    Paused,
    AwayIdle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackingSession {
    pub project_id: String,
    pub task_id: Option<String>,
    pub started_at: DateTime<Utc>,
    pub state: TrackerState,
    pub total_active_seconds: u64,
    pub total_idle_seconds: u64,
    pub chunk_active_seconds: u64,
    pub chunk_idle_seconds: u64,
    pub chunk_started_at: DateTime<Utc>,
    pub mouse_clicks: u32,
    pub key_presses: u32,
    pub chunk_mouse_clicks: u32,
    pub chunk_key_presses: u32,
    pub current_window: Option<String>,
    pub current_process: Option<String>,
    pub last_chunk_timelog_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackerStatus {
    pub state: TrackerState,
    pub session: Option<TrackingSession>,
    pub elapsed_seconds: u64,
    pub activity_score: f64,
}

#[derive(Debug, Clone)]
pub struct ChunkSnapshot {
    pub project_id: String,
    pub task_id: Option<String>,
    pub start_time: i64,
    pub end_time: i64,
    pub activity_score: f64,
    pub window_title: Option<String>,
    pub process_name: Option<String>,
}

pub struct TrackerEngine {
    state: TrackerState,
    session: Option<TrackingSession>,
    idle_threshold_secs: u64,
}

impl TrackerEngine {
    pub fn new() -> Self {
        Self {
            state: TrackerState::Idle,
            session: None,
            idle_threshold_secs: 600,
        }
    }

    pub fn state(&self) -> TrackerState {
        self.state.clone()
    }

    pub fn start(
        &mut self,
        project_id: String,
        task_id: Option<String>,
    ) -> Result<(), String> {
        if self.state != TrackerState::Idle {
            return Err("Already tracking".into());
        }

        let now = Utc::now();
        self.session = Some(TrackingSession {
            project_id,
            task_id,
            started_at: now,
            state: TrackerState::Active,
            total_active_seconds: 0,
            total_idle_seconds: 0,
            chunk_active_seconds: 0,
            chunk_idle_seconds: 0,
            chunk_started_at: now,
            mouse_clicks: 0,
            key_presses: 0,
            chunk_mouse_clicks: 0,
            chunk_key_presses: 0,
            current_window: None,
            current_process: None,
            last_chunk_timelog_id: None,
        });
        self.state = TrackerState::Active;
        log::info!("Tracking started");
        Ok(())
    }

    pub fn stop(&mut self) -> Result<Option<TrackingSession>, String> {
        if self.state == TrackerState::Idle {
            return Err("Not tracking".into());
        }

        let session = self.session.take();
        self.state = TrackerState::Idle;
        log::info!("Tracking stopped");
        Ok(session)
    }

    pub fn pause(&mut self) -> Result<(), String> {
        if self.state != TrackerState::Active {
            return Err("Not actively tracking".into());
        }
        self.state = TrackerState::Paused;
        if let Some(ref mut session) = self.session {
            session.state = TrackerState::Paused;
        }
        Ok(())
    }

    pub fn resume(&mut self) -> Result<(), String> {
        if self.state != TrackerState::Paused && self.state != TrackerState::AwayIdle {
            return Err("Not paused".into());
        }
        self.state = TrackerState::Active;
        if let Some(ref mut session) = self.session {
            session.state = TrackerState::Active;
        }
        Ok(())
    }

    pub fn update_window(&mut self, title: String, process: String) {
        if let Some(ref mut session) = self.session {
            session.current_window = Some(title);
            session.current_process = Some(process);
        }
    }

    pub fn record_input(&mut self, clicks: u32, keys: u32) {
        if let Some(ref mut session) = self.session {
            if self.state == TrackerState::Active {
                session.mouse_clicks = session.mouse_clicks.saturating_add(clicks);
                session.key_presses = session.key_presses.saturating_add(keys);
                session.chunk_mouse_clicks = session.chunk_mouse_clicks.saturating_add(clicks);
                session.chunk_key_presses = session.chunk_key_presses.saturating_add(keys);
            }
        }
    }

    pub fn check_idle(&mut self, system_idle_secs: u64) {
        if self.state == TrackerState::Active && system_idle_secs >= self.idle_threshold_secs {
            self.state = TrackerState::AwayIdle;
            if let Some(ref mut session) = self.session {
                session.state = TrackerState::AwayIdle;
            }
        } else if self.state == TrackerState::AwayIdle
            && system_idle_secs < self.idle_threshold_secs
        {
            self.state = TrackerState::Active;
            if let Some(ref mut session) = self.session {
                session.state = TrackerState::Active;
            }
        }
    }

    pub fn tick(&mut self) {
        if let Some(ref mut session) = self.session {
            match self.state {
                TrackerState::Active => {
                    session.total_active_seconds += 1;
                    session.chunk_active_seconds += 1;
                }
                TrackerState::AwayIdle => {
                    session.total_idle_seconds += 1;
                    session.chunk_idle_seconds += 1;
                }
                _ => {}
            }
        }
    }

    pub fn session_started_secs(&self) -> Option<u64> {
        self.session.as_ref().map(|s| s.started_at.timestamp() as u64)
    }

    pub fn last_chunk_timelog_id(&self) -> Option<i64> {
        self.session
            .as_ref()
            .and_then(|s| s.last_chunk_timelog_id)
    }

    pub fn set_last_chunk_timelog_id(&mut self, id: i64) {
        if let Some(ref mut session) = self.session {
            session.last_chunk_timelog_id = Some(id);
            session.chunk_started_at = Utc::now();
            session.chunk_active_seconds = 0;
            session.chunk_idle_seconds = 0;
            session.chunk_mouse_clicks = 0;
            session.chunk_key_presses = 0;
        }
    }

    pub fn chunk_snapshot(&self) -> Option<ChunkSnapshot> {
        let session = self.session.as_ref()?;
        let chunk_total = session.chunk_active_seconds + session.chunk_idle_seconds;
        let idle_ratio = if chunk_total == 0 {
            1.0
        } else {
            session.chunk_active_seconds as f64 / chunk_total as f64
        };
        let input_events = (session.chunk_mouse_clicks + session.chunk_key_presses) as f64;
        let input_score = (input_events / 30.0).clamp(0.0, 1.0);
        let activity_score = (idle_ratio * 0.65 + input_score * 0.35).clamp(0.0, 1.0);

        Some(ChunkSnapshot {
            project_id: session.project_id.clone(),
            task_id: session.task_id.clone(),
            start_time: session.chunk_started_at.timestamp_millis(),
            end_time: Utc::now().timestamp_millis(),
            activity_score,
            window_title: session.current_window.clone(),
            process_name: session.current_process.clone(),
        })
    }

    pub fn get_status(&self) -> TrackerStatus {
        let elapsed = self.session.as_ref().map_or(0, |s| {
            (Utc::now() - s.started_at).num_seconds().max(0) as u64
        });

        let activity_score = self.session.as_ref().map_or(0.0, |s| {
            let total = s.total_active_seconds + s.total_idle_seconds;
            if total == 0 {
                1.0
            } else {
                s.total_active_seconds as f64 / total as f64
            }
        });

        TrackerStatus {
            state: self.state.clone(),
            session: self.session.clone(),
            elapsed_seconds: elapsed,
            activity_score,
        }
    }
}
