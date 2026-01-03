const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../offchain/.env') });

/**
 * Streamlined Contract Deployment and NFT Minting Script
 * Deploys FarmerCreditNFT contract and mints NFTs with IPFS metadata
 */

class FarmerCreditNFTContractDeployer {
    constructor() {
        this.contractAddress = null;
        this.contract = null;
        this.signer = null;
        this.deployedTokens = [];
        this.dataPath = path.join(__dirname, '../offchain/data');
        this.metadataPath = path.join(__dirname, '../frontend-react/public/nft-metadata');
    }

    /**
     * Initialize ethers provider and signer
     */
    async initializeProvider() {
        const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
        const privateKey = process.env.PRIVATE_KEY;

        if (!privateKey) {
            throw new Error('PRIVATE_KEY not found in .env file');
        }

        // For local development, use hardhat's provider
        if (rpcUrl.includes('127.0.0.1') || rpcUrl.includes('localhost')) {
            this.signer = await ethers.getSigner();
            console.log('🔗 Using Hardhat local network');
        } else {
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            this.signer = new ethers.Wallet(privateKey, provider);
            console.log('🔗 Connected to external network:', rpcUrl);
        }

        console.log('👤 Deployer address:', await this.signer.getAddress());

        // Check balance
        const balance = await this.signer.getBalance();
        console.log('💰 Deployer balance:', ethers.formatEther(balance), 'ETH');
    }

    /**
     * Deploy the FarmerCreditNFT contract
     */
    async deployContract() {
        console.log('🚀 Deploying FarmerCreditNFT contract...\n');

        try {
            const FarmerCreditNFT = await ethers.getContractFactory('FarmerCreditNFT');

            // Deploy with constructor parameters
            console.log('📝 Deploying contract...');
            this.contract = await FarmerCreditNFT.deploy();

            // Wait for deployment
            await this.contract.waitForDeployment();
            this.contractAddress = await this.contract.getAddress();

            console.log('✅ Contract deployed successfully!');
            console.log('📍 Contract address:', this.contractAddress);
            console.log('🔗 Transaction hash:', this.contract.deploymentTransaction().hash);

            // Set up roles
            await this.setupRoles();

            return this.contractAddress;

        } catch (error) {
            console.error('❌ Contract deployment failed:', error.message);
            throw error;
        }
    }

    /**
     * Set up admin, minter, and updater roles
     */
    async setupRoles() {
        console.log('🔐 Setting up contract roles...');

        try {
            const deployerAddress = await this.signer.getAddress();

            // Add deployer as minter and updater
            const minterTx = await this.contract.addMinter(deployerAddress);
            await minterTx.wait();

            const updaterTx = await this.contract.addUpdater(deployerAddress);
            await updaterTx.wait();

            console.log('✅ Roles configured successfully');
            console.log('   👑 Admin:', deployerAddress);
            console.log('   🎨 Minter:', deployerAddress);
            console.log('   📝 Updater:', deployerAddress);

        } catch (error) {
            console.error('❌ Role setup failed:', error.message);
            throw error;
        }
    }

    /**
     * Load existing NFT metadata files
     */
    loadNFTMetadata() {
        const metadataFiles = fs.readdirSync(this.metadataPath)
            .filter(file => file.endsWith('.json'))
            .sort();

        console.log(`📂 Found ${metadataFiles.length} NFT metadata files`);

        const nftMetadata = [];
        for (const filename of metadataFiles) {
            const filePath = path.join(this.metadataPath, filename);
            const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            nftMetadata.push({
                filename,
                metadata,
                tokenId: metadata.properties?.tokenId || parseInt(filename.match(/\d+/)?.[0] || '0')
            });
        }

        return nftMetadata.sort((a, b) => a.tokenId - b.tokenId);
    }

    /**
     * Convert metadata to contract format
     */
    metadataToContractProfile(metadata) {
        const props = metadata.properties || {};
        const attrs = metadata.attributes || [];

        // Extract values from attributes
        const getTrait = (traitType) => {
            const attr = attrs.find(a => a.trait_type === traitType);
            return attr ? attr.value : 0;
        };

        return {
            farmerDID: props.farmerDID || ethers.ZeroAddress,
            stateCode: props.stateCode || 0,
            districtCode: props.districtCode || 0,
            cropClusterCode: props.cropClusterCode || 0,
            avgYieldKgPerAcre: Math.floor(getTrait('Average Yield (Kg/Acre)')) || 1000,
            AvgSeasonYieldIndex: 3, // Default value
            totalDisbursed: ethers.parseUnits('25000', 2), // 250.00 in paise
            totalRepaid: ethers.parseUnits('20000', 2), // 200.00 in paise
            onTimeRepayments: getTrait('On-Time Repayments') || getTrait('Total Loans') || 3,
            lateRepayments: getTrait('Late Repayments') || 1,
            defaults: getTrait('Defaults') || 0,
            trustMetric: getTrait('Trust Metric') || 7,
            incentiveScore: getTrait('Incentive Score') || 75,
            updateDate: Math.floor(Date.now() / 1000),
            lastUpdated: Math.floor(Date.now() / 1000)
        };
    }

    /**
     * Mint NFT for a farmer
     */
    async mintNFT(nftData) {
        const { metadata, tokenId, filename } = nftData;

        console.log(`🎨 Minting NFT #${tokenId}: ${filename}`);

        try {
            // Get farmer address (use a default for demo)
            const farmerAddress = await this.signer.getAddress(); // In production, use actual farmer address

            // Convert metadata to contract profile
            const profile = this.metadataToContractProfile(metadata);

            // Generate metadata URI (empty for now as we don't want metadata URLs)
            const metadataURI = "";

            // Mint NFT
            console.log('   📝 Executing mint transaction...');
            const tx = await this.contract.mintCreditProfile(
                farmerAddress,
                profile.farmerDID,
                [
                    profile.stateCode,
                    profile.districtCode,
                    profile.cropClusterCode,
                    profile.avgYieldKgPerAcre,
                    profile.AvgSeasonYieldIndex,
                    profile.totalDisbursed,
                    profile.totalRepaid,
                    profile.onTimeRepayments,
                    profile.lateRepayments,
                    profile.defaults,
                    profile.trustMetric,
                    profile.incentiveScore,
                    profile.updateDate,
                    profile.lastUpdated
                ],
                metadataURI
            );

            // Wait for confirmation
            const receipt = await tx.wait();

            console.log('   ✅ NFT minted successfully!');
            console.log('   🔗 Transaction:', tx.hash);
            console.log('   ⛽ Gas used:', receipt.gasUsed.toString());

            const mintedNFT = {
                tokenId,
                filename,
                farmerName: metadata.name,
                farmerAddress,
                profile,
                metadata,
                transactionHash: tx.hash,
                gasUsed: receipt.gasUsed.toString(),
                mintedAt: new Date().toISOString()
            };

            this.deployedTokens.push(mintedNFT);
            return mintedNFT;

        } catch (error) {
            console.error(`   ❌ Failed to mint NFT #${tokenId}:`, error.message);
            return null;
        }
    }

    /**
     * Batch mint all NFTs
     */
    async batchMintNFTs() {
        console.log('🌾 Starting batch minting process...\n');

        const nftMetadata = this.loadNFTMetadata();
        const results = [];

        for (const nftData of nftMetadata) {
            const result = await this.mintNFT(nftData);
            if (result) {
                results.push({ success: true, tokenId: result.tokenId, name: result.farmerName });
            } else {
                results.push({ success: false, tokenId: nftData.tokenId, filename: nftData.filename });
            }

            // Small delay between mints
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return results;
    }

    /**
     * Generate deployment report
     */
    async generateReport(results) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log('\n' + '='.repeat(70));
        console.log('🎯 CONTRACT DEPLOYMENT & MINTING SUMMARY');
        console.log('='.repeat(70));
        console.log(`📍 Contract Address: ${this.contractAddress}`);
        console.log(`🔗 Chain ID: ${process.env.CHAIN_ID || 'localhost'}`);
        console.log(`📊 Total NFTs Processed: ${results.length}`);
        console.log(`✅ Successful Mints: ${successful.length}`);
        console.log(`❌ Failed Mints: ${failed.length}`);

        if (successful.length > 0) {
            const totalSupply = await this.contract.totalSupply();
            console.log(`🎨 Contract Total Supply: ${totalSupply.toString()}`);

            console.log('\n📈 MINTED NFTs:');
            successful.forEach(r => {
                console.log(`   Token #${r.tokenId}: ${r.name}`);
            });
        }

        if (failed.length > 0) {
            console.log('\n❌ FAILED MINTS:');
            failed.forEach(r => {
                console.log(`   Token #${r.tokenId}: ${r.filename}`);
            });
        }

        console.log('\n💾 Saving deployment data...');
        this.saveDeploymentData(results);

        console.log('='.repeat(70));
        console.log('🎉 Contract deployment and minting completed!');
        console.log('='.repeat(70));
    }

    /**
     * Save deployment data to file
     */
    saveDeploymentData(results) {
        const deploymentData = {
            contract: {
                address: this.contractAddress,
                deployer: this.signer.address,
                deployedAt: new Date().toISOString(),
                chainId: process.env.CHAIN_ID || 'localhost',
                rpcUrl: process.env.RPC_URL
            },
            minting: {
                totalProcessed: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                mintedTokens: this.deployedTokens
            },
            statistics: {
                averageTrustMetric: this.deployedTokens.length > 0 ?
                    this.deployedTokens.reduce((sum, t) => sum + (t.profile.trustMetric || 0), 0) / this.deployedTokens.length : 0,
                premiumEligibleCount: this.deployedTokens.filter(t =>
                    t.metadata.attributes?.find(a => a.trait_type === 'Premium Eligible')?.value === 'Yes'
                ).length
            }
        };

        const outputPath = path.join(this.dataPath, 'contract-deployment.json');
        fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));

        console.log(`📁 Deployment data saved to: ${outputPath}`);
        return deploymentData;
    }

    /**
     * Main deployment process
     */
    async deploy() {
        try {
            // Initialize provider
            await this.initializeProvider();

            // Deploy contract
            await this.deployContract();

            console.log('\n');

            // Mint NFTs
            const results = await this.batchMintNFTs();

            // Generate report
            await this.generateReport(results);

            return {
                contractAddress: this.contractAddress,
                mintedTokens: this.deployedTokens.length,
                success: true
            };

        } catch (error) {
            console.error('💥 Deployment process failed:', error.message);
            throw error;
        }
    }
}

/**
 * Main execution function
 */
async function main() {
    console.log('🌾 FARMER CREDIT NFT - CONTRACT DEPLOYMENT');
    console.log('='.repeat(50));

    try {
        const deployer = new FarmerCreditNFTContractDeployer();
        const result = await deployer.deploy();

        console.log(`\n🚀 Deployment completed successfully!`);
        console.log(`📍 Contract: ${result.contractAddress}`);
        console.log(`🎨 NFTs Minted: ${result.mintedTokens}`);

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

// Export for testing
module.exports = { FarmerCreditNFTContractDeployer, main };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
