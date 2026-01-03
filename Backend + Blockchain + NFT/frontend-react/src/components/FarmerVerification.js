import React, { useState } from "react";
import { sha256Hex, verifyFarmer } from "../utils/api";
import "./FarmerVerification.css";

const FarmerVerification = ({ onFarmerVerified }) => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!mobileNumber || mobileNumber.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const farmerDid = await sha256Hex(mobileNumber);
      const response = await verifyFarmer(farmerDid);

      setResult(response);

      if (response.exists && onFarmerVerified) {
        onFarmerVerified(farmerDid, mobileNumber);
      }
    } catch (err) {
      setError(err.message || "Failed to verify farmer");
      console.error("Verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    if (value.length <= 10) {
      setMobileNumber(value);
    }
  };

  return (
    <div className="farmer-verification card fade-in">
    <div className="card-header">
    <span className="icon">👨‍🌾</span>
    1. Farmer Verification
    </div>

    <form onSubmit={handleVerify} className="verification-form">
    <div className="form-group">
    <label htmlFor="mobileNumber" className="form-label">
    Farmer Mobile Number
    </label>
    <div className="input-group">
    <span className="input-prefix">+91</span>
    <input
    type="tel"
    id="mobileNumber"
    className="form-input"
    placeholder="Enter 10-digit mobile number"
    value={mobileNumber}
    onChange={handleMobileChange}
    maxLength={10}
    required
    disabled={loading}
    />
    </div>
    <small className="form-hint">
    Enter the registered mobile number of the farmer
    </small>
    </div>

    <button
    type="submit"
    className="btn btn-primary"
    disabled={loading || mobileNumber.length !== 10}
    >
    {loading ? (
      <>
      <span className="spinner-small"></span>
      Verifying...
      </>
    ) : (
      <>
      <span className="icon">🔍</span>
      Verify Farmer
      </>
    )}
    </button>
    </form>

    {error && (
      <div className="message message-error error-shake">
      <strong>❌ Error:</strong> {error}
      </div>
    )}

    {result && (
      <div
      className={`verification-result ${result.exists ? "success-pulse" : ""}`}
      >
      {result.exists ? (
        <div className="message message-success">
        <div className="result-header">
        <span className="icon-large">✅</span>
        <div>
        <strong>Farmer Verified Successfully!</strong>
        <p className="result-subtext">
        This farmer is registered in the blockchain system
        </p>
        </div>
        </div>
        <div className="result-details">
        <div className="detail-item">
        <span className="detail-label">Farmer DID:</span>
        <code className="detail-value">
        {Array.isArray(result.farmer_did)
          ? result.farmer_did[0]
          : result.farmer_did}
        </code>
        </div>
        {result.registered_at > 0 && (
          <div className="detail-item">
          <span className="detail-label">Registered:</span>
          <span className="detail-value">
          {new Date(
            result.registered_at * 1000,
          ).toLocaleDateString()}
          </span>
          </div>
        )}
        </div>
        </div>
      ) : (
        <div className="message message-error">
        <div className="result-header">
        <span className="icon-large">❌</span>
        <div>
        <strong>Farmer Not Found</strong>
        <p className="result-subtext">
        This mobile number is not registered in the system
        </p>
        </div>
        </div>
        <p className="result-hint">
        Please ensure the farmer is registered before proceeding with
        the purchase.
        </p>
        </div>
      )}
      </div>
    )}
    </div>
  );
};

export default FarmerVerification;
