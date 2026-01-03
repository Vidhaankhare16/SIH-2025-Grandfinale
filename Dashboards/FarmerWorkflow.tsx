import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle, Sprout, Gavel, TrendingUp, Calendar, MapPin, Package, IndianRupee } from 'lucide-react';
import { getFarmingAdvisory } from '../services/geminiService';
import { AdvisoryPlan, SoilHealthCard } from '../types';
import AdvisoryPage from './AdvisoryPage';
import { createFarmerListing } from '../services/biddingService';
import { getFarmerData } from '../services/farmerService';
import { validateQuantity, validatePrice, validatePH, validateSoilParameter, validateDate, validateDistrict } from '../services/inputValidationService';

interface FarmerWorkflowProps {
  lang: string;
  location: string;
  userId?: string;
  onComplete?: () => void;
}

type WorkflowStep = 'advisory' | 'planting' | 'bidding';

const FarmerWorkflow: React.FC<FarmerWorkflowProps> = ({ lang, location, userId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('advisory');
  const [advisoryPlan, setAdvisoryPlan] = useState<AdvisoryPlan | null>(null);
  const [advisoryContext, setAdvisoryContext] = useState<{ district: string; soil: string; water: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSoilReport, setHasSoilReport] = useState<boolean | null>(null);
  const [showSoilCardForm, setShowSoilCardForm] = useState(false);
  const [district, setDistrict] = useState('Khordha');
  const [soil, setSoil] = useState('Sandy Loam');
  const [water, setWater] = useState('Rainfed');
  const [soilCard, setSoilCard] = useState<Partial<SoilHealthCard>>({
    landType: 'midland',
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
    organicCarbon: 0,
    electricalConductivity: 0,
    pH: 7.0,
    boron: 0,
    sulphur: 0,
  });
  const [plantingDate, setPlantingDate] = useState('');
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [minimumPrice, setMinimumPrice] = useState(0);
  const [quality, setQuality] = useState<'Organic' | 'Chemical Based'>('Organic');
  const [farmerName, setFarmerName] = useState('');

  const t = (en: string, or: string) => lang === 'en' ? en : or;

  // Get farmer name
  useEffect(() => {
    if (userId) {
      const farmerData = getFarmerData(userId);
      if (farmerData) {
        setFarmerName(farmerData.name);
      }
    }
  }, [userId]);

  // Extract district from location
  useEffect(() => {
    if (location) {
      const districts = ['Khordha', 'Cuttack', 'Puri', 'Ganjam', 'Sundargarh', 'Koraput', 'Sambalpur'];
      for (const dist of districts) {
        if (location.toLowerCase().includes(dist.toLowerCase())) {
          setDistrict(dist);
          break;
        }
      }
    }
  }, [location]);

  const generateAdvisory = async () => {
    setLoading(true);
    try {
      const contextData = {
        district,
        soil,
        water,
        soilCard: hasSoilReport ? soilCard : undefined,
        includeWeather: true,
        includeTimeline: true,
        includeSupplements: true,
      };

      const result = await getFarmingAdvisory(contextData);
      
      if (result && typeof result === 'object' && 'cropName' in result) {
        setAdvisoryPlan(result as AdvisoryPlan);
        setAdvisoryContext({ district, soil, water });
        setCurrentStep('planting');
      }
    } catch (error) {
      console.error('Error generating advisory:', error);
      alert(t('Failed to generate advisory. Please try again.', 'ସୁପାରିଶ ଉତ୍ପାଦନ କରିବାରେ ବିଫଳ | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |'));
    } finally {
      setLoading(false);
    }
  };

  const handlePlantCrop = () => {
    if (!plantingDate || !expectedHarvestDate) {
      alert(t('Please select planting and harvest dates', 'ଦୟାକରି ରୋପଣ ଏବଂ ଫସଲ ତାରିଖ ବାଛନ୍ତୁ'));
      return;
    }
    setCurrentStep('bidding');
  };

  const handlePlaceBid = () => {
    if (!quantity || !minimumPrice || !expectedHarvestDate) {
      alert(t('Please fill all required fields', 'ଦୟାକରି ସମସ୍ତ ଆବଶ୍ୟକ କ୍ଷେତ୍ର ପୂରଣ କରନ୍ତୁ'));
      return;
    }

    if (!advisoryPlan) {
      alert(t('Advisory plan not found', 'ସୁପାରିଶ ଯୋଜନା ମିଳିଲା ନାହିଁ'));
      return;
    }

    try {
      createFarmerListing({
        farmerId: userId || 'farmer_1',
        farmerName: farmerName || 'Farmer',
        cropName: advisoryPlan.cropName,
        quantity,
        minimumPrice,
        quality,
        location: location || district,
        expectedHarvestDate,
      });

      alert(t('Bid placed successfully! FPOs can now bid on your produce.', 'ବିଡ୍ ସଫଳତାର ସହିତ ରଖାଗଲା! FPOs ଏବେ ଆପଣଙ୍କର ଉତ୍ପାଦନରେ ବିଡ୍ କରିପାରିବେ |'));
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      alert(t('Failed to place bid. Please try again.', 'ବିଡ୍ ରଖିବାରେ ବିଫଳ | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |'));
    }
  };

  // Calculate expected harvest date based on advisory duration
  useEffect(() => {
    if (advisoryPlan && plantingDate) {
      const durationMatch = advisoryPlan.duration.match(/(\d+)/);
      if (durationMatch) {
        const days = parseInt(durationMatch[1]);
        const plantDate = new Date(plantingDate);
        plantDate.setDate(plantDate.getDate() + days);
        setExpectedHarvestDate(plantDate.toISOString().split('T')[0]);
      }
    }
  }, [advisoryPlan, plantingDate]);

  // Set default minimum price based on advisory MSP
  useEffect(() => {
    if (advisoryPlan?.marketOutlook?.msp) {
      setMinimumPrice(Math.floor(advisoryPlan.marketOutlook.msp * 0.9)); // 90% of MSP as minimum
    }
  }, [advisoryPlan]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${currentStep === 'advisory' ? 'text-enam-green' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'advisory' ? 'bg-enam-green text-white' : 'bg-gray-200'}`}>
                {currentStep !== 'advisory' ? <CheckCircle size={20} /> : <Sprout size={20} />}
              </div>
              <div>
                <div className="font-bold">{t('Step 1: Get Advisory', 'ପଦକ୍ଷେପ ୧: ସୁପାରିଶ ପାଆନ୍ତୁ')}</div>
                <div className="text-sm">{t('Crop recommendation', 'ଫସଲ ସୁପାରିଶ')}</div>
              </div>
            </div>
            <ArrowRight className="text-gray-300" size={24} />
            <div className={`flex items-center gap-3 ${currentStep === 'planting' ? 'text-enam-green' : currentStep === 'bidding' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'planting' ? 'bg-enam-green text-white' : currentStep === 'bidding' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                {currentStep === 'bidding' ? <CheckCircle size={20} /> : <Calendar size={20} />}
              </div>
              <div>
                <div className="font-bold">{t('Step 2: Plant Crop', 'ପଦକ୍ଷେପ ୨: ଫସଲ ରୋପଣ କରନ୍ତୁ')}</div>
                <div className="text-sm">{t('Set planting date', 'ରୋପଣ ତାରିଖ ସେଟ୍ କରନ୍ତୁ')}</div>
              </div>
            </div>
            <ArrowRight className="text-gray-300" size={24} />
            <div className={`flex items-center gap-3 ${currentStep === 'bidding' ? 'text-enam-green' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'bidding' ? 'bg-enam-green text-white' : 'bg-gray-200'}`}>
                <Gavel size={20} />
              </div>
              <div>
                <div className="font-bold">{t('Step 3: Place Bid', 'ପଦକ୍ଷେପ ୩: ବିଡ୍ ରଖନ୍ତୁ')}</div>
                <div className="text-sm">{t('List your produce', 'ଆପଣଙ୍କର ଉତ୍ପାଦନ ତାଲିକା କରନ୍ତୁ')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'advisory' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('Step 1: Get Your Crop Advisory', 'ପଦକ୍ଷେପ ୧: ଆପଣଙ୍କର ଫସଲ ସୁପାରିଶ ପାଆନ୍ତୁ')}</h2>
            
            {!advisoryPlan ? (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('District', 'ଜିଲ୍ଲା')}</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    >
                      {['Khordha', 'Cuttack', 'Puri', 'Ganjam', 'Sundargarh', 'Koraput', 'Sambalpur'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('Soil Type', 'ମାଟିର ପ୍ରକାର')}</label>
                    <select
                      value={soil}
                      onChange={(e) => setSoil(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    >
                      {['Sandy Loam', 'Clay Loam', 'Red Soil', 'Black Soil'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('Water Source', 'ଜଳ ସ୍ରୋତ')}</label>
                    <select
                      value={water}
                      onChange={(e) => setWater(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    >
                      {['Rainfed', 'Irrigated', 'Mixed'].map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('Do you have a Soil Health Card?', 'ଆପଣଙ୍କର ମାଟି ସ୍ୱାସ୍ଥ୍ୟ କାର୍ଡ ଅଛି କି?')}</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => { setHasSoilReport(true); setShowSoilCardForm(true); }}
                        className={`px-6 py-3 rounded-lg font-bold transition ${hasSoilReport === true ? 'bg-enam-green text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {t('Yes', 'ହଁ')}
                      </button>
                      <button
                        onClick={() => { setHasSoilReport(false); setShowSoilCardForm(false); }}
                        className={`px-6 py-3 rounded-lg font-bold transition ${hasSoilReport === false ? 'bg-enam-green text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {t('No', 'ନା')}
                      </button>
                    </div>
                  </div>
                  {showSoilCardForm && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                      <h3 className="font-bold text-gray-900">{t('Soil Health Card Details', 'ମାଟି ସ୍ୱାସ୍ଥ୍ୟ କାର୍ଡ ବିବରଣୀ')}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{t('Land Type', 'ଜମିର ପ୍ରକାର')}</label>
                          <select
                            value={soilCard.landType}
                            onChange={(e) => setSoilCard({ ...soilCard, landType: e.target.value as any })}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          >
                            <option value="upland">{t('Upland', 'ଉଚ୍ଚଭୂମି')}</option>
                            <option value="lowland">{t('Lowland', 'ନିମ୍ନଭୂମି')}</option>
                            <option value="midland">{t('Midland', 'ମଧ୍ୟଭୂମି')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">N (kg/ha)</label>
                          <input
                            type="number"
                            min="0"
                            max="800"
                            step="0.1"
                            value={soilCard.nitrogen || 0}
                            onChange={(e) => {
                              const validation = validateSoilParameter('nitrogen', parseFloat(e.target.value) || 0, 0, 800);
                              if (validation.valid) {
                                setSoilCard({ ...soilCard, nitrogen: validation.sanitized });
                              }
                            }}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            title="Available Nitrogen (N) in kg/ha. High: > 480 kg/ha"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">P (kg/ha)</label>
                          <input
                            type="number"
                            min="0"
                            max="300"
                            step="0.1"
                            value={soilCard.phosphorus || 0}
                            onChange={(e) => {
                              const validation = validateSoilParameter('phosphorus', parseFloat(e.target.value) || 0, 0, 300);
                              if (validation.valid) {
                                setSoilCard({ ...soilCard, phosphorus: validation.sanitized });
                              }
                            }}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            title="Available Phosphorus (P) in kg/ha. High: > 22 kg/ha"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">K (kg/ha)</label>
                          <input
                            type="number"
                            min="0"
                            max="600"
                            step="0.1"
                            value={soilCard.potassium || 0}
                            onChange={(e) => {
                              const validation = validateSoilParameter('potassium', parseFloat(e.target.value) || 0, 0, 600);
                              if (validation.valid) {
                                setSoilCard({ ...soilCard, potassium: validation.sanitized });
                              }
                            }}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            title="Available Potassium (K) in kg/ha. High: > 280 kg/ha"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">OC (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="8"
                            step="0.01"
                            value={soilCard.organicCarbon || 0}
                            onChange={(e) => {
                              const validation = validateSoilParameter('organicCarbon', parseFloat(e.target.value) || 0, 0, 8);
                              if (validation.valid) {
                                setSoilCard({ ...soilCard, organicCarbon: validation.sanitized });
                              }
                            }}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            title="Organic Carbon (OC) in %. Typical range: 0.75-4%, rarely > 8%"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">EC (dS/m)</label>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={soilCard.electricalConductivity || 0}
                            onChange={(e) => {
                              const validation = validateSoilParameter('EC', parseFloat(e.target.value) || 0, 0, 5);
                              if (validation.valid) {
                                setSoilCard({ ...soilCard, electricalConductivity: validation.sanitized });
                              }
                            }}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            title="Electrical Conductivity (EC) in dS/m. > 4.0 dS/m indicates Saline soil (injurious to crops)"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">pH</label>
                          <input
                            type="number"
                            min="0"
                            max="14"
                            step="0.1"
                            value={soilCard.pH || 7.0}
                            onChange={(e) => {
                              const validation = validatePH(parseFloat(e.target.value) || 7.0);
                              if (validation.valid) {
                                setSoilCard({ ...soilCard, pH: validation.sanitized });
                              }
                            }}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{t('Boron (ppm)', 'ବୋରନ୍ (ppm)')}</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={soilCard.boron || 0}
                            onChange={(e) => {
                              const validation = validateSoilParameter('boron', parseFloat(e.target.value) || 0, 0, 10);
                              if (validation.valid) {
                                setSoilCard({ ...soilCard, boron: validation.sanitized });
                              }
                            }}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            title="Boron (B) in ppm. High: > 3-5 ppm (may be toxic to sensitive crops). Narrow range between deficiency and toxicity."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{t('Sulphur (ppm)', 'ସଲଫର୍ (ppm)')}</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={soilCard.sulphur || 0}
                            onChange={(e) => {
                              const validation = validateSoilParameter('sulphur', parseFloat(e.target.value) || 0, 0, 100);
                              if (validation.valid) {
                                setSoilCard({ ...soilCard, sulphur: validation.sanitized });
                              }
                            }}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            title="Sulphur (S) in ppm. High rating: > 15-20 ppm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={generateAdvisory}
                  disabled={loading || hasSoilReport === null}
                  className="w-full bg-enam-green hover:bg-enam-dark text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {t('Generating Advisory...', 'ସୁପାରିଶ ଉତ୍ପାଦନ କରୁଛି...')}
                    </>
                  ) : (
                    <>
                      <Sprout size={20} />
                      {t('Get Advisory', 'ସୁପାରିଶ ପାଆନ୍ତୁ')}
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <AdvisoryPage
                  lang={lang}
                  location={location}
                  plan={advisoryPlan}
                  context={advisoryContext}
                  onBack={() => setAdvisoryPlan(null)}
                />
                <button
                  onClick={() => setCurrentStep('planting')}
                  className="w-full bg-enam-green hover:bg-enam-dark text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {t('Next: Plant Crop', 'ପରବର୍ତ୍ତୀ: ଫସଲ ରୋପଣ କରନ୍ତୁ')}
                  <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'planting' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('Step 2: Plant Your Crop', 'ପଦକ୍ଷେପ ୨: ଆପଣଙ୍କର ଫସଲ ରୋପଣ କରନ୍ତୁ')}</h2>
            {advisoryPlan && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="font-bold text-green-900 mb-2">{t('Recommended Crop:', 'ସୁପାରିଶ କରାଯାଇଥିବା ଫସଲ:')} {advisoryPlan.cropName}</div>
                <div className="text-sm text-green-700">{t('Duration:', 'ଅବଧି:')} {advisoryPlan.duration}</div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('Planting Date', 'ରୋପଣ ତାରିଖ')}</label>
                <input
                  type="date"
                  value={plantingDate}
                  onChange={(e) => {
                    const validation = validateDate(e.target.value, new Date(), new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
                    if (validation.valid) {
                      setPlantingDate(validation.sanitized);
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('Expected Harvest Date', 'ଆଶାକୃତ ଫସଲ ତାରିଖ')}</label>
                <input
                  type="date"
                  value={expectedHarvestDate}
                  onChange={(e) => {
                    const minDate = plantingDate ? new Date(plantingDate) : new Date();
                    const maxDate = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000); // 2 years
                    const validation = validateDate(e.target.value, minDate, maxDate);
                    if (validation.valid) {
                      setExpectedHarvestDate(validation.sanitized);
                    }
                  }}
                  min={plantingDate || new Date().toISOString().split('T')[0]}
                  max={new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep('advisory')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  {t('Back', 'ପଛକୁ')}
                </button>
                <button
                  onClick={handlePlantCrop}
                  className="flex-1 bg-enam-green hover:bg-enam-dark text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {t('Next: Place Bid', 'ପରବର୍ତ୍ତୀ: ବିଡ୍ ରଖନ୍ତୁ')}
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'bidding' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('Step 3: Place Your Bid', 'ପଦକ୍ଷେପ ୩: ଆପଣଙ୍କର ବିଡ୍ ରଖନ୍ତୁ')}</h2>
            {advisoryPlan && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="font-bold text-blue-900 mb-2">{t('Crop:', 'ଫସଲ:')} {advisoryPlan.cropName}</div>
                <div className="text-sm text-blue-700">
                  {t('MSP:', 'MSP:')} ₹{advisoryPlan.marketOutlook.msp}/qtl | 
                  {t('Market Price:', 'ବଜାର ମୂଲ୍ୟ:')} ₹{advisoryPlan.marketOutlook.marketPrice}/qtl
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('Expected Quantity (quintals)', 'ଆଶାକୃତ ପରିମାଣ (କ୍ୱିଣ୍ଟାଲ)')}</label>
                  <input
                    type="number"
                    min="0.1"
                    max="10000"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => {
                      const validation = validateQuantity(e.target.value);
                      if (validation.valid) {
                        setQuantity(validation.sanitized);
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    placeholder={t('Enter expected yield (0.1-10000 quintals)', 'ଆଶାକୃତ ଉତ୍ପାଦନ ପ୍ରବେଶ କରନ୍ତୁ (0.1-10000 କ୍ୱିଣ୍ଟାଲ)')}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('Minimum Price per Quintal (₹)', 'ପ୍ରତି କ୍ୱିଣ୍ଟାଲ ସର୍ବନିମ୍ନ ମୂଲ୍ୟ (₹)')}</label>
                  <input
                    type="number"
                    min="1000"
                    max="100000"
                    step="10"
                    value={minimumPrice}
                    onChange={(e) => {
                      const validation = validatePrice(e.target.value);
                      if (validation.valid) {
                        setMinimumPrice(validation.sanitized);
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    placeholder={t('Minimum price per quintal (₹1000-₹100000)', 'ପ୍ରତି କ୍ୱିଣ୍ଟାଲର ନିମ୍ନତମ ମୂଲ୍ୟ (₹1000-₹100000)')}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('Quality', 'ଗୁଣବତ୍ତା')}</label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as 'Organic' | 'Chemical Based')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                >
                  <option value="Organic">{t('Organic', 'ଜୈବିକ')}</option>
                  <option value="Chemical Based">{t('Chemical Based', 'ରାସାୟନିକ ଆଧାରିତ')}</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep('planting')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  {t('Back', 'ପଛକୁ')}
                </button>
                <button
                  onClick={handlePlaceBid}
                  className="flex-1 bg-enam-green hover:bg-enam-dark text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Gavel size={20} />
                  {t('Place Bid', 'ବିଡ୍ ରଖନ୍ତୁ')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerWorkflow;

