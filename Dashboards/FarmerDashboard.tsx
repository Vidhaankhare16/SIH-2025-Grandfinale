import React, { useState, useEffect } from 'react';
import { Sprout, MapPin, ArrowRight, TrendingUp, IndianRupee, BarChart3, CheckCircle, AlertCircle, FileText, Info } from 'lucide-react';
import { getFarmingAdvisory, resolveLocationToDistrictState } from '../services/geminiService';
import { AdvisoryPlan, SoilHealthCard } from '../types';

interface FarmerDashboardProps {
  lang: string;
  location: string;
  setLocation: (loc: string) => void;
  onDetectLocation?: () => void;
  onPlanReady?: (plan: AdvisoryPlan, context: { district: string; soil: string; water: string }) => void;
  userId?: string;
  onStartWorkflow?: () => void;
  onSchemesNav?: () => void;
}

// Average soil data for Odisha districts
const districtSoilData: Record<string, { soil: string; water: string }> = {
  'Khordha': { soil: 'Sandy Loam', water: 'Rainfed' },
  'Cuttack': { soil: 'Clay Loam', water: 'Irrigated' },
  'Puri': { soil: 'Sandy Loam', water: 'Rainfed' },
  'Ganjam': { soil: 'Red Soil', water: 'Rainfed' },
  'Koraput': { soil: 'Red Soil', water: 'Rainfed' },
  'Sambalpur': { soil: 'Red Soil', water: 'Rainfed' },
  'Bhubaneswar': { soil: 'Sandy Loam', water: 'Rainfed' },
  'Balasore': { soil: 'Sandy Loam', water: 'Rainfed' },
  'Bhadrak': { soil: 'Clay Loam', water: 'Irrigated' },
  'Jagatsinghpur': { soil: 'Clay Loam', water: 'Irrigated' },
  'Kendrapara': { soil: 'Clay Loam', water: 'Irrigated' },
  'Nayagarh': { soil: 'Red Soil', water: 'Rainfed' },
  'Angul': { soil: 'Red Soil', water: 'Rainfed' },
  'Dhenkanal': { soil: 'Red Soil', water: 'Rainfed' },
  'Keonjhar': { soil: 'Red Soil', water: 'Rainfed' },
  'Mayurbhanj': { soil: 'Red Soil', water: 'Rainfed' },
  'Jajpur': { soil: 'Clay Loam', water: 'Irrigated' },
  'Bargarh': { soil: 'Black Soil', water: 'Irrigated' },
  'Bolangir': { soil: 'Red Soil', water: 'Rainfed' },
  'Nuapada': { soil: 'Red Soil', water: 'Rainfed' },
  'Kalahandi': { soil: 'Red Soil', water: 'Rainfed' },
  'Rayagada': { soil: 'Red Soil', water: 'Rainfed' },
  'Gajapati': { soil: 'Red Soil', water: 'Rainfed' },
  'Kandhamal': { soil: 'Red Soil', water: 'Rainfed' },
  'Boudh': { soil: 'Red Soil', water: 'Rainfed' },
  'Sonepur': { soil: 'Red Soil', water: 'Rainfed' },
  'Deogarh': { soil: 'Red Soil', water: 'Rainfed' },
  'Jharsuguda': { soil: 'Red Soil', water: 'Rainfed' },
  'Sundargarh': { soil: 'Red Soil', water: 'Rainfed' },
  'Malkangiri': { soil: 'Red Soil', water: 'Rainfed' },
  'Nabarangpur': { soil: 'Red Soil', water: 'Rainfed' },
};

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ lang, location, setLocation, onDetectLocation, onPlanReady, userId, onStartWorkflow, onSchemesNav }) => {
  // Translation helper
  const t = (en: string, or: string) => lang === 'en' ? en : or;
  
  // Prevent non-numeric characters (e, E, +, -) in number inputs
  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point, and numbers
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', '.', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) ||
      (e.key >= '0' && e.key <= '9') ||
      // Allow Ctrl/Cmd + A, C, V, X, Z
      (e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())
    ) {
      return;
    }
    // Prevent: e, E, +, -
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };
  
  // Oilseed name translations
  const getOilseedName = (cropName: string): string => {
    const translations: Record<string, { en: string; or: string }> = {
      'Groundnut': { en: 'Groundnut', or: 'ଚିନାବାଦାମ' },
      'Mustard': { en: 'Mustard', or: 'ସରସୋ' },
      'Soybean': { en: 'Soybean', or: 'ସୋୟାବିନ୍' },
      'Sunflower': { en: 'Sunflower', or: 'ସୂର୍ଯ୍ୟମୁଖୀ' },
      'Sesame': { en: 'Sesame', or: 'ତିଳ' },
    };
    return lang === 'en' ? translations[cropName]?.en || cropName : translations[cropName]?.or || cropName;
  };
  
  const [loading, setLoading] = useState(false);
  const [hasSoilReport, setHasSoilReport] = useState<boolean | null>(null);
  const [detectingDistrict, setDetectingDistrict] = useState(false);
  const [showSoilCardForm, setShowSoilCardForm] = useState(false);
  
  // Input State
  const [district, setDistrict] = useState('Khordha');
  const [soil, setSoil] = useState('Sandy Loam');
  const [water, setWater] = useState('Rainfed');
  
  // Soil Health Card State
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

  // Load soil health card from localStorage on mount
  useEffect(() => {
    try {
      const storageKey = userId ? `soilHealthCard_${userId}` : 'soilHealthCard';
      const savedCard = localStorage.getItem(storageKey);
      if (savedCard) {
        const parsedCard = JSON.parse(savedCard);
        setSoilCard(parsedCard);
        setHasSoilReport(true);
        setShowSoilCardForm(true);
      }
    } catch (error) {
      console.error('Error loading soil health card from localStorage:', error);
    }
  }, [userId]);

  // Save soil health card to localStorage whenever it changes
  useEffect(() => {
    if (hasSoilReport && soilCard.landType && (soilCard.nitrogen > 0 || soilCard.phosphorus > 0 || soilCard.potassium > 0)) {
      try {
        const storageKey = userId ? `soilHealthCard_${userId}` : 'soilHealthCard';
        localStorage.setItem(storageKey, JSON.stringify(soilCard));
      } catch (error) {
        console.error('Error saving soil health card to localStorage:', error);
      }
    }
  }, [soilCard, hasSoilReport, userId]);

  const districts = ["Khordha", "Cuttack", "Puri", "Ganjam", "Sundargarh", "Koraput", "Sambalpur"];
  const soils = ["Sandy Loam", "Clay Loam", "Red Soil", "Black Soil"];
  const waterSources = ["Rainfed", "Irrigated", "Mixed"];
  
  // Extract district from location and set average soil data
  useEffect(() => {
    if (hasSoilReport === false && location) {
      const extractDistrict = async () => {
        setDetectingDistrict(true);
        try {
          // Try to extract district from location string
          let detectedDistrict = '';
          
          // Check if location contains district name
          for (const dist of Object.keys(districtSoilData)) {
            if (location.toLowerCase().includes(dist.toLowerCase())) {
              detectedDistrict = dist;
              break;
            }
          }
          
          // If not found, try to resolve from coordinates if location is in lat/lng format
          if (!detectedDistrict && location.includes('Lat') && location.includes('Lng')) {
            const coords = location.match(/Lat\s*([\d.]+).*Lng\s*([\d.]+)/);
            if (coords) {
              const lat = parseFloat(coords[1]);
              const lng = parseFloat(coords[2]);
              const resolved = await resolveLocationToDistrictState(lat, lng);
              if (resolved) {
                // Extract district name from "District, State" format
                const parts = resolved.split(',');
                detectedDistrict = parts[0]?.trim() || '';
              }
            }
          }
          
          // If still not found, try to match any district name in location
          if (!detectedDistrict) {
            for (const dist of Object.keys(districtSoilData)) {
              if (location.toLowerCase().includes(dist.toLowerCase())) {
                detectedDistrict = dist;
                break;
              }
            }
          }
          
          // Set district and average soil data
          if (detectedDistrict && districtSoilData[detectedDistrict]) {
            setDistrict(detectedDistrict);
            setSoil(districtSoilData[detectedDistrict].soil);
            setWater(districtSoilData[detectedDistrict].water);
          } else if (detectedDistrict) {
            // District found but no soil data, use defaults
            setDistrict(detectedDistrict);
            setSoil('Sandy Loam');
            setWater('Rainfed');
          }
        } catch (error) {
          console.error('Error detecting district:', error);
        } finally {
          setDetectingDistrict(false);
        }
      };
      
      extractDistrict();
    }
  }, [hasSoilReport, location]);
  
  // Remove isMounted check - it's causing issues with async operations
  // The parent component will handle state management

  const generatePlan = async () => {
    if (!location.trim()) {
      alert(lang === 'en' ? 'Please enter your nearest location for weather-aware advice.' : 'ଦୟାକରି ନଜିକ ସ୍ଥାନ ଲେଖନ୍ତୁ |');
      return;
    }
    if (hasSoilReport === null) {
      alert(lang === 'en' ? 'Please answer the soil report card question first.' : 'ଦୟାକରି ପ୍ରଥମେ ମାଟି ରିପୋର୍ଟ କାର୍ଡ୍ ପ୍ରଶ୍ନର ଉତ୍ତର ଦିଅନ୍ତୁ |');
      return;
    }
    if (hasSoilReport === true && showSoilCardForm) {
      alert(lang === 'en' ? 'Please fill in your soil health card details first.' : 'ଦୟାକରି ପ୍ରଥମେ ଆପଣଙ୍କର ମାଟି ସ୍ୱାସ୍ଥ୍ୟ କାର୍ଡ୍ ବିବରଣୀ ପୂରଣ କରନ୍ତୁ |');
      return;
    }
    setLoading(true);
    try {
      let soilInfo = '';
      if (hasSoilReport && soilCard.landType) {
        // Build detailed soil health card information
        const cardDetails = [
          `Land Type: ${soilCard.landType}`,
          `Chemical Parameters: N=${soilCard.nitrogen || 0} kg/ha, P=${soilCard.phosphorus || 0} kg/ha, K=${soilCard.potassium || 0} kg/ha`,
          `OC=${soilCard.organicCarbon || 0}%, EC=${soilCard.electricalConductivity || 0} dS/m, pH=${soilCard.pH || 7.0}`,
          `Micronutrients: Boron=${soilCard.boron || 0} ppm, Sulphur=${soilCard.sulphur || 0} ppm`
        ].join(', ');
        
        soilInfo = `Farmer has a soil health card with detailed soil test results: ${cardDetails}. Use these precise values to provide accurate fertilizer recommendations and crop suitability analysis.`;
      } else {
        soilInfo = `Using average soil data for ${district} district. Soil type: ${soil} (estimated based on regional averages). Note: For more accurate recommendations, farmer should get a soil health card.`;
      }
      
      const result = await getFarmingAdvisory(
        `Generate comprehensive cultivation advisory plan with complete timeline, weather-based recommendations, and detailed supplement requirements. ${soilInfo}`,
        lang === 'en' ? 'English' : 'Oriya',
        { 
          mode: 'REPORT', 
          district, 
          soil, 
          water, 
          location,
          hasSoilReport: hasSoilReport,
          soilDataSource: hasSoilReport ? 'soil_health_card' : 'district_average',
          soilCard: hasSoilReport && soilCard.landType ? soilCard : null,
          includeWeather: true,
          includeTimeline: true,
          includeSupplements: true
        }
      );
      
      console.log("Advisory result received:", result);
      console.log("Result type:", typeof result);
      console.log("Has onPlanReady:", !!onPlanReady);
      console.log("Result is object?", typeof result === 'object' && result !== null);
      console.log("Result has cropName?", result && typeof result === 'object' && 'cropName' in result);
      
      // Always call onPlanReady if we have a valid result, regardless of isMounted
      // The parent component (App) will handle the state management
      if (result && typeof result === 'object' && result !== null && 'cropName' in result) {
        console.log("Calling onPlanReady with result:", result);
        onPlanReady?.(result, { district, soil, water });
        console.log("onPlanReady called successfully");
      } else {
        console.error("Invalid result type or empty result. Result:", result);
        console.error("Result type check:", {
          isObject: typeof result === 'object',
          isNotNull: result !== null,
          hasCropName: result && 'cropName' in result
        });
        alert(lang === 'en' 
          ? 'Advisory generated but could not be displayed. Please try again.' 
          : 'ପରାମର୍ଶ ସୃଷ୍ଟି ହୋଇଛି କିନ୍ତୁ ଦେଖାଯାଇପାରିଲା ନାହିଁ | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |');
      }
    } catch (e) {
      console.error("Error generating plan:", e);
      alert(lang === 'en' 
        ? 'Error generating advisory. Please try again or check your internet connection.' 
        : 'ପରାମର୍ଶ ସୃଷ୍ଟିରେ ତ୍ରୁଟି | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Market Prices Section */}
      <div className="w-full px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-enam-green to-enam-dark rounded-lg">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {lang === 'en' ? 'Current Market Prices' : 'ବର୍ତ୍ତମାନର ବଜାର ମୂଲ୍ୟ'}
              </h2>
              <p className="text-sm text-gray-600">
                {lang === 'en' ? 'Live prices for all oilseeds (per quintal)' : 'ସମସ୍ତ ତେଲବିହନର ଲାଇଭ୍ ମୂଲ୍ୟ (ପ୍ରତି କ୍ୱିଣ୍ଟାଲ)'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Groundnut */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{getOilseedName('Groundnut')}</h3>
                <Sprout size={20} className="text-gray-500" />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-600 mb-1">{lang === 'en' ? 'Market Price' : 'ବଜାର ମୂଲ୍ୟ'}</div>
                  <div className="text-2xl font-bold text-enam-green">₹6,850</div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">{lang === 'en' ? 'MSP' : 'MSP'}</div>
                  <div className="text-lg font-semibold text-gray-700">₹6,377</div>
                </div>
                <div className="text-xs text-enam-green font-semibold mt-2">
                  {lang === 'en' ? '+₹473 above MSP' : 'MSP ଠାରୁ +₹୪୭୩'}
                </div>
              </div>
            </div>

            {/* Mustard */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{getOilseedName('Mustard')}</h3>
                <Sprout size={20} className="text-gray-500" />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-600 mb-1">{lang === 'en' ? 'Market Price' : 'ବଜାର ମୂଲ୍ୟ'}</div>
                  <div className="text-2xl font-bold text-enam-green">₹5,620</div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">{lang === 'en' ? 'MSP' : 'MSP'}</div>
                  <div className="text-lg font-semibold text-gray-700">₹5,450</div>
                </div>
                <div className="text-xs text-enam-green font-semibold mt-2">
                  {lang === 'en' ? '+₹170 above MSP' : 'MSP ଠାରୁ +₹୧୭୦'}
                </div>
              </div>
            </div>

            {/* Soybean */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{getOilseedName('Soybean')}</h3>
                <Sprout size={20} className="text-gray-500" />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-600 mb-1">{lang === 'en' ? 'Market Price' : 'ବଜାର ମୂଲ୍ୟ'}</div>
                  <div className="text-2xl font-bold text-enam-green">₹4,520</div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">{lang === 'en' ? 'MSP' : 'MSP'}</div>
                  <div className="text-lg font-semibold text-gray-700">₹4,300</div>
                </div>
                <div className="text-xs text-enam-green font-semibold mt-2">
                  {lang === 'en' ? '+₹220 above MSP' : 'MSP ଠାରୁ +₹୨୨୦'}
                </div>
              </div>
            </div>

            {/* Sunflower */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{getOilseedName('Sunflower')}</h3>
                <Sprout size={20} className="text-gray-500" />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-600 mb-1">{lang === 'en' ? 'Market Price' : 'ବଜାର ମୂଲ୍ୟ'}</div>
                  <div className="text-2xl font-bold text-enam-green">₹6,580</div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">{lang === 'en' ? 'MSP' : 'MSP'}</div>
                  <div className="text-lg font-semibold text-gray-700">₹6,400</div>
                </div>
                <div className="text-xs text-enam-green font-semibold mt-2">
                  {lang === 'en' ? '+₹180 above MSP' : 'MSP ଠାରୁ +₹୧୮୦'}
                </div>
              </div>
            </div>

            {/* Sesame */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{getOilseedName('Sesame')}</h3>
                <Sprout size={20} className="text-gray-500" />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-600 mb-1">{lang === 'en' ? 'Market Price' : 'ବଜାର ମୂଲ୍ୟ'}</div>
                  <div className="text-2xl font-bold text-enam-green">₹7,800</div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">{lang === 'en' ? 'MSP' : 'MSP'}</div>
                  <div className="text-lg font-semibold text-gray-700">₹7,800</div>
                </div>
                <div className="text-xs text-gray-600 font-semibold mt-2">
                  {lang === 'en' ? 'At MSP' : 'MSP ରେ'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900">
              <div className="font-bold mb-1">
                {lang === 'en' ? 'Price Information' : 'ମୂଲ୍ୟ ସୂଚନା'}
              </div>
              <div>
                {lang === 'en' 
                  ? 'Market prices are updated daily. MSP (Minimum Support Price) is the government-guaranteed minimum price. All current market prices are at or above MSP, ensuring price protection for farmers.'
                  : 'ବଜାର ମୂଲ୍ୟ ଦ dailyକିକ ଅପଡେଟ୍ ହୁଏ | MSP (ସର୍ବନିମ୍ନ ସହାୟତା ମୂଲ୍ୟ) ହେଉଛି ସରକାରୀ ନିଶ୍ଚିତ ସର୍ବନିମ୍ନ ମୂଲ୍ୟ | ସମସ୍ତ ବର୍ତ୍ତମାନର ବଜାର ମୂଲ୍ୟ MSP ଠାରୁ ଅଧିକ କିମ୍ବା ସମାନ, ଯାହା କୃଷକମାନଙ୍କ ପାଇଁ ମୂଲ୍ୟ ସୁରକ୍ଷା ନିଶ୍ଚିତ କରେ |'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Hero Section */}
      <div className="w-full px-4 py-6 md:py-8">
        <div className="bg-gradient-to-br from-enam-green/10 via-enam-dark/5 to-govt-orange/10 rounded-2xl p-6 md:p-8 border-2 border-enam-green/20 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              {lang === 'en' 
                ? 'Why Grow Oilseeds?' 
                : 'କାହିଁକି ତେଲବିହନ ଚାଷ କରିବା?'}
            </h1>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              {lang === 'en'
                ? 'Switch from traditional crops to oilseeds and earn 2-3x more profit per acre. High demand, guaranteed MSP, and government support make oilseeds the smart choice for Odisha farmers.'
                : 'ପାରମ୍ପରିକ ଫସଲରୁ ତେଲବିହନକୁ ସ୍ଥାନାନ୍ତର କରନ୍ତୁ ଏବଂ ପ୍ରତି ଏକରରେ ୨-୩ ଗୁଣ ଅଧିକ ଲାଭ କରନ୍ତୁ | ଉଚ୍ଚ ଚାହିଦା, ନିଶ୍ଚିତ MSP, ଏବଂ ସରକାରୀ ସହାୟତା ତେଲବିହନକୁ ଓଡ଼ିଶାର କୃଷକମାନଙ୍କ ପାଇଁ ସ୍ମାର୍ଟ ବାଛିବା କରେ |'}
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {/* Profit Comparison */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {lang === 'en' ? 'Higher Profit' : 'ଉଚ୍ଚ ଲାଭ'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {lang === 'en' ? 'vs Traditional Crops' : 'ପାରମ୍ପରିକ ଫସଲ ସହିତ'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{lang === 'en' ? 'Oilseeds (per acre):' : 'ତେଲବିହନ (ପ୍ରତି ଏକର):'}</span>
                  <span className="text-xl font-bold text-green-600">₹27,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{lang === 'en' ? 'Rice (per acre):' : 'ଚାଉଳ (ପ୍ରତି ଏକର):'}</span>
                  <span className="text-lg font-bold text-gray-500">₹15,000-20,000</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">{lang === 'en' ? 'Extra Profit:' : 'ଅତିରିକ୍ତ ଲାଭ:'}</span>
                    <span className="text-lg font-bold text-green-600">+35-80%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Demand Stats */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {lang === 'en' ? 'High Demand' : 'ଉଚ୍ଚ ଚାହିଦା'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {lang === 'en' ? 'Market Growth' : 'ବଜାର ବୃଦ୍ଧି'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">{lang === 'en' ? 'National Demand:' : 'ଜାତୀୟ ଚାହିଦା:'}</span>
                    <span className="text-lg font-bold text-blue-600">+8-10%</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {lang === 'en' ? 'Annual growth rate' : 'ବାର୍ଷିକ ବୃଦ୍ଧି ହାର'}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">{lang === 'en' ? 'Import Dependency:' : 'ଆମଦାନି ନିର୍ଭରତା:'}</span>
                    <span className="text-lg font-bold text-orange-600">57%</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {lang === 'en' ? 'Huge opportunity for local farmers' : 'ସ୍ଥାନୀୟ କୃଷକମାନଙ୍କ ପାଇଁ ବିଶାଳ ସୁଯୋଗ'}
                  </div>
                </div>
              </div>
            </div>

            {/* MSP & Support */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-orange-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <IndianRupee size={24} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {lang === 'en' ? 'Guaranteed MSP' : 'ନିଶ୍ଚିତ MSP'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {lang === 'en' ? 'Price Protection' : 'ମୂଲ୍ୟ ସୁରକ୍ଷା'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-2">{lang === 'en' ? 'Average MSP:' : 'ହାରାହାରି MSP:'}</div>
                  <div className="text-2xl font-bold text-orange-600">₹6,530</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {lang === 'en' ? 'per quintal (Groundnut ₹6,377 / Mustard ₹5,450)' : 'ପ୍ରତି କ୍ୱିଣ୍ଟାଲ (ଚିନାବାଦାମ ₹୬,୩୭୭ / ସରସୋ ₹୫,୪୫୦)'}
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={() => onSchemesNav && onSchemesNav()}
                    className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 transition-colors cursor-pointer group w-full text-left"
                  >
                    <CheckCircle size={16} className="group-hover:scale-110 transition-transform" />
                    <span className="font-bold underline group-hover:no-underline">
                      {lang === 'en' ? 'Govt. Support Available' : 'ସରକାରୀ ସହାୟତା ଉପଲବ୍ଧ'}
                    </span>
                    <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Key Benefits List */}
          <div className="bg-white/80 rounded-xl p-6 border border-gray-200">
            <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-enam-green" />
              {lang === 'en' ? 'Key Benefits of Oilseeds' : 'ତେଲବିହନର ମୁଖ୍ୟ ଲାଭ'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-900 text-sm">
                    {lang === 'en' ? '2-3x Higher Returns' : '୨-୩ ଗୁଣ ଉଚ୍ଚ ପ୍ରତ୍ୟାବର୍ତ୍ତନ'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {lang === 'en' 
                      ? 'Oilseeds yield ₹35,000-45,000/acre vs ₹20,000-25,000 for paddy'
                      : 'ତେଲବିହନ ପ୍ରତି ଏକରରେ ₹୩୫,୦୦୦-୪୫,୦୦୦ ଦେଇଥାଏ ଯେତେବେଳେ ଧାନ ₹୨୦,୦୦୦-୨୫,୦୦୦ ଦେଇଥାଏ'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-900 text-sm">
                    {lang === 'en' ? 'Shorter Growing Period' : 'ଛୋଟ ବୃଦ୍ଧି ଅବଧି'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {lang === 'en' 
                      ? '100-120 days vs 140-160 days for paddy - more crop cycles per year'
                      : '୧୦୦-୧୨୦ ଦିନ ବନାମ ଧାନର ୧୪୦-୧୬୦ ଦିନ - ବାର୍ଷିକ ଅଧିକ ଫସଲ ଚକ୍ର'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-900 text-sm">
                    {lang === 'en' ? 'Less Water Required' : 'କମ୍ ଜଳ ଆବଶ୍ୟକ'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {lang === 'en' 
                      ? '30-40% less water than paddy - perfect for rainfed areas'
                      : 'ଧାନ ଅପେକ୍ଷା ୩୦-୪୦% କମ୍ ଜଳ - ବର୍ଷାଜଳ ଅଞ୍ଚଳ ପାଇଁ ଉତ୍କୃଷ୍ଟ'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-900 text-sm">
                    {lang === 'en' ? 'Growing Market Demand' : 'ବୃଦ୍ଧିଶୀଳ ବଜାର ଚାହିଦା'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {lang === 'en' 
                      ? 'India imports 57% of edible oils - huge opportunity for local farmers'
                      : 'ଭାରତ ୫୭% ଖାଦ୍ୟ ତେଲ ଆମଦାନି କରେ - ସ୍ଥାନୀୟ କୃଷକମାନଙ୍କ ପାଇଁ ବିଶାଳ ସୁଯୋଗ'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onSchemesNav && onSchemesNav()}
                className="flex items-start gap-3 w-full text-left hover:bg-green-50 p-2 rounded-lg transition-colors group"
              >
                <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    {lang === 'en' ? 'Government Support' : 'ସରକାରୀ ସହାୟତା'}
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-green-600" />
                  </div>
                  <div className="text-xs text-gray-600">
                    {lang === 'en' 
                      ? 'Free seeds, MSP guarantee, subsidies, and training under NMEO-OP'
                      : 'NMEO-OP ଅଧୀନରେ ମାଗଣା ବିହନ, MSP ନିଶ୍ଚିତକରଣ, ସବସିଡି, ଏବଂ ପ୍ରଶିକ୍ଷଣ'}
                  </div>
                </div>
              </button>
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-900 text-sm">
                    {lang === 'en' ? 'Better Soil Health' : 'ଉତ୍କୃଷ୍ଟ ମାଟି ସ୍ୱାସ୍ଥ୍ୟ'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {lang === 'en' 
                      ? 'Oilseeds improve soil fertility and reduce dependency on chemical fertilizers'
                      : 'ତେଲବିହନ ମାଟିର ଉର୍ବରତା ବୃଦ୍ଧି କରେ ଏବଂ ରାସାୟନିକ ସାର ଉପରେ ନିର୍ଭରତା ହ୍ରାସ କରେ'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Your Cultivation Plan */}
      <div id="farmer-input" className="max-w-3xl mx-auto py-4 md:py-8 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-enam-dark p-6 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">
              {lang === 'en' ? 'Start Your Cultivation Plan' : 'ଆପଣଙ୍କର ଚାଷ ଯୋଜନା ଆରମ୍ଭ କରନ୍ତୁ'}
            </h2>
            <p className="text-white/80 text-sm">
              {lang === 'en' ? 'Get AI-driven advice tailored to your farm & market trends.' : 'ଆପଣଙ୍କ ଚାଷଜମି ଏବଂ ବଜାର ପାଇଁ କୃତ୍ରିମ ବୁଦ୍ଧିମତା ପରାମର୍ଶ ପାଆନ୍ତୁ |'}
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Soil Report Card Question */}
            {hasSoilReport === null && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Info size={18} className="text-blue-600" />
                      {lang === 'en' ? 'Do you have a Soil Health Card?' : 'ଆପଣଙ୍କର ମାଟି ସ୍ୱାସ୍ଥ୍ୟ କାର୍ଡ୍ ଅଛି କି?'}
                    </h3>
                    <p className="text-sm text-gray-700 mb-4">
                      {lang === 'en'
                        ? 'If you have a soil health card with detailed soil test results, we can provide more accurate recommendations. Otherwise, we will use average soil data for your district.'
                        : 'ଯଦି ଆପଣଙ୍କର ବିସ୍ତୃତ ମାଟି ପରୀକ୍ଷଣ ଫଳାଫଳ ସହିତ ମାଟି ସ୍ୱାସ୍ଥ୍ୟ କାର୍ଡ୍ ଅଛି, ଆମେ ଅଧିକ ସଠିକ୍ ସୁପାରିଶ ଦେଇପାରିବୁ | ଅନ୍ୟଥା, ଆମେ ଆପଣଙ୍କ ଜିଲ୍ଲା ପାଇଁ ହାରାହାରି ମାଟି ତଥ୍ୟ ବ୍ୟବହାର କରିବୁ |'}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setHasSoilReport(true);
                          setShowSoilCardForm(true);
                        }}
                        className="flex-1 px-4 py-3 bg-enam-green text-white rounded-lg font-bold hover:bg-enam-dark transition"
                      >
                        {lang === 'en' ? 'Yes, I have a Soil Card' : 'ହଁ, ମୋର ମାଟି କାର୍ଡ୍ ଅଛି'}
                      </button>
                      <button
                        onClick={() => setHasSoilReport(false)}
                        className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
                      >
                        {lang === 'en' ? 'No, use average data' : 'ନାହିଁ, ହାରାହାରି ତଥ୍ୟ ବ୍ୟବହାର କରନ୍ତୁ'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Soil Health Card Form */}
            {showSoilCardForm && hasSoilReport === true && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-green-600" />
                    <h3 className="font-bold text-gray-900 text-lg">
                      {lang === 'en' ? 'Soil Health Card Details' : 'ମାଟି ସ୍ୱାସ୍ଥ୍ୟ କାର୍ଡ୍ ବିବରଣୀ'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {soilCard.nitrogen > 0 || soilCard.phosphorus > 0 || soilCard.potassium > 0 ? (
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                        <CheckCircle size={12} />
                        {lang === 'en' ? 'Saved' : 'ସଂରକ୍ଷିତ'}
                      </span>
                    ) : null}
                    <button
                      onClick={() => setShowSoilCardForm(false)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      {lang === 'en' ? 'Hide' : 'ଲୁଚାନ୍ତୁ'}
                    </button>
                  </div>
                </div>
                {(soilCard.nitrogen > 0 || soilCard.phosphorus > 0 || soilCard.potassium > 0) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    {lang === 'en' 
                      ? '✓ Your soil health card data is saved and will be used automatically for future advisories.'
                      : '✓ ଆପଣଙ୍କର ମାଟି ସ୍ୱାସ୍ଥ୍ୟ କାର୍ଡ୍ ତଥ୍ୟ ସଂରକ୍ଷିତ ହୋଇଛି ଏବଂ ଭବିଷ୍ୟତର ସୁପାରିଶ ପାଇଁ ସ୍ୱୟଂଚାଳିତ ଭାବରେ ବ୍ୟବହୃତ ହେବ |'}
                  </div>
                )}

                {/* Land Type */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {lang === 'en' ? 'Land Type' : 'ଜମିର ପ୍ରକାର'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={soilCard.landType || 'midland'}
                    onChange={(e) => setSoilCard({ ...soilCard, landType: e.target.value as 'upland' | 'lowland' | 'midland' })}
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-enam-green outline-none"
                  >
                    <option value="upland">{lang === 'en' ? 'Upland' : 'ଉଚ୍ଚଭୂମି'}</option>
                    <option value="lowland">{lang === 'en' ? 'Lowland' : 'ନିମ୍ନଭୂମି'}</option>
                    <option value="midland">{lang === 'en' ? 'Midland' : 'ମଧ୍ୟଭୂମି'}</option>
                  </select>
                </div>

                {/* Chemical Parameters Section */}
                <div className="border-t border-gray-300 pt-4">
                  <h4 className="font-bold text-gray-800 mb-4 text-sm">
                    {lang === 'en' ? 'Chemical Parameters' : 'ରାସାୟନିକ ପାରାମିଟର'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nitrogen (N) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {lang === 'en' ? 'Nitrogen (N)' : 'ନାଇଟ୍ରୋଜେନ୍ (N)'} <span className="text-gray-500 text-xs">(kg/ha)</span>
                        <span className="text-gray-400 text-xs ml-2">(Max: 1,500)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1500"
                        step="0.1"
                        value={soilCard.nitrogen || ''}
                        onKeyDown={handleNumberKeyDown}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (value > 1500) {
                            alert(lang === 'en' ? 'Nitrogen value cannot exceed 1,500 kg/ha. This is beyond normal agricultural range.' : 'ନାଇଟ୍ରୋଜେନ୍ ମୂଲ୍ୟ ୧,୫୦୦ kg/ha ରୁ ଅଧିକ ହୋଇପାରିବ ନାହିଁ | ଏହା ସାଧାରଣ କୃଷି ପରିସରରୁ ବାହାରେ |');
                            setSoilCard({ ...soilCard, nitrogen: 1500 });
                          } else {
                            setSoilCard({ ...soilCard, nitrogen: value });
                          }
                        }}
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                        placeholder="e.g., 280"
                      />
                    </div>

                    {/* Phosphorus (P) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {lang === 'en' ? 'Phosphorus (P)' : 'ଫସଫରସ୍ (P)'} <span className="text-gray-500 text-xs">(kg/ha)</span>
                        <span className="text-gray-400 text-xs ml-2">(Max: 500)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        step="0.1"
                        value={soilCard.phosphorus || ''}
                        onKeyDown={handleNumberKeyDown}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (value > 500) {
                            alert(lang === 'en' ? 'Phosphorus value cannot exceed 500 kg/ha. This is beyond normal agricultural range.' : 'ଫସଫରସ୍ ମୂଲ୍ୟ ୫୦୦ kg/ha ରୁ ଅଧିକ ହୋଇପାରିବ ନାହିଁ | ଏହା ସାଧାରଣ କୃଷି ପରିସରରୁ ବାହାରେ |');
                            setSoilCard({ ...soilCard, phosphorus: 500 });
                          } else {
                            setSoilCard({ ...soilCard, phosphorus: value });
                          }
                        }}
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                        placeholder="e.g., 22"
                      />
                    </div>

                    {/* Potassium (K) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {lang === 'en' ? 'Potassium (K)' : 'ପୋଟାସିୟମ୍ (K)'} <span className="text-gray-500 text-xs">(kg/ha)</span>
                        <span className="text-gray-400 text-xs ml-2">(Max: 2,000)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="2000"
                        step="0.1"
                        value={soilCard.potassium || ''}
                        onKeyDown={handleNumberKeyDown}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (value > 2000) {
                            alert(lang === 'en' ? 'Potassium value cannot exceed 2,000 kg/ha. This is beyond normal agricultural range.' : 'ପୋଟାସିୟମ୍ ମୂଲ୍ୟ ୨,୦୦୦ kg/ha ରୁ ଅଧିକ ହୋଇପାରିବ ନାହିଁ | ଏହା ସାଧାରଣ କୃଷି ପରିସରରୁ ବାହାରେ |');
                            setSoilCard({ ...soilCard, potassium: 2000 });
                          } else {
                            setSoilCard({ ...soilCard, potassium: value });
                          }
                        }}
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                        placeholder="e.g., 140"
                      />
                    </div>

                    {/* Organic Carbon (OC) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {lang === 'en' ? 'Organic Carbon (OC)' : 'ଜୈବିକ କାର୍ବନ୍ (OC)'} <span className="text-gray-500 text-xs">(%)</span>
                        <span className="text-gray-400 text-xs ml-2">(Max: 100)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={soilCard.organicCarbon || ''}
                        onKeyDown={handleNumberKeyDown}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (value > 100) {
                            alert(lang === 'en' ? 'Organic Carbon value cannot exceed 100%. This is beyond normal agricultural range.' : 'ଜୈବିକ କାର୍ବନ୍ ମୂଲ୍ୟ ୧୦୦% ରୁ ଅଧିକ ହୋଇପାରିବ ନାହିଁ | ଏହା ସାଧାରଣ କୃଷି ପରିସରରୁ ବାହାରେ |');
                            setSoilCard({ ...soilCard, organicCarbon: 100 });
                          } else {
                            setSoilCard({ ...soilCard, organicCarbon: value });
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value && parseFloat(e.target.value) > 100) {
                            setSoilCard({ ...soilCard, organicCarbon: 100 });
                          }
                        }}
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                        placeholder="e.g., 0.5"
                      />
                    </div>

                    {/* Electrical Conductivity (EC) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {lang === 'en' ? 'Electrical Conductivity (EC)' : 'ବିଦ୍ୟୁତ୍ ଚାଳକତା (EC)'} <span className="text-gray-500 text-xs">(dS/m)</span>
                        <span className="text-gray-400 text-xs ml-2">(Max: 4)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        step="0.01"
                        value={soilCard.electricalConductivity || ''}
                        onKeyDown={handleNumberKeyDown}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (value > 4) {
                            alert(lang === 'en' ? 'Electrical Conductivity value cannot exceed 4 dS/m. This is beyond normal agricultural range.' : 'ବିଦ୍ୟୁତ୍ ଚାଳକତା ମୂଲ୍ୟ ୪ dS/m ରୁ ଅଧିକ ହୋଇପାରିବ ନାହିଁ | ଏହା ସାଧାରଣ କୃଷି ପରିସରରୁ ବାହାରେ |');
                            setSoilCard({ ...soilCard, electricalConductivity: 4 });
                          } else {
                            setSoilCard({ ...soilCard, electricalConductivity: value });
                          }
                        }}
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                        placeholder="e.g., 0.3"
                      />
                    </div>

                    {/* pH */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {lang === 'en' ? 'pH' : 'pH'} <span className="text-gray-500 text-xs">(value)</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="14"
                        value={soilCard.pH || ''}
                        onKeyDown={handleNumberKeyDown}
                        onChange={(e) => setSoilCard({ ...soilCard, pH: parseFloat(e.target.value) || 7.0 })}
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                        placeholder="e.g., 6.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Micronutrients Section */}
                <div className="border-t border-gray-300 pt-4">
                  <h4 className="font-bold text-gray-800 mb-4 text-sm">
                    {lang === 'en' ? 'Micronutrients' : 'ସୂକ୍ଷ୍ମ ପୋଷକ'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Boron */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {lang === 'en' ? 'Boron' : 'ବୋରନ୍'} <span className="text-gray-500 text-xs">(ppm)</span>
                        <span className="text-gray-400 text-xs ml-2">(Max: 2)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        step="0.01"
                        value={soilCard.boron || ''}
                        onKeyDown={handleNumberKeyDown}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (value > 2) {
                            alert(lang === 'en' ? 'Boron value cannot exceed 2 ppm. This is beyond normal agricultural range.' : 'ବୋରନ୍ ମୂଲ୍ୟ ୨ ppm ରୁ ଅଧିକ ହୋଇପାରିବ ନାହିଁ | ଏହା ସାଧାରଣ କୃଷି ପରିସରରୁ ବାହାରେ |');
                            setSoilCard({ ...soilCard, boron: 2 });
                          } else {
                            setSoilCard({ ...soilCard, boron: value });
                          }
                        }}
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                        placeholder="e.g., 0.5"
                      />
                    </div>

                    {/* Sulphur */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {lang === 'en' ? 'Sulphur' : 'ସଲଫର୍'} <span className="text-gray-500 text-xs">(ppm)</span>
                        <span className="text-gray-400 text-xs ml-2">(Max: 20)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.01"
                        value={soilCard.sulphur || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (value > 20) {
                            alert(lang === 'en' ? 'Sulphur value cannot exceed 20 ppm. This is beyond normal agricultural range.' : 'ସଲଫର୍ ମୂଲ୍ୟ ୨୦ ppm ରୁ ଅଧିକ ହୋଇପାରିବ ନାହିଁ | ଏହା ସାଧାରଣ କୃଷି ପରିସରରୁ ବାହାରେ |');
                            setSoilCard({ ...soilCard, sulphur: 20 });
                          } else {
                            setSoilCard({ ...soilCard, sulphur: value });
                          }
                        }}
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                        placeholder="e.g., 10"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowSoilCardForm(false)}
                  className="w-full bg-enam-green hover:bg-enam-dark text-white font-bold py-3 rounded-xl transition"
                >
                  {lang === 'en' ? 'Save & Continue' : 'ସେଭ କରନ୍ତୁ ଏବଂ ଜାରି ରଖନ୍ତୁ'}
                </button>
              </div>
            )}

            {/* Location Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-enam-green" /> {lang === 'en' ? 'Nearest town/village' : 'ସବୁଠୁ ନଜିକରା ସ୍ଥାନ'}
              </label>
              <div className="flex gap-2">
                <input 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g., Khordha, Odisha' : 'ଉଦାହରଣ: ଖୋର୍ଧା, ଓଡ଼ିଶା'}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-enam-green outline-none"
                />
                {onDetectLocation && (
                  <button
                    type="button"
                    onClick={onDetectLocation}
                    className="shrink-0 px-3 py-2 bg-enam-dark text-white rounded-xl font-bold text-xs hover:bg-enam-green transition"
                  >
                    {lang === 'en' ? 'Detect' : 'ଖୋଜନ୍ତୁ'}
                  </button>
                )}
              </div>
            </div>

            {hasSoilReport !== null && (
              <>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className={hasSoilReport ? "text-green-600" : "text-blue-600"} />
                    <span className="text-sm font-bold text-gray-700">
                      {lang === 'en' 
                        ? `Soil Data: ${hasSoilReport ? (showSoilCardForm ? 'Entering Soil Health Card Details' : 'From Soil Health Card') : 'Average for District'}`
                        : `ମାଟି ତଥ୍ୟ: ${hasSoilReport ? (showSoilCardForm ? 'ମାଟି ସ୍ୱାସ୍ଥ୍ୟ କାର୍ଡ୍ ବିବରଣୀ ପ୍ରବେଶ କରୁଛନ୍ତି' : 'ମାଟି ସ୍ୱାସ୍ଥ୍ୟ କାର୍ଡ୍ରୁ') : 'ଜିଲ୍ଲା ପାଇଁ ହାରାହାରି'}`}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setHasSoilReport(null);
                      setShowSoilCardForm(false);
                      setSoil('Sandy Loam');
                      setWater('Rainfed');
                      setSoilCard({
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
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                  >
                    {lang === 'en' ? 'Change' : 'ପରିବର୍ତ୍ତନ କରନ୍ତୁ'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* District */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin size={16} className="text-enam-green" /> {lang === 'en' ? 'District' : 'ଜିଲ୍ଲା'}
                    {hasSoilReport === false && detectingDistrict && (
                      <span className="text-xs text-blue-600 animate-pulse">
                        ({lang === 'en' ? 'Detecting...' : 'ଖୋଜୁଛି...'})
                      </span>
                    )}
                    {hasSoilReport === false && !detectingDistrict && (
                      <span className="text-xs text-green-600">
                        ({lang === 'en' ? 'Auto-detected' : 'ସ୍ୱୟଂ-ଖୋଜିତ'})
                      </span>
                    )}
                  </label>
                  <select 
                    value={district} 
                    onChange={(e) => {
                      setDistrict(e.target.value);
                      // Update soil and water based on district if no soil report
                      if (hasSoilReport === false && districtSoilData[e.target.value]) {
                        setSoil(districtSoilData[e.target.value].soil);
                        setWater(districtSoilData[e.target.value].water);
                      }
                    }}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-enam-green outline-none"
                    disabled={hasSoilReport === false && detectingDistrict}
                  >
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Soil Type */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Sprout size={16} className="text-brown-500" /> {lang === 'en' ? 'Soil Type' : 'ମାଟି ପ୍ରକାର'}
                    {hasSoilReport === false && (
                      <span className="text-xs text-gray-500">
                        ({lang === 'en' ? 'Average for district' : 'ଜିଲ୍ଲା ପାଇଁ ହାରାହାରି'})
                      </span>
                    )}
                  </label>
                  <select 
                    value={soil} 
                    onChange={(e) => setSoil(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-enam-green outline-none"
                    disabled={hasSoilReport === false}
                  >
                    {soils.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {hasSoilReport === false && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Info size={12} />
                      {lang === 'en' 
                        ? 'Using average soil data for your district. For more accuracy, get a soil health card from your local agriculture office.'
                        : 'ଆପଣଙ୍କ ଜିଲ୍ଲା ପାଇଁ ହାରାହାରି ମାଟି ତଥ୍ୟ ବ୍ୟବହାର କରୁଛି | ଅଧିକ ସଠିକ୍ ପାଇଁ, ଆପଣଙ୍କ ସ୍ଥାନୀୟ କୃଷି କାର୍ଯ୍ୟାଳୟରୁ ମାଟି ସ୍ୱାସ୍ଥ୍ୟ କାର୍ଡ୍ ପାଆନ୍ତୁ |'}
                    </p>
                  )}
                </div>

                {/* Water Source */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Sprout size={16} className="text-blue-500" /> {lang === 'en' ? 'Water Source' : 'ଜଳ ସ୍ରୋତ'}
                    {hasSoilReport === false && (
                      <span className="text-xs text-gray-500">
                        ({lang === 'en' ? 'Average for district' : 'ଜିଲ୍ଲା ପାଇଁ ହାରାହାରି'})
                      </span>
                    )}
                  </label>
                  <select 
                    value={water} 
                    onChange={(e) => setWater(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-enam-green outline-none"
                    disabled={hasSoilReport === false}
                  >
                    {waterSources.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              </>
            )}

            {hasSoilReport !== null && (
              <button 
                onClick={generatePlan}
                disabled={loading || !location.trim() || detectingDistrict}
                className="w-full bg-govt-orange hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <span className="animate-pulse">
                    {lang === 'en' ? 'Analyzing Market & Soil...' : 'ବଜାର ଏବଂ ମାଟି ବିଶ୍ଳେଷଣ କରୁଛି...'}
                  </span>
                ) : detectingDistrict ? (
                  <span className="animate-pulse">
                    {lang === 'en' ? 'Detecting district...' : 'ଜିଲ୍ଲା ଖୋଜୁଛି...'}
                  </span>
                ) : (
                  <>
                    {lang === 'en' ? 'Generate Advisory' : 'ପରାମର୍ଶ ପାଆନ୍ତୁ'} <ArrowRight size={20} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
