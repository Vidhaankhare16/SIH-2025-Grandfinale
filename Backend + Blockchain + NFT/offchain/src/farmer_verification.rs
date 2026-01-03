use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// Farmer entry in the verification database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FarmerEntry {
    pub mobile: String,
    pub farmer_did: String,
    pub name: String,
    pub location: String,
    pub state_code: String,
    pub district_code: String,
    pub land_acres: f64,
    pub crop: String,
    pub verified: bool,
    pub registration_date: String,
    pub ipfscid: String,
}

/// Metadata for the farmer database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FarmerDbMetadata {
    pub version: String,
    pub last_updated: String,
    pub total_farmers: usize,
    pub description: String,
}

/// Complete farmer database structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FarmerDatabase {
    pub farmers: Vec<FarmerEntry>,
    pub metadata: FarmerDbMetadata,
}

/// In-memory farmer verification service
#[derive(Debug, Clone)]
pub struct FarmerVerificationService {
    mobile_to_did: HashMap<String, String>,
    did_to_farmer: HashMap<String, FarmerEntry>,
}

impl FarmerVerificationService {
    /// Load the farmer database from a JSON file
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, anyhow::Error> {
        let content = fs::read_to_string(path)?;
        let db: FarmerDatabase = serde_json::from_str(&content)?;

        let mut mobile_to_did = HashMap::new();
        let mut did_to_farmer = HashMap::new();

        for farmer in db.farmers {
            mobile_to_did.insert(farmer.mobile.clone(), farmer.farmer_did.clone());
            did_to_farmer.insert(farmer.farmer_did.clone(), farmer.clone());
        }

        Ok(Self {
            mobile_to_did,
            did_to_farmer,
        })
    }

    /// Create a new service with empty database
    pub fn new() -> Self {
        Self {
            mobile_to_did: HashMap::new(),
            did_to_farmer: HashMap::new(),
        }
    }

    /// Verify if a mobile number exists and return the associated farmer DID
    pub fn verify_mobile(&self, mobile: &str) -> Option<&String> {
        self.mobile_to_did.get(mobile)
    }

    /// Check if a farmer DID is registered
    pub fn is_did_registered(&self, farmer_did: &str) -> bool {
        self.did_to_farmer.contains_key(farmer_did)
    }

    /// Get farmer details by DID
    pub fn get_farmer_by_did(&self, farmer_did: &str) -> Option<&FarmerEntry> {
        self.did_to_farmer.get(farmer_did)
    }

    /// Get farmer details by mobile number
    pub fn get_farmer_by_mobile(&self, mobile: &str) -> Option<&FarmerEntry> {
        self.mobile_to_did
            .get(mobile)
            .and_then(|did| self.did_to_farmer.get(did))
    }

    /// Verify both mobile and DID match
    pub fn verify_mobile_did_pair(&self, mobile: &str, farmer_did: &str) -> bool {
        self.mobile_to_did
            .get(mobile)
            .map(|did| did == farmer_did)
            .unwrap_or(false)
    }

    /// Add a new farmer to the in-memory database
    pub fn add_farmer(&mut self, farmer: FarmerEntry) {
        self.mobile_to_did
            .insert(farmer.mobile.clone(), farmer.farmer_did.clone());
        self.did_to_farmer.insert(farmer.farmer_did.clone(), farmer);
    }

    /// Check if a mobile number is verified
    pub fn is_mobile_verified(&self, mobile: &str) -> bool {
        self.get_farmer_by_mobile(mobile)
            .map(|farmer| farmer.verified)
            .unwrap_or(false)
    }

    /// Get total number of registered farmers
    pub fn total_farmers(&self) -> usize {
        self.did_to_farmer.len()
    }

    /// Get all registered mobile numbers
    pub fn get_all_mobiles(&self) -> Vec<String> {
        self.mobile_to_did.keys().cloned().collect()
    }

    /// Get all registered farmer DIDs
    pub fn get_all_dids(&self) -> Vec<String> {
        self.did_to_farmer.keys().cloned().collect()
    }

    /// Update IPFS CID for a farmer by mobile number
    pub fn update_farmer_ipfscid_by_mobile(&mut self, mobile: &str, ipfscid: &str) -> Result<(), anyhow::Error> {
        if let Some(farmer_did) = self.mobile_to_did.get(mobile).cloned() {
            if let Some(farmer) = self.did_to_farmer.get_mut(&farmer_did) {
                farmer.ipfscid = ipfscid.to_string();
                tracing::info!(
                    mobile = %mobile,
                    farmer_did = %farmer_did,
                    ipfscid = %ipfscid,
                    "Updated farmer IPFS CID"
                );
                Ok(())
            } else {
                Err(anyhow::anyhow!("Farmer DID {} not found in database", farmer_did))
            }
        } else {
            Err(anyhow::anyhow!("Mobile number {} not found in database", mobile))
        }
    }

    /// Update IPFS CID for a farmer by DID
    pub fn update_farmer_ipfscid_by_did(&mut self, farmer_did: &str, ipfscid: &str) -> Result<(), anyhow::Error> {
        if let Some(farmer) = self.did_to_farmer.get_mut(farmer_did) {
            farmer.ipfscid = ipfscid.to_string();
            tracing::info!(
                farmer_did = %farmer_did,
                ipfscid = %ipfscid,
                "Updated farmer IPFS CID"
            );
            Ok(())
        } else {
            Err(anyhow::anyhow!("Farmer DID {} not found in database", farmer_did))
        }
    }

    /// Save the current database state to a JSON file
    pub fn save_to_file<P: AsRef<Path>>(&self, path: P) -> Result<(), anyhow::Error> {
        let farmers: Vec<FarmerEntry> = self.did_to_farmer.values().cloned().collect();

        let metadata = FarmerDbMetadata {
            version: "1.0".to_string(),
            last_updated: chrono::Utc::now().format("%Y-%m-%d").to_string(),
            total_farmers: farmers.len(),
            description: "Farmer verification database with SHA-256 hashed DIDs from mobile numbers".to_string(),
        };

        let db = FarmerDatabase {
            farmers,
            metadata,
        };

        let json_content = serde_json::to_string_pretty(&db)?;
        fs::write(path, json_content)?;

        Ok(())
    }
}

impl Default for FarmerVerificationService {
    fn default() -> Self {
        Self::new()
    }
}

/// Request structure for mobile verification endpoint
#[derive(Debug, Serialize, Deserialize)]
pub struct VerifyMobileRequest {
    pub mobile: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub farmer_did: Option<String>,
}

/// Response structure for mobile verification
#[derive(Debug, Serialize, Deserialize)]
pub struct VerifyMobileResponse {
    pub verified: bool,
    pub farmer_did: Option<String>,
    pub farmer_name: Option<String>,
    pub location: Option<String>,
    pub message: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_service() {
        let service = FarmerVerificationService::new();
        assert_eq!(service.total_farmers(), 0);
    }

    #[test]
    fn test_add_and_verify_farmer() {
        let mut service = FarmerVerificationService::new();

        let farmer = FarmerEntry {
            mobile: "9876543210".to_string(),
            farmer_did: "0x123abc".to_string(),
            name: "Test Farmer".to_string(),
            location: "Test Location".to_string(),
            state_code: "XX".to_string(),
            district_code: "XX001".to_string(),
            land_acres: 5.0,
            crop: "wheat".to_string(),
            verified: true,
            registration_date: "2024-01-01".to_string(),
            ipfscid: "".to_string(),
        };

        service.add_farmer(farmer.clone());

        assert_eq!(service.total_farmers(), 1);
        assert!(service.is_mobile_verified("9876543210"));
        assert!(service.verify_mobile_did_pair("9876543210", "0x123abc"));

        let retrieved = service.get_farmer_by_mobile("9876543210").unwrap();
        assert_eq!(retrieved.name, "Test Farmer");
    }

    #[test]
    fn test_verify_invalid_mobile() {
        let service = FarmerVerificationService::new();
        assert!(!service.is_mobile_verified("0000000000"));
        assert_eq!(service.verify_mobile("0000000000"), None);
    }
}
