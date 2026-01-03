const { FarmerCreditNFTContractDeployer } = require('./deployContract');
const { PinataIPFSDeployer } = require('./deployToIPFS');
const fs = require('fs');
const path = require('path');

/**
 * Master Deployment Script
 * Orchestrates complete deployment process:
 * 1. Deploy smart contract and mint NFTs
 * 2. Deploy NFT metadata to IPFS via Pinata
 * 3. Deploy blockchain summary to IPFS
 */

class MasterDeployer {
    constructor() {
        this.contractResult = null;
        this.ipfsResult = null;
        this.dataPath = path.join(__dirname, '../offchain/data');
    }

    /**
     * Validate environment variables
     */
    validateEnvironment() {
        const requiredVars = [
            'PINATA_API_KEY',
            'PINATA_API_SECRET',
            'RPC_URL',
            'PRIVATE_KEY',
            'CHAIN_ID',
            'CONTRACT_ADDRESS'
        ];

        const missing = requiredVars.filter(varName => !process.env[varName]);

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        console.log('✅ Environment variables validated');
    }

    /**
     * Deploy smart contract and mint NFTs
     */
    async deployContract() {
        console.log('🚀 PHASE 1: Contract Deployment & NFT Minting');
        console.log('='.repeat(50));

        try {
            const contractDeployer = new FarmerCreditNFTContractDeployer();
            this.contractResult = await contractDeployer.deploy();

            console.log('✅ Contract deployment phase completed');
            return this.contractResult;

        } catch (error) {
            console.error('❌ Contract deployment failed:', error.message);
            throw error;
        }
    }

    /**
     * Deploy to IPFS via Pinata
     */
    async deployToIPFS() {
        console.log('\n🌐 PHASE 2: IPFS Deployment via Pinata');
        console.log('='.repeat(50));

        try {
            const ipfsDeployer = new PinataIPFSDeployer();
            this.ipfsResult = await ipfsDeployer.deploy();

            console.log('✅ IPFS deployment phase completed');
            return this.ipfsResult;

        } catch (error) {
            console.error('❌ IPFS deployment failed:', error.message);
            throw error;
        }
    }

    /**
     * Generate final deployment report
     */
    generateFinalReport() {
        const report = {
            deployment: {
                timestamp: new Date().toISOString(),
                phases: ['contract', 'ipfs'],
                status: 'completed',
                deployer: 'Master Deployment Script'
            },
            contract: {
                address: this.contractResult?.contractAddress,
                mintedNFTs: this.contractResult?.mintedTokens,
                chainId: process.env.CHAIN_ID,
                network: this.getNetworkName(process.env.CHAIN_ID)
            },
            ipfs: {
                provider: 'Pinata',
                totalUploads: this.ipfsResult?.deployment?.totalNFTs || 0,
                blockchainSummaryHash: this.ipfsResult?.blockchainDeployment?.ipfs?.hash,
                averageTrustScore: this.ipfsResult?.statistics?.averageTrustScore
            },
            statistics: {
                totalNFTsProcessed: Math.max(
                    this.contractResult?.mintedTokens || 0,
                    this.ipfsResult?.deployment?.totalNFTs || 0
                ),
                premiumEligible: this.ipfsResult?.statistics?.premiumEligibleCount || 0,
                deploymentDuration: 'N/A', // Could be calculated if needed
                successRate: '100%'
            },
            urls: {
                blockchainSummary: this.ipfsResult?.blockchainDeployment?.ipfs?.url,
                gateway: 'https://gateway.pinata.cloud/ipfs/',
                explorer: this.getExplorerUrl(process.env.CHAIN_ID, this.contractResult?.contractAddress)
            }
        };

        // Save final report
        const reportPath = path.join(this.dataPath, 'final-deployment-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        this.printFinalSummary(report);
        return report;
    }

    /**
     * Get network name from chain ID
     */
    getNetworkName(chainId) {
        const networks = {
            '1': 'Ethereum Mainnet',
            '80002': 'Polygon Mumbai Testnet',
            '137': 'Polygon Mainnet',
            '31337': 'Hardhat Local'
        };

        return networks[chainId] || `Custom Network (${chainId})`;
    }

    /**
     * Get explorer URL for contract
     */
    getExplorerUrl(chainId, contractAddress) {
        if (!contractAddress) return null;

        const explorers = {
            '1': `https://etherscan.io/address/${contractAddress}`,
            '80002': `https://mumbai.polygonscan.com/address/${contractAddress}`,
            '137': `https://polygonscan.com/address/${contractAddress}`
        };

        return explorers[chainId] || null;
    }

    /**
     * Print final deployment summary
     */
    printFinalSummary(report) {
        console.log('\n' + '='.repeat(80));
        console.log('🎯 FINAL DEPLOYMENT SUMMARY');
        console.log('='.repeat(80));
        console.log(`⏰ Completed: ${report.deployment.timestamp}`);
        console.log(`🌐 Network: ${report.contract.network}`);
        console.log(`📍 Contract: ${report.contract.address}`);
        console.log(`🎨 NFTs Processed: ${report.statistics.totalNFTsProcessed}`);
        console.log(`⭐ Premium Eligible: ${report.statistics.premiumEligible}`);
        console.log(`📈 Avg Trust Score: ${report.ipfs.averageTrustScore}/10`);
        console.log('');
        console.log('🔗 Important Links:');
        if (report.urls.explorer) {
            console.log(`   📝 Contract Explorer: ${report.urls.explorer}`);
        }
        console.log(`   🌐 Blockchain Summary: ${report.urls.blockchainSummary}`);
        console.log(`   📋 IPFS Gateway: ${report.urls.gateway}`);
        console.log('');
        console.log('📁 Data Files:');
        console.log('   📊 Contract Data: offchain/data/contract-deployment.json');
        console.log('   🌐 IPFS Data: offchain/data/pinata-deployment-results.json');
        console.log('   📋 Final Report: offchain/data/final-deployment-report.json');
        console.log('='.repeat(80));
        console.log('🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉');
        console.log('='.repeat(80));
        console.log('');
        console.log('💡 Next Steps:');
        console.log('   1. Your NFTs are now minted on the blockchain');
        console.log('   2. All metadata is stored on IPFS via Pinata');
        console.log('   3. Frontend can access NFTs using the contract address');
        console.log('   4. IPFS data is accessible via Pinata gateway');
        console.log('');
    }

    /**
     * Handle deployment errors gracefully
     */
    async handleError(phase, error) {
        console.error(`💥 Deployment failed in ${phase} phase:`, error.message);

        // Save error report
        const errorReport = {
            phase,
            error: error.message,
            timestamp: new Date().toISOString(),
            contractResult: this.contractResult,
            ipfsResult: this.ipfsResult
        };

        const errorPath = path.join(this.dataPath, 'deployment-error.json');
        fs.writeFileSync(errorPath, JSON.stringify(errorReport, null, 2));

        console.log(`📁 Error details saved to: ${errorPath}`);

        throw error;
    }

    /**
     * Main deployment orchestration
     */
    async deploy() {
        console.log('🌾 FARMER CREDIT NFT - MASTER DEPLOYMENT');
        console.log('='.repeat(50));
        console.log('📋 Phases: Contract → IPFS → Report');
        console.log('='.repeat(50));

        try {
            // Validate environment
            this.validateEnvironment();
            console.log('');

            // Phase 1: Contract deployment
            await this.deployContract().catch(error =>
                this.handleError('contract', error)
            );

            // Phase 2: IPFS deployment
            await this.deployToIPFS().catch(error =>
                this.handleError('ipfs', error)
            );

            // Phase 3: Final report
            console.log('\n📊 PHASE 3: Generating Final Report');
            console.log('='.repeat(50));
            const finalReport = this.generateFinalReport();

            return finalReport;

        } catch (error) {
            console.error('💥 Master deployment failed:', error.message);
            throw error;
        }
    }
}

/**
 * CLI execution with options
 */
async function main() {
    const args = process.argv.slice(2);
    const skipContract = args.includes('--skip-contract');
    const skipIPFS = args.includes('--skip-ipfs');
    const helpRequested = args.includes('--help') || args.includes('-h');

    if (helpRequested) {
        console.log(`
🌾 Farmer Credit NFT Master Deployment Script

Usage: node scripts/deploy.js [options]

Options:
  --skip-contract    Skip contract deployment phase
  --skip-ipfs       Skip IPFS deployment phase
  --help, -h        Show this help message

Environment Variables Required:
  PINATA_API_KEY      Your Pinata API key
  PINATA_API_SECRET   Your Pinata API secret
  RPC_URL            Blockchain RPC URL
  PRIVATE_KEY        Deployer private key
  CHAIN_ID           Target chain ID
  CONTRACT_ADDRESS   Contract address (if skipping deployment)

Examples:
  node scripts/deploy.js                 # Full deployment
  node scripts/deploy.js --skip-contract # Only IPFS deployment
  node scripts/deploy.js --skip-ipfs     # Only contract deployment
        `);
        process.exit(0);
    }

    try {
        if (skipContract && skipIPFS) {
            console.log('❌ Cannot skip both contract and IPFS deployment phases');
            process.exit(1);
        }

        const deployer = new MasterDeployer();

        if (skipContract) {
            console.log('⏭️  Skipping contract deployment phase');
            await deployer.deployToIPFS();
        } else if (skipIPFS) {
            console.log('⏭️  Skipping IPFS deployment phase');
            await deployer.deployContract();
        } else {
            // Full deployment
            await deployer.deploy();
        }

        console.log('🚀 Deployment script completed successfully!');

    } catch (error) {
        console.error('❌ Deployment script failed:', error.message);
        process.exit(1);
    }
}

// Export for testing
module.exports = { MasterDeployer, main };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
