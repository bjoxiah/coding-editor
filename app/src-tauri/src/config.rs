use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "config.json";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppSettings {
    pub username:              String,
    pub api_url:               String,
    pub ws_url:                String,
    pub aws_access_key_id:     String,
    pub aws_secret_access_key: String,
    pub aws_region:            String,
    pub aws_bucket:            String,
}

fn enc_key() -> [u8; 32] {
    let uid = machine_uid::get().unwrap_or_else(|_| "fallback-uid".to_string());
    let mut h = Sha256::new();
    h.update(b"rnagent-config-v1:");
    h.update(uid.as_bytes());
    h.finalize().into()
}

fn encrypt(plaintext: &str) -> Result<String, String> {
    if plaintext.is_empty() {
        return Ok(String::new());
    }
    let key    = enc_key();
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key));
    let nonce  = Aes256Gcm::generate_nonce(&mut OsRng);
    let ct     = cipher
        .encrypt(&nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encrypt failed: {}", e))?;

    let mut blob = nonce.to_vec();
    blob.extend_from_slice(&ct);
    Ok(B64.encode(&blob))
}

fn decrypt(b64: &str) -> Result<String, String> {
    if b64.is_empty() {
        return Ok(String::new());
    }
    let blob = B64.decode(b64).map_err(|e| format!("Base64 decode: {}", e))?;
    if blob.len() < 12 {
        return Err("Ciphertext too short".to_string());
    }
    let (nonce_bytes, ct) = blob.split_at(12);
    let key    = enc_key();
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key));
    let plain  = cipher
        .decrypt(Nonce::from_slice(nonce_bytes), ct)
        .map_err(|e| format!("Decrypt failed: {}", e))?;
    String::from_utf8(plain).map_err(|e| e.to_string())
}

fn get_str(store: &tauri_plugin_store::Store<tauri::Wry>, key: &str) -> String {
    store
        .get(key)
        .and_then(|v| v.as_str().map(str::to_string))
        .unwrap_or_default()
}


#[tauri::command]
pub async fn save_settings(
    app: AppHandle,
    settings: AppSettings,
) -> Result<(), String> {
    let store = app
        .store(STORE_FILE)
        .map_err(|e| format!("Store error: {}", e))?;

    store.set("username",   serde_json::json!(settings.username));
    store.set("api_url",    serde_json::json!(settings.api_url));
    store.set("ws_url",     serde_json::json!(settings.ws_url));
    store.set("aws_region", serde_json::json!(settings.aws_region));
    store.set("aws_bucket", serde_json::json!(settings.aws_bucket));

    store.set("aws_access_key_id",
        serde_json::json!(encrypt(&settings.aws_access_key_id)?));
    store.set("aws_secret_access_key",
        serde_json::json!(encrypt(&settings.aws_secret_access_key)?));

    store.set("configured", serde_json::json!(true));
    store.save().map_err(|e| format!("Store save failed: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn load_settings(app: AppHandle) -> Result<AppSettings, String> {
    let store = app
        .store(STORE_FILE)
        .map_err(|e| format!("Store error: {}", e))?;

    Ok(AppSettings {
        username:    get_str(&store, "username"),
        api_url:     get_str(&store, "api_url"),
        ws_url:      get_str(&store, "ws_url"),
        aws_region:  get_str(&store, "aws_region"),
        aws_bucket:  get_str(&store, "aws_bucket"),
        aws_access_key_id:     decrypt(&get_str(&store, "aws_access_key_id"))?,
        aws_secret_access_key: decrypt(&get_str(&store, "aws_secret_access_key"))?,
    })
}

#[tauri::command]
pub async fn has_settings(app: AppHandle) -> Result<bool, String> {
    let store = app
        .store(STORE_FILE)
        .map_err(|e| format!("Store error: {}", e))?;

    Ok(store
        .get("configured")
        .and_then(|v| v.as_bool())
        .unwrap_or(false))
}

#[tauri::command]
pub async fn clear_settings(app: AppHandle) -> Result<(), String> {
    let store = app
        .store(STORE_FILE)
        .map_err(|e| format!("Store error: {}", e))?;

    store.clear();
    store.save().map_err(|e| format!("Store save failed: {}", e))?;
    Ok(())
}