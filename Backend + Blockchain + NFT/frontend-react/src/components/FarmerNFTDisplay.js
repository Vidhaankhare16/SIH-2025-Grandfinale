import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import creditNFTContract, {
  CROP_CLUSTER_NAMES,
  STATE_NAMES,
  TRUST_LEVELS,
} from "../utils/creditNFTContract";
import { NFT_METADATA_URLS } from "../utils/ipfsConfig";
import "./FarmerNFTDisplay.css";

const FarmerNFTDisplay = () => {
  const { tokenId, farmerDID } = useParams();
  const navigate = useNavigate();

  const [nftData, setNftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNFTData();
  }, [tokenId, farmerDID]);

  const loadNFTData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let profile = null;
      let currentTokenId = tokenId;

      if (farmerDID && !tokenId) {
        // Get token ID from farmer DID
        currentTokenId = await creditNFTContract.getTokenIdByDID(farmerDID);
        if (currentTokenId === "0") {
          throw new Error("No NFT found for this farmer");
        }
      }

      // Load profile data
      if (currentTokenId) {
        profile = await creditNFTContract.getCreditProfile(currentTokenId);
      } else if (farmerDID) {
        profile = await creditNFTContract.getCreditProfileByDID(farmerDID);
        currentTokenId = await creditNFTContract.getTokenIdByDID(farmerDID);
      }

      if (!profile) {
        throw new Error("Could not load NFT data");
      }

      // Load additional data
      const [trustInfo, loanStats, repaymentRatio, isPremium, tokenURI] =
        await Promise.all([
          creditNFTContract.getTrustAndIncentive(currentTokenId),
          creditNFTContract.getLoanStats(currentTokenId),
          creditNFTContract.getRepaymentRatio(currentTokenId),
          creditNFTContract.isPremiumEligible(currentTokenId),
          creditNFTContract.getTokenURI(currentTokenId),
        ]);

      setNftData({
        tokenId: currentTokenId,
        profile,
        trustInfo,
        loanStats,
        repaymentRatio,
        isPremium,
        tokenURI,
        // Generate display metadata
        metadata: {
          name: `Farmer Credit Profile #${currentTokenId}`,
          farmerName: `Farmer ${profile.farmerDID.slice(0, 8)}...`,
          crop: getCropName(profile.cropClusterCode),
          location: getStateName(profile.stateCode),
          image: `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.farmerDID}`,
        },
      });
    } catch (err) {
      setError(err.message);
      console.error("Error loading NFT data:", err);
    } finally {
      setLoading(false);
    }
  }, [tokenId, farmerDID]);

  const getCropName = (cropCode) => {
    return CROP_CLUSTER_NAMES[cropCode] || `Crop Cluster ${cropCode}`;
  };

  const getStateName = (stateCode) => {
    return STATE_NAMES[stateCode] || `State ${stateCode}`;
  };

  const getTrustLevel = (trustMetric) => {
    for (const level of Object.values(TRUST_LEVELS)) {
      if (trustMetric >= level.min && trustMetric <= level.max) {
        return level;
      }
    }
    return TRUST_LEVELS.POOR;
  };

  const formatCurrency = (amountInPaise) => {
    const amount = parseInt(amountInPaise) / 100;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year}/${hours}:${minutes}`;
  };

  const getRiskColor = (trustMetric, defaults) => {
    if (defaults > 1) return "high-risk";
    if (defaults === 1) return "medium-risk";
    if (trustMetric >= 8) return "low-risk";
    if (trustMetric >= 6) return "medium-risk";
    return "high-risk";
  };

  const getRiskLabel = (trustMetric, defaults) => {
    if (defaults > 1) return "High Risk";
    if (defaults === 1) return "Medium Risk";
    if (trustMetric >= 8) return "Low Risk";
    if (trustMetric >= 6) return "Medium Risk";
    return "High Risk";
  };

  const getRepaymentPercentage = () => {
    if (!nftData || nftData.profile.totalDisbursed === 0) return 0;
    return Math.round(
      (nftData.profile.totalRepaid / nftData.profile.totalDisbursed) * 100
    );
  };

  if (loading) {
    return (
      <div className="nft-display-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading NFT data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nft-display-container">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Error Loading NFT</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!nftData) {
    return (
      <div className="nft-display-container">
        <div className="error-container">
          <div className="error-icon">🚫</div>
          <h2>NFT Not Found</h2>
          <p>The requested NFT could not be found.</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const trustLevel = getTrustLevel(nftData.profile.trustMetric);

  return (
    <div className="nft-display-container">
      {/* Header */}
      <div className="nft-header">
        <button className="back-button" onClick={() => navigate("/")}>
          ← Back to Home
        </button>
        <h1 className="nft-title">Farmer Credit NFT</h1>
        <div className="nft-token-id">Token #{nftData.tokenId}</div>
      </div>

      {/* Main NFT Card */}
      <div className="nft-main-card">
        {/* NFT Image Section */}
        <div className="nft-image-section">
          <div className="nft-image-container">
            <img
              src={nftData.metadata.image}
              alt="Farmer NFT"
              className="nft-image"
            />
            <div className="nft-overlay">
              <div className="nft-badge">Credit NFT</div>
            </div>
          </div>

          {nftData.isPremium && (
            <div className="premium-badge">
              <span className="premium-icon">👑</span>
              Premium Eligible
            </div>
          )}
        </div>

        {/* NFT Details Section */}
        <div className="nft-details-section">
          <div className="nft-basic-info">
            <h2 className="farmer-name">{nftData.metadata.farmerName}</h2>
            <div className="farmer-location">
              <span className="location-icon">📍</span>
              {nftData.metadata.location}
            </div>
            <div className="farmer-crop">
              <span className="crop-icon">🌱</span>
              {nftData.metadata.crop}
            </div>
          </div>

          {/* Trust Score Section */}
          <div className="trust-score-section">
            <div className="trust-score-main">
              <div
                className="trust-score-value"
                style={{ color: trustLevel.color }}
              >
                {nftData.profile.trustMetric}/10
              </div>
              <div className="trust-score-label">Trust Score</div>
            </div>

            <div
              className="trust-level-badge"
              style={{ backgroundColor: trustLevel.color }}
            >
              {trustLevel.label}
            </div>

            <div
              className={`risk-badge ${getRiskColor(
                nftData.profile.trustMetric,
                nftData.profile.defaults
              )}`}
            >
              {getRiskLabel(
                nftData.profile.trustMetric,
                nftData.profile.defaults
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="key-metrics">
            <div className="metric">
              <div className="metric-value">
                {nftData.profile.incentiveScore}%
              </div>
              <div className="metric-label">Incentive Score</div>
            </div>
            <div className="metric">
              <div className="metric-value">{getRepaymentPercentage()}%</div>
              <div className="metric-label">Repayment Rate</div>
            </div>
            <div className="metric">
              <div className="metric-value">
                {nftData.profile.avgYieldKgPerAcre}
              </div>
              <div className="metric-label">Avg Yield (kg/acre)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information Sections */}
      <div className="nft-info-sections">
        {/* Financial Performance */}
        <div className="info-section">
          <h3 className="section-title">
            <span className="section-icon">💰</span>
            Financial Performance
          </h3>
          <div className="section-content">
            <div className="financial-item">
              <span className="financial-label">Total Disbursed:</span>
              <span className="financial-value">
                {formatCurrency(nftData.profile.totalDisbursed)}
              </span>
            </div>
            <div className="financial-item">
              <span className="financial-label">Total Repaid:</span>
              <span className="financial-value success">
                {formatCurrency(nftData.profile.totalRepaid)}
              </span>
            </div>
            <div className="financial-item">
              <span className="financial-label">Outstanding:</span>
              <span className="financial-value">
                {formatCurrency(
                  nftData.profile.totalDisbursed - nftData.profile.totalRepaid
                )}
              </span>
            </div>
            <div className="repayment-progress">
              <div className="progress-label">Repayment Progress</div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getRepaymentPercentage()}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {getRepaymentPercentage()}% Complete
              </div>
            </div>
          </div>
        </div>

        {/* Loan Statistics */}
        <div className="info-section">
          <h3 className="section-title">
            <span className="section-icon">📊</span>
            Loan Statistics
          </h3>
          <div className="section-content">
            <div className="loan-stats-grid">
              <div className="loan-stat success">
                <div className="stat-icon">✅</div>
                <div className="stat-value">
                  {nftData.profile.onTimeRepayments}
                </div>
                <div className="stat-label">On-Time Repayments</div>
              </div>
              <div className="loan-stat warning">
                <div className="stat-icon">⏰</div>
                <div className="stat-value">
                  {nftData.profile.lateRepayments}
                </div>
                <div className="stat-label">Late Repayments</div>
              </div>
              <div className="loan-stat error">
                <div className="stat-icon">❌</div>
                <div className="stat-value">{nftData.profile.defaults}</div>
                <div className="stat-label">Defaults</div>
              </div>
              <div className="loan-stat total">
                <div className="stat-icon">📋</div>
                <div className="stat-value">{nftData.loanStats.totalLoans}</div>
                <div className="stat-label">Total Loans</div>
              </div>
            </div>
          </div>
        </div>

        {/* Agricultural Details */}
        <div className="info-section">
          <h3 className="section-title">
            <span className="section-icon">🚜</span>
            Agricultural Profile
          </h3>
          <div className="section-content">
            <div className="agri-details">
              <div className="agri-item">
                <span className="agri-label">Crop Cluster:</span>
                <span className="agri-value">{nftData.metadata.crop}</span>
              </div>
              <div className="agri-item">
                <span className="agri-label">Average Yield:</span>
                <span className="agri-value">
                  {nftData.profile.avgYieldKgPerAcre} kg/acre
                </span>
              </div>
              <div className="agri-item">
                <span className="agri-label">Yield Index:</span>
                <span className="agri-value">
                  {nftData.profile.AvgSeasonYieldIndex}
                </span>
              </div>
              <div className="agri-item">
                <span className="agri-label">State Code:</span>
                <span className="agri-value">{nftData.profile.stateCode}</span>
              </div>
              <div className="agri-item">
                <span className="agri-label">District Code:</span>
                <span className="agri-value">
                  {nftData.profile.districtCode}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="info-section">
          <h3 className="section-title">
            <span className="section-icon">🔧</span>
            Technical Details
          </h3>
          <div className="section-content">
            <div className="tech-details">
              <div className="tech-item">
                <span className="tech-label">Farmer DID:</span>
                <span className="tech-value mono">
                  {nftData.profile.farmerDID}
                </span>
              </div>
              <div className="tech-item">
                <span className="tech-label">Token ID:</span>
                <span className="tech-value">{nftData.tokenId}</span>
              </div>
              <div className="tech-item">
                <span className="tech-label">Last Updated:</span>
                <span className="tech-value">
                  {formatTimestamp(nftData.profile.lastUpdated)}
                </span>
              </div>
              <div className="tech-item">
                <span className="tech-label">Contract Version:</span>
                <span className="tech-value">1.0</span>
              </div>
              {NFT_METADATA_URLS[nftData.profile.farmerDID] && (
                <>
                  <div className="tech-item">
                    <span className="tech-label">IPFS CID:</span>
                    <span className="tech-value mono">
                      {NFT_METADATA_URLS[nftData.profile.farmerDID].cid}
                    </span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-label">IPFS Metadata URL:</span>
                    <a
                      href={
                        NFT_METADATA_URLS[nftData.profile.farmerDID].metadataUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tech-value link-external"
                    >
                      View on IPFS →
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="nft-actions">
        <button className="btn btn-secondary" onClick={() => navigate("/")}>
          <span className="btn-icon">🏠</span>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default FarmerNFTDisplay;
