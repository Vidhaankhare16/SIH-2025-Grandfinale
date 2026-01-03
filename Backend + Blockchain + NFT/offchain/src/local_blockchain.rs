use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use chrono::{DateTime, Utc};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub block_id: String,
    pub previous_block_hash: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub transaction_type: String,
    pub batch_id: String,
    pub farmer_did: String,
    pub transaction_data: serde_json::Value,
    pub block_hash: String,
    pub version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalBlockchain {
    pub blocks: Vec<Block>,
    pub batch_history: HashMap<String, Vec<String>>, // batch_id -> [block_hashes]
}

#[derive(Debug, Clone)]
pub struct BlockReceipt {
    pub block_hash: String,
    pub block_id: String,
    pub version: u32,
    pub is_update: bool,
}

impl LocalBlockchain {
    const BLOCKCHAIN_FILE: &'static str = "local_blockchain.json";

    pub fn new() -> Self {
        Self {
            blocks: Vec::new(),
            batch_history: HashMap::new(),
        }
    }

    pub fn load() -> anyhow::Result<Self> {
        if Path::new(Self::BLOCKCHAIN_FILE).exists() {
            let content = fs::read_to_string(Self::BLOCKCHAIN_FILE)?;
            let blockchain: LocalBlockchain = serde_json::from_str(&content)?;
            tracing::info!("Loaded blockchain with {} blocks", blockchain.blocks.len());
            Ok(blockchain)
        } else {
            tracing::info!("Creating new blockchain");
            Ok(Self::new())
        }
    }

    pub fn save(&self) -> anyhow::Result<()> {
        let content = serde_json::to_string_pretty(self)?;
        fs::write(Self::BLOCKCHAIN_FILE, content)?;
        tracing::info!("Saved blockchain with {} blocks", self.blocks.len());
        Ok(())
    }

    fn calculate_hash(block_data: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(block_data.as_bytes());
        format!("0x{:x}", hasher.finalize())
    }

    fn generate_block_id() -> String {
        format!("BLK_{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0))
    }

    pub fn add_fpo_purchase(
        &mut self,
        batch_id: String,
        farmer_did: String,
        ipfs_cid: String,
        transaction_data: serde_json::Value,
    ) -> anyhow::Result<BlockReceipt> {
        let previous_blocks = self.batch_history.get(&batch_id);
        let previous_block_hash = if let Some(blocks) = previous_blocks {
            blocks.last().cloned()
        } else {
            None
        };

        let version = previous_blocks.map(|b| b.len() as u32 + 1).unwrap_or(1);
        let is_update = previous_block_hash.is_some();

        let block_id = Self::generate_block_id();
        let timestamp = Utc::now();

        // Create block data for hashing
        let block_content = serde_json::json!({
            "block_id": block_id,
            "previous_block_hash": previous_block_hash,
            "timestamp": timestamp,
            "transaction_type": "fpo_purchase",
            "batch_id": batch_id,
            "farmer_did": farmer_did,
            "ipfs_cid": ipfs_cid,
            "version": version,
            "transaction_data": transaction_data
        });

        let block_hash = Self::calculate_hash(&block_content.to_string());

        let block = Block {
            block_id: block_id.clone(),
            previous_block_hash: previous_block_hash.clone(),
            timestamp,
            transaction_type: "fpo_purchase".to_string(),
            batch_id: batch_id.clone(),
            farmer_did,
            transaction_data,
            block_hash: block_hash.clone(),
            version,
        };

        // Add block to chain
        self.blocks.push(block);

        // Update batch history
        self.batch_history
            .entry(batch_id.clone())
            .or_insert_with(Vec::new)
            .push(block_hash.clone());

        // Save to file
        self.save()?;

        tracing::info!(
            block_id = %block_id,
            block_hash = %block_hash,
            batch_id = %batch_id,
            version = %version,
            is_update = %is_update,
            total_blocks = %self.blocks.len(),
            "Created new block"
        );

        Ok(BlockReceipt {
            block_hash,
            block_id,
            version,
            is_update,
        })
    }

    pub fn get_batch_history(&self, batch_id: &str) -> Vec<&Block> {
        if let Some(block_hashes) = self.batch_history.get(batch_id) {
            block_hashes
                .iter()
                .filter_map(|hash| {
                    self.blocks.iter().find(|b| &b.block_hash == hash)
                })
                .collect()
        } else {
            Vec::new()
        }
    }

    pub fn get_latest_block_for_batch(&self, batch_id: &str) -> Option<&Block> {
        self.get_batch_history(batch_id).last().copied()
    }

    pub fn verify_farmer_exists(&self, farmer_did: &str) -> bool {
        self.blocks.iter().any(|block| block.farmer_did == farmer_did)
    }

    pub fn get_block_by_hash(&self, block_hash: &str) -> Option<&Block> {
        self.blocks.iter().find(|b| b.block_hash == block_hash)
    }

    pub fn get_blockchain_stats(&self) -> serde_json::Value {
        serde_json::json!({
            "total_blocks": self.blocks.len(),
            "unique_batches": self.batch_history.len(),
            "unique_farmers": self.blocks.iter().map(|b| &b.farmer_did).collect::<std::collections::HashSet<_>>().len(),
            "last_block_time": self.blocks.last().map(|b| b.timestamp),
            "blockchain_file": Self::BLOCKCHAIN_FILE
        })
    }
}

// Thread-safe wrapper
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct LocalBlockchainClient {
    blockchain: Arc<RwLock<LocalBlockchain>>,
}

impl LocalBlockchainClient {
    pub async fn new() -> anyhow::Result<Self> {
        let blockchain = LocalBlockchain::load()?;
        Ok(Self {
            blockchain: Arc::new(RwLock::new(blockchain)),
        })
    }

    pub async fn add_fpo_purchase(
        &self,
        batch_id: String,
        farmer_did: String,
        ipfs_cid: String,
        transaction_data: serde_json::Value,
    ) -> anyhow::Result<BlockReceipt> {
        let mut blockchain = self.blockchain.write().await;
        blockchain.add_fpo_purchase(batch_id, farmer_did, ipfs_cid, transaction_data)
    }

    pub async fn verify_farmer(&self, farmer_did: &str) -> anyhow::Result<bool> {
        let blockchain = self.blockchain.read().await;
        Ok(blockchain.verify_farmer_exists(farmer_did))
    }

    pub async fn get_batch_history(&self, batch_id: &str) -> anyhow::Result<Vec<Block>> {
        let blockchain = self.blockchain.read().await;
        Ok(blockchain.get_batch_history(batch_id).into_iter().cloned().collect())
    }

    pub async fn get_stats(&self) -> anyhow::Result<serde_json::Value> {
        let blockchain = self.blockchain.read().await;
        Ok(blockchain.get_blockchain_stats())
    }
}
