import React, { useEffect } from 'react';
import { AdvisoryPlan } from '../types';
import { ArrowLeft, MapPin, Sprout, Droplets, TrendingUp, IndianRupee, Calendar, CheckCircle, AlertCircle, BarChart3, Cloud, Thermometer, Gavel, ArrowRight } from 'lucide-react';
import { getDistrictWeatherData } from '../services/weatherService';

interface AdvisoryPageProps {
  lang: string;
  location: string;
  plan: AdvisoryPlan;
  context: { district: string; soil: string; water: string } | null;
  onBack: () => void;
  onBiddingNav?: () => void;
}

const AdvisoryPage: React.FC<AdvisoryPageProps> = ({ lang, location, plan, context, onBack, onBiddingNav }) => {
  // Translation helper
  const t = (en: string, or: string) => lang === 'en' ? en : or;
  
  // Translate timeline day labels
  const translateTimelineDay = (day: string): string => {
    if (lang === 'en') return day;
    
    // Common timeline day patterns
    const translations: Record<string, string> = {
      'Pre-Sowing': 'ପୂର୍ବ-ବିହନ',
      'Pre-Sowing (15 days before)': 'ପୂର୍ବ-ବିହନ (୧୫ ଦିନ ପୂର୍ବରୁ)',
      'Sowing Day': 'ବିହନ ଦିନ',
      'Day 1': 'ଦିନ ୧',
      'Day 2': 'ଦିନ ୨',
      'Day 3': 'ଦିନ ୩',
      'Day 7': 'ଦିନ ୭',
      'Day 10': 'ଦିନ ୧୦',
      'Day 15': 'ଦିନ ୧୫',
      'Day 20': 'ଦିନ ୨୦',
      'Day 30': 'ଦିନ ୩୦',
      'Day 45': 'ଦିନ ୪୫',
      'Day 60': 'ଦିନ ୬୦',
      'Day 90': 'ଦିନ ୯୦',
      'Day 100': 'ଦିନ ୧୦୦',
      'Day 100-120': 'ଦିନ ୧୦୦-୧୨୦',
      'Day 120': 'ଦିନ ୧୨୦',
      'Harvest': 'କଟାଇ',
      'Harvest Day': 'କଟାଇ ଦିନ',
      '1 Month': '୧ ମାସ',
      '2 Months': '୨ ମାସ',
      '3 Months': '୩ ମାସ',
      '4 Months': '୪ ମାସ',
      '5 Months': '୫ ମାସ',
      '6 Months': '୬ ମାସ',
      'Current': 'ବର୍ତ୍ତମାନ',
    };
    
    // Check for exact match first
    if (translations[day]) {
      return translations[day];
    }
    
    // Check for patterns like "Day X" or "Day X-Y" or "Day X-Y-Z"
    const dayPattern = /^Day\s+(\d+)(?:-(\d+))?(?:-(\d+))?$/i;
    const match = day.match(dayPattern);
    if (match) {
      if (match[3]) {
        return `ଦିନ ${match[1]}-${match[2]}-${match[3]}`;
      }
      if (match[2]) {
        return `ଦିନ ${match[1]}-${match[2]}`;
      }
      return `ଦିନ ${match[1]}`;
    }
    
    // Check for "X Months" pattern
    const monthPattern = /^(\d+)\s+Months?$/i;
    const monthMatch = day.match(monthPattern);
    if (monthMatch) {
      return `${monthMatch[1]} ମାସ`;
    }
    
    // Check for "X Month" pattern
    const monthPattern2 = /^(\d+)\s+Month$/i;
    const monthMatch2 = day.match(monthPattern2);
    if (monthMatch2) {
      return `${monthMatch2[1]} ମାସ`;
    }
    
    // Return original if no translation found
    return day;
  };
  
  const district = context?.district || 'Your district';
  const soil = context?.soil || 'Soil';
  const water = context?.water || 'Irrigation';
  const weatherData = getDistrictWeatherData(district);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const season = (currentMonth >= 6 && currentMonth <= 9) ? 'kharif' : 'rabi';

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-enam-dark hover:text-govt-orange transition"
          >
            <ArrowLeft size={18} /> {lang === 'en' ? 'Back to dashboard' : 'ଡାଶବୋର୍ଡକୁ ଫେରନ୍ତୁ'}
          </button>
          <div className="text-right">
            <div className="text-xs text-gray-500">{lang === 'en' ? 'Location' : 'ସ୍ଥାନ'}</div>
            <div className="text-sm font-semibold text-gray-800 flex items-center gap-1">
              <MapPin size={14} className="text-enam-green" /> {location || 'Not set'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-gradient-to-r from-enam-dark to-enam-green text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">
              {lang === 'en' ? 'Recommended oilseed' : 'ପରାମର୍ଶିତ ତେଲ ବିଜ'}
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              {plan.cropName} <span className="text-white/80 text-lg">({plan.localName})</span>
            </h1>
            <p className="text-sm text-white/80 max-w-3xl">{plan.suitabilityReason}</p>
            <div className="flex flex-wrap gap-3 pt-4">
              <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full text-xs font-semibold">
                <MapPin size={14} /> {district}
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full text-xs font-semibold">
                <Sprout size={14} /> {soil}
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full text-xs font-semibold">
                <Droplets size={14} /> {water}
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full text-xs font-semibold">
                <TrendingUp size={14} /> {lang === 'en' ? 'ROI' : 'ଲାଭ'}: {plan.roi}
              </span>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10">
            <IndianRupee size={180} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} className="text-enam-dark" />
                <h3 className="text-lg font-bold text-gray-900">
                  {lang === 'en' ? 'Guided cultivation timeline' : 'ପଦକ୍ରମ ଚାଷ ଯୋଜନା'}
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {lang === 'en'
                  ? 'Follow these steps from land prep to harvest.'
                  : 'ଜମି ପ୍ରସ୍ତୁତିରୁ କଟାଇ ପର୍ଯ୍ୟନ୍ତ ଏହି ପଦକ୍ରମ ଅନୁସରଣ କରନ୍ତୁ |'}
              </p>
              <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                {plan.timeline.map((step, idx) => (
                  <div key={idx} className="relative bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="absolute -left-[21px] top-4 w-4 h-4 rounded-full bg-enam-green border-4 border-white shadow-sm"></div>
                    <div className="text-xs font-bold text-enam-green uppercase tracking-wider mb-1">{translateTimelineDay(step.day)}</div>
                    <div className="text-sm text-gray-800 leading-relaxed">{step.task}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Cloud size={18} className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  {lang === 'en' ? 'Weather & Climate Suitability' : 'ପାଣିପାଗ ଓ ଜଳବାୟୁ ଉପଯୁକ୍ତତା'}
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <div className="text-[10px] text-blue-600 font-bold uppercase mb-1">Annual Rainfall</div>
                  <div className="text-lg font-bold text-blue-700">{weatherData.averageRainfall} mm</div>
                </div>
                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                  <div className="text-[10px] text-green-600 font-bold uppercase mb-1">{season === 'kharif' ? 'Monsoon' : 'Rabi'} Rainfall</div>
                  <div className="text-lg font-bold text-green-700">{season === 'kharif' ? weatherData.monsoonRainfall : weatherData.rabiRainfall} mm</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                  <div className="text-[10px] text-orange-600 font-bold uppercase mb-1">Temperature</div>
                  <div className="text-sm font-bold text-orange-700">{weatherData.temperatureRange.min}°-{weatherData.temperatureRange.max}°C</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                  <div className="text-[10px] text-purple-600 font-bold uppercase mb-1">Climate Zone</div>
                  <div className="text-sm font-bold text-purple-700 capitalize">{weatherData.agroClimate}</div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-xs font-bold text-blue-800 uppercase mb-2">
                  {lang === 'en' ? 'Weather Suitability Analysis' : 'ପାଣିପାଗ ଉପଯୁକ୍ତତା ବିଶ୍ଳେଷଣ'}
                </div>
                <div className="text-sm text-blue-900 space-y-1">
                  <div>• {lang === 'en' ? `Current Season: ${season === 'kharif' ? 'Kharif (Monsoon)' : 'Rabi (Post-Monsoon)'}` : `ବର୍ତ୍ତମାନର ଋତୁ: ${season === 'kharif' ? 'ଖରିଫ (ବର୍ଷା)' : 'ରବି (ବର୍ଷା ପରେ)'}`}</div>
                  <div>• {lang === 'en' ? `Soil Type: ${weatherData.soilType}` : `ମାଟିର ପ୍ରକାର: ${weatherData.soilType}`}</div>
                  <div>• {lang === 'en' ? `Rainfall is ${season === 'kharif' ? weatherData.monsoonRainfall >= 1100 ? 'adequate' : 'below average but manageable' : weatherData.rabiRainfall >= 150 ? 'sufficient for rainfed cultivation' : 'supplemental irrigation recommended'}` : `ବର୍ଷାପାତ ${season === 'kharif' ? weatherData.monsoonRainfall >= 1100 ? 'ପର୍ଯ୍ୟାପ୍ତ' : 'ହାରାହାରିରୁ କମ୍ କିନ୍ତୁ ପରିଚାଳନା ଯୋଗ୍ୟ' : weatherData.rabiRainfall >= 150 ? 'ବର୍ଷାଜଳ ଚାଷ ପାଇଁ ପର୍ଯ୍ୟାପ୍ତ' : 'ଅତିରିକ୍ତ ସିଞ୍ଚନ ସୁପାରିଶ'}`}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-enam-dark" />
                <h3 className="text-lg font-bold text-gray-900">
                  {lang === 'en' ? 'Market & pricing playbook' : 'ବଜାର ଓ ମୂଲ୍ୟ ରଣନୀତି'}
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="text-[10px] text-gray-500 font-bold uppercase">MSP</div>
                  <div className="text-lg font-bold text-gray-900">₹{plan.marketOutlook.msp}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Market price</div>
                  <div className="text-lg font-bold text-enam-green">₹{plan.marketOutlook.marketPrice}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Demand</div>
                  <div className={`text-lg font-bold ${plan.marketOutlook.demand === 'High' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {plan.marketOutlook.demand}
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-enam-dark text-white p-4 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold opacity-80 uppercase mb-1">
                    {lang === 'en' ? 'Selling strategy' : 'ବିକ୍ରୟ ରଣନୀତି'}
                  </div>
                  <div className="font-medium">{plan.marketOutlook.strategy}</div>
                </div>
              </div>
              
              {/* Redirect to Bidding Button */}
              {onBiddingNav && (
                <div className="mt-6 bg-gradient-to-r from-enam-green to-enam-dark rounded-xl p-6 border-2 border-enam-green shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Gavel size={20} className="text-white" />
                        <h4 className="text-lg font-bold text-white">
                          {lang === 'en' ? 'Ready to List Your Crop?' : 'ଆପଣଙ୍କର ଫସଲ ତାଲିକା କରିବାକୁ ପ୍ରସ୍ତୁତ?'}
                        </h4>
                      </div>
                      <p className="text-sm text-white/90 mb-3">
                        {lang === 'en' 
                          ? `Based on the market analysis, the suggested price is ₹${plan.marketOutlook.marketPrice}/quintal. List your ${plan.cropName} on the bidding platform and receive competitive bids from FPOs.`
                          : `ବଜାର ବିଶ୍ଳେଷଣ ଅନୁସାରେ, ସୁପାରିଶ ମୂଲ୍ୟ ହେଉଛି ₹${plan.marketOutlook.marketPrice}/କ୍ୱିଣ୍ଟାଲ | ବିଡିଂ ପ୍ଲାଟଫର୍ମରେ ଆପଣଙ୍କର ${plan.cropName} ତାଲିକା କରନ୍ତୁ ଏବଂ FPO ମାନଙ୍କଠାରୁ ପ୍ରତିଯୋଗିତାମୂଳକ ବିଡ୍ ପାଆନ୍ତୁ |`}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-white/80">
                        <CheckCircle size={14} />
                        <span>
                          {lang === 'en' 
                            ? `Suggested Price: ₹${plan.marketOutlook.marketPrice}/qtl | MSP: ₹${plan.marketOutlook.msp}/qtl`
                            : `ସୁପାରିଶ ମୂଲ୍ୟ: ₹${plan.marketOutlook.marketPrice}/କ୍ୱିଣ୍ଟାଲ | MSP: ₹${plan.marketOutlook.msp}/କ୍ୱିଣ୍ଟାଲ`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={onBiddingNav}
                      className="ml-4 bg-white hover:bg-gray-100 text-enam-dark px-6 py-3 rounded-lg font-bold transition flex items-center gap-2 shadow-lg hover:shadow-xl whitespace-nowrap"
                    >
                      {lang === 'en' ? 'Go to Bidding' : 'ବିଡିଂକୁ ଯାଆନ୍ତୁ'}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {lang === 'en' ? 'Quick economics' : 'ଆର୍ଥିକ ସଙ୍କ୍ଷିପ୍ତ ସାର'}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{lang === 'en' ? 'Net profit/acre' : 'ପ୍ରତି ଏକର ନିଷ୍ପତି'}</span>
                  <span className="font-bold text-enam-green">₹{plan.economics.netProfit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{lang === 'en' ? 'Revenue' : 'ରେଭେନୁ'}</span>
                  <span className="font-bold">₹{plan.economics.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{lang === 'en' ? 'Input cost' : 'ଖର୍ଚ୍ଚ'}</span>
                  <span className="font-bold text-gray-700">₹{plan.economics.cost.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-start gap-2">
                  <TrendingUp size={14} className="text-enam-green mt-0.5" />
                  {plan.economics.comparisonText}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {lang === 'en' ? 'Shopping list' : 'କିଣିବା ତାଲିକା'}
              </h3>
              <ul className="space-y-2">
                {plan.shoppingList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    <div className="w-1.5 h-1.5 rounded-full bg-enam-green mt-1.5 shrink-0"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {lang === 'en' ? 'Schemes & subsidies' : 'ଯୋଜନା ଓ ସହାୟତା'}
              </h3>
              <div className="space-y-3">
                {plan.subsidies.map((sub, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="font-bold text-gray-900">{sub.name}</div>
                    <div className="text-xs text-gray-600">{sub.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisoryPage;

