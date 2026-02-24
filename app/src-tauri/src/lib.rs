mod project;
mod config;
mod aws;
mod agent;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {    
    let client = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_secs(10))
        .timeout(std::time::Duration::from_secs(300)) // generous for streaming
        .build()
        .expect("Failed to build HTTP client");

    tauri::Builder::default()
        .manage(client)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // project
            project::create_project,
            project::read_file,
            project::write_file,
            project::save_file,
            project::delete_file,
            project::rename_file,
            project::create_directory,
            project::delete_project,
            project::list_files,
            project::get_file_tree,
            project::open_in_terminal,
            project::open_in_finder,
            // config
            config::save_settings,
            config::load_settings,
            config::has_settings,
            config::clear_settings,
            // aws
            aws::upload_to_s3,
            aws::delete_from_s3,
            // agent
            agent::run_agent
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
