import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, TrendingUp, IndianRupee, MapPin, Loader, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { predictPrice, getSupplyDemandAnalysis } from '../services/pricePredictionService';
import { InvestmentBreakdown, ExpectedReturns, PricePrediction, SellingRecommendation } from '../types';
import { getFarmingAdvisory } from '../services/geminiService';
import { findNearbySellingOpportunities, getBestSellingOptions, SellingOpportunity } from '../services/sellingOpportunitiesService';
import { validateAcreage, validateNumber } from '../services/inputValidationService';

interface FinancialPlanningPageProps {
  lang: string;
  location: string;
  userId?: string;
  onBack: () => void;
}

const FinancialPlanningPage: React.FC<FinancialPlanningPageProps> = ({ lang, location, onBack }) => {
  const [activeTab, setActiveTab] = useState<'finance' | 'prediction' | 'selling'>('finance');
  const [loading, setLoading] = useState(false);
  
  // Translation helper
  const t = (en: string, or: string) => lang === 'en' ? en : or;
  
  // Crop-specific defaults (realistic values based on Odisha agriculture)
  const cropDefaults: Record<string, { yield: number; investment: InvestmentBreakdown }> = {
    'Groundnut': {
      yield: 14.5, // Average yield: 12-18 qtl/acre
      investment: { seeds: 4200, fertilizers: 7200, pesticides: 2800, labor: 9500, irrigation: 4800, machinery: 4500, other: 1800, total: 34800 }
    },
    'Mustard': {
      yield: 11.5, // Average yield: 10-15 qtl/acre
      investment: { seeds: 3800, fertilizers: 6800, pesticides: 2400, labor: 8800, irrigation: 4200, machinery: 4000, other: 1600, total: 31600 }
    },
    'Soybean': {
      yield: 9.5, // Average yield: 8-12 qtl/acre
      investment: { seeds: 3500, fertilizers: 6200, pesticides: 2200, labor: 8200, irrigation: 3800, machinery: 3800, other: 1500, total: 29200 }
    },
    'Sunflower': {
      yield: 9.8, // Average yield: 8-12 qtl/acre
      investment: { seeds: 3600, fertilizers: 6400, pesticides: 2300, labor: 8500, irrigation: 4000, machinery: 3900, other: 1550, total: 30250 }
    },
    'Sesame': {
      yield: 2.8, // Average yield: 2-4 qtl/acre
      investment: { seeds: 2800, fertilizers: 4800, pesticides: 1800, labor: 6500, irrigation: 3200, machinery: 3000, other: 1200, total: 23300 }
    },
  };

  // Investment inputs
  const [cropName, setCropName] = useState('Groundnut');
  const [acreage, setAcreage] = useState(1);
  const [investment, setInvestment] = useState<InvestmentBreakdown>(cropDefaults['Groundnut'].investment);
  
  // Expected returns
  const [expectedYield, setExpectedYield] = useState(cropDefaults['Groundnut'].yield); // quintals per acre
  
  // Update defaults when crop changes
  useEffect(() => {
    const defaults = cropDefaults[cropName] || cropDefaults['Groundnut'];
    setExpectedYield(defaults.yield);
    setInvestment(defaults.investment);
    
    // Check if we have a saved price prediction for this crop
    try {
      const savedPrediction = localStorage.getItem('farmerPricePrediction');
      const savedCrop = localStorage.getItem('farmerPricePredictionCrop');
      if (savedPrediction && savedCrop === cropName) {
        const prediction = JSON.parse(savedPrediction);
        setPricePrediction(prediction);
      } else if (savedCrop !== cropName) {
        // Clear prediction if crop changed
        setPricePrediction(null);
      }
    } catch (error) {
      console.error('Error loading price prediction:', error);
    }
  }, [cropName]);
  const [expectedReturns, setExpectedReturns] = useState<ExpectedReturns | null>(null);
  
  // Price prediction
  const [pricePrediction, setPricePrediction] = useState<PricePrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  
  // Load price prediction from localStorage on mount
  useEffect(() => {
    try {
      const savedPrediction = localStorage.getItem('farmerPricePrediction');
      const savedCrop = localStorage.getItem('farmerPricePredictionCrop');
      if (savedPrediction && savedCrop === cropName) {
        const prediction = JSON.parse(savedPrediction);
        setPricePrediction(prediction);
      }
    } catch (error) {
      console.error('Error loading price prediction from localStorage:', error);
    }
  }, []); // Only run on mount

  // Save price prediction to localStorage whenever it changes
  useEffect(() => {
    if (pricePrediction) {
      try {
        localStorage.setItem('farmerPricePrediction', JSON.stringify(pricePrediction));
        localStorage.setItem('farmerPricePredictionCrop', cropName);
      } catch (error) {
        console.error('Error saving price prediction to localStorage:', error);
      }
    }
  }, [pricePrediction, cropName]);
  
  // Selling recommendations
  const [sellingRecommendations, setSellingRecommendations] = useState<SellingRecommendation[]>([]);
  const [sellingOpportunities, setSellingOpportunities] = useState<SellingOpportunity[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  
  const crops = ['Groundnut', 'Mustard', 'Soybean', 'Sunflower', 'Sesame'];

  // Load price prediction from localStorage on mount
  useEffect(() => {
    try {
      const savedPrediction = localStorage.getItem('farmerPricePrediction');
      const savedCrop = localStorage.getItem('farmerPricePredictionCrop');
      if (savedPrediction && savedCrop === cropName) {
        const prediction = JSON.parse(savedPrediction);
        setPricePrediction(prediction);
      }
    } catch (error) {
      console.error('Error loading price prediction from localStorage:', error);
    }
  }, []); // Only run on mount

  // Save price prediction to localStorage whenever it changes
  useEffect(() => {
    if (pricePrediction) {
      try {
        localStorage.setItem('farmerPricePrediction', JSON.stringify(pricePrediction));
        localStorage.setItem('farmerPricePredictionCrop', cropName);
      } catch (error) {
        console.error('Error saving price prediction to localStorage:', error);
      }
    }
  }, [pricePrediction, cropName]);

  // Calculate total investment (exclude 'total' field to avoid circular dependency)
  useEffect(() => {
    const { total, ...investmentFields } = investment;
    const calculatedTotal = Object.values(investmentFields).reduce((sum, val) => {
      const numVal = typeof val === 'number' ? val : 0;
      return sum + (isNaN(numVal) ? 0 : numVal);
    }, 0);
    
    // Only update if the calculated total is different to avoid infinite loops
    if (calculatedTotal !== investment.total) {
      setInvestment(prev => ({ ...prev, total: calculatedTotal }));
    }
  }, [investment.seeds, investment.fertilizers, investment.pesticides, investment.labor, investment.irrigation, investment.machinery, investment.other]);

  // Calculate expected returns
  useEffect(() => {
    // Calculate total investment per acre first (excluding total field)
    const { total: _, ...investmentFields } = investment;
    const investmentPerAcre = Object.values(investmentFields).reduce((sum, val) => {
      const numVal = typeof val === 'number' ? val : 0;
      return sum + (isNaN(numVal) ? 0 : numVal);
    }, 0);
    
    const totalInvestment = investmentPerAcre * acreage;
    const totalYield = expectedYield * acreage;
    const price = pricePrediction?.predictedPrice || 6500;
    const totalRevenue = totalYield * price;
    const netProfit = totalRevenue - totalInvestment;
    const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
    const breakEvenPrice = totalYield > 0 ? totalInvestment / totalYield : 0;

    setExpectedReturns({
      totalInvestment,
      expectedYield: totalYield,
      expectedPrice: price,
      totalRevenue,
      netProfit,
      roi,
      breakEvenPrice,
    });
  }, [investment.seeds, investment.fertilizers, investment.pesticides, investment.labor, investment.irrigation, investment.machinery, investment.other, acreage, expectedYield, pricePrediction]);

  // Load selling opportunities when location or crop changes
  useEffect(() => {
    if (location && cropName) {
      setLoadingOpportunities(true);
      try {
        const opportunities = findNearbySellingOpportunities(location, cropName, 10);
        setSellingOpportunities(opportunities);
        console.log("Loaded selling opportunities:", opportunities.length);
      } catch (error) {
        console.error("Error loading selling opportunities:", error);
      } finally {
        setLoadingOpportunities(false);
      }
    }
  }, [location, cropName]);

  // Define reasonable max limits for each investment field (per acre)
  const investmentMaxLimits: Record<string, number> = {
    seeds: 10000,        // ₹10,000/acre for premium seeds
    fertilizers: 15000,  // ₹15,000/acre for high-input farming
    pesticides: 8000,    // ₹8,000/acre for intensive pest management
    labor: 20000,       // ₹20,000/acre for labor-intensive crops
    irrigation: 12000,  // ₹12,000/acre for irrigation costs
    machinery: 15000,   // ₹15,000/acre for machinery rental/costs
    other: 10000,       // ₹10,000/acre for miscellaneous costs
  };

  const handleInvestmentChange = (field: keyof InvestmentBreakdown, inputValue: string) => {
    // Handle empty input - don't default to 0, allow empty string
    if (inputValue === '' || inputValue === null || inputValue === undefined) {
      setInvestment(prev => ({ ...prev, [field]: 0 }));
      return;
    }
    
    // Validate and sanitize the input
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      return; // Don't update if invalid
    }
    
    // Get max limit for this field
    const maxLimit = investmentMaxLimits[field] || 100000;
    
    // Validate the number (0 to maxLimit for investment fields)
    const validation = validateNumber(numValue, 0, maxLimit, true);
    if (validation.valid) {
      setInvestment(prev => ({ ...prev, [field]: validation.sanitized }));
    } else if (numValue > maxLimit) {
      // Show alert if value exceeds max
      alert(
        lang === 'en' 
          ? `${field.charAt(0).toUpperCase() + field.slice(1)} cannot exceed ₹${maxLimit.toLocaleString()}/acre. This is beyond normal agricultural range.`
          : `${field === 'seeds' ? 'ବିହନ' : field === 'fertilizers' ? 'ସାର' : field === 'pesticides' ? 'କୀଟନାଶକ' : field === 'labor' ? 'ଶ୍ରମ' : field === 'irrigation' ? 'ସିଞ୍ଚାଇ' : field === 'machinery' ? 'ଯନ୍ତ୍ର' : 'ଅନ୍ୟ'} ₹${maxLimit.toLocaleString()}/ଏକର ରୁ ଅଧିକ ହୋଇପାରିବ ନାହିଁ | ଏହା ସାଧାରଣ କୃଷି ପରିସରରୁ ବାହାରେ |`
      );
      setInvestment(prev => ({ ...prev, [field]: maxLimit }));
    }
  };

  const handlePredictPrice = async () => {
    setPredictionLoading(true);
    try {
      const harvestDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const prediction = await predictPrice(cropName, location, harvestDate);
      setPricePrediction(prediction);
      
      // Save to localStorage immediately
      try {
        localStorage.setItem('farmerPricePrediction', JSON.stringify(prediction));
        localStorage.setItem('farmerPricePredictionCrop', cropName);
      } catch (error) {
        console.error('Error saving price prediction:', error);
      }
      
      // Also get supply/demand analysis
      const analysis = await getSupplyDemandAnalysis(cropName, location);
      setSellingRecommendations([
        {
          location: 'APMC Market',
          recommendedPrice: prediction.predictedPrice,
          reason: analysis.recommendation,
          demandLevel: analysis.demand,
          supplyLevel: analysis.supply,
          distance: 15,
          contactInfo: '1800-180-1551',
        },
        {
          location: 'Nearest FPO',
          recommendedPrice: prediction.predictedPrice * 0.98,
          reason: 'Direct sale to FPO, better logistics',
          demandLevel: analysis.demand,
          supplyLevel: analysis.supply,
          distance: 8,
        },
      ]);
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setPredictionLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-200 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {lang === 'en' ? 'Financial Planning & Marketplace' : 'ଆର୍ଥିକ ଯୋଜନା ଏବଂ ବଜାର'}
              </h1>
              <p className="text-sm text-gray-600">
                {lang === 'en' ? 'Plan your investment, predict prices, and sell your produce' : 'ଆପଣଙ୍କର ବିନିଯୋଗ ଯୋଜନା କରନ୍ତୁ, ମୂଲ୍ୟ ଭବିଷ୍ୟବାଣୀ କରନ୍ତୁ, ଏବଂ ଆପଣଙ୍କର ଉତ୍ପାଦନ ବିକ୍ରୟ କରନ୍ତୁ'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('finance')}
              className={`px-6 py-4 font-bold transition ${
                activeTab === 'finance'
                  ? 'border-b-4 border-enam-green text-enam-green bg-green-50'
                  : 'text-gray-600 hover:text-enam-green'
              }`}
            >
              <Calculator size={18} className="inline mr-2" />
              {lang === 'en' ? 'Investment & Returns' : 'ବିନିଯୋଗ ଏବଂ ପ୍ରତ୍ୟାବର୍ତ୍ତନ'}
            </button>
            <button
              onClick={() => setActiveTab('prediction')}
              className={`px-6 py-4 font-bold transition ${
                activeTab === 'prediction'
                  ? 'border-b-4 border-enam-green text-enam-green bg-green-50'
                  : 'text-gray-600 hover:text-enam-green'
              }`}
            >
              <TrendingUp size={18} className="inline mr-2" />
              {lang === 'en' ? 'Price Prediction' : 'ମୂଲ୍ୟ ଭବିଷ୍ୟବାଣୀ'}
            </button>
            <button
              onClick={() => setActiveTab('selling')}
              className={`px-6 py-4 font-bold transition ${
                activeTab === 'selling'
                  ? 'border-b-4 border-enam-green text-enam-green bg-green-50'
                  : 'text-gray-600 hover:text-enam-green'
              }`}
            >
              <MapPin size={18} className="inline mr-2" />
              {lang === 'en' ? 'Where to Sell' : 'କେଉଁଠାରେ ବିକ୍ରୟ କରିବେ'}
            </button>
          </div>
        </div>

        {/* Finance Tab */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            {/* Crop Selection */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {lang === 'en' ? 'Crop Selection' : 'ଫସଲ ବାଛିବା'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {lang === 'en' ? 'Crop' : 'ଫସଲ'}
                  </label>
                  <select
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                  >
                    {crops.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {lang === 'en' ? 'Acreage' : 'ଏକର'}
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="500"
                    step="0.1"
                    value={acreage || ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '' || inputValue === null) {
                        setAcreage(0);
                        return;
                      }
                      const numValue = parseFloat(inputValue);
                      if (isNaN(numValue)) {
                        return;
                      }
                      if (numValue > 500) {
                        alert(lang === 'en' ? 'Acreage cannot exceed 500 acres. This is beyond normal farming scale.' : 'ଏକର ୫୦୦ ଏକର ରୁ ଅଧିକ ହୋଇପାରିବ ନାହିଁ | ଏହା ସାଧାରଣ ଚାଷ ପରିମାଣରୁ ବାହାରେ |');
                        setAcreage(500);
                        return;
                      }
                      const validation = validateAcreage(inputValue);
                      if (validation.valid) {
                        setAcreage(validation.sanitized);
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.target.value || parseFloat(e.target.value) < 0.1) {
                        setAcreage(0.1);
                      } else if (parseFloat(e.target.value) > 500) {
                        setAcreage(500);
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {lang === 'en' ? 'Range: 0.1 - 500 acres' : 'ପରିସର: ୦.୧ - ୫୦୦ ଏକର'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {lang === 'en' ? 'Expected Yield (qtl/acre)' : 'ଆଶାକୃତ ଉତ୍ପାଦନ (କ୍ୱିଣ୍ଟାଲ/ଏକର)'}
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="50"
                    step="0.1"
                    value={expectedYield || ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '' || inputValue === null) {
                        setExpectedYield(0);
                        return;
                      }
                      const numValue = parseFloat(inputValue);
                      if (isNaN(numValue)) {
                        return;
                      }
                      // Crop-specific yield limits (qtl/acre)
                      const yieldLimits: Record<string, number> = {
                        'Groundnut': 25,  // Realistic max: 18-25 qtl/acre
                        'Mustard': 20,    // Realistic max: 15-20 qtl/acre
                        'Soybean': 18,    // Realistic max: 12-18 qtl/acre
                        'Sunflower': 18,  // Realistic max: 12-18 qtl/acre
                        'Sesame': 6,      // Realistic max: 4-6 qtl/acre
                      };
                      const maxYield = yieldLimits[cropName] || 50;
                      if (numValue > maxYield) {
                        alert(
                          lang === 'en' 
                            ? `Expected yield for ${cropName} cannot exceed ${maxYield} qtl/acre. This is beyond normal agricultural range.`
                            : `${cropName} ପାଇଁ ଆଶାକୃତ ଉତ୍ପାଦନ ${maxYield} କ୍ୱିଣ୍ଟାଲ/ଏକର ରୁ ଅଧିକ ହୋଇପାରିବ ନାହିଁ | ଏହା ସାଧାରଣ କୃଷି ପରିସରରୁ ବାହାରେ |`
                        );
                        setExpectedYield(maxYield);
                        return;
                      }
                      const validation = validateNumber(inputValue, 0.1, maxYield, true);
                      if (validation.valid) {
                        setExpectedYield(validation.sanitized);
                      }
                    }}
                    onBlur={(e) => {
                      const yieldLimits: Record<string, number> = {
                        'Groundnut': 25,
                        'Mustard': 20,
                        'Soybean': 18,
                        'Sunflower': 18,
                        'Sesame': 6,
                      };
                      const maxYield = yieldLimits[cropName] || 50;
                      if (!e.target.value || parseFloat(e.target.value) < 0.1) {
                        setExpectedYield(0.1);
                      } else if (parseFloat(e.target.value) > maxYield) {
                        setExpectedYield(maxYield);
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {lang === 'en' 
                      ? `Range: 0.1 - ${cropName === 'Groundnut' ? '25' : cropName === 'Mustard' ? '20' : cropName === 'Soybean' || cropName === 'Sunflower' ? '18' : '6'} qtl/acre`
                      : `ପରିସର: ୦.୧ - ${cropName === 'Groundnut' ? '୨୫' : cropName === 'Mustard' ? '୨୦' : cropName === 'Soybean' || cropName === 'Sunflower' ? '୧୮' : '୬'} କ୍ୱିଣ୍ଟାଲ/ଏକର`}
                  </div>
                </div>
              </div>
            </div>

            {/* Investment Breakdown */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator size={24} className="text-enam-green" />
                {lang === 'en' ? 'Investment Breakdown' : 'ବିନିଯୋଗ ବିଭାଜନ'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(investment).filter(([key]) => key !== 'total').map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 capitalize">
                      {lang === 'en' 
                        ? key.replace(/([A-Z])/g, ' $1').trim()
                        : {
                            'seeds': 'ବିହନ',
                            'fertilizers': 'ସାର',
                            'pesticides': 'କୀଟନାଶକ',
                            'labor': 'ଶ୍ରମ',
                            'irrigation': 'ସିଞ୍ଚାଇ',
                            'machinery': 'ଯନ୍ତ୍ର',
                            'other': 'ଅନ୍ୟ'
                          }[key] || key.replace(/([A-Z])/g, ' $1').trim()
                      } (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={investmentMaxLimits[key] || 100000}
                      step="1"
                      value={value as number || ''}
                      onChange={(e) => handleInvestmentChange(key as keyof InvestmentBreakdown, e.target.value)}
                      onBlur={(e) => {
                        if (!e.target.value || parseFloat(e.target.value) < 0) {
                          handleInvestmentChange(key as keyof InvestmentBreakdown, '0');
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                      placeholder={`Max: ₹${(investmentMaxLimits[key] || 100000).toLocaleString()}`}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {lang === 'en' 
                        ? `Max: ₹${(investmentMaxLimits[key] || 100000).toLocaleString()}/acre`
                        : `ସର୍ବାଧିକ: ₹${(investmentMaxLimits[key] || 100000).toLocaleString()}/ଏକର`}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-enam-green/10 rounded-lg border-2 border-enam-green">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">
                    {lang === 'en' ? 'Total Investment per Acre:' : 'ପ୍ରତି ଏକର ମୋଟ ବିନିଯୋଗ:'}
                  </span>
                  <span className="text-2xl font-bold text-enam-green">
                    ₹{investment.total.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {lang === 'en' 
                    ? `Total for ${acreage} acre(s): ₹${(investment.total * acreage).toLocaleString()}`
                    : `${acreage} ଏକର ପାଇଁ ମୋଟ: ₹${(investment.total * acreage).toLocaleString()}`}
                </div>
              </div>
            </div>

            {/* Expected Returns */}
            {expectedReturns && (
              <div className="bg-gradient-to-br from-green-50 to-enam-green/10 rounded-xl p-6 shadow-sm border-2 border-green-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <IndianRupee size={24} className="text-green-600" />
                  {lang === 'en' ? 'Expected Returns' : 'ଆଶାକୃତ ପ୍ରତ୍ୟାବର୍ତ୍ତନ'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'Total Investment' : 'ମୋଟ ବିନିଯୋଗ'}</div>
                      <div className="text-2xl font-bold text-gray-900">₹{expectedReturns.totalInvestment.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'Expected Yield' : 'ଆଶାକୃତ ଉତ୍ପାଦନ'}</div>
                      <div className="text-2xl font-bold text-blue-600">{expectedReturns.expectedYield.toFixed(1)} qtl</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'Expected Price' : 'ଆଶାକୃତ ମୂଲ୍ୟ'}</div>
                      <div className="text-2xl font-bold text-purple-600">₹{expectedReturns.expectedPrice.toLocaleString()}/qtl</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                      <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'Total Revenue' : 'ମୋଟ ଆୟ'}</div>
                      <div className="text-3xl font-bold text-green-600">₹{expectedReturns.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
                      <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'Net Profit' : 'ନିଟ୍ ଲାଭ'}</div>
                      <div className="text-3xl font-bold text-orange-600">₹{expectedReturns.netProfit.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'ROI' : 'ବିନିଯୋଗର ପ୍ରତ୍ୟାବର୍ତ୍ତନ'}</div>
                      <div className="text-2xl font-bold text-indigo-600">{expectedReturns.roi.toFixed(1)}%</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-300">
                      <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'Break-Even Price' : 'ବ୍ରେକ୍-ଇଭେନ୍ ମୂଲ୍ୟ'}</div>
                      <div className="text-xl font-bold text-yellow-700">₹{expectedReturns.breakEvenPrice.toFixed(0)}/qtl</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {lang === 'en' ? 'Minimum price needed to cover costs' : 'ମୂଲ୍ୟ ଆବରଣ କରିବା ପାଇଁ ସର୍ବନିମ୍ନ ମୂଲ୍ୟ'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Price Prediction Tab */}
        {activeTab === 'prediction' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {lang === 'en' ? 'ML Price Prediction' : 'ML ମୂଲ୍ୟ ଭବିଷ୍ୟବାଣୀ'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {lang === 'en' ? 'Crop' : 'ଫସଲ'}
                  </label>
                  <select
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                  >
                    {crops.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handlePredictPrice}
                    disabled={predictionLoading}
                    className="w-full bg-enam-green hover:bg-enam-dark text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {predictionLoading ? (
                      <>
                        <Loader className="animate-spin" size={18} />
                        {lang === 'en' ? 'Predicting...' : 'ଭବିଷ୍ୟବାଣୀ କରୁଛି...'}
                      </>
                    ) : (
                      <>
                        <TrendingUp size={18} />
                        {lang === 'en' ? 'Predict Price' : 'ମୂଲ୍ୟ ଭବିଷ୍ୟବାଣୀ କରନ୍ତୁ'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {pricePrediction && (
                <div className="space-y-6">
                  {/* Price Stats Cards */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      {lang === 'en' ? 'Prediction Results' : 'ଭବିଷ୍ୟବାଣୀ ଫଳାଫଳ'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
                          <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'Current Price' : 'ବର୍ତ୍ତମାନର ମୂଲ୍ୟ'}</div>
                          <div className="text-2xl font-bold text-gray-900">₹{pricePrediction.currentPrice.toLocaleString()}/qtl</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                          <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'Predicted Price at Harvest' : 'କଟାଣ ସମୟରେ ଭବିଷ୍ୟବାଣୀ ମୂଲ୍ୟ'}</div>
                          <div className="text-3xl font-bold text-green-600">₹{pricePrediction.predictedPrice.toLocaleString()}/qtl</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {pricePrediction.trend === 'increasing' ? '📈' : pricePrediction.trend === 'decreasing' ? '📉' : '➡️'} 
                            {lang === 'en' ? ` Trend: ${pricePrediction.trend}` : ` ପ୍ରବୃତ୍ତି: ${pricePrediction.trend}`}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
                          <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'Confidence Level' : 'ଆତ୍ମବିଶ୍ୱାସ ସ୍ତର'}</div>
                          <div className="text-2xl font-bold text-blue-600">{pricePrediction.confidence}%</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="text-sm text-gray-600 mb-2">{lang === 'en' ? 'Key Factors' : 'ମୁଖ୍ୟ କାରକ'}</div>
                          <ul className="space-y-1">
                            {pricePrediction.factors.map((factor, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <CheckCircle size={14} className="text-green-600 mt-0.5 shrink-0" />
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Prediction Chart */}
                  {pricePrediction.timeSeriesData && pricePrediction.timeSeriesData.length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp size={24} className="text-enam-green" />
                        {lang === 'en' ? 'Price Prediction Over Time' : 'ସମୟ ଉପରେ ମୂଲ୍ୟ ଭବିଷ୍ୟବାଣୀ'}
                      </h3>
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-700">
                          {lang === 'en' 
                            ? 'This chart shows the predicted market price progression compared to the Minimum Support Price (MSP) over time. The MSP line represents the guaranteed minimum price set by the government.'
                            : 'ଏହି ଚାର୍ଟ ସମୟ ଉପରେ ସରକାରୀ ନିର୍ଦ୍ଧାରିତ ସର୍ବନିମ୍ନ ସହାୟତା ମୂଲ୍ୟ (MSP) ସହିତ ଭବିଷ୍ୟବାଣୀ ବଜାର ମୂଲ୍ୟର ପ୍ରଗତି ଦର୍ଶାଏ |'}
                        </p>
                      </div>
                      <ResponsiveContainer width="100%" height={450}>
                        <LineChart
                          data={pricePrediction.timeSeriesData.map(point => ({
                            ...point,
                            dateLabel: point.label,
                            date: new Date(point.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                          }))}
                          margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                          <XAxis 
                            dataKey="dateLabel" 
                            stroke="#6b7280"
                            fontSize={13}
                            fontWeight="500"
                            tick={{ fill: '#4b5563' }}
                            tickLine={{ stroke: '#9ca3af' }}
                            axisLine={{ stroke: '#d1d5db' }}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            fontSize={13}
                            fontWeight="500"
                            tick={{ fill: '#4b5563' }}
                            tickLine={{ stroke: '#9ca3af' }}
                            axisLine={{ stroke: '#d1d5db' }}
                            domain={[
                              (dataMin: number) => Math.max(0, Math.floor(dataMin * 0.92)),
                              (dataMax: number) => Math.ceil(dataMax * 1.08)
                            ]}
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(1)}k`}
                            label={{ 
                              value: lang === 'en' ? 'Price (₹/quintal)' : 'ମୂଲ୍ୟ (₹/କ୍ୱିଣ୍ଟାଲ)', 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { textAnchor: 'middle', fill: '#4b5563', fontSize: '13px', fontWeight: '600' }
                            }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '2px solid #e5e7eb',
                              borderRadius: '10px',
                              boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                              padding: '12px'
                            }}
                            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}/qtl`, '']}
                            labelStyle={{ 
                              fontWeight: 'bold', 
                              color: '#111827',
                              fontSize: '13px',
                              marginBottom: '8px',
                              paddingBottom: '8px',
                              borderBottom: '1px solid #e5e7eb'
                            }}
                            itemStyle={{ 
                              color: '#4b5563',
                              fontSize: '13px',
                              padding: '4px 0'
                            }}
                            separator=": "
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '25px', paddingBottom: '10px' }}
                            iconType="line"
                            iconSize={16}
                            formatter={(value) => <span style={{ fontSize: '13px', fontWeight: '500', color: '#4b5563' }}>{value}</span>}
                          />
                          <ReferenceLine 
                            y={pricePrediction.timeSeriesData[0]?.msp} 
                            stroke="#f59e0b" 
                            strokeWidth={2}
                            strokeDasharray="8 4"
                            strokeOpacity={0.7}
                            label={{ 
                              value: lang === 'en' ? 'MSP (Guaranteed)' : 'MSP (ନିଶ୍ଚିତ)', 
                              position: 'bottomRight',
                              fill: '#f59e0b',
                              fontSize: 12,
                              fontWeight: 'bold',
                              offset: -15
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="msp" 
                            stroke="#f59e0b" 
                            strokeWidth={2.5}
                            strokeDasharray="8 4"
                            strokeOpacity={0.8}
                            name={lang === 'en' ? 'MSP (Minimum Support Price)' : 'MSP (ସର୍ବନିମ୍ନ ସହାୟତା ମୂଲ୍ୟ)'}
                            dot={{ fill: '#f59e0b', r: 5, strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff', fill: '#f59e0b' }}
                            connectNulls={false}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="predictedPrice" 
                            stroke="#10b981" 
                            strokeWidth={3.5}
                            strokeOpacity={0.9}
                            name={lang === 'en' ? 'Predicted Market Price' : 'ଭବିଷ୍ୟବାଣୀ ବଜାର ମୂଲ୍ୟ'}
                            dot={{ fill: '#10b981', r: 6, strokeWidth: 2.5, stroke: '#fff' }}
                            activeDot={{ r: 9, strokeWidth: 2.5, stroke: '#fff', fill: '#10b981' }}
                            connectNulls={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <div className="font-bold text-green-700 mb-1">
                            {lang === 'en' ? 'Price Above MSP' : 'MSP ଉପରେ ମୂଲ୍ୟ'}
                          </div>
                          <div className="text-gray-700">
                            {pricePrediction.predictedPrice > pricePrediction.timeSeriesData[0]?.msp 
                              ? `+₹${(pricePrediction.predictedPrice - pricePrediction.timeSeriesData[0]?.msp).toLocaleString()}/qtl`
                              : lang === 'en' ? 'Below MSP' : 'MSP ତଳେ'}
                          </div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <div className="font-bold text-blue-700 mb-1">
                            {lang === 'en' ? 'Expected Gain' : 'ଆଶାକୃତ ଲାଭ'}
                          </div>
                          <div className="text-gray-700">
                            +₹{(pricePrediction.predictedPrice - pricePrediction.currentPrice).toLocaleString()}/qtl
                          </div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                          <div className="font-bold text-orange-700 mb-1">
                            {lang === 'en' ? 'MSP Protection' : 'MSP ସୁରକ୍ଷା'}
                          </div>
                          <div className="text-gray-700">
                            {pricePrediction.predictedPrice >= pricePrediction.timeSeriesData[0]?.msp
                              ? lang === 'en' ? 'Protected' : 'ସୁରକ୍ଷିତ'
                              : lang === 'en' ? 'At Risk' : 'ବିପଦରେ'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selling Recommendations Tab */}
        {activeTab === 'selling' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin size={24} className="text-enam-green" />
                  {t('Where to Sell - Nearby Opportunities', 'କେଉଁଠାରେ ବିକ୍ରୟ କରିବେ - ନିକଟତମ ସୁଯୋଗ')}
                </h2>
                {location && (
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <MapPin size={16} />
                    {location}
                  </div>
                )}
              </div>
              
              {!location ? (
                <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-gray-700 mb-2">
                    {t('Please set your location to find nearby selling opportunities', 'ନିକଟତମ ବିକ୍ରୟ ସୁଯୋଗ ଖୋଜିବା ପାଇଁ ଦୟାକରି ଆପଣଙ୍କର ସ୍ଥାନ ସେଟ୍ କରନ୍ତୁ')}
                  </p>
                </div>
              ) : loadingOpportunities ? (
                <div className="text-center py-8">
                  <Loader className="animate-spin mx-auto mb-4 text-enam-green" size={32} />
                  <p className="text-gray-600">
                    {t('Finding nearby opportunities...', 'ନିକଟତମ ସୁଯୋଗ ଖୋଜୁଛି...')}
                  </p>
                </div>
              ) : sellingOpportunities.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-2">
                    {t('No selling opportunities found for', 'ପାଇଁ କୌଣସି ବିକ୍ରୟ ସୁଯୋଗ ମିଳିଲା ନାହିଁ')} {cropName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('Try selecting a different crop or check back later', 'ଏକ ଭିନ୍ନ ଫସଲ ବାଛନ୍ତୁ କିମ୍ବା ପରେ ପୁନର୍ବାର ଚେକ୍ କରନ୍ତୁ')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Best Options Summary */}
                  {(() => {
                    const bestOptions = getBestSellingOptions(location, cropName);
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {bestOptions.nearest && (
                          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
                            <div className="text-xs font-bold text-blue-700 mb-1">{t('Nearest', 'ନିକଟତମ')}</div>
                            <div className="font-bold text-gray-900">{bestOptions.nearest.name}</div>
                            <div className="text-sm text-gray-600 mt-1">{bestOptions.nearest.distance.toFixed(1)} km</div>
                          </div>
                        )}
                        {bestOptions.highestPrice && (
                          <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
                            <div className="text-xs font-bold text-green-700 mb-1">{t('Highest Price', 'ସର୍ବୋଚ୍ଚ ମୂଲ୍ୟ')}</div>
                            <div className="font-bold text-gray-900">{bestOptions.highestPrice.name}</div>
                            <div className="text-sm text-gray-600 mt-1">₹{bestOptions.highestPrice.priceRange.max}/qtl</div>
                          </div>
                        )}
                        {bestOptions.bestRating && (
                          <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-300">
                            <div className="text-xs font-bold text-purple-700 mb-1">{t('Best Rated', 'ସର୍ବୋତ୍ତମ ମୂଲ୍ୟାଙ୍କନ')}</div>
                            <div className="font-bold text-gray-900">{bestOptions.bestRating.name}</div>
                            <div className="text-sm text-gray-600 mt-1">⭐ {bestOptions.bestRating.rating}/5</div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* All Opportunities List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {t('All Nearby Opportunities', 'ସମସ୍ତ ନିକଟତମ ସୁଯୋଗ')} ({sellingOpportunities.length})
                    </h3>
                    {sellingOpportunities.map((opp) => (
                      <div key={opp.id} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-gray-200 hover:border-enam-green transition">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">{opp.name}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                opp.type === 'APMC Market' ? 'bg-orange-100 text-orange-700' :
                                opp.type === 'FPO' ? 'bg-blue-100 text-blue-700' :
                                opp.type === 'Processor' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {opp.type}
                              </span>
                              <div className="flex items-center gap-1 text-yellow-600">
                                {'⭐'.repeat(Math.floor(opp.rating))}
                                <span className="text-xs text-gray-600 ml-1">({opp.rating})</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <span className="flex items-center gap-1">
                                <MapPin size={14} />
                                {opp.distance.toFixed(1)} km
                              </span>
                              <span>📍 {opp.address}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{opp.description}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {opp.facilities.map((facility, idx) => (
                                <span key={idx} className="px-2 py-1 bg-white rounded text-xs text-gray-700 border border-gray-200">
                                  {facility}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm text-gray-600 mb-1">{t('Price Range', 'ମୂଲ୍ୟ ସୀମା')}</div>
                            <div className="text-xl font-bold text-green-600">
                              ₹{opp.priceRange.min.toLocaleString()} - ₹{opp.priceRange.max.toLocaleString()}/qtl
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{opp.paymentTerms}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-300">
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold">{t('Contact:', 'ଯୋଗାଯୋଗ:')}</span> {opp.contactInfo}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t('Accepts:', 'ଗ୍ରହଣ କରେ:')} {opp.cropsAccepted.join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FinancialPlanningPage;

