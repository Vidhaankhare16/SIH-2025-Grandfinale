use crate::chain::{hash_bytes, hash_string};
use crate::error::{format_hash, format_tx_hash, ipfs_gateway_url, ApiError, ApiResult};
use crate::farmer_verification::{VerifyMobileRequest, VerifyMobileResponse};
use crate::state::AppState;
use alloy::primitives::FixedBytes;
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};


// ======================== BATCH HELPERS ========================

/// Helper function to generate batch folder path
fn batch_folder(batch_id: &str) -> String {
    format!("data/{}", batch_id)
}

// ======================== SHARED RESPONSE STRUCTS ========================

#[derive(Debug, Serialize)]
pub struct TxResponse {
    pub tx_hash: String,
    pub message: String,
}

// ======================== STAGE 1: FARMER REGISTRATION ========================

#[derive(Debug, Deserialize)]
pub struct RegisterFarmerRequest {
    pub farmer_did: String,
    pub crop_id: String,
    pub metadata: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mobile: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RegisterFarmerResponse {
    pub tx_hash: String,
    pub farmer_did: String,
    pub crop_id_hash: String,
    pub metadata_cid: String,
    pub ipfs_url: String,
}

pub async fn register_farmer(
    State(state): State<AppState>,
    Json(payload): Json<RegisterFarmerRequest>,
) -> ApiResult<RegisterFarmerResponse> {
    tracing::info!(farmer_did = %payload.farmer_did, "Registering farmer");

    // Verify mobile number if provided
    if let Some(mobile) = &payload.mobile {
        let farmer_verification = state.farmer_verification.lock().await;
        if !farmer_verification.is_mobile_verified(mobile) {
            tracing::warn!(mobile = %mobile, "Mobile number not verified in database");
            return Err(ApiError::bad_request(format!(
                "Mobile number {} is not verified. Please register first.",
                mobile
            )));
        }

        // Verify mobile-DID pair match
        if !farmer_verification
            .verify_mobile_did_pair(mobile, &payload.farmer_did)
        {
            tracing::error!(
                mobile = %mobile,
                farmer_did = %payload.farmer_did,
                "Mobile number and farmer DID mismatch"
            );
            return Err(ApiError::bad_request(
                "Mobile number does not match the provided farmer DID",
            ));
        }
        tracing::info!(mobile = %mobile, "Mobile number verified successfully");
    }

    let metadata_cid = state
        .ipfs_client
        .upload_json(&payload.metadata)
        .await
        .map_err(ApiError::ipfs_upload_failed)?;

    let farmer_did: FixedBytes<32> = payload
        .farmer_did
        .parse()
        .map_err(|e| ApiError::invalid_did(e))?;

    let crop_id_hash = hash_string(&payload.crop_id);

    let receipt = state
        .blockchain_client
        .register_farmer(farmer_did, crop_id_hash, metadata_cid.clone())
        .await
        .map_err(ApiError::blockchain_failed)?;

    Ok(Json(RegisterFarmerResponse {
        tx_hash: format_tx_hash(receipt.transaction_hash),
        farmer_did: payload.farmer_did,
        crop_id_hash: format_hash(crop_id_hash),
        metadata_cid: metadata_cid.clone(),
        ipfs_url: ipfs_gateway_url(&metadata_cid),
    }))
}

// ======================== STAGE 2: FPO PURCHASE ========================

#[derive(Debug, Deserialize)]
pub struct FpoPurchaseRequest {
    pub batch_id: String,
    pub quantity_kg: f64,
    pub transport_method: String,
    pub travel_distance: f64,
    pub price_per_kg: f64,
    pub quality_grade: String,
    pub farmer_did: String,
    pub land_acres: f64,
    pub crop_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mobile: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct FpoPurchaseResponse {
    pub tx_hash: String,
    pub cid: String,
}

pub async fn fpo_purchase(
    State(state): State<AppState>,
    Json(payload): Json<FpoPurchaseRequest>,
) -> ApiResult<FpoPurchaseResponse> {
    tracing::info!(batch_id = %payload.batch_id, "Recording FPO purchase");

    // Verify farmer DID is registered
    {
        let farmer_verification = state.farmer_verification.lock().await;
        if !farmer_verification
            .is_did_registered(&payload.farmer_did)
        {
            tracing::warn!(farmer_did = %payload.farmer_did, "Farmer DID not found in verification database");
            return Err(ApiError::bad_request(format!(
                "Farmer DID {} is not registered. Please register the farmer first.",
                payload.farmer_did
            )));
        }

        // Verify mobile-DID pair if mobile is provided
        if let Some(mobile) = &payload.mobile {
            if !farmer_verification
                .verify_mobile_did_pair(mobile, &payload.farmer_did)
            {
                tracing::error!(
                    mobile = %mobile,
                    farmer_did = %payload.farmer_did,
                    "Mobile number and farmer DID mismatch in FPO purchase"
                );
                return Err(ApiError::bad_request(
                    "Mobile number does not match the farmer DID",
                ));
            }
            tracing::info!(mobile = %mobile, "Mobile-DID pair verified for FPO purchase");
        }
    }
    tracing::info!(
        batch_id = %payload.batch_id,
        quantity_kg = %payload.quantity_kg,
        transport = %payload.transport_method,
        "Recording FPO purchase"
    );

    // 1) Decide folder for this batch
    let folder = batch_folder(&payload.batch_id);

    // 2) Calculate transport costs and totals
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

    // 3) Create comprehensive metadata for IPFS
    let metadata = serde_json::json!({
        "transaction_type": "fpo_purchase",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "batch_info": {
            "batch_id": payload.batch_id,
            "quantity_kg": payload.quantity_kg,
            "quality_grade": payload.quality_grade
        },
        "farmer_info": {
            "farmer_did": payload.farmer_did,
            "land_acres": payload.land_acres,
            "crop_type": payload.crop_type
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
            "blockchain_hash": "pending",
            "ipfs_stored": true
        }
    });

    // 4) Write metadata into the batch folder
    state
        .ipfs_client
        .write_json_to_folder(&folder, "fpo_purchase.json", &metadata)
        .map_err(ApiError::ipfs_upload_failed)?;

    // 5) Upload entire folder -> get root CID for this batch view
    let metadata_cid = state
        .ipfs_client
        .upload_folder(&folder)
        .await
        .map_err(ApiError::ipfs_upload_failed)?;

    // 6) Hashes + chain call
    let batch_hash = hash_string(&payload.batch_id);
    let farmer_did: FixedBytes<32> = payload
        .farmer_did
        .parse()
        .map_err(|e| ApiError::invalid_did(e))?;

    let receipt = state
        .blockchain_client
        .fpo_purchase(batch_hash, farmer_did, metadata_cid.clone())
        .await
        .map_err(ApiError::blockchain_failed)?;

    let tx_hash = format_tx_hash(receipt.transaction_hash);

    tracing::info!(
        tx_hash = %tx_hash,
        cid = %metadata_cid,
        "FPO purchase completed successfully"
    );

    Ok(Json(FpoPurchaseResponse {
        tx_hash,
        cid: metadata_cid.clone(),
    }))
}

// ======================== STAGE 3: WAREHOUSE STORAGE ========================

#[derive(Debug, Deserialize)]
pub struct WarehouseUpdateRequest {
    pub warehouse_id: String,
    pub iot_data: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct WarehouseUpdateResponse {
    pub tx_hash: String,
    pub warehouse_id: String,
    pub state_hash: String,
    pub metadata_cid: String,
    pub ipfs_url: String,
}

pub async fn update_warehouse_state(
    State(state): State<AppState>,
    Json(payload): Json<WarehouseUpdateRequest>,
) -> ApiResult<WarehouseUpdateResponse> {
    tracing::info!(warehouse_id = %payload.warehouse_id, "Updating warehouse state");

    let metadata_cid = state
        .ipfs_client
        .upload_json(&payload.iot_data)
        .await
        .map_err(ApiError::ipfs_upload_failed)?;

    let iot_json = serde_json::to_vec(&payload.iot_data).map_err(ApiError::json_failed)?;
    let state_hash = hash_bytes(&iot_json);
    let warehouse_id = hash_string(&payload.warehouse_id);

    let receipt = state
        .blockchain_client
        .update_warehouse_state(warehouse_id, state_hash, metadata_cid.clone())
        .await
        .map_err(ApiError::blockchain_failed)?;

    Ok(Json(WarehouseUpdateResponse {
        tx_hash: format_tx_hash(receipt.transaction_hash),
        warehouse_id: payload.warehouse_id,
        state_hash: format_hash(state_hash),
        metadata_cid: metadata_cid.clone(),
        ipfs_url: ipfs_gateway_url(&metadata_cid),
    }))
}

// Batch warehouse update
#[derive(Debug, Deserialize)]
pub struct BatchWarehouseUpdate {
    pub warehouse_id: String,
    pub iot_data: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct BatchWarehouseUpdateRequest {
    pub updates: Vec<BatchWarehouseUpdate>,
}

pub async fn batch_update_warehouse(
    State(state): State<AppState>,
    Json(payload): Json<BatchWarehouseUpdateRequest>,
) -> ApiResult<TxResponse> {
    tracing::info!(count = payload.updates.len(), "Batch updating warehouses");

    let mut warehouse_ids = Vec::with_capacity(payload.updates.len());
    let mut state_hashes = Vec::with_capacity(payload.updates.len());

    for update in &payload.updates {
        let warehouse_id = hash_string(&update.warehouse_id);
        let iot_json = serde_json::to_vec(&update.iot_data).map_err(ApiError::json_failed)?;
        let state_hash = hash_bytes(&iot_json);
        warehouse_ids.push(warehouse_id);
        state_hashes.push(state_hash);
    }

    let receipt = state
        .blockchain_client
        .batch_update_warehouse(warehouse_ids, state_hashes)
        .await
        .map_err(ApiError::blockchain_failed)?;

    Ok(Json(TxResponse {
        tx_hash: format_tx_hash(receipt.transaction_hash),
        message: format!("Successfully updated {} warehouses", payload.updates.len()),
    }))
}

// ======================== STAGE 4: LOGISTICS TRACKING ========================

#[derive(Debug, Deserialize)]
pub struct LogisticsUpdateRequest {
    pub shipment_id: String,
    pub location: String,
    pub is_delivered: bool,
    pub gps_data: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct LogisticsUpdateResponse {
    pub tx_hash: String,
    pub shipment_id: String,
    pub location_hash: String,
    pub metadata_cid: String,
    pub ipfs_url: String,
}

pub async fn record_logistics(
    State(state): State<AppState>,
    Json(payload): Json<LogisticsUpdateRequest>,
) -> ApiResult<LogisticsUpdateResponse> {
    tracing::info!(shipment_id = %payload.shipment_id, "Recording logistics milestone");

    let metadata_cid = state
        .ipfs_client
        .upload_json(&payload.gps_data)
        .await
        .map_err(ApiError::ipfs_upload_failed)?;

    let shipment_id = hash_string(&payload.shipment_id);
    let location_hash = hash_string(&payload.location);

    let receipt = state
        .blockchain_client
        .record_logistics(
            shipment_id,
            location_hash,
            payload.is_delivered,
            metadata_cid.clone(),
        )
        .await
        .map_err(ApiError::blockchain_failed)?;

    Ok(Json(LogisticsUpdateResponse {
        tx_hash: format_tx_hash(receipt.transaction_hash),
        shipment_id: payload.shipment_id,
        location_hash: format_hash(location_hash),
        metadata_cid: metadata_cid.clone(),
        ipfs_url: ipfs_gateway_url(&metadata_cid),
    }))
}

// ======================== STAGE 5: PROCESSING ========================

#[derive(Debug, Deserialize)]
pub struct ProcessBatchRequest {
    pub input_batch_id: String,
    pub output_batch_ids: Vec<String>,
    pub process_metadata: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct ProcessBatchResponse {
    pub tx_hash: String,
    pub input_batch_hash: String,
    pub transform_hash: String,
    pub output_batch_hashes: Vec<String>,
    pub metadata_cid: String,
    pub ipfs_url: String,
}

pub async fn process_batch(
    State(state): State<AppState>,
    Json(payload): Json<ProcessBatchRequest>,
) -> ApiResult<ProcessBatchResponse> {
    tracing::info!(input_batch = %payload.input_batch_id, "Processing batch");

    // 1) Folder for this batch
    let folder = batch_folder(&payload.input_batch_id);

    // 2) Store processing metadata in folder
    state
        .ipfs_client
        .write_json_to_folder(&folder, "processing.json", &payload.process_metadata)
        .map_err(ApiError::ipfs_upload_failed)?;

    // 3) Upload entire folder -> root CID reflects all previous files for this batch
    let metadata_cid = state
        .ipfs_client
        .upload_folder(&folder)
        .await
        .map_err(ApiError::ipfs_upload_failed)?;

    // 4) Hashes + chain call
    let input_batch_hash = hash_string(&payload.input_batch_id);
    let output_batch_hashes: Vec<FixedBytes<32>> = payload
        .output_batch_ids
        .iter()
        .map(|id| hash_string(id))
        .collect();

    let metadata_json =
        serde_json::to_vec(&payload.process_metadata).map_err(ApiError::json_failed)?;
    let transform_hash = hash_bytes(&metadata_json);

    let receipt = state
        .blockchain_client
        .process_batch(
            input_batch_hash,
            transform_hash,
            output_batch_hashes.clone(),
            metadata_cid.clone(),
        )
        .await
        .map_err(ApiError::blockchain_failed)?;

    Ok(Json(ProcessBatchResponse {
        tx_hash: format_tx_hash(receipt.transaction_hash),
        input_batch_hash: format_hash(input_batch_hash),
        transform_hash: format_hash(transform_hash),
        output_batch_hashes: output_batch_hashes.iter().map(|h| format_hash(h)).collect(),
        metadata_cid: metadata_cid.clone(),
        ipfs_url: ipfs_gateway_url(&metadata_cid),
    }))
}

// ======================== STAGE 6: PACKAGING ========================

#[derive(Debug, Deserialize)]
pub struct CreateSkuRequest {
    pub sku_id: String,
    pub parent_batch_id: String,
    pub unit_ids: Vec<String>,
    pub packaging_metadata: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct CreateSkuResponse {
    pub tx_hash: String,
    pub sku_id: String,
    pub parent_batch_hash: String,
    pub merkle_root: String,
    pub metadata_cid: String,
    pub ipfs_url: String,
}

pub async fn create_sku(
    State(state): State<AppState>,
    Json(payload): Json<CreateSkuRequest>,
) -> ApiResult<CreateSkuResponse> {
    tracing::info!(sku_id = %payload.sku_id, "Creating SKU");

    // 1) Use parent batch as folder (e.g. batch-0)
    let folder = batch_folder(&payload.parent_batch_id);

    // 2) Store packaging metadata for THIS SKU inside that folder
    let filename = format!("packaging_{}.json", payload.sku_id);
    state
        .ipfs_client
        .write_json_to_folder(&folder, &filename, &payload.packaging_metadata)
        .map_err(ApiError::ipfs_upload_failed)?;

    // 3) Upload entire folder -> updated root CID for this batch
    let metadata_cid = state
        .ipfs_client
        .upload_folder(&folder)
        .await
        .map_err(ApiError::ipfs_upload_failed)?;

    // 4) Merkle + chain call
    let unit_hashes: Vec<FixedBytes<32>> =
        payload.unit_ids.iter().map(|id| hash_string(id)).collect();

    let mut merkle_data = Vec::with_capacity(unit_hashes.len() * 32);
    for hash in &unit_hashes {
        merkle_data.extend_from_slice(hash.as_slice());
    }
    let merkle_root = hash_bytes(&merkle_data);

    let sku_id = hash_string(&payload.sku_id);
    let parent_batch_hash = hash_string(&payload.parent_batch_id);

    let receipt = state
        .blockchain_client
        .create_sku(sku_id, parent_batch_hash, merkle_root, metadata_cid.clone())
        .await
        .map_err(ApiError::blockchain_failed)?;

    Ok(Json(CreateSkuResponse {
        tx_hash: format_tx_hash(receipt.transaction_hash),
        sku_id: payload.sku_id,
        parent_batch_hash: format_hash(parent_batch_hash),
        merkle_root: format_hash(merkle_root),
        metadata_cid: metadata_cid.clone(),
        ipfs_url: ipfs_gateway_url(&metadata_cid),
    }))
}

// ======================== STAGE 7: FRAUD REPORTING ========================

#[derive(Debug, Deserialize)]
pub struct ReportFraudRequest {
    pub sku_id: String,
    pub evidence: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct ReportFraudResponse {
    pub tx_hash: String,
    pub sku_id: String,
    pub evidence_hash: String,
    pub evidence_cid: String,
    pub ipfs_url: String,
}

pub async fn report_fraud(
    State(state): State<AppState>,
    Json(payload): Json<ReportFraudRequest>,
) -> ApiResult<ReportFraudResponse> {
    tracing::info!(sku_id = %payload.sku_id, "Reporting fraud");

    let evidence_cid = state
        .ipfs_client
        .upload_json(&payload.evidence)
        .await
        .map_err(ApiError::ipfs_upload_failed)?;

    let evidence_json = serde_json::to_vec(&payload.evidence).map_err(ApiError::json_failed)?;
    let evidence_hash = hash_bytes(&evidence_json);
    let sku_id = hash_string(&payload.sku_id);

    let receipt = state
        .blockchain_client
        .report_fraud(sku_id, evidence_hash, evidence_cid.clone())
        .await
        .map_err(ApiError::blockchain_failed)?;

    Ok(Json(ReportFraudResponse {
        tx_hash: format_tx_hash(receipt.transaction_hash),
        sku_id: payload.sku_id,
        evidence_hash: format_hash(evidence_hash),
        evidence_cid: evidence_cid.clone(),
        ipfs_url: ipfs_gateway_url(&evidence_cid),
    }))
}

// ======================== STAGE 8: AI SCORING ========================

#[derive(Debug, Deserialize)]
pub struct CommitAiScoreRequest {
    pub batch_id: String,
    pub reveal_hash: String,
    pub nonce: String,
}

#[derive(Debug, Serialize)]
pub struct CommitAiScoreResponse {
    pub tx_hash: String,
    pub batch_id: String,
    pub commit_hash: String,
}

pub async fn commit_ai_score(
    State(state): State<AppState>,
    Json(payload): Json<CommitAiScoreRequest>,
) -> ApiResult<CommitAiScoreResponse> {
    tracing::info!(batch_id = %payload.batch_id, "Committing AI score");

    let batch_hash = hash_string(&payload.batch_id);
    let reveal_hash: FixedBytes<32> = payload
        .reveal_hash
        .parse()
        .map_err(|e| ApiError::invalid_hash("reveal hash", e))?;
    let nonce: FixedBytes<32> = payload
        .nonce
        .parse()
        .map_err(|e| ApiError::invalid_hash("nonce", e))?;

    let commit_hash = crate::chain::generate_commit_hash(reveal_hash, nonce);

    let receipt = state
        .blockchain_client
        .commit_ai_score(batch_hash, commit_hash)
        .await
        .map_err(ApiError::blockchain_failed)?;

    Ok(Json(CommitAiScoreResponse {
        tx_hash: format_tx_hash(receipt.transaction_hash),
        batch_id: payload.batch_id,
        commit_hash: format_hash(commit_hash),
    }))
}

#[derive(Debug, Deserialize)]
pub struct RevealAiScoreRequest {
    pub batch_id: String,
    pub nonce: String,
    pub score_data: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct RevealAiScoreResponse {
    pub tx_hash: String,
    pub batch_id: String,
    pub reveal_hash: String,
    pub metadata_cid: String,
    pub ipfs_url: String,
}

pub async fn reveal_ai_score(
    State(state): State<AppState>,
    Json(payload): Json<RevealAiScoreRequest>,
) -> ApiResult<RevealAiScoreResponse> {
    tracing::info!(batch_id = %payload.batch_id, "Revealing AI score");

    // 1) Use batch folder
    let folder = batch_folder(&payload.batch_id);

    // 2) Save AI score JSON in the batch folder
    state
        .ipfs_client
        .write_json_to_folder(&folder, "ai_score.json", &payload.score_data)
        .map_err(ApiError::ipfs_upload_failed)?;

    // 3) Upload full folder -> one CID
    let metadata_cid = state
        .ipfs_client
        .upload_folder(&folder)
        .await
        .map_err(ApiError::ipfs_upload_failed)?;

    // 4) Compute reveal hash and call chain
    let score_json = serde_json::to_vec(&payload.score_data).map_err(ApiError::json_failed)?;
    let reveal_hash = hash_bytes(&score_json);

    let batch_hash = hash_string(&payload.batch_id);
    let nonce: FixedBytes<32> = payload
        .nonce
        .parse()
        .map_err(|e| ApiError::invalid_hash("nonce", e))?;

    let receipt = state
        .blockchain_client
        .reveal_ai_score(batch_hash, reveal_hash, nonce, metadata_cid.clone())
        .await
        .map_err(ApiError::blockchain_failed)?;

    Ok(Json(RevealAiScoreResponse {
        tx_hash: format_tx_hash(receipt.transaction_hash),
        batch_id: payload.batch_id,
        reveal_hash: format_hash(reveal_hash),
        metadata_cid: metadata_cid.clone(),
        ipfs_url: ipfs_gateway_url(&metadata_cid),
    }))
}

// ======================== VERIFICATION ENDPOINTS ========================

#[derive(Debug, Deserialize)]
pub struct VerifySkuRequest {
    pub sku_id: String,
}

#[derive(Debug, Serialize)]
pub struct VerifySkuResponse {
    pub sku_id: String,
    pub parent_batch_hash: String,
    pub merkle_root: String,
    pub packaged_at: u64,
    pub exists: bool,
}

// ======================== MOBILE VERIFICATION HANDLERS ========================

/// Verify mobile number and optionally check against farmer DID
pub async fn verify_mobile(
    State(state): State<AppState>,
    Json(payload): Json<VerifyMobileRequest>,
) -> ApiResult<VerifyMobileResponse> {
    tracing::info!(mobile = %payload.mobile, "Verifying mobile number");

    // Check if mobile exists
    let farmer_opt = {
        let farmer_verification = state.farmer_verification.lock().await;
        farmer_verification.get_farmer_by_mobile(&payload.mobile).cloned()
    };

    match farmer_opt {
        Some(farmer) => {
            // Mobile number exists
            let verified = if let Some(ref provided_did) = payload.farmer_did {
                // Check if the provided DID matches
                let matches = &farmer.farmer_did == provided_did;
                if !matches {
                    tracing::warn!(
                        mobile = %payload.mobile,
                        expected_did = %farmer.farmer_did,
                        provided_did = %provided_did,
                        "Farmer DID mismatch"
                    );
                }
                matches
            } else {
                // No DID provided, just confirm mobile exists
                true
            };

            let message = if verified {
                format!("Mobile number {} verified successfully", payload.mobile)
            } else {
                "Mobile number found but DID does not match".to_string()
            };

            Ok(Json(VerifyMobileResponse {
                verified,
                farmer_did: Some(farmer.farmer_did.clone()),
                farmer_name: Some(farmer.name.clone()),
                location: Some(farmer.location.clone()),
                message,
            }))
        }
        None => {
            tracing::warn!(mobile = %payload.mobile, "Mobile number not found in database");
            Ok(Json(VerifyMobileResponse {
                verified: false,
                farmer_did: None,
                farmer_name: None,
                location: None,
                message: format!("Mobile number {} not found in database", payload.mobile),
            }))
        }
    }
}

/// Get farmer details by DID
#[derive(Debug, Deserialize)]
pub struct GetFarmerByDidRequest {
    pub farmer_did: String,
}

#[derive(Debug, Serialize)]
pub struct GetFarmerByDidResponse {
    pub found: bool,
    pub mobile: Option<String>,
    pub name: Option<String>,
    pub location: Option<String>,
    pub verified: Option<bool>,
    pub registration_date: Option<String>,
}

pub async fn get_farmer_by_did(
    State(state): State<AppState>,
    Json(payload): Json<GetFarmerByDidRequest>,
) -> ApiResult<GetFarmerByDidResponse> {
    tracing::info!(farmer_did = %payload.farmer_did, "Looking up farmer by DID");

    // Get farmer details from verification service
    let farmer_details = {
        let farmer_verification = state.farmer_verification.lock().await;
        farmer_verification.get_farmer_by_did(&payload.farmer_did).cloned()
    };
    match farmer_details {
        Some(farmer) => Ok(Json(GetFarmerByDidResponse {
            found: true,
            mobile: Some(farmer.mobile.clone()),
            name: Some(farmer.name.clone()),
            location: Some(farmer.location.clone()),
            verified: Some(farmer.verified),
            registration_date: Some(farmer.registration_date.clone()),
        })),
        None => Ok(Json(GetFarmerByDidResponse {
            found: false,
            mobile: None,
            name: None,
            location: None,
            verified: None,
            registration_date: None,
        })),
    }
}

pub async fn verify_sku(
    State(state): State<AppState>,
    Json(payload): Json<VerifySkuRequest>,
) -> ApiResult<VerifySkuResponse> {
    let sku_id = hash_string(&payload.sku_id);

    let result = state
        .blockchain_client
        .verify_package_origin(sku_id)
        .await
        .map_err(ApiError::blockchain_failed)?;

    Ok(Json(VerifySkuResponse {
        sku_id: payload.sku_id,
        parent_batch_hash: format_hash(result.0),
        merkle_root: format_hash(result.1),
        packaged_at: result.2,
        exists: result.2 > 0,
    }))
}

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

pub async fn verify_farmer(
    State(state): State<AppState>,
    Json(payload): Json<VerifyFarmerRequest>,
) -> ApiResult<VerifyFarmerResponse> {
    tracing::info!(farmer_did = %payload.farmer_did, "Verifying farmer");

    // First check local verification database
    let local_farmer = {
        let farmer_verification = state.farmer_verification.lock().await;
        farmer_verification.get_farmer_by_did(&payload.farmer_did).cloned()
    };

    if let Some(farmer) = local_farmer {
        tracing::info!(
            farmer_did = %payload.farmer_did,
            name = %farmer.name,
            "Farmer found in local database"
        );

        // Return success with mock blockchain data
        // In production, you'd still verify on blockchain
        return Ok(Json(VerifyFarmerResponse {
            farmer_did: payload.farmer_did.clone(),
            exists: farmer.verified,
            crop_id_hash: format!("0x{}", hex::encode(&payload.farmer_did.as_bytes()[0..16])),
            registered_at: 0, // Could parse from registration_date if needed
        }));
    }

    // Try blockchain verification as fallback
    tracing::debug!(
        farmer_did = %payload.farmer_did,
        "Farmer not in local DB, checking blockchain"
    );

    match payload.farmer_did.parse::<FixedBytes<32>>() {
        Ok(farmer_did_hash) => {
            match state.blockchain_client.verify_farmer(farmer_did_hash).await {
                Ok(result) => {
                    tracing::info!(
                        farmer_did = %payload.farmer_did,
                        exists = result.0,
                        "Blockchain verification successful"
                    );
                    Ok(Json(VerifyFarmerResponse {
                        farmer_did: payload.farmer_did,
                        exists: result.0,
                        crop_id_hash: format_hash(result.1),
                        registered_at: result.2,
                    }))
                }
                Err(e) => {
                    tracing::error!(
                        farmer_did = %payload.farmer_did,
                        error = %e,
                        "Blockchain verification failed"
                    );
                    // Return not found instead of 500 error
                    Ok(Json(VerifyFarmerResponse {
                        farmer_did: payload.farmer_did,
                        exists: false,
                        crop_id_hash:
                            "0x0000000000000000000000000000000000000000000000000000000000000000"
                                .to_string(),
                        registered_at: 0,
                    }))
                }
            }
        }
        Err(e) => {
            tracing::warn!(
                farmer_did = %payload.farmer_did,
                error = %e,
                "Invalid farmer DID format"
            );
            Err(ApiError::bad_request(format!(
                "Invalid farmer DID format: {}",
                e
            )))
        }
    }
}

// ======================== FARMER IPFS UPLOAD ========================

#[derive(Debug, Deserialize)]
pub struct FarmerIpfsUploadRequest {
    pub mobile: String,
    pub data: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct FarmerIpfsUploadResponse {
    pub success: bool,
    pub cid: String,
    pub ipfs_url: String,
    pub farmer_did: String,
    pub farmer_name: String,
    pub message: String,
}

pub async fn upload_farmer_ipfs_data(
    State(state): State<AppState>,
    Json(payload): Json<FarmerIpfsUploadRequest>,
) -> ApiResult<FarmerIpfsUploadResponse> {
    tracing::info!(mobile = %payload.mobile, "Uploading IPFS data for farmer");

    // Verify mobile number exists in database
    let farmer = {
        let farmer_verification = state.farmer_verification.lock().await;
        farmer_verification.get_farmer_by_mobile(&payload.mobile).cloned()
    }.ok_or_else(|| {
        tracing::warn!(mobile = %payload.mobile, "Mobile number not found in database");
        ApiError::bad_request(format!("Mobile number {} not found in database", payload.mobile))
    })?;

    // Upload data to IPFS
    let cid = state
        .ipfs_client
        .upload_json(&payload.data)
        .await
        .map_err(ApiError::ipfs_upload_failed)?;

    // Update farmer's IPFS CID in the database
    {
        let mut farmer_verification = state.farmer_verification.lock().await;
        if let Err(e) = farmer_verification.update_farmer_ipfscid_by_mobile(&payload.mobile, &cid) {
            tracing::error!(error = %e, "Failed to update farmer IPFS CID in memory");
        }

        // Save updated database to file
        if let Err(e) = farmer_verification.save_to_file("data/farmers_db.json") {
            tracing::error!(error = %e, "Failed to save farmer database to file");
        } else {
            tracing::info!("Farmer database updated and saved successfully");
        }
    }

    Ok(Json(FarmerIpfsUploadResponse {
        success: true,
        cid: cid.clone(),
        ipfs_url: crate::error::ipfs_gateway_url(&cid),
        farmer_did: farmer.farmer_did.clone(),
        farmer_name: farmer.name.clone(),
        message: "IPFS data uploaded successfully".to_string(),
    }))
}
