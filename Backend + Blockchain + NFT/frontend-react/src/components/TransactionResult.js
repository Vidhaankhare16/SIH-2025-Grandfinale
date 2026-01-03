import React, { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import creditNFTContract from "../utils/creditNFTContract";
import { NFT_METADATA_URLS } from "../utils/ipfsConfig";
import "./TransactionResult.css";

const TransactionResult = ({ result }) => {
  const navigate = useNavigate();
  const [nftData, setNftData] = useState(null);
  const [loadingNFT, setLoadingNFT] = useState(false);

  const txHash = result.tx_hash || "Not available";
  const cid = result.cid || "Not available";
  const pinataUrl = `https://purple-brilliant-tick-514.mypinata.cloud/ipfs/${cid}`;
  const qrCodeUrl = `https://purple-brilliant-tick-514.mypinata.cloud/ipfs/${cid}`;

  const checkAndCreateNFT = useCallback(async () => {
    try {
      setLoadingNFT(true);

      // Check if farmer already has an NFT
      const hasNFT = await creditNFTContract.hasNFT(result.farmerDid);

      if (hasNFT) {
        const tokenId = await creditNFTContract.getTokenIdByDID(
          result.farmerDid
        );
        setNftData({ tokenId, exists: true });
      } else {
        // Auto-mint NFT for the farmer
        const mintResult = await creditNFTContract.autoMintForFarmer(
          result.farmerDid,
          result.farmerMobile
        );

        if (mintResult.success) {
          setNftData({
            tokenId: mintResult.tokenId,
            exists: mintResult.existing || false,
            newlyMinted: !mintResult.existing,
          });
        }
      }
    } catch (error) {
      console.error("Error with NFT:", error);
    } finally {
      setLoadingNFT(false);
    }
  }, [result]);

  const handleViewNFT = () => {
    if (nftData && nftData.tokenId) {
      navigate(`/nft/${nftData.tokenId}`);
    }
  };

  useEffect(() => {
    if (result && result.farmerDid) {
      checkAndCreateNFT();
    }
  }, [result, checkAndCreateNFT]);

  return (
    <div className="transaction-result card fade-in success-pulse">
      <div className="result-header-success">
        <span className="icon-extra-large">✅</span>
        <div>
          <h2 className="result-title">Transaction Complete!</h2>
          <p className="result-subtitle">
            Your FPO purchase has been successfully recorded on the blockchain
          </p>
        </div>
      </div>

      <div className="result-content">
        {/* Blockchain Hash */}
        <div className="result-section">
          <div className="section-header">
            <span className="icon">🔗</span>
            <strong>Blockchain Transaction Hash</strong>
          </div>
          <div className="hash-container">
            <code className="hash-value">{txHash}</code>
            {txHash !== "Not available" && (
              <button
                className="btn-copy"
                onClick={() => navigator.clipboard.writeText(txHash)}
                title="Copy to clipboard"
              >
                📋
              </button>
            )}
          </div>
        </div>

        {/* IPFS CID */}
        <div className="result-section">
          <div className="section-header">
            <span className="icon">📁</span>
            <strong>IPFS Content Identifier (CID)</strong>
          </div>
          <div className="hash-container">
            <code className="hash-value">{cid}</code>
            {cid !== "Not available" && (
              <button
                className="btn-copy"
                onClick={() => navigator.clipboard.writeText(cid)}
                title="Copy to clipboard"
              >
                📋
              </button>
            )}
          </div>
          {cid !== "Not available" && (
            <>
              <a
                href={pinataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-external"
              >
                View on Pinata Gateway →
              </a>
            </>
          )}
        </div>

        {/* QR Code */}
        {txHash !== "Not available" && (
          <div className="result-section qr-section">
            <div className="section-header">
              <span className="icon">📱</span>
              <strong>QR Code - Scan to View IPFS Data</strong>
            </div>
            <div className="qr-container">
              <QRCodeSVG
                value={qrCodeUrl}
                size={200}
                level="H"
                includeMargin={true}
                fgColor="var(--color-primary-dark)"
                bgColor="var(--color-white)"
              />
              <p className="qr-hint">Scan to view IPFS data</p>
            </div>
          </div>
        )}

        {/* NFT IPFS Section */}
        {result && result.farmerDid && NFT_METADATA_URLS[result.farmerDid] && (
          <div className="result-section">
            <div className="section-header">
              <span className="icon">🎨</span>
              <strong>NFT Metadata IPFS Hash</strong>
            </div>
            <div className="hash-container">
              <code className="hash-value">
                {NFT_METADATA_URLS[result.farmerDid].cid}
              </code>
              <button
                className="btn-copy"
                onClick={() =>
                  navigator.clipboard.writeText(
                    NFT_METADATA_URLS[result.farmerDid].cid
                  )
                }
                title="Copy NFT IPFS hash to clipboard"
              >
                📋
              </button>
            </div>
            <a
              href={NFT_METADATA_URLS[result.farmerDid].metadataUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-external"
            >
              View NFT Metadata on IPFS →
            </a>
          </div>
        )}

        {/* NFT Section */}
        {result && result.farmerDid && (
          <div className="result-section nft-section">
            <div className="section-header">
              <span className="icon">🎨</span>
              <strong>Farmer Credit NFT</strong>
            </div>
            {loadingNFT ? (
              <div className="nft-loading">
                <div className="spinner-small"></div>
                <span>Processing Farmer Credit NFT...</span>
              </div>
            ) : nftData ? (
              <div className="nft-info">
                {nftData.newlyMinted && (
                  <div className="nft-minted-badge">
                    <span className="icon">✨</span>
                    <span>New Credit NFT Minted!</span>
                  </div>
                )}
                <div className="nft-details">
                  <div className="nft-token-info">
                    <span className="nft-label">Token ID:</span>
                    <span className="nft-value">#{nftData.tokenId}</span>
                  </div>
                  <div className="nft-token-info">
                    <span className="nft-label">Status:</span>
                    <span className="nft-value success">
                      {nftData.exists ? "Active" : "Newly Created"}
                    </span>
                  </div>
                </div>
                <button className="btn-nft-view" onClick={handleViewNFT}>
                  <span className="icon">👁️</span>
                  View Credit NFT
                </button>
              </div>
            ) : (
              <div className="nft-error">
                <span className="icon">⚠️</span>
                <span>Unable to process Credit NFT</span>
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        <div className="success-footer">
          <div className="success-badge">
            <span className="icon">🎉</span>
            <span>Successfully stored on blockchain and IPFS</span>
          </div>
          <p className="success-hint">
            This transaction is now immutable and can be verified by anyone with
            the transaction hash or IPFS CID.
            {nftData && (
              <>
                <br />
                <strong>Bonus:</strong> A Credit NFT has been created/updated
                for this farmer!
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionResult;
