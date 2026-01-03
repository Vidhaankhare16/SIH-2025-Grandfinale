use anyhow::{Context, Result};
use reqwest::Client;
use serde_json::Value;
use std::fs;
use std::path::Path;
use reqwest::multipart::{Form, Part};

/// IPFS client for uploading files and folders to Pinata
#[derive(Debug, Clone)]
pub struct IpfsClient {
    client: Client,
    api_key: String,
    api_secret: String,
}

impl IpfsClient {
    /// Create new IPFS client from environment variables
    pub fn from_env() -> Result<Self> {
        let api_key = std::env::var("PINATA_API_KEY")
            .context("PINATA_API_KEY environment variable not set")?;
        let api_secret = std::env::var("PINATA_API_SECRET")
            .context("PINATA_API_SECRET environment variable not set")?;

        Ok(Self {
            client: Client::new(),
            api_key,
            api_secret,
        })
    }

    /// Upload a single JSON object to IPFS
    pub async fn upload_json(&self, data: &Value) -> Result<String> {
        let json_bytes = serde_json::to_vec_pretty(data)
            .context("Failed to serialize JSON data")?;

        self.upload_bytes(json_bytes, "data.json").await
    }

    /// Upload raw bytes to IPFS with a filename
    pub async fn upload_bytes(&self, data: Vec<u8>, filename: &str) -> Result<String> {
        let form = Form::new()
            .part("file", Part::bytes(data).file_name(filename.to_string()));

        let resp = self.client
            .post("https://api.pinata.cloud/pinning/pinFileToIPFS")
            .header("pinata_api_key", &self.api_key)
            .header("pinata_secret_api_key", &self.api_secret)
            .multipart(form)
            .send()
            .await
            .context("Failed to send request to Pinata")?;

        let response_json: Value = resp.json().await
            .context("Failed to parse Pinata response")?;

        let ipfs_hash = response_json["IpfsHash"]
            .as_str()
            .context("No IpfsHash in Pinata response")?;

        Ok(ipfs_hash.to_string())
    }

    /// Write JSON data to a file within a batch folder
    pub fn write_json_to_folder(&self, folder_path: &str, filename: &str, data: &Value) -> Result<()> {
        // Create folder if it doesn't exist
        fs::create_dir_all(folder_path)
            .with_context(|| format!("Failed to create directory: {}", folder_path))?;

        let file_path = Path::new(folder_path).join(filename);
        let json_content = serde_json::to_string_pretty(data)
            .context("Failed to serialize JSON data")?;

        fs::write(&file_path, json_content)
            .with_context(|| format!("Failed to write file: {}", file_path.display()))?;

        Ok(())
    }

    /// Upload an entire folder (recursive) to IPFS and get ONE CID
    pub async fn upload_folder(&self, folder_path: &str) -> Result<String> {
        let mut form = Form::new();

        // Walk through all files in the folder
        for entry in walkdir::WalkDir::new(folder_path) {
            let entry = entry
                .with_context(|| format!("Failed to read directory entry in: {}", folder_path))?;
            let path = entry.path();

            if path.is_file() {
                let bytes = fs::read(path)
                    .with_context(|| format!("Failed to read file: {}", path.display()))?;

                let rel_path = path.strip_prefix(folder_path)
                    .with_context(|| format!("Failed to get relative path for: {}", path.display()))?
                    .to_string_lossy()
                    .to_string();

                // Pinata expects file names for directory uploads to maintain structure
                form = form.part(
                    "file",
                    Part::bytes(bytes).file_name(rel_path)
                );
            }
        }

        let resp = self.client
            .post("https://api.pinata.cloud/pinning/pinFileToIPFS")
            .header("pinata_api_key", &self.api_key)
            .header("pinata_secret_api_key", &self.api_secret)
            .multipart(form)
            .send()
            .await
            .context("Failed to send folder upload request to Pinata")?;

        let response_json: Value = resp.json().await
            .context("Failed to parse Pinata folder upload response")?;

        let ipfs_hash = response_json["IpfsHash"]
            .as_str()
            .context("No IpfsHash in Pinata folder upload response")?;

        Ok(ipfs_hash.to_string())
    }
}



/// HTTP handler for uploading files to IPFS
pub async fn upload_to_ipfs(
    axum::extract::State(state): axum::extract::State<crate::state::AppState>,
    axum::Json(payload): axum::Json<serde_json::Value>,
) -> Result<axum::Json<serde_json::Value>, crate::error::ApiError> {
    let cid = state
        .ipfs_client
        .upload_json(&payload)
        .await
        .map_err(crate::error::ApiError::ipfs_upload_failed)?;

    Ok(axum::Json(serde_json::json!({
        "success": true,
        "cid": cid,
        "ipfs_url": crate::error::ipfs_gateway_url(&cid)
    })))
}
