use aws_config::BehaviorVersion;
use aws_credential_types::Credentials;
use aws_sdk_s3::{
    config::Region,
    presigning::PresigningConfig,
    primitives::ByteStream,
    Client,
};
use std::time::Duration;
use tauri::AppHandle;

use crate::config::load_settings;

const PRESIGN_DURATION_SECS: u64 = 60 * 60 * 24 * 7; // 7 days

async fn s3_client(app: &AppHandle) -> Result<(Client, String), String> {
    let settings = load_settings(app.clone()).await?;

    if settings.aws_access_key_id.is_empty() || settings.aws_secret_access_key.is_empty() {
        return Err("AWS credentials not configured. Please complete setup in Settings.".to_string());
    }
    if settings.aws_region.is_empty() {
        return Err("AWS region not configured.".to_string());
    }
    if settings.aws_bucket.is_empty() {
        return Err("AWS bucket not configured.".to_string());
    }

    let credentials = Credentials::new(
        &settings.aws_access_key_id,
        &settings.aws_secret_access_key,
        None,
        None,
        "rnagent-store",
    );

    let sdk_config = aws_config::defaults(BehaviorVersion::latest())
        .credentials_provider(credentials)
        .region(Region::new(settings.aws_region.clone()))
        .load()
        .await;

    let client = Client::new(&sdk_config);
    Ok((client, settings.aws_bucket))
}


#[tauri::command]
pub async fn upload_to_s3(
    app: AppHandle,
    file_name: String,
    content_type: String,
    bytes: Vec<u8>,
) -> Result<String, String> {
    let (client, bucket) = s3_client(&app).await?;

    let ext = file_name
        .rsplit('.')
        .next()
        .unwrap_or("bin")
        .to_lowercase();

    let key = format!(
        "images/{}/{}.{}",
        chrono::Utc::now().format("%Y-%m-%d"),
        uuid::Uuid::new_v4(),
        ext
    );

    client
        .put_object()
        .bucket(&bucket)
        .key(&key)
        .content_type(&content_type)
        .body(ByteStream::from(bytes))
        .send()
        .await
        .map_err(|e| format!("S3 upload failed: {:?}", e))?;

    let presign_config = PresigningConfig::expires_in(Duration::from_secs(PRESIGN_DURATION_SECS))
        .map_err(|e| format!("Presign config error: {:?}", e))?;

    let presigned = client
        .get_object()
        .bucket(&bucket)
        .key(&key)
        .presigned(presign_config)
        .await
        .map_err(|e| format!("Presign failed: {:?}", e))?;

    Ok(presigned.uri().to_string())
}

#[tauri::command]
pub async fn delete_from_s3(
    app: AppHandle,
    url: String,
) -> Result<(), String> {
    let (client, bucket) = s3_client(&app).await?;

    let key = url
        .split(".amazonaws.com/")
        .nth(1)
        .and_then(|s| s.split('?').next()) // strip query string
        .ok_or_else(|| format!("Could not extract S3 key from URL: {}", url))?
        .to_string();

    client
        .delete_object()
        .bucket(&bucket)
        .key(&key)
        .send()
        .await
        .map_err(|e| format!("S3 delete failed: {:?}", e))?;

    Ok(())
}

