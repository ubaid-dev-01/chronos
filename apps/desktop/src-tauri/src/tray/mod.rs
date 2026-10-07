use crate::AppState;
use tauri::{
    AppHandle, Manager,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconEvent,
};
use tauri_plugin_shell::ShellExt;

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItem::with_id(app, "show", "Show Chronos", true, None::<&str>)?;
    let start = MenuItem::with_id(app, "start", "Start Tracking", true, None::<&str>)?;
    let pause = MenuItem::with_id(app, "pause", "Pause", true, None::<&str>)?;
    let resume = MenuItem::with_id(app, "resume", "Resume", true, None::<&str>)?;
    let stop = MenuItem::with_id(app, "stop", "Stop", true, None::<&str>)?;
    let dashboard = MenuItem::with_id(app, "dashboard", "Open Dashboard", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[&show, &sep, &start, &pause, &resume, &stop, &sep, &dashboard, &sep, &quit],
    )?;

    if let Some(tray) = app.tray_by_id("main") {
        tray.set_menu(Some(menu))?;
        tray.on_menu_event(move |app, event| {
            match event.id.as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "start" => tray_start(app),
                "pause" => tray_pause(app),
                "resume" => tray_resume(app),
                "stop" => tray_stop(app),
                "dashboard" => {
                    let base = std::env::var("APP_URL")
                        .unwrap_or_else(|_| "http://localhost:3000".into());
                    let _ = app.shell().open(format!("{}/dashboard", base.trim_end_matches('/')), None);
                }
                "quit" => app.exit(0),
                _ => {}
            }
        });
        tray.on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::DoubleClick { .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        });
    }

    Ok(())
}

fn tray_start(app: &AppHandle) {
    let Some(state) = app.try_state::<AppState>() else {
        return;
    };
    let project_id = state
        .db
        .get_auth_value("last_project_id")
        .ok()
        .flatten()
        .filter(|s| !s.is_empty());
    let Some(project_id) = project_id else {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
        }
        return;
    };
    let task_id = state
        .db
        .get_auth_value("last_task_id")
        .ok()
        .flatten()
        .filter(|s| !s.is_empty());
    let label = state.db.get_auth_value("last_label").ok().flatten();

    {
        let mut tracker = state.tracker.lock();
        if tracker.start(project_id.clone(), task_id.clone()).is_err() {
            return;
        }
    }

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

    let api = state.api_client.clone();
    let msg = label.unwrap_or_else(|| "Tracking started".into());
    crate::tracker::r#loop::notify(app, "Chronos", &msg);
    tauri::async_runtime::spawn(async move {
        api.ping_presence("active", Some(project_id.as_str()), task_id.as_deref())
            .await;
    });
}

fn tray_pause(app: &AppHandle) {
    let Some(state) = app.try_state::<AppState>() else {
        return;
    };
    let _ = state.tracker.lock().pause();
}

fn tray_resume(app: &AppHandle) {
    let Some(state) = app.try_state::<AppState>() else {
        return;
    };
    let _ = state.tracker.lock().resume();
}

fn tray_stop(app: &AppHandle) {
    let Some(state) = app.try_state::<AppState>() else {
        return;
    };
    let _ = state.tracking_loop.flush_current_chunk();
    let _ = state.tracker.lock().stop();
    if let Some(win) = app.get_webview_window("timer") {
        let _ = win.hide();
    }
    crate::tracker::r#loop::notify(app, "Chronos", "Stopped tracking");
    let api = state.api_client.clone();
    tauri::async_runtime::spawn(async move {
        api.ping_presence("idle", None, None).await;
    });
}
