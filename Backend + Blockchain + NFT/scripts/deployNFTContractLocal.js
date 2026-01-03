const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

/**
 * Local Blockchain Deployment Script for FarmerCreditNFT
 * This script deploys the NFT contract to a local Hardhat network
 * and automatically mints NFTs for existing farmers
 */

async function main() {
    console.log('🚀 Starting FarmerCreditNFT Local Deployment...\n');

    // Get signers
    const [deployer, minter, updater] = await ethers.getSigners();

    console.log('👤 Deploying with account:', deployer.address);
    console.log('💰 Account balance:', ethers.utils.formatEther(await deployer.getBalance()), 'ETH\n');

    // Deploy the contract
    console.log('📝 Deploying FarmerCreditNFT contract...');

    const FarmerCreditNFT = await ethers.getContractFactory('FarmerCreditNFT');
    const nftContract = await FarmerCreditNFT.deploy();
    await nftContract.deployed();

    console.log('✅ Contract deployed successfully!');
    console.log('📍 Contract address:', nftContract.address);
    console.log('🔗 Transaction hash:', nftContract.deployTransaction.hash);

    // Wait for a few confirmations
    console.log('⏳ Waiting for confirmations...');
    await nftContract.deployTransaction.wait(2);

    // Set up roles
    console.log('\n🔐 Setting up roles...');
    await nftContract.addMinter(minter.address);
    await nftContract.addUpdater(updater.address);
    console.log('✅ Minter role granted to:', minter.address);
    console.log('✅ Updater role granted to:', updater.address);

    // Load farmer data
    const farmersDbPath = path.join(__dirname, '../offchain/data/farmers_db.json');
    const creditProfilesPath = path.join(__dirname, '../offchain/data/credit-profiles');

    let farmersDb = {};
    let mintResults = [];

    try {
        farmersDb = JSON.parse(fs.readFileSync(farmersDbPath, 'utf8'));
        console.log('\n📊 Loaded farmer database with', farmersDb.farmers.length, 'farmers');
    } catch (error) {
        console.log('⚠️  No farmer database found, will create sample data');
        farmersDb = { farmers: [] };
    }

    // Auto-mint NFTs for existing farmers
    if (farmersDb.farmers && farmersDb.farmers.length > 0) {
        console.log('\n🎨 Auto-minting NFTs for existing farmers...\n');

        const contractWithMinter = nftContract.connect(minter);

        for (let i = 0; i < farmersDb.farmers.length; i++) {
            const farmer = farmersDb.farmers[i];

            try {
                console.log(`Processing ${i + 1}/${farmersDb.farmers.length}: ${farmer.name}`);

                // Load or generate credit profile
                const creditProfilePath = path.join(creditProfilesPath, `${farmer.farmer_did}.json`);
                let creditData = null;

                if (fs.existsSync(creditProfilePath)) {
                    creditData = JSON.parse(fs.readFileSync(creditProfilePath, 'utf8'));
                } else {
                    // Generate sample credit profile
                    creditData = generateSampleCreditProfile(farmer);
                }

                // Format profile for contract
                const profile = {
                    farmerDID: farmer.farmer_did,
                    stateCode: getStateCode(farmer.state_code),
                    districtCode: getDistrictCode(farmer.district_code),
                    cropClusterCode: getCropClusterCode(farmer.crop),
                    avgYieldKgPerAcre: creditData.farmerCreditProfile.avgYieldKgPerAcre,
                    AvgSeasonYieldIndex: creditData.farmerCreditProfile.AvgSeasonYieldIndex,
                    totalDisbursed: creditData.farmerCreditProfile.totalDisbursed,
                    totalRepaid: creditData.farmerCreditProfile.totalRepaid,
                    onTimeRepayments: creditData.farmerCreditProfile.onTimeRepayments,
                    lateRepayments: creditData.farmerCreditProfile.lateRepayments,
                    defaults: creditData.farmerCreditProfile.defaults,
                    trustMetric: creditData.farmerCreditProfile.trustMetric,
                    incentiveScore: creditData.farmerCreditProfile.incentiveScore,
                    updateDate: Math.floor(Date.now() / 1000),
                    lastUpdated: Math.floor(Date.now() / 1000)
                };

                // Generate metadata URI (mock IPFS)
                const metadataURI = `ipfs://Qm${Math.random().toString(36).substring(2, 48)}`;

                // Mint NFT
                const tx = await contractWithMinter.mintCreditProfile(
                    deployer.address, // recipient
                    profile,
                    metadataURI
                );

                const receipt = await tx.wait();

                // Extract token ID from events
                const mintEvent = receipt.events?.find(e => e.event === 'CreditProfileMinted');
                const tokenId = mintEvent?.args?.tokenId?.toString();

                console.log(`   ✅ NFT minted successfully!`);
                console.log(`   📋 Token ID: ${tokenId}`);
                console.log(`   🎯 Trust Score: ${profile.trustMetric}/10`);
                console.log(`   💯 Incentive Score: ${profile.incentiveScore}/100`);
                console.log(`   📦 Gas used: ${receipt.gasUsed.toString()}\n`);

                mintResults.push({
                    farmer: farmer.name,
                    farmerDID: farmer.farmer_did,
                    tokenId,
                    txHash: tx.hash,
                    trustMetric: profile.trustMetric,
                    incentiveScore: profile.incentiveScore,
                    gasUsed: receipt.gasUsed.toString()
                });

            } catch (error) {
                console.error(`   ❌ Failed to mint NFT for ${farmer.name}:`, error.message);
            }
        }
    }

    // Save deployment results
    const deploymentData = {
        network: 'localhost',
        contractAddress: nftContract.address,
        deploymentTxHash: nftContract.deployTransaction.hash,
        deployer: deployer.address,
        minter: minter.address,
        updater: updater.address,
        deployedAt: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
        gasPrice: ethers.utils.formatUnits(await ethers.provider.getGasPrice(), 'gwei'),
        totalNFTsMinted: mintResults.length,
        mintResults
    };

    const outputPath = path.join(__dirname, '../offchain/data/local-nft-deployment.json');
    fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));

    // Update frontend contract address
    const frontendUtilsPath = path.join(__dirname, '../frontend-react/src/utils/creditNFTContract.js');
    if (fs.existsSync(frontendUtilsPath)) {
        let contractCode = fs.readFileSync(frontendUtilsPath, 'utf8');
        contractCode = contractCode.replace(
            /const CONTRACT_ADDRESS = "[^"]*"/,
            `const CONTRACT_ADDRESS = "${nftContract.address}"`
        );
        fs.writeFileSync(frontendUtilsPath, contractCode);
        console.log('✅ Updated frontend contract address');
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 DEPLOYMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`📍 Contract Address: ${nftContract.address}`);
    console.log(`🌐 Network: Localhost (Hardhat)`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`🎨 Total NFTs Minted: ${mintResults.length}`);
    console.log(`💾 Deployment data saved to: ${outputPath}`);

    if (mintResults.length > 0) {
        const avgTrust = mintResults.reduce((sum, r) => sum + r.trustMetric, 0) / mintResults.length;
        const highTrustCount = mintResults.filter(r => r.trustMetric >= 8).length;
        console.log(`📈 Average Trust Score: ${avgTrust.toFixed(1)}/10`);
        console.log(`⭐ High Trust Farmers (≥8): ${highTrustCount}/${mintResults.length}`);
    }

    console.log('\n🚀 Ready for frontend integration!');
    console.log('💡 Start your React app and create transactions to see NFTs in action.');
    console.log('='.repeat(60));
}

// Helper functions
function generateSampleCreditProfile(farmer) {
    const trustMetric = Math.floor(Math.random() * 6) + 5; // 5-10
    const avgYield = Math.floor(Math.random() * 1000) + 1000; // 1000-2000
    const totalLoans = Math.floor(Math.random() * 5) + 3; // 3-7

    return {
        farmerCreditProfile: {
            avgYieldKgPerAcre: avgYield,
            AvgSeasonYieldIndex: 3,
            totalDisbursed: 2500000, // 25,000 INR in paise
            totalRepaid: 2200000, // 22,000 INR in paise
            onTimeRepayments: Math.max(0, totalLoans - 2),
            lateRepayments: Math.min(2, totalLoans),
            defaults: Math.random() > 0.8 ? 1 : 0,
            trustMetric,
            incentiveScore: calculateIncentiveScore(trustMetric)
        }
    };
}

function calculateIncentiveScore(trustMetric) {
    if (trustMetric >= 9) return 95;
    if (trustMetric >= 8) return 85;
    if (trustMetric >= 7) return 75;
    if (trustMetric >= 6) return 65;
    if (trustMetric >= 5) return 55;
    return 35;
}

function getStateCode(stateISO) {
    const stateCodes = {
        'PB': 3,   // Punjab
        'HR': 6,   // Haryana
        'UP': 9,   // Uttar Pradesh
        'MH': 27,  // Maharashtra
        'TN': 33   // Tamil Nadu
    };
    return stateCodes[stateISO] || 3;
}

function getDistrictCode(districtCode) {
    return parseInt(districtCode.replace(/[A-Z]+/, '')) || 301;
}

function getCropClusterCode(crop) {
    const cropCodes = {
        'mustard': 1,
        'sunflower': 2,
        'groundnut': 3,
        'sesame': 4,
        'soybean': 5,
        'safflower': 6,
        'niger': 7
    };
    return cropCodes[crop.toLowerCase()] || 1;
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 Deployment failed:', error);
        process.exit(1);
    });
