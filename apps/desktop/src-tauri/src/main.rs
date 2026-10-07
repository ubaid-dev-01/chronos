#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chronos_agent::commands;
use chronos_agent::tracker::engine::{TrackerEngine, TrackerState};
use chronos_agent::tracker::r#loop::TrackingLoop;
use chronos_agent::storage::sqlite::Database;
use chronos_agent::sync::manager::SyncManager;
use chronos_agent::api::client::ApiClient;
use chronos_agent::tray;
use chronos_agent::AppState;

use std::sync::Arc;
use parking_lot::Mutex;
use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

fn main() {
    env_logger::init();

    let start_sc = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyS);
    let pause_sc = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyP);
    let stop_sc = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyX);
    let start_sc_h = start_sc;
    let pause_sc_h = pause_sc;
    let stop_sc_h = stop_sc;

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if event.state != ShortcutState::Pressed {
                        return;
                    }
                    let Some(state) = app.try_state::<AppState>() else {
                        return;
                    };
                    if *shortcut == start_sc_h {
                        let project = state
                            .db
                            .get_auth_value("last_project_id")
                            .ok()
                            .flatten()
                            .filter(|s| !s.is_empty());
                        if let Some(pid) = project {
                            let task = state
                                .db
                                .get_auth_value("last_task_id")
                                .ok()
                                .flatten()
                                .filter(|s| !s.is_empty());
                            let _ = state.tracker.lock().start(pid, task);
                            if state
                                .db
                                .get_auth_value("show_popup_timer")
                                .ok()
                                .flatten()
                                .map(|v| v == "1")
                                .unwrap_or(false)
                            {
                                if let Some(win) = app.get_webview_window("timer") {
                                    let _ = win.show();
                                }
                            }
                        }
                    } else if *shortcut == pause_sc_h {
                        let mut t = state.tracker.lock();
                        match t.state() {
                            TrackerState::Active => {
                                let _ = t.pause();
                            }
                            TrackerState::Paused | TrackerState::AwayIdle => {
                                let _ = t.resume();
                            }
                            _ => {}
                        }
                    } else if *shortcut == stop_sc_h {
                        let _ = state.tracking_loop.flush_current_chunk();
                        let _ = state.tracker.lock().stop();
                        if let Some(win) = app.get_webview_window("timer") {
                            let _ = win.hide();
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            let data_dir = app.path().app_data_dir().expect("Failed to get data dir");
            std::fs::create_dir_all(&data_dir).ok();
            let db_path = data_dir.join("chronos.db");
            let db = Arc::new(Database::new(&db_path).expect("Failed to init database"));

            let tracker = Arc::new(Mutex::new(TrackerEngine::new()));
            let sync_manager = Arc::new(SyncManager::new(db.clone()));
            let api_client = Arc::new(ApiClient::new(db.clone()));
            let tracking_loop = Arc::new(TrackingLoop::new(
                tracker.clone(),
                db.clone(),
                api_client.clone(),
                app.handle().clone(),
            ));

            app.manage(AppState {
                tracker: tracker.clone(),
                db,
                sync_manager: sync_manager.clone(),
                api_client,
                tracking_loop: tracking_loop.clone(),
            });

            let handle = app.handle().clone();
            tray::setup_tray(&handle)?;

            let start_reg = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyS);
            let pause_reg = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyP);
            let stop_reg = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyX);
            let _ = app.global_shortcut().register(start_reg);
            let _ = app.global_shortcut().register(pause_reg);
            let _ = app.global_shortcut().register(stop_reg);

            tauri::async_runtime::spawn(async move {
                sync_manager.start_sync_loop().await;
            });

            tauri::async_runtime::spawn(async move {
                tracking_loop.run().await;
            });

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
            }
            if let Some(window) = app.get_webview_window("timer") {
                let _ = window.hide();
            }

            log::info!("Chronos agent started");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::auth::login,
            commands::auth::logout,
            commands::auth::get_auth_status,
            commands::data::fetch_projects,
            commands::data::fetch_my_tasks,
            commands::tracking::start_tracking,
            commands::tracking::stop_tracking,
            commands::tracking::pause_tracking,
            commands::tracking::resume_tracking,
            commands::tracking::get_tracking_status,
            commands::sync_cmd::trigger_sync,
            commands::sync_cmd::get_sync_status,
            commands::sync_cmd::set_network_status,
            commands::permissions::check_permissions,
            commands::agent::get_permissions,
            commands::agent::get_agent_settings,
            commands::agent::set_agent_settings,
            commands::agent::get_today_summary,
            commands::agent::open_dashboard,
            commands::agent::set_last_selection,
            commands::agent::show_floating_timer,
            commands::agent::hide_floating_timer,
        ])
        .run(tauri::generate_context!())
        .expect("Error running Chronos agent");
}
