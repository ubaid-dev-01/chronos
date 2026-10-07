use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowInfo {
    pub title: String,
    pub process_name: String,
}

/// Get the currently active window info (cross-platform via x-win).
pub fn get_current_window() -> Option<WindowInfo> {
    let window = x_win::get_active_window().ok()?;
    Some(WindowInfo {
        title: window.title,
        process_name: window.info.name,
    })
}

/// Check if the current window is a "sensitive" application
pub fn is_sensitive_window(title: &str, process: &str, keywords: &[String]) -> bool {
    let lower_title = title.to_lowercase();
    let lower_process = process.to_lowercase();

    keywords.iter().any(|kw| {
        !kw.is_empty() && (lower_title.contains(kw) || lower_process.contains(kw))
    })
}
