// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rss_reader_lib::parse_rss;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![parse_rss])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
