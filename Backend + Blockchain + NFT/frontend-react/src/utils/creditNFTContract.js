// NFT service with IPFS integration
// Uses local IPFS node for metadata storage

class FarmerCreditNFTContract {
  constructor() {
    this.contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    this.mockNFTs = new Map();
    this.nextTokenId = 1;
    this.initialized = false;
    this.ipfsGateway = "http://localhost:8080/ipfs/";
    this.metadataUrls = {};
    this.loadIPFSConfig();
  }

  // Load IPFS configuration if available
  loadIPFSConfig() {
    try {
      // Try to load IPFS config (will be auto-generated after deployment)
      import("./ipfsConfig.js")
        .then((config) => {
          this.ipfsGateway = config.IPFS_CONFIG.gateway;
          this.metadataUrls = config.NFT_METADATA_URLS;
          console.log(
            "🌐 Loaded IPFS configuration with",
            Object.keys(this.metadataUrls).length,
            "NFT metadata URLs"
          );
          this.updateExistingNFTs();
        })
        .catch(() => {
          console.log("⚠️  No IPFS config found, using mock data");
        });
    } catch (error) {
      console.log("⚠️  IPFS config not available, using mock data");
    }
  }

  // Update existing NFTs with IPFS URLs when config becomes available
  updateExistingNFTs() {
    this.mockNFTs.forEach((nft, tokenId) => {
      const ipfsData = this.metadataUrls[nft.profile.farmerDID];
      if (ipfsData && !nft.ipfsUrl) {
        nft.ipfsUrl = ipfsData.metadataUrl;
        nft.metadataURI = `ipfs://${ipfsData.cid}`;
        console.log(
          `🔄 Updated NFT ${tokenId} with IPFS URL:`,
          ipfsData.metadataUrl
        );
      }
    });
  }

  // Initialize (mock - always succeeds)
  async initialize() {
    console.log("🎯 NFT service initialized with IPFS support");
    this.initialized = true;
    return true;
  }

  // Get contract basic info
  async getContractInfo() {
    return {
      name: "FarmerCreditProfile",
      symbol: "FCP",
      totalSupply: this.mockNFTs.size.toString(),
      contractAddress: this.contractAddress,
    };
  }

  // Check if farmer has an NFT
  async hasNFT(farmerDID) {
    await this.delay(200); // Simulate network delay
    return Array.from(this.mockNFTs.values()).some(
      (nft) => nft.profile.farmerDID === farmerDID
    );
  }

  // Get NFT token ID by farmer DID
  async getTokenIdByDID(farmerDID) {
    await this.delay(200);
    const nft = Array.from(this.mockNFTs.entries()).find(
      ([_, nft]) => nft.profile.farmerDID === farmerDID
    );
    return nft ? nft[0].toString() : "0";
  }

  // Get credit profile by DID
  async getCreditProfileByDID(farmerDID) {
    await this.delay(300);
    const nft = Array.from(this.mockNFTs.values()).find(
      (nft) => nft.profile.farmerDID === farmerDID
    );
    return nft ? nft.profile : null;
  }

  // Get credit profile by token ID
  async getCreditProfile(tokenId) {
    await this.delay(300);
    const nft = this.mockNFTs.get(parseInt(tokenId));
    return nft ? nft.profile : null;
  }

  // Get NFT metadata URI
  async getTokenURI(tokenId) {
    await this.delay(200);
    const nft = this.mockNFTs.get(parseInt(tokenId));
    if (!nft) return "";

    // Prioritize IPFS URL if available
    if (nft.ipfsUrl) {
      return nft.ipfsUrl;
    }

    // If metadata URI is pending, check if IPFS config is now available
    if (nft.metadataURI && nft.metadataURI.startsWith("pending://")) {
      const farmerDID = nft.profile.farmerDID;
      const ipfsData = this.metadataUrls[farmerDID];
      if (ipfsData) {
        nft.ipfsUrl = ipfsData.metadataUrl;
        nft.metadataURI = `ipfs://${ipfsData.cid}`;
        return nft.ipfsUrl;
      }
    }

    return nft.metadataURI || "";
  }

  // Get trust and incentive scores
  async getTrustAndIncentive(tokenId) {
    await this.delay(200);
    const nft = this.mockNFTs.get(parseInt(tokenId));
    if (!nft) return { trustMetric: 0, incentiveScore: 0 };

    return {
      trustMetric: nft.profile.trustMetric,
      incentiveScore: nft.profile.incentiveScore,
    };
  }

  // Get loan statistics
  async getLoanStats(tokenId) {
    await this.delay(250);
    const nft = this.mockNFTs.get(parseInt(tokenId));
    if (!nft) {
      return {
        totalLoans: 0,
        onTimeRepayments: 0,
        lateRepayments: 0,
        defaults: 0,
        successRate: "0%",
      };
    }

    const totalLoans =
      nft.profile.onTimeRepayments +
      nft.profile.lateRepayments +
      nft.profile.defaults;
    const successRate =
      totalLoans > 0
        ? ((nft.profile.onTimeRepayments / totalLoans) * 100).toFixed(2) + "%"
        : "0%";

    return {
      totalLoans,
      onTimeRepayments: nft.profile.onTimeRepayments,
      lateRepayments: nft.profile.lateRepayments,
      defaults: nft.profile.defaults,
      successRate,
    };
  }

  // Check premium eligibility
  async isPremiumEligible(tokenId) {
    await this.delay(150);
    const nft = this.mockNFTs.get(parseInt(tokenId));
    if (!nft) return false;

    return (
      nft.profile.trustMetric >= 8 &&
      nft.profile.defaults === 0 &&
      nft.profile.onTimeRepayments >= 3
    );
  }

  // Get repayment ratio
  async getRepaymentRatio(tokenId) {
    await this.delay(200);
    const nft = this.mockNFTs.get(parseInt(tokenId));
    if (!nft || nft.profile.totalDisbursed === 0) return "0%";

    const ratio = (nft.profile.totalRepaid / nft.profile.totalDisbursed) * 100;
    return ratio.toFixed(2) + "%";
  }

  // Auto-mint NFT if farmer doesn't have one
  async autoMintForFarmer(farmerDID, farmerMobile) {
    try {
      console.log(
        "🎨 Auto-minting NFT for farmer:",
        farmerDID.slice(0, 10) + "..."
      );
      await this.delay(500); // Simulate minting time

      // Check if farmer already has NFT
      const hasExistingNFT = await this.hasNFT(farmerDID);
      if (hasExistingNFT) {
        const tokenId = await this.getTokenIdByDID(farmerDID);
        console.log("✅ Existing NFT found, Token ID:", tokenId);
        return {
          success: true,
          existing: true,
          tokenId,
        };
      }

      // Generate sample farmer profile
      const profile = this.generateSampleProfile(farmerDID);
      const metadata = this.generateNFTMetadata(profile);

      // Check if we have IPFS metadata URL for this farmer
      const ipfsData = this.metadataUrls[farmerDID];
      let metadataURI;
      let ipfsUrl = null;

      if (ipfsData) {
        metadataURI = `ipfs://${ipfsData.cid}`;
        ipfsUrl = ipfsData.metadataUrl;
        console.log("🔗 Using IPFS metadata:", ipfsUrl);
      } else {
        // For now, create a placeholder that will be replaced after IPFS deployment
        metadataURI = `pending://deployment/${farmerDID}`;
        console.log(
          "⏳ Pending IPFS deployment for:",
          farmerDID.slice(0, 10) + "..."
        );
      }

      // Store mock NFT
      const tokenId = this.nextTokenId++;
      this.mockNFTs.set(tokenId, {
        profile,
        metadata,
        metadataURI,
        ipfsUrl,
        mintedAt: new Date().toISOString(),
        txHash: "0x" + Math.random().toString(16).substring(2, 66),
      });

      console.log("🎉 New NFT minted successfully!");
      console.log("📋 Token ID:", tokenId);
      console.log("🎯 Trust Score:", profile.trustMetric + "/10");

      return {
        success: true,
        existing: false,
        newlyMinted: true,
        tokenId: tokenId.toString(),
      };
    } catch (error) {
      console.error("❌ Auto-mint failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate sample farmer profile
  generateSampleProfile(farmerDID) {
    const trustMetric = Math.floor(Math.random() * 6) + 5; // 5-10
    const avgYield = Math.floor(Math.random() * 1000) + 1000; // 1000-2000 kg/acre
    const totalLoans = Math.floor(Math.random() * 5) + 3; // 3-7 loans
    const onTime = Math.max(0, totalLoans - Math.floor(Math.random() * 3));
    const late = Math.min(totalLoans - onTime, 2);
    const defaults = Math.random() > 0.8 ? 1 : 0;

    const totalDisbursed = 2500000 + Math.floor(Math.random() * 2000000); // 25k-45k INR in paise
    const repaymentRatio = 0.7 + Math.random() * 0.25; // 70-95% repayment
    const totalRepaid = Math.floor(totalDisbursed * repaymentRatio);

    return {
      farmerDID,
      stateCode: 3, // Punjab
      districtCode: 301, // Bathinda
      cropClusterCode: this.getCropClusterCode("mustard"),
      avgYieldKgPerAcre: avgYield,
      AvgSeasonYieldIndex: 3,
      totalDisbursed,
      totalRepaid,
      onTimeRepayments: onTime,
      lateRepayments: late,
      defaults,
      trustMetric,
      incentiveScore: this.calculateIncentiveScore(trustMetric),
      updateDate: Math.floor(Date.now() / 1000),
      lastUpdated: Math.floor(Date.now() / 1000),
    };
  }

  // Generate NFT metadata
  generateNFTMetadata(profile) {
    return {
      name: `Farmer Credit Profile #${this.nextTokenId}`,
      description: `Tokenized credit profile for farmer with DID ${profile.farmerDID.slice(
        0,
        8
      )}...`,
      image: `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.farmerDID}`,
      external_url: "https://oilseed-valuechain.gov.in",
      attributes: [
        {
          trait_type: "Trust Metric",
          value: profile.trustMetric,
          display_type: "number",
          max_value: 10,
        },
        {
          trait_type: "Incentive Score",
          value: profile.incentiveScore,
          display_type: "number",
          max_value: 100,
        },
        {
          trait_type: "Average Yield (Kg/Acre)",
          value: profile.avgYieldKgPerAcre,
          display_type: "number",
        },
        {
          trait_type: "On-Time Repayments",
          value: profile.onTimeRepayments,
          display_type: "number",
        },
        {
          trait_type: "Defaults",
          value: profile.defaults,
          display_type: "number",
        },
        {
          trait_type: "Credit Risk Level",
          value: this.getCreditRiskLevel(profile.trustMetric, profile.defaults),
        },
        {
          trait_type: "Deployment",
          value: "IPFS Native",
        },
      ],
      properties: {
        farmerDID: profile.farmerDID,
        stateCode: profile.stateCode,
        districtCode: profile.districtCode,
        cropClusterCode: profile.cropClusterCode,
        contractVersion: "1.0",
        deploymentType: "IPFS",
        lastUpdated: new Date(profile.lastUpdated * 1000).toISOString(),
        ipfsGateway: this.ipfsGateway,
      },
    };
  }

  // Helper: Calculate incentive score
  calculateIncentiveScore(trustMetric) {
    if (trustMetric >= 9) return 95;
    if (trustMetric >= 8) return 85;
    if (trustMetric >= 7) return 75;
    if (trustMetric >= 6) return 65;
    if (trustMetric >= 5) return 55;
    return 35;
  }

  // Helper: Get credit risk level
  getCreditRiskLevel(trustMetric, defaults) {
    if (defaults > 1) return "High Risk";
    if (defaults === 1) return "Medium Risk";
    if (trustMetric >= 8) return "Low Risk";
    if (trustMetric >= 6) return "Medium Risk";
    return "High Risk";
  }

  // Helper: Get crop cluster code
  getCropClusterCode(crop) {
    const cropCodes = {
      mustard: 1,
      sunflower: 2,
      groundnut: 3,
      sesame: 4,
      soybean: 5,
      safflower: 6,
      niger: 7,
    };
    return cropCodes[crop.toLowerCase()] || 1;
  }

  // Helper: Format currency
  formatCurrency(amountInPaise) {
    const amount = parseInt(amountInPaise) / 100;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Helper: Add delay for realistic simulation
  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const creditNFTContract = new FarmerCreditNFTContract();

// Initialize immediately
creditNFTContract.initialize();

export default creditNFTContract;

// Export constants
export const CROP_CLUSTER_NAMES = {
  1: "Mustard/Rapeseed",
  2: "Sunflower",
  3: "Groundnut/Peanut",
  4: "Sesame/Gingelly",
  5: "Soybean",
  6: "Safflower",
  7: "Niger Seed",
};

export const STATE_NAMES = {
  3: "Punjab",
  6: "Haryana",
  9: "Uttar Pradesh",
  27: "Maharashtra",
  33: "Tamil Nadu",
};

export const TRUST_LEVELS = {
  EXCELLENT: { min: 9, max: 10, label: "Excellent", color: "#10B981" },
  GOOD: { min: 7, max: 8, label: "Good", color: "#3B82F6" },
  AVERAGE: { min: 5, max: 6, label: "Average", color: "#F59E0B" },
  BELOW_AVERAGE: { min: 3, max: 4, label: "Below Average", color: "#EF4444" },
  POOR: { min: 0, max: 2, label: "Poor", color: "#DC2626" },
};
