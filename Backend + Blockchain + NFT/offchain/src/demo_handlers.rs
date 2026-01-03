use crate::error::{ApiError, ApiResult};
use crate::local_blockchain::LocalBlockchainClient;
use crate::state::AppState;
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

// ======================== DEMO REQUEST/RESPONSE STRUCTS ========================

#[derive(Debug, Deserialize)]
pub struct VerifyFarmerRequest {
    pub farmer_did: String,
}

#[derive(Debug, Serialize)]
pub struct VerifyFarmerResponse {
    pub farmer_did: String,
    pub exists: bool,
    pub crop_id_hash: String,
    pub registered_at: u64,
}

#[derive(Debug, Deserialize)]
pub struct FpoPurchaseRequest {
    pub batch_id: String,
    pub quantity_kg: f64,
    pub transport_method: String,
    pub travel_distance: f64,
    pub price_per_kg: f64,
    pub quality_grade: String,
    pub farmer_did: String,
}

#[derive(Debug, Serialize)]
pub struct FpoPurchaseResponse {
    pub tx_hash: String,
    pub cid: String,
}

// ======================== DEMO HANDLERS ========================

pub async fn verify_farmer(
    State(state): State<AppState>,
    Json(payload): Json<VerifyFarmerRequest>,
) -> ApiResult<VerifyFarmerResponse> {
    tracing::info!(farmer_did = %payload.farmer_did, "Verifying farmer in local blockchain");

    let exists = state
        .blockchain_client
        .verify_farmer(&payload.farmer_did)
        .await
        .map_err(|e| ApiError::internal_server_error(format!("Blockchain verify error: {}", e)))?;

    tracing::info!(farmer_did = %payload.farmer_did, exists = %exists, "Farmer verification complete");

    Ok(Json(VerifyFarmerResponse {
        farmer_did: payload.farmer_did,
        exists,
        crop_id_hash: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
        registered_at: if exists { 1600000000 } else { 0 },
    }))
}

pub async fn fpo_purchase(
    State(state): State<AppState>,
    Json(payload): Json<FpoPurchaseRequest>,
) -> ApiResult<FpoPurchaseResponse> {
    tracing::info!(
        batch_id = %payload.batch_id,
        quantity_kg = %payload.quantity_kg,
        transport = %payload.transport_method,
        farmer_did = %payload.farmer_did,
        "Processing FPO purchase"
    );

    // 1) Calculate transport costs and totals
    let transport_rates = match payload.transport_method.as_str() {
        "tractor" => 8.0,
        "bullock" => 5.0,
        "pickup" => 11.0,
        "truck" => 15.0,
        _ => 0.0,
    };

    let product_cost = payload.quantity_kg * payload.price_per_kg;
    let transport_cost = payload.travel_distance * transport_rates;
    let total_cost = product_cost + transport_cost;

    // 2) Create comprehensive metadata for IPFS
    let metadata = serde_json::json!({
        "transaction_type": "fpo_purchase",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "batch_info": {
            "batch_id": payload.batch_id,
            "quantity_kg": payload.quantity_kg,
            "quality_grade": payload.quality_grade
        },
        "farmer_info": {
            "farmer_did": payload.farmer_did
        },
        "logistics": {
            "transport_method": payload.transport_method,
            "travel_distance_km": payload.travel_distance,
            "transport_rate_per_km": transport_rates,
            "transport_cost": transport_cost
        },
        "pricing": {
            "price_per_kg": payload.price_per_kg,
            "product_cost": product_cost,
            "transport_cost": transport_cost,
            "total_cost": total_cost
        },
        "verification": {
            "blockchain_stored": true,
            "ipfs_stored": true
        }
    });

    // 3) Upload to IPFS
    let metadata_cid = state
        .ipfs_client
        .upload_json(&metadata)
        .await
        .map_err(|e| ApiError::internal_server_error(format!("IPFS upload failed: {}", e)))?;

    tracing::info!(cid = %metadata_cid, "IPFS upload completed successfully");

    // 4) Add to local blockchain
    let receipt = state
        .blockchain_client
        .add_fpo_purchase(
            payload.batch_id.clone(),
            payload.farmer_did.clone(),
            metadata_cid.clone(),
            metadata,
        )
        .await
        .map_err(|e| ApiError::internal_server_error(format!("Local blockchain error: {}", e)))?;

    let block_hash = receipt.block_hash;

    tracing::info!(
        block_hash = %block_hash,
        block_id = %receipt.block_id,
        version = %receipt.version,
        is_update = %receipt.is_update,
        cid = %metadata_cid,
        "FPO purchase completed successfully"
    );

    Ok(Json(FpoPurchaseResponse {
        tx_hash: block_hash,
        cid: metadata_cid,
    }))
}

// ======================== ADDITIONAL DEMO ENDPOINTS ========================

#[derive(Debug, Serialize)]
pub struct BlockchainStatsResponse {
    pub stats: serde_json::Value,
}

pub async fn get_blockchain_stats(
    State(state): State<AppState>,
) -> ApiResult<BlockchainStatsResponse> {
    let stats = state
        .blockchain_client
        .get_stats()
        .await
        .map_err(|e| ApiError::internal_server_error(format!("Stats error: {}", e)))?;

    Ok(Json(BlockchainStatsResponse { stats }))
}

#[derive(Debug, Deserialize)]
pub struct BatchHistoryRequest {
    pub batch_id: String,
}

#[derive(Debug, Serialize)]
pub struct BatchHistoryResponse {
    pub batch_id: String,
    pub history: Vec<serde_json::Value>,
}

pub async fn get_batch_history(
    State(state): State<AppState>,
    Json(payload): Json<BatchHistoryRequest>,
) -> ApiResult<BatchHistoryResponse> {
    let history = state
        .blockchain_client
        .get_batch_history(&payload.batch_id)
        .await
        .map_err(|e| ApiError::internal_server_error(format!("History error: {}", e)))?;

    let history_json: Vec<serde_json::Value> = history
        .into_iter()
        .map(|block| serde_json::json!({
            "block_id": block.block_id,
            "block_hash": block.block_hash,
            "timestamp": block.timestamp,
            "version": block.version,
            "transaction_data": block.transaction_data
        }))
        .collect();

    Ok(Json(BatchHistoryResponse {
        batch_id: payload.batch_id,
        history: history_json,
    }))
}
