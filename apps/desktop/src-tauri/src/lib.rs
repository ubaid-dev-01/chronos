pub mod commands;
pub mod tracker;
pub mod screenshot;
pub mod sync;
pub mod storage;
pub mod tray;
pub mod api;

use std::sync::Arc;
use parking_lot::Mutex;
use tracker::engine::TrackerEngine;
use tracker::r#loop::TrackingLoop;
use storage::sqlite::Database;
use sync::manager::SyncManager;
use api::client::ApiClient;

pub struct AppState {
    pub tracker: Arc<Mutex<TrackerEngine>>,
    pub db: Arc<Database>,
    pub sync_manager: Arc<SyncManager>,
    pub api_client: Arc<ApiClient>,
    pub tracking_loop: Arc<TrackingLoop>,
}
