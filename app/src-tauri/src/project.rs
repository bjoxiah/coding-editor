use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub node_type: String, // type is reserved word
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lang: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileNode>>,
}

const IGNORED_DIRS: &[&str] = &[
    "node_modules",
    ".vscode",
    ".expo",
    ".git",
    ".DS_Store",
];

fn resolve_safe(project_path: &str, relative: &str) -> Result<PathBuf, String> {
    let base = PathBuf::from(project_path)
        .canonicalize()
        .map_err(|e| format!("Invalid project path '{}': {}", project_path, e))?;
    let target = base.join(relative);

    let resolved = if target.exists() {
        target
            .canonicalize()
            .map_err(|e| format!("Failed to resolve '{}': {}", relative, e))?
    } else {
        let parent = target
            .parent()
            .ok_or_else(|| "Invalid file path".to_string())?;
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directories: {}", e))?;
        }
        let parent_canon = parent
            .canonicalize()
            .map_err(|e| format!("Failed to resolve parent: {}", e))?;
        parent_canon.join(target.file_name().unwrap())
    };

    if !resolved.starts_with(&base) {
        return Err("Path traversal detected — access denied".to_string());
    }

    Ok(resolved)
}

fn get_lang(filename: &str) -> Option<String> {
    let ext = filename.rsplit('.').next()?.to_lowercase();
    match ext.as_str() {
        "tsx" | "ts" | "jsx" | "js" | "css" | "json" | "html" | "md" | "svg" | "yaml" | "yml" | "lock" => Some(ext),
        _ => None,
    }
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let name = entry.file_name().to_string_lossy().to_string();

        if IGNORED_DIRS.contains(&name.as_str()) {
            continue;
        }

        let src_path = entry.path();
        let dst_path = dst.join(&name);

        if entry.file_type()?.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }

    Ok(())
}

fn build_tree(base: &Path, dir: &Path) -> std::io::Result<Vec<FileNode>> {
    let mut nodes: Vec<FileNode> = Vec::new();

    let mut entries: Vec<_> = fs::read_dir(dir)?.filter_map(|e| e.ok()).collect();
    entries.sort_by_key(|e| {
        let is_file = e.file_type().map(|ft| ft.is_file()).unwrap_or(true);
        (is_file, e.file_name())
    });

    for entry in entries {
        let name = entry.file_name().to_string_lossy().to_string();

        if IGNORED_DIRS.contains(&name.as_str()) {
            continue;
        }

        let path = entry.path();
        let relative = path
            .strip_prefix(base)
            .unwrap_or(&path)
            .to_string_lossy()
            .to_string();

        if entry.file_type()?.is_dir() {
            let children = build_tree(base, &path)?;
            nodes.push(FileNode {
                name,
                path: relative,
                node_type: "folder".to_string(),
                lang: None,
                children: Some(children),
            });
        } else {
            nodes.push(FileNode {
                name: name.clone(),
                path: relative,
                node_type: "file".to_string(),
                lang: get_lang(&name),
                children: None,
            });
        }
    }

    Ok(nodes)
}

fn collect_files(base: &Path, dir: &Path, out: &mut Vec<String>) -> std::io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let name = entry.file_name().to_string_lossy().to_string();

        if IGNORED_DIRS.contains(&name.as_str()) {
            continue;
        }

        let path = entry.path();

        if path.is_dir() {
            collect_files(base, &path, out)?;
        } else {
            let relative = path.strip_prefix(base).unwrap();
            out.push(relative.to_string_lossy().to_string());
        }
    }
    Ok(())
}

// Commands
#[tauri::command]
pub async fn create_project(
    app: AppHandle,
    name: String,
    working_dir: String,
) -> Result<String, String> {
    let project_dir = PathBuf::from(&working_dir).join(&name);

    if project_dir.exists() {
        return Err(format!(
            "Directory already exists: {}",
            project_dir.display()
        ));
    }

    let template_dir = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("resources")
        .join("expo-template");

    if !template_dir.exists() {
        return Err(format!("Template not found at: {}", template_dir.display()));
    }

    copy_dir_recursive(&template_dir, &project_dir)
        .map_err(|e| format!("Failed to copy template: {}", e))?;

    // update app.json
    let app_json = project_dir.join("app.json");
    if app_json.exists() {
        let content =
            fs::read_to_string(&app_json).map_err(|e| format!("Failed to read app.json: {}", e))?;
        let updated = content
            .replace(
                "\"name\": \"expo-template\"",
                &format!("\"name\": \"{}\"", name),
            )
            .replace(
                "\"slug\": \"expo-template\"",
                &format!("\"slug\": \"{}\"", name),
            )
            .replace(
                "\"scheme\": \"expo-template\"",
                &format!("\"scheme\": \"{}\"", name),
            );
        fs::write(&app_json, updated).map_err(|e| format!("Failed to write app.json: {}", e))?;
    }

    // update package.json
    let pkg_json = project_dir.join("package.json");
    if pkg_json.exists() {
        let content = fs::read_to_string(&pkg_json)
            .map_err(|e| format!("Failed to read package.json: {}", e))?;
        let updated = content.replace(
            "\"name\": \"expo-template\"",
            &format!("\"name\": \"{}\"", name),
        );
        fs::write(&pkg_json, updated)
            .map_err(|e| format!("Failed to write package.json: {}", e))?;
    }

    Ok(project_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn read_file(project_path: String, file_path: String) -> Result<String, String> {
    let full = resolve_safe(&project_path, &file_path)?;
    fs::read_to_string(&full).map_err(|e| format!("Failed to read '{}': {}", file_path, e))
}

#[tauri::command]
pub async fn write_file(
    project_path: String,
    file_path: String,
    content: String,
) -> Result<(), String> {
    let full = resolve_safe(&project_path, &file_path)?;

    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directories: {}", e))?;
    }

    fs::write(&full, content).map_err(|e| format!("Failed to write '{}': {}", file_path, e))
}

#[tauri::command]
pub async fn delete_file(project_path: String, file_path: String) -> Result<(), String> {
    let full = resolve_safe(&project_path, &file_path)?;

    if !full.exists() {
        return Err(format!("File not found: {}", file_path));
    }

    if full.is_dir() {
        fs::remove_dir_all(&full)
            .map_err(|e| format!("Failed to delete directory '{}': {}", file_path, e))
    } else {
        fs::remove_file(&full).map_err(|e| format!("Failed to delete file '{}': {}", file_path, e))
    }
}

#[tauri::command]
pub async fn rename_file(
    project_path: String,
    old_path: String,
    new_path: String,
) -> Result<(), String> {
    let old_full = resolve_safe(&project_path, &old_path)?;
    let new_full = resolve_safe(&project_path, &new_path)?;

    if !old_full.exists() {
        return Err(format!("File not found: {}", old_path));
    }

    if new_full.exists() {
        return Err(format!("Destination already exists: {}", new_path));
    }

    if let Some(parent) = new_full.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directories: {}", e))?;
    }

    fs::rename(&old_full, &new_full)
        .map_err(|e| format!("Failed to rename '{}' to '{}': {}", old_path, new_path, e))
}

#[tauri::command]
pub async fn create_directory(project_path: String, dir_path: String) -> Result<(), String> {
    let full = resolve_safe(&project_path, &dir_path)?;
    fs::create_dir_all(&full)
        .map_err(|e| format!("Failed to create directory '{}': {}", dir_path, e))
}

#[tauri::command]
pub async fn list_files(project_path: String) -> Result<Vec<String>, String> {
    let root = PathBuf::from(&project_path);

    if !root.exists() {
        return Err(format!("Project not found: {}", project_path));
    }

    let mut files = Vec::new();
    collect_files(&root, &root, &mut files).map_err(|e| e.to_string())?;
    files.sort();
    Ok(files)
}

#[tauri::command]
pub async fn get_file_tree(project_path: String) -> Result<Vec<FileNode>, String> {
    let root = PathBuf::from(&project_path);

    if !root.exists() {
        return Err(format!("Project not found: {}", project_path));
    }

    build_tree(&root, &root).map_err(|e| format!("Failed to build tree: {}", e))
}

#[tauri::command]
pub async fn save_file(
    project_path: String,
    file_path: String,
    content: String,
) -> Result<(), String> {
    write_file(project_path, file_path, content).await
}

#[tauri::command]
pub async fn delete_project(project_path: String) -> Result<(), String> {
    let path = std::path::PathBuf::from(&project_path);

    if !path.exists() {
        return Ok(());
    }

    if !path.is_dir() {
        return Err(format!("Not a directory: {}", project_path));
    }

    // Get absolute path
    let canonical = path
        .canonicalize()
        .map_err(|e| format!("Invalid path: {}", e))?;

    let components: Vec<_> = canonical.components().collect();
    if components.len() <= 3 {
        return Err("Refusing to delete a top-level directory".to_string());
    }

    std::fs::remove_dir_all(&canonical).map_err(|e| format!("Failed to delete project: {}", e))
}

#[tauri::command]
pub async fn open_in_terminal(dir_path: String) -> Result<(), String> {
    let path = std::path::Path::new(&dir_path);
    if !path.exists() {
        return Err(format!("Path does not exist: {}", dir_path));
    }

    #[cfg(target_os = "macos")]
    {
        // apple
        let script = format!(
            "tell application \"Terminal\" to do script \"cd '{}'\" activate",
            dir_path.replace('\'', "\\'")
        );
        std::process::Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .spawn()
            .map_err(|e| format!("Failed to open Terminal: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        // windows
        let result = std::process::Command::new("wt")
            .args(["-d", &dir_path])
            .spawn();

        if result.is_err() {
            std::process::Command::new("cmd")
                .args(["/c", "start", "cmd.exe"])
                .current_dir(&dir_path)
                .spawn()
                .map_err(|e| format!("Failed to open terminal: {}", e))?;
        }
    }

    #[cfg(target_os = "linux")]
    {
        // linux
        let terminals = [
            ("gnome-terminal", vec!["--working-directory", &dir_path]),
            ("konsole", vec!["--workdir", &dir_path]),
            ("xterm", vec!["-e", &format!("cd '{}' && $SHELL", dir_path)]),
            ("x-terminal-emulator", vec![]),
        ];

        let mut launched = false;
        for (term, args) in &terminals {
            if std::process::Command::new(term).args(args).spawn().is_ok() {
                launched = true;
                break;
            }
        }

        if !launched {
            return Err("No supported terminal emulator found".to_string());
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn open_in_finder(path: String) -> Result<(), String> {
    let p = std::path::Path::new(&path);
    if !p.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open Finder: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open Explorer: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    Ok(())
}
