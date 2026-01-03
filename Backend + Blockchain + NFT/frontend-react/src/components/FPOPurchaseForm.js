import React, { useState, useEffect } from "react";
import {
  submitFPOPurchase,
  calculateCosts,
  TRANSPORT_RATES,
} from "../utils/api";
import "./FPOPurchaseForm.css";

const FPOPurchaseForm = ({ farmerDid, farmerMobile, onPurchaseComplete }) => {
  const [formData, setFormData] = useState({
    batchId: "",
    quantityKg: "",
    transportMethod: "",
    travelDistance: "",
    pricePerKg: "",
    qualityGrade: "",
    landAcres: "",
    cropType: "",
  });

  const [costs, setCosts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // Calculate costs whenever relevant fields change
  useEffect(() => {
    const { quantityKg, pricePerKg, travelDistance, transportMethod } =
      formData;

    if (quantityKg && pricePerKg && travelDistance && transportMethod) {
      const calculated = calculateCosts(
        parseFloat(quantityKg),
        parseFloat(pricePerKg),
        parseFloat(travelDistance),
        transportMethod,
      );
      setCosts(calculated);

      // Generate preview data
      if (
        formData.batchId &&
        formData.qualityGrade &&
        formData.landAcres &&
        formData.cropType
      ) {
        setPreviewData({
          transaction_type: "fpo_purchase",
          timestamp: new Date().toISOString(),
          farmer_info: {
            land_acres: parseFloat(formData.landAcres),
            crop_type: formData.cropType,
          },
          batch_info: {
            batch_id: formData.batchId,
            quantity_kg: parseFloat(quantityKg),
            quality_grade: formData.qualityGrade,
          },
          logistics: {
            transport_method: transportMethod,
            travel_distance_km: parseFloat(travelDistance),
            transport_rate_per_km: calculated.transportRate,
            transport_cost: calculated.transportCost,
          },
          pricing: {
            price_per_kg: parseFloat(pricePerKg),
            product_cost: calculated.productCost,
            total_cost: calculated.totalCost,
          },
        });
      }
    } else {
      setCosts(null);
      setPreviewData(null);
    }
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!farmerDid) {
      setError("Please verify farmer first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        batch_id: formData.batchId,
        quantity_kg: parseFloat(formData.quantityKg),
        transport_method: formData.transportMethod,
        travel_distance: parseFloat(formData.travelDistance),
        price_per_kg: parseFloat(formData.pricePerKg),
        quality_grade: formData.qualityGrade,
        farmer_did: farmerDid,
        land_acres: parseFloat(formData.landAcres),
        crop_type: formData.cropType,
      };

      const response = await submitFPOPurchase(payload);

      if (onPurchaseComplete) {
        onPurchaseComplete(response);
      }

      // Reset form
      setFormData({
        batchId: "",
        quantityKg: "",
        transportMethod: "",
        travelDistance: "",
        pricePerKg: "",
        qualityGrade: "",
        landAcres: "",
        cropType: "",
      });
      setCosts(null);
      setPreviewData(null);
    } catch (err) {
      setError(err.message || "Failed to submit purchase");
      console.error("Purchase submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      farmerDid &&
      formData.batchId &&
      formData.quantityKg &&
      formData.transportMethod &&
      formData.travelDistance &&
      formData.pricePerKg &&
      formData.qualityGrade &&
      formData.landAcres &&
      formData.cropType
    );
  };

  return (
    <div className="fpo-purchase-form card fade-in">
      <div className="card-header">
        <span className="icon">📦</span>
        2. FPO Purchase Entry
      </div>

      {!farmerDid && (
        <div className="message message-warning">
          <strong>⚠️ Please verify farmer first</strong>
          <p>You must verify the farmer before entering purchase details.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="purchase-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="batchId" className="form-label">
              Batch ID <span className="required">*</span>
            </label>
            <input
              type="text"
              id="batchId"
              name="batchId"
              className="form-input"
              placeholder="Enter batch identification number"
              value={formData.batchId}
              onChange={handleInputChange}
              required
              disabled={!farmerDid || loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="qualityGrade" className="form-label">
              Growing Method <span className="required">*</span>
            </label>
            <select
              id="qualityGrade"
              name="qualityGrade"
              className="form-input form-select"
              value={formData.qualityGrade}
              onChange={handleInputChange}
              required
              disabled={!farmerDid || loading}
            >
              <option value="">Select growing method</option>
              <option value="organic">🌿 Organic</option>
              <option value="conventional">🌾 Conventional</option>
              <option value="chemical">⚗️ Chemical</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="landAcres" className="form-label">
              Land Area (acres) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="landAcres"
              name="landAcres"
              className="form-input"
              placeholder="0.0"
              step="0.1"
              min="0"
              value={formData.landAcres}
              onChange={handleInputChange}
              onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
              required
              disabled={!farmerDid || loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cropType" className="form-label">
              Crop Type <span className="required">*</span>
            </label>
            <select
              id="cropType"
              name="cropType"
              className="form-input form-select"
              value={formData.cropType}
              onChange={handleInputChange}
              required
              disabled={!farmerDid || loading}
            >
              <option value="">Select oilseed crop</option>
              <option value="mustard">🌻 Mustard</option>
              <option value="sunflower">🌻 Sunflower</option>
              <option value="soybean">🌱 Soybean</option>
              <option value="groundnut">🥜 Groundnut</option>
              <option value="sesame">🌰 Sesame</option>
              <option value="safflower">🌼 Safflower</option>
              <option value="rapeseed">🌾 Rapeseed</option>
              <option value="linseed">🌾 Linseed</option>
              <option value="niger">🌻 Niger</option>
              <option value="castor">🌿 Castor</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantityKg" className="form-label">
              Quantity (kg) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="quantityKg"
              name="quantityKg"
              className="form-input"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={formData.quantityKg}
              onChange={handleInputChange}
              onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
              required
              disabled={!farmerDid || loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pricePerKg" className="form-label">
              Price per kg (₹) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="pricePerKg"
              name="pricePerKg"
              className="form-input"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={formData.pricePerKg}
              onChange={handleInputChange}
              onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
              required
              disabled={!farmerDid || loading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="transportMethod" className="form-label">
              Transport Method <span className="required">*</span>
            </label>
            <select
              id="transportMethod"
              name="transportMethod"
              className="form-input form-select"
              value={formData.transportMethod}
              onChange={handleInputChange}
              required
              disabled={!farmerDid || loading}
            >
              <option value="">Select transport method</option>
              <option value="tractor">
                🚜 Tractor (₹{TRANSPORT_RATES.tractor}/km)
              </option>
              <option value="tempo">
                🚐 Tempo (₹{TRANSPORT_RATES.tempo}/km)
              </option>
              <option value="truck">
                🚛 Truck (₹{TRANSPORT_RATES.truck}/km)
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="travelDistance" className="form-label">
              Travel Distance (km) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="travelDistance"
              name="travelDistance"
              className="form-input"
              placeholder="0.0"
              step="0.1"
              min="0"
              value={formData.travelDistance}
              onChange={handleInputChange}
              onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
              required
              disabled={!farmerDid || loading}
            />
          </div>
        </div>

        {costs && (
          <div className="cost-summary">
            <div className="cost-header">
              <span className="icon">💰</span>
              <strong>Cost Breakdown</strong>
            </div>
            <div className="cost-details">
              <div className="cost-item">
                <span className="cost-label">Product Cost:</span>
                <span className="cost-value">
                  ₹{costs.productCost.toFixed(2)}
                </span>
              </div>
              <div className="cost-item">
                <span className="cost-label">Transport Cost:</span>
                <span className="cost-value">
                  ₹{costs.transportCost.toFixed(2)}
                </span>
              </div>
              <div className="cost-item total">
                <span className="cost-label">Total Cost:</span>
                <span className="cost-value">
                  ₹{costs.totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {previewData && (
          <div className="data-preview">
            <div className="preview-header">
              <span className="icon">📋</span>
              <strong>IPFS Data Preview</strong>
            </div>
            <pre className="preview-content">
              {JSON.stringify(previewData, null, 2)}
            </pre>
          </div>
        )}

        {error && (
          <div className="message message-error error-shake">
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-large"
          disabled={!isFormValid() || loading}
        >
          {loading ? (
            <>
              <span className="spinner-small"></span>
              Processing Transaction...
            </>
          ) : (
            <>
              <span className="icon">✅</span>
              Submit Purchase
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default FPOPurchaseForm;
