use tokio::fs;
use reqwest::{Client, Response};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter};
use crate::config::load_settings;

const MAX_FRAME_SIZE: usize = 10 * 1024 * 1024; // 10MB

#[derive(Debug, Serialize)]
struct ScaffoldRequest {
    project_path: String,
    user_prompt:  String,
    app_name:     String,
    brand_color:  String,
    image_urls:   Vec<String>,
}

#[derive(Debug, Serialize)]
struct EditRequest {
    project_path:  String,
    relative_path: String,
    content:       String,
    user_prompt:   String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AgentEvent {
    FileWrite { path: String, content: String },
    Status    { message: String },
    Done      { summary: String, files: Vec<String> },
    Error     { message: String },
}

fn find_double_newline(buf: &[u8]) -> Option<usize> {
    buf.windows(2).position(|w| w == b"\n\n")
}

async fn secure_write_file(base_dir: &Path, rel_path: &str, content: &str) -> Result<(), String> {
    let target_path = base_dir.join(rel_path);

    let parent = target_path.parent().ok_or("Invalid file path")?;
    fs::create_dir_all(parent).await.map_err(|e| e.to_string())?;

    let canonical_parent = fs::canonicalize(parent).await.map_err(|e| e.to_string())?;
    let canonical_base   = fs::canonicalize(base_dir).await.map_err(|e| e.to_string())?;

    if !canonical_parent.starts_with(&canonical_base) {
        return Err("Security violation: path traversal detected".into());
    }

    fs::write(&target_path, content)
        .await
        .map_err(|e| format!("Failed to write {}: {}", rel_path, e))
}

async fn process_stream(
    app:       &AppHandle,
    base_path: &Path,
    mut response: Response,
) -> Result<(), String> {
    let mut raw_buf = Vec::new();

    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        raw_buf.extend_from_slice(&chunk);

        if raw_buf.len() > MAX_FRAME_SIZE {
            return Err("Response exceeded safety limit".into());
        }

        while let Some(pos) = find_double_newline(&raw_buf) {
            let frame_bytes: Vec<u8> = raw_buf.drain(..pos + 2).collect();

            let frame = match std::str::from_utf8(&frame_bytes) {
                Ok(s) => s.trim(),
                Err(_) => continue,
            };

            if !frame.starts_with("data:") {
                continue;
            }

            let event: AgentEvent = match serde_json::from_str(&frame[5..]) {
                Ok(e) => e,
                Err(_) => continue,
            };

            match &event {
                AgentEvent::FileWrite { path, content } => {
                    if let Err(e) = secure_write_file(base_path, path, content).await {
                        app.emit("agent_event", AgentEvent::Error { message: e }).ok();
                        continue;
                    }
                    app.emit("agent_event", event).ok();
                }
                AgentEvent::Done { .. } | AgentEvent::Error { .. } => {
                    app.emit("agent_event", event).ok();
                    return Ok(());
                }
                _ => {
                    app.emit("agent_event", event).ok();
                }
            }
        }
    }

    app.emit("agent_event", AgentEvent::Error {
        message: "Stream closed unexpectedly".into(),
    }).ok();

    Ok(())
}

#[tauri::command]
pub async fn scaffold_project(
    app:          AppHandle,
    client:       tauri::State<'_, Client>,
    project_path: String,
    prompt:       String,
    app_name:     String,
    brand_color:  String,
    image_urls:   Vec<String>,
) -> Result<(), String> {
    let settings = load_settings(app.clone()).await?;

    let base_path = PathBuf::from(&project_path)
        .canonicalize()
        .map_err(|e| e.to_string())?;

    let url = format!("{}/generate", settings.api_url.trim_end_matches('/'));

    let response = client
        .post(&url)
        .json(&ScaffoldRequest {
            project_path,
            user_prompt: prompt,
            app_name,
            brand_color,
            image_urls,
        })
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Server returned an error ({})", response.status()));
    }

    process_stream(&app, &base_path, response).await
}

#[tauri::command]
pub async fn edit_project_file(
    app:           AppHandle,
    client:        tauri::State<'_, Client>,
    project_path:  String,
    relative_path: String,
    content:       String,
    prompt:        String,
) -> Result<(), String> {
    let settings = load_settings(app.clone()).await?;

    let base_path = PathBuf::from(&project_path)
        .canonicalize()
        .map_err(|e| e.to_string())?;

    let url = format!("{}/edit", settings.api_url.trim_end_matches('/'));

    let response = client
        .post(&url)
        .json(&EditRequest {
            project_path,
            relative_path,
            content,
            user_prompt: prompt,
        })
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Server returned an error ({})", response.status()));
    }

    process_stream(&app, &base_path, response).await
}