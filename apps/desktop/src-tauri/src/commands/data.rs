use crate::api::client::{AgentProject, AgentTask};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn fetch_projects(state: State<'_, AppState>) -> Result<Vec<AgentProject>, String> {
    state.api_client.fetch_projects().await
}

#[tauri::command]
pub async fn fetch_my_tasks(state: State<'_, AppState>) -> Result<Vec<AgentTask>, String> {
    state.api_client.fetch_my_tasks().await
}
