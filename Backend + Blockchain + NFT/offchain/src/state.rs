use crate::chain::ChainClient;
use crate::farmer_verification::FarmerVerificationService;
use crate::ipfs::IpfsClient;
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Unified application state containing all shared clients and configuration
#[derive(Clone)]
pub struct AppState {
    pub blockchain_client: Arc<ChainClient>,
    pub ipfs_client: Arc<IpfsClient>,
    pub farmer_verification: Arc<Mutex<FarmerVerificationService>>,
}

impl AppState {
    /// Create new AppState from environment variables
    pub async fn from_env() -> Result<Self> {
        tracing::info!("Initializing application state from environment");

        let chain_client = ChainClient::from_env().await?;
        tracing::info!("Chain client initialized successfully");

        let ipfs_client = IpfsClient::from_env()?;
        tracing::info!("IPFS client initialized successfully");

        // Load farmer verification database
        let farmer_verification = match FarmerVerificationService::from_file("data/farmers_db.json")
        {
            Ok(service) => {
                tracing::info!(
                    "Farmer verification service loaded with {} farmers",
                    service.total_farmers()
                );
                service
            }
            Err(e) => {
                tracing::warn!(
                    "Failed to load farmer database: {}. Using empty database.",
                    e
                );
                FarmerVerificationService::new()
            }
        };

        Ok(Self {
            blockchain_client: Arc::new(chain_client),
            ipfs_client: Arc::new(ipfs_client),
            farmer_verification: Arc::new(Mutex::new(farmer_verification)),
        })
    }
}
