import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import FarmerVerification from "./components/FarmerVerification";
import FPOPurchaseForm from "./components/FPOPurchaseForm";
import TransactionResult from "./components/TransactionResult";
import FarmerNFTDisplay from "./components/FarmerNFTDisplay";
import "./App.css";

// Main Home Component
function MainApp() {
  const [farmerDid, setFarmerDid] = useState(null);
  const [farmerMobile, setFarmerMobile] = useState(null);
  const [transactionResult, setTransactionResult] = useState(null);

  const handleFarmerVerified = (did, mobile) => {
    setFarmerDid(did);
    setFarmerMobile(mobile);
    setTransactionResult(null); // Clear previous transaction results
  };

  const handlePurchaseComplete = (result) => {
    // Store farmer info in result for NFT processing
    const resultWithFarmerInfo = {
      ...result,
      farmerDid,
      farmerMobile,
    };
    setTransactionResult(resultWithFarmerInfo);
    // Scroll to result
    setTimeout(() => {
      const resultElement = document.querySelector(".transaction-result");
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleNewTransaction = () => {
    setFarmerDid(null);
    setFarmerMobile(null);
    setTransactionResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1 className="header-title">Supply Chain Blockchain System</h1>
            <p className="header-subtitle">
              Government of India - Agriculture Department
            </p>
          </div>
          <div className="header-badge">FPO Management Portal</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Government Seal */}
        <div className="govt-seal">
          <strong>Ministry of Agriculture & Farmers Welfare</strong>
        </div>

        {/* Page Title */}
        <div className="page-header">
          <h2 className="page-title">
            <span>📋</span>
            FPO Purchase Entry System
          </h2>
          <p className="page-subtitle">
            Record farmer produce purchases on blockchain with IPFS storage for
            transparent and immutable supply chain tracking
          </p>
        </div>

        {/* Farmer Verification Section */}
        <FarmerVerification onFarmerVerified={handleFarmerVerified} />

        <hr className="section-divider" />

        {/* FPO Purchase Form Section */}
        <FPOPurchaseForm
          farmerDid={farmerDid}
          farmerMobile={farmerMobile}
          onPurchaseComplete={handlePurchaseComplete}
        />

        {/* Transaction Result Section */}
        {transactionResult && (
          <>
            <hr className="section-divider" />
            <TransactionResult result={transactionResult} />

            {/* New Transaction Button */}
            <div
              style={{ textAlign: "center", marginTop: "var(--spacing-xl)" }}
            >
              <button
                className="btn btn-primary"
                onClick={handleNewTransaction}
                style={{ minWidth: "250px" }}
              >
                <span className="icon">➕</span>
                Start New Transaction
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2024 Government of India - All Rights Reserved</p>
        <div className="footer-links">
          <button type="button" className="footer-link">
            Privacy Policy
          </button>
          <button type="button" className="footer-link">
            Terms of Service
          </button>
          <button type="button" className="footer-link">
            Contact Support
          </button>
          <button type="button" className="footer-link">
            Documentation
          </button>
        </div>
      </footer>
    </div>
  );
}

// Main App with Router
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/nft/:tokenId" element={<FarmerNFTDisplay />} />
        <Route path="/nft/farmer/:farmerDID" element={<FarmerNFTDisplay />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
