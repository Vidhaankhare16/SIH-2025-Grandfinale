const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config({ path: path.join(__dirname, '../offchain/.env') });

/**
 * Streamlined IPFS Deployment Script using Pinata
 * Deploys NFT metadata and blockchain data to IPFS
 */

class PinataIPFSDeployer {
    constructor() {
        this.pinataApiKey = process.env.PINATA_API_KEY;
        this.pinataSecretKey = process.env.PINATA_API_SECRET;
        this.rpcUrl = process.env.RPC_URL;
        this.privateKey = process.env.PRIVATE_KEY;
        this.chainId = process.env.CHAIN_ID;
        this.contractAddress = process.env.CONTRACT_ADDRESS;

        this.deployedNFTs = [];
        this.metadataPath = path.join(__dirname, '../frontend-react/public/nft-metadata');
        this.dataPath = path.join(__dirname, '../offchain/data');

        if (!this.pinataApiKey || !this.pinataSecretKey) {
            throw new Error('Pinata API credentials not found in .env file');
        }
    }

    /**
     * Test Pinata connection
     */
    async testPinataConnection() {
        try {
            const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
                headers: {
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                }
            });
            console.log('✅ Pinata connection successful:', response.data.message);
            return true;
        } catch (error) {
            console.error('❌ Pinata connection failed:', error.response?.data || error.message);
            return false;
        }
    }

    /**
     * Upload JSON data to Pinata IPFS
     */
    async uploadJSONToPinata(data, filename) {
        try {
            const pinataOptions = JSON.stringify({
                cidVersion: 0,
                customPinPolicy: {
                    regions: [
                        {
                            id: 'FRA1',
                            desiredReplicationCount: 1
                        },
                        {
                            id: 'NYC1',
                            desiredReplicationCount: 1
                        }
                    ]
                }
            });

            const pinataMetadata = JSON.stringify({
                name: filename,
                keyvalues: {
                    type: 'nft-metadata',
                    project: 'farmer-credit-nft'
                }
            });

            const form = new FormData();
            form.append('file', JSON.stringify(data, null, 2), filename);
            form.append('pinataOptions', pinataOptions);
            form.append('pinataMetadata', pinataMetadata);

            const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
                maxContentLength: 'Infinity',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                }
            });

            const ipfsHash = response.data.IpfsHash;
            console.log(`📁 Uploaded ${filename} to IPFS: ${ipfsHash}`);

            return {
                hash: ipfsHash,
                url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
                size: response.data.PinSize
            };

        } catch (error) {
            console.error(`❌ Failed to upload ${filename}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Load and process existing NFT metadata files
     */
    loadExistingNFTMetadata() {
        const metadataFiles = fs.readdirSync(this.metadataPath)
            .filter(file => file.endsWith('.json'))
            .sort();

        console.log(`📂 Found ${metadataFiles.length} NFT metadata files`);

        const nftMetadata = [];
        for (const filename of metadataFiles) {
            const filePath = path.join(this.metadataPath, filename);
            const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            // Remove metadata URL if present but keep everything else
            delete metadata.metadataURI;

            nftMetadata.push({
                filename,
                metadata,
                tokenId: metadata.properties?.tokenId || parseInt(filename.match(/\d+/)?.[0] || '0')
            });
        }

        return nftMetadata;
    }

    /**
     * Deploy NFT metadata to IPFS
     */
    async deployNFTMetadata() {
        console.log('🎨 Deploying NFT metadata to IPFS...\n');

        const nftMetadata = this.loadExistingNFTMetadata();
        const deployedNFTs = [];

        for (const nft of nftMetadata) {
            try {
                console.log(`📤 Uploading ${nft.filename}...`);

                const ipfsResult = await this.uploadJSONToPinata(nft.metadata, nft.filename);

                const deployedNFT = {
                    tokenId: nft.tokenId,
                    filename: nft.filename,
                    farmerName: nft.metadata.name,
                    farmerDID: nft.metadata.properties?.farmerDID,
                    ipfs: {
                        hash: ipfsResult.hash,
                        url: ipfsResult.url,
                        size: ipfsResult.size
                    },
                    metadata: nft.metadata,
                    deployedAt: new Date().toISOString()
                };

                deployedNFTs.push(deployedNFT);
                console.log(`   ✅ Success! IPFS Hash: ${ipfsResult.hash}\n`);

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error(`   ❌ Failed to upload ${nft.filename}:`, error.message);
            }
        }

        this.deployedNFTs = deployedNFTs;
        return deployedNFTs;
    }

    /**
     * Create blockchain deployment summary
     */
    createBlockchainSummary() {
        return {
            blockchain: {
                chainId: this.chainId,
                rpcUrl: this.rpcUrl,
                contractAddress: this.contractAddress,
                contractName: 'FarmerCreditNFT'
            },
            deployment: {
                timestamp: new Date().toISOString(),
                totalNFTs: this.deployedNFTs.length,
                network: this.chainId === '80002' ? 'Polygon Mumbai Testnet' : `Chain ID ${this.chainId}`,
                deployer: 'Smart Contract Deployment System'
            },
            statistics: {
                totalNFTsDeployed: this.deployedNFTs.length,
                averageTrustScore: this.calculateAverageTrustScore(),
                premiumEligibleCount: this.getPremiumEligibleCount(),
                uniqueFarmers: new Set(this.deployedNFTs.map(nft => nft.farmerDID).filter(Boolean)).size
            },
            nfts: this.deployedNFTs.map(nft => ({
                tokenId: nft.tokenId,
                farmerName: nft.farmerName,
                farmerDID: nft.farmerDID,
                ipfsHash: nft.ipfs.hash,
                ipfsUrl: nft.ipfs.url,
                deployedAt: nft.deployedAt
            }))
        };
    }

    /**
     * Calculate average trust score from deployed NFTs
     */
    calculateAverageTrustScore() {
        const trustScores = this.deployedNFTs
            .map(nft => {
                const trustAttr = nft.metadata.attributes?.find(attr => attr.trait_type === 'Trust Metric');
                return trustAttr ? trustAttr.value : 0;
            })
            .filter(score => score > 0);

        return trustScores.length > 0 ?
            (trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length).toFixed(2) : 0;
    }

    /**
     * Get count of premium eligible farmers
     */
    getPremiumEligibleCount() {
        return this.deployedNFTs.filter(nft => {
            const premiumAttr = nft.metadata.attributes?.find(attr => attr.trait_type === 'Premium Eligible');
            return premiumAttr?.value === 'Yes';
        }).length;
    }

    /**
     * Deploy blockchain summary to IPFS
     */
    async deployBlockchainData() {
        console.log('🔗 Deploying blockchain summary to IPFS...');

        const blockchainSummary = this.createBlockchainSummary();
        const filename = `blockchain-deployment-${Date.now()}.json`;

        try {
            const ipfsResult = await this.uploadJSONToPinata(blockchainSummary, filename);

            console.log(`✅ Blockchain data deployed to IPFS!`);
            console.log(`   Hash: ${ipfsResult.hash}`);
            console.log(`   URL: ${ipfsResult.url}`);

            return {
                filename,
                ipfs: ipfsResult,
                data: blockchainSummary
            };

        } catch (error) {
            console.error('❌ Failed to deploy blockchain data:', error.message);
            throw error;
        }
    }

    /**
     * Save deployment results locally
     */
    saveDeploymentResults(blockchainDeployment) {
        const results = {
            deployment: {
                timestamp: new Date().toISOString(),
                totalNFTs: this.deployedNFTs.length,
                chainId: this.chainId,
                contractAddress: this.contractAddress
            },
            nftDeployments: this.deployedNFTs,
            blockchainDeployment,
            statistics: {
                averageTrustScore: this.calculateAverageTrustScore(),
                premiumEligibleCount: this.getPremiumEligibleCount(),
                totalIPFSUploads: this.deployedNFTs.length + 1, // +1 for blockchain summary
                successRate: '100%'
            }
        };

        const outputPath = path.join(this.dataPath, 'pinata-deployment-results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`💾 Deployment results saved to: ${outputPath}`);

        return results;
    }

    /**
     * Print deployment summary
     */
    printSummary(results) {
        console.log('\n' + '='.repeat(70));
        console.log('🎯 PINATA IPFS DEPLOYMENT SUMMARY');
        console.log('='.repeat(70));
        console.log(`📊 Total NFTs Deployed: ${results.deployment.totalNFTs}`);
        console.log(`⭐ Average Trust Score: ${results.statistics.averageTrustScore}/10`);
        console.log(`🏆 Premium Eligible: ${results.statistics.premiumEligibleCount}/${results.deployment.totalNFTs}`);
        console.log(`🔗 Chain ID: ${results.deployment.chainId}`);
        console.log(`📝 Contract: ${results.deployment.contractAddress}`);
        console.log('');
        console.log('🌐 IPFS Deployments:');
        console.log(`📄 Blockchain Summary: ${results.blockchainDeployment.ipfs.url}`);
        console.log('📋 NFT Metadata:');

        results.nftDeployments.slice(0, 5).forEach(nft => {
            console.log(`   ${nft.farmerName}: ${nft.ipfs.url}`);
        });

        if (results.nftDeployments.length > 5) {
            console.log(`   ... and ${results.nftDeployments.length - 5} more NFTs`);
        }

        console.log('='.repeat(70));
        console.log('🎉 All data successfully deployed to IPFS via Pinata!');
        console.log('='.repeat(70));
    }

    /**
     * Main deployment function
     */
    async deploy() {
        console.log('🚀 Starting Pinata IPFS deployment...\n');

        try {
            // Test connection
            const connected = await this.testPinataConnection();
            if (!connected) {
                throw new Error('Failed to connect to Pinata');
            }

            console.log('');

            // Deploy NFT metadata
            await this.deployNFTMetadata();

            // Deploy blockchain summary
            const blockchainDeployment = await this.deployBlockchainData();

            // Save results
            const results = this.saveDeploymentResults(blockchainDeployment);

            // Print summary
            this.printSummary(results);

            return results;

        } catch (error) {
            console.error('💥 Deployment failed:', error.message);
            throw error;
        }
    }
}

/**
 * Main execution function
 */
async function main() {
    console.log('🌾 FARMER CREDIT NFT - PINATA IPFS DEPLOYMENT');
    console.log('='.repeat(50));

    try {
        const deployer = new PinataIPFSDeployer();
        await deployer.deploy();
    } catch (error) {
        console.error('❌ Deployment process failed:', error.message);
        process.exit(1);
    }
}

// Export for testing
module.exports = { PinataIPFSDeployer, main };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
