// API configuration and utility functions
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

/**
 * SHA-256 hash function for generating farmer DID
 * @param {string} text - Text to hash
 * @returns {Promise<string>} Hex string with 0x prefix
 */
export async function sha256Hex(text) {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify if a farmer exists in the blockchain
 * @param {string} farmerDid - Farmer's DID (hashed mobile number)
 * @returns {Promise<Object>} Response containing exists, crop_id_hash, etc.
 */
export async function verifyFarmer(farmerDid) {
  const response = await fetch(`${API_BASE_URL}/verify/farmer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ farmer_did: farmerDid }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Submit FPO purchase transaction
 * @param {Object} payload - Purchase data
 * @returns {Promise<Object>} Response containing tx_hash, cid, etc.
 */
export async function submitFPOPurchase(payload) {
  const response = await fetch(`${API_BASE_URL}/fpo/purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch IPFS data from Pinata gateway
 * @param {string} cid - IPFS CID
 * @returns {Promise<Object>} JSON data from IPFS
 */
export async function fetchIPFSData(cid) {
  const response = await fetch(
    `https://purple-brilliant-tick-514.mypinata.cloud/ipfs/${cid}/fpo_purchase.json`,
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get batch history from blockchain
 * @param {string} batchId - Batch ID
 * @returns {Promise<Object>} Batch history data
 */
export async function getBatchHistory(batchId) {
  const response = await fetch(`${API_BASE_URL}/batch/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batch_id: batchId }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Upload data to IPFS
 * @param {Object} data - Data to upload
 * @returns {Promise<Object>} Response containing CID
 */
export async function uploadToIPFS(data) {
  const response = await fetch(`${API_BASE_URL}/ipfs/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Transport rate lookup (₹ per km)
 * Based on current Indian market rates for agricultural transport
 */
export const TRANSPORT_RATES = {
  tractor: 12,   // ₹12/km - Common for short-distance farm transport
  tempo: 18,     // ₹18/km - Medium capacity, popular for local transport
  truck: 25,     // ₹25/km - Large capacity for long-distance transport
};

/**
 * Calculate total cost for purchase
 * @param {number} quantity - Quantity in kg
 * @param {number} pricePerKg - Price per kg
 * @param {number} distance - Distance in km
 * @param {string} transportMethod - Transport method key
 * @returns {Object} Calculated costs
 */
export function calculateCosts(
  quantity,
  pricePerKg,
  distance,
  transportMethod,
) {
  const transportRate = TRANSPORT_RATES[transportMethod] || 0;
  const productCost = quantity * pricePerKg;
  const transportCost = distance * transportRate;
  const totalCost = productCost + transportCost;

  return {
    productCost,
    transportCost,
    totalCost,
    transportRate,
  };
}

const api = {
  sha256Hex,
  verifyFarmer,
  submitFPOPurchase,
  fetchIPFSData,
  getBatchHistory,
  uploadToIPFS,
  calculateCosts,
  TRANSPORT_RATES,
};

export default api;
