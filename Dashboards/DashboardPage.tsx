import React, { useState, useEffect } from 'react';
import { Sprout, Plus, X, Target, ArrowLeft, TrendingUp, BarChart3, Sparkles, Loader } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getFarmingAdvisory } from '../services/geminiService';

interface DashboardPageProps {
  lang: string;
  location: string;
  onBack: () => void;
}

interface CropData {
  id: string;
  cropName: string;
  acreage: number;
  yieldPerAcre: number; // in quintals
  pricePerQuintal: number;
  totalProduction: number; // calculated
  totalRevenue: number; // calculated
  totalCost: number; // estimated
  netProfit: number; // calculated
}

const DashboardPage: React.FC<DashboardPageProps> = ({ lang, location, onBack }) => {
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string>('');
  
  // Current Crops State
  const [currentCrops, setCurrentCrops] = useState<CropData[]>([
    { 
      id: '1', 
      cropName: 'Paddy', 
      acreage: 2, 
      yieldPerAcre: 25, 
      pricePerQuintal: 2000,
      totalProduction: 50,
      totalRevenue: 100000,
      totalCost: 36000,
      netProfit: 64000
    }
  ]);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [newCrop, setNewCrop] = useState({ cropName: '', acreage: 0, yieldPerAcre: 0, pricePerQuintal: 0 });

  const traditionalCrops = ["Paddy", "Wheat", "Maize", "Cotton", "Sugarcane", "Pulses"];

  // Oilseed profit data (per acre)
  const oilseedData = {
    groundnut: { profit: 45000, yield: 15, msp: 6377, marketPrice: 6800 },
    mustard: { profit: 50000, yield: 12, msp: 5450, marketPrice: 6000 },
    soybean: { profit: 40000, yield: 18, msp: 4300, marketPrice: 4800 },
    sunflower: { profit: 42000, yield: 14, msp: 6400, marketPrice: 7000 },
    sesame: { profit: 48000, yield: 4, msp: 7800, marketPrice: 8500 }
  };

  // Calculate totals
  const totalAcreage = currentCrops.reduce((sum, crop) => sum + crop.acreage, 0);
  const totalCurrentProfit = currentCrops.reduce((sum, crop) => sum + crop.netProfit, 0);
  const avgProfitPerAcre = totalAcreage > 0 ? totalCurrentProfit / totalAcreage : 0;
  
  // Calculate potential oilseed profit
  const potentialOilseedProfit = totalAcreage * oilseedData.groundnut.profit;
  const profitIncrease = potentialOilseedProfit - totalCurrentProfit;
  const profitIncreasePercent = totalCurrentProfit > 0 ? ((profitIncrease / totalCurrentProfit) * 100) : 0;

  // Add new crop
  const handleAddCrop = () => {
    if (!newCrop.cropName || newCrop.acreage <= 0) return;
    
    const totalProduction = newCrop.acreage * newCrop.yieldPerAcre;
    const totalRevenue = totalProduction * newCrop.pricePerQuintal;
    const totalCost = newCrop.acreage * 18000; // Estimated cost per acre
    const netProfit = totalRevenue - totalCost;

    const crop: CropData = {
      id: Date.now().toString(),
      ...newCrop,
      totalProduction,
      totalRevenue,
      totalCost,
      netProfit
    };

    setCurrentCrops([...currentCrops, crop]);
    setNewCrop({ cropName: '', acreage: 0, yieldPerAcre: 0, pricePerQuintal: 0 });
    setShowAddCrop(false);
  };

  // Remove crop
  const handleRemoveCrop = (id: string) => {
    setCurrentCrops(currentCrops.filter(c => c.id !== id));
  };

  // Generate AI recommendation using Gemini
  const generateRecommendation = async () => {
    if (currentCrops.length === 0) {
      alert(lang === 'en' ? 'Please add at least one crop first.' : 'ଦୟାକରି ପ୍ରଥମେ ଅତିକମରେ ଗୋଟିଏ ଫସଲ ଯୋଡନ୍ତୁ |');
      return;
    }

    setLoadingRecommendation(true);
    setAiRecommendation('');

    try {
      const cropSummary = currentCrops.map(c => 
        `${c.cropName}: ${c.acreage} acres, ${c.yieldPerAcre} qtl/acre yield, ₹${c.pricePerQuintal}/qtl price, ₹${c.netProfit.toLocaleString()} profit`
      ).join('\n');

      const prompt = `You are an agricultural advisor helping a farmer in Odisha, India. 

Current farming situation:
${cropSummary}

Total acreage: ${totalAcreage.toFixed(1)} acres
Current total profit: ₹${totalCurrentProfit.toLocaleString()}
Average profit per acre: ₹${avgProfitPerAcre.toLocaleString()}

Location: ${location || 'Odisha'}

Provide a personalized recommendation (in ${lang === 'en' ? 'English' : 'Oriya'}) for this farmer to switch to oilseeds. Be specific and data-driven. Include:

1. Analysis of their current farming performance
2. Specific oilseed recommendations (Groundnut, Mustard, Soybean, Sunflower, or Sesame) based on their location and current crops
3. Expected profit increase with specific numbers
4. Step-by-step transition plan
5. Government schemes and subsidies they can avail
6. Market demand and MSP benefits

Make it encouraging but realistic. Keep it concise (300-400 words). Focus on how oilseeds can improve their income.`;

      const response = await getFarmingAdvisory(
        prompt,
        lang === 'en' ? 'English' : 'Oriya',
        { mode: 'REPORT', district: location, soil: 'Mixed', water: 'Mixed', location }
      );

      if (typeof response === 'string') {
        setAiRecommendation(response);
      } else if (response.recommendedCrop) {
        setAiRecommendation(
          lang === 'en'
            ? `Based on your farming data, I recommend switching to ${response.recommendedCrop}. ${response.reason || 'This oilseed offers better returns and is suitable for your region.'}`
            : `ଆପଣଙ୍କର କୃଷି ତଥ୍ୟ ଆଧାରରେ, ମୁଁ ${response.recommendedCrop}କୁ ସ୍ଥାନାନ୍ତର କରିବାକୁ ସୁପାରିଶ କରୁଛି | ${response.reason || 'ଏହି ତେଲବିହନ ଉତ୍କୃଷ୍ଟ ପ୍ରତ୍ୟାବର୍ତ୍ତନ ପ୍ରଦାନ କରେ ଏବଂ ଆପଣଙ୍କ ଅଞ୍ଚଳ ପାଇଁ ଉପଯୁକ୍ତ |'}`
        );
      }
    } catch (error) {
      console.error('Error generating recommendation:', error);
      setAiRecommendation(
        lang === 'en'
          ? 'Unable to generate recommendation at this time. Please try again later.'
          : 'ଏହି ସମୟରେ ସୁପାରିଶ ଉତ୍ପାଦନ କରିପାରିଲା ନାହିଁ | ଦୟାକରି ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ |'
      );
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // Chart data for comparison
  const comparisonChartData = [
    {
      name: lang === 'en' ? 'Your Current Crops' : 'ଆପଣଙ୍କର ବର୍ତ୍ତମାନର ଫସଲ',
      profit: totalCurrentProfit,
      profitPerAcre: avgProfitPerAcre
    },
    {
      name: lang === 'en' ? 'Oilseeds (Potential)' : 'ତେଲବିହନ (ସମ୍ଭାବନା)',
      profit: potentialOilseedProfit,
      profitPerAcre: oilseedData.groundnut.profit
    }
  ];

  const cropDistributionData = currentCrops.map(crop => ({
    name: crop.cropName,
    value: crop.acreage,
    profit: crop.netProfit
  }));

  const COLORS = ['#84c225', '#1a5d1a', '#FF9933', '#138808', '#000080', '#f39c12'];

  return (
    <div className="min-h-[70vh] bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack} 
            className="p-2 rounded-full hover:bg-gray-100 border border-gray-200"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {lang === 'en' ? 'My Farming Dashboard' : 'ମୋର କୃଷି ଡ୍ୟାସବୋର୍ଡ୍'}
            </h2>
            <p className="text-xs text-gray-500">
              {lang === 'en' ? 'Track your crops and get personalized recommendations' : 'ଆପଣଙ୍କର ଫସଲ ଟ୍ରାକ୍ କରନ୍ତୁ ଏବଂ ବ୍ୟକ୍ତିଗତ ସୁପାରିଶ ପାଆନ୍ତୁ'}
            </p>
          </div>
        </div>
      </div>

      {/* Current Crops Input Section */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sprout size={20} className="text-enam-green" />
            {lang === 'en' ? 'Your Current Crops' : 'ଆପଣଙ୍କର ବର୍ତ୍ତମାନର ଫସଲ'}
          </h3>
          {!showAddCrop && (
            <button
              onClick={() => setShowAddCrop(true)}
              className="flex items-center gap-2 px-4 py-2 bg-enam-green text-white rounded-lg text-sm font-bold hover:bg-enam-dark transition"
            >
              <Plus size={16} />
              {lang === 'en' ? 'Add Crop' : 'ଫସଲ ଯୋଡନ୍ତୁ'}
            </button>
          )}
        </div>

        {/* Add Crop Form */}
        {showAddCrop && (
          <div className="bg-white rounded-lg p-4 border-2 border-enam-green mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {lang === 'en' ? 'Crop Name' : 'ଫସଲ ନାମ'}
                </label>
                <select
                  value={newCrop.cropName}
                  onChange={(e) => setNewCrop({ ...newCrop, cropName: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-enam-green outline-none"
                >
                  <option value="">{lang === 'en' ? 'Select...' : 'ବାଛନ୍ତୁ...'}</option>
                  {traditionalCrops.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {lang === 'en' ? 'Acreage' : 'ଏକର'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={newCrop.acreage || ''}
                  onChange={(e) => setNewCrop({ ...newCrop, acreage: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-enam-green outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {lang === 'en' ? 'Yield/Acre (qtl)' : 'ଉତ୍ପାଦନ/ଏକର (କ୍ୱିଣ୍ଟାଲ)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={newCrop.yieldPerAcre || ''}
                  onChange={(e) => setNewCrop({ ...newCrop, yieldPerAcre: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-enam-green outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {lang === 'en' ? 'Price/Qtl (₹)' : 'ମୂଲ୍ୟ/କ୍ୱିଣ୍ଟାଲ (₹)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCrop.pricePerQuintal || ''}
                  onChange={(e) => setNewCrop({ ...newCrop, pricePerQuintal: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-enam-green outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddCrop}
                className="px-4 py-2 bg-enam-green text-white rounded-lg text-sm font-bold hover:bg-enam-dark transition"
              >
                {lang === 'en' ? 'Add Crop' : 'ଯୋଡନ୍ତୁ'}
              </button>
              <button
                onClick={() => {
                  setShowAddCrop(false);
                  setNewCrop({ cropName: '', acreage: 0, yieldPerAcre: 0, pricePerQuintal: 0 });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition"
              >
                {lang === 'en' ? 'Cancel' : 'ବାତିଲ୍'}
              </button>
            </div>
          </div>
        )}

        {/* Current Crops List */}
        {currentCrops.length > 0 ? (
          <div className="space-y-3">
            {currentCrops.map((crop) => (
              <div key={crop.id} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">{lang === 'en' ? 'Crop' : 'ଫସଲ'}</div>
                    <div className="font-bold text-gray-900">{crop.cropName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{lang === 'en' ? 'Acreage' : 'ଏକର'}</div>
                    <div className="font-bold text-gray-900">{crop.acreage} {lang === 'en' ? 'acres' : 'ଏକର'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{lang === 'en' ? 'Production' : 'ଉତ୍ପାଦନ'}</div>
                    <div className="font-bold text-gray-900">{crop.totalProduction.toFixed(1)} qtl</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{lang === 'en' ? 'Revenue' : 'ଆୟ'}</div>
                    <div className="font-bold text-gray-900">₹{crop.totalRevenue.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{lang === 'en' ? 'Net Profit' : 'ନିଟ୍ ଲାଭ'}</div>
                    <div className="font-bold text-green-600">₹{crop.netProfit.toLocaleString()}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveCrop(crop.id)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {lang === 'en' 
              ? 'No crops added yet. Click "Add Crop" to get started.'
              : 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ଫସଲ ଯୋଡାଯାଇନାହିଁ | ଆରମ୍ଭ କରିବା ପାଇଁ "ଫସଲ ଯୋଡନ୍ତୁ" କ୍ଲିକ୍ କରନ୍ତୁ |'}
          </div>
        )}
      </div>

      {/* Statistics Summary */}
      {currentCrops.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="text-xs text-gray-600 mb-1">{lang === 'en' ? 'Total Acreage' : 'ମୋଟ ଏକର'}</div>
              <div className="text-2xl font-bold text-blue-600">{totalAcreage.toFixed(1)}</div>
              <div className="text-xs text-gray-500">{lang === 'en' ? 'acres' : 'ଏକର'}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <div className="text-xs text-gray-600 mb-1">{lang === 'en' ? 'Current Profit' : 'ବର୍ତ୍ତମାନର ଲାଭ'}</div>
              <div className="text-2xl font-bold text-green-600">₹{totalCurrentProfit.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{lang === 'en' ? 'per season' : 'ପ୍ରତି ଋତୁ'}</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
              <div className="text-xs text-gray-600 mb-1">{lang === 'en' ? 'Avg Profit/Acre' : 'ହାରାହାରି ଲାଭ/ଏକର'}</div>
              <div className="text-2xl font-bold text-orange-600">₹{avgProfitPerAcre.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{lang === 'en' ? 'current crops' : 'ବର୍ତ୍ତମାନର ଫସଲ'}</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
              <div className="text-xs text-gray-600 mb-1">{lang === 'en' ? 'Potential Profit' : 'ସମ୍ଭାବନା ଲାଭ'}</div>
              <div className="text-2xl font-bold text-purple-600">₹{potentialOilseedProfit.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{lang === 'en' ? 'with oilseeds' : 'ତେଲବିହନ ସହିତ'}</div>
            </div>
          </div>

          {/* Comparison Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profit Comparison Bar Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-enam-green" />
                {lang === 'en' ? 'Profit Comparison' : 'ଲାଭ ତୁଳନା'}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => `₹${value.toLocaleString()}`}
                  />
                  <Bar dataKey="profit" fill="#84c225" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Crop Distribution Pie Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sprout size={20} className="text-enam-green" />
                {lang === 'en' ? 'Crop Distribution' : 'ଫସଲ ବିତରଣ'}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={cropDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {cropDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI-Powered Recommendation */}
          <div className="bg-gradient-to-br from-green-50 to-enam-green/10 rounded-xl p-6 border-2 border-green-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Sparkles size={24} className="text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Target size={20} />
                  {lang === 'en' ? 'AI-Powered Personalized Recommendation' : 'AI-ଚାଳିତ ବ୍ୟକ୍ତିଗତ ସୁପାରିଶ'}
                </h3>
                
                {!aiRecommendation && !loadingRecommendation && (
                  <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                    <p className="text-sm text-gray-700 mb-4">
                      {lang === 'en'
                        ? 'Get personalized recommendations based on your farming data, location, and market trends. Our AI will analyze your current crops and suggest the best oilseed options for maximum profit.'
                        : 'ଆପଣଙ୍କର କୃଷି ତଥ୍ୟ, ସ୍ଥାନ, ଏବଂ ବଜାର ପ୍ରବୃତ୍ତି ଆଧାରରେ ବ୍ୟକ୍ତିଗତ ସୁପାରିଶ ପାଆନ୍ତୁ | ଆମର AI ଆପଣଙ୍କର ବର୍ତ୍ତମାନର ଫସଲକୁ ବିଶ୍ଳେଷଣ କରିବ ଏବଂ ସର୍ବାଧିକ ଲାଭ ପାଇଁ ସର୍ବୋତ୍ତମ ତେଲବିହନ ବିକଳ୍ପ ସୁପାରିଶ କରିବ |'}
                    </p>
                    <button
                      onClick={generateRecommendation}
                      className="w-full bg-enam-green hover:bg-enam-dark text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Sparkles size={18} />
                      {lang === 'en' ? 'Generate AI Recommendation' : 'AI ସୁପାରିଶ ଉତ୍ପାଦନ କରନ୍ତୁ'}
                    </button>
                  </div>
                )}

                {loadingRecommendation && (
                  <div className="bg-white rounded-lg p-6 border border-green-200 text-center">
                    <Loader className="animate-spin mx-auto mb-4 text-enam-green" size={32} />
                    <p className="text-gray-600">
                      {lang === 'en' ? 'Analyzing your data and generating personalized recommendations...' : 'ଆପଣଙ୍କର ତଥ୍ୟ ବିଶ୍ଳେଷଣ କରୁଛି ଏବଂ ବ୍ୟକ୍ତିଗତ ସୁପାରିଶ ଉତ୍ପାଦନ କରୁଛି...'}
                    </p>
                  </div>
                )}

                {aiRecommendation && !loadingRecommendation && (
                  <div className="bg-white rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-enam-green" />
                        {lang === 'en' ? 'Your Personalized Recommendation' : 'ଆପଣଙ୍କର ବ୍ୟକ୍ତିଗତ ସୁପାରିଶ'}
                      </h4>
                      <button
                        onClick={() => setAiRecommendation('')}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {aiRecommendation}
                    </div>
                    <button
                      onClick={generateRecommendation}
                      className="mt-4 px-4 py-2 bg-enam-green hover:bg-enam-dark text-white rounded-lg text-sm font-bold transition"
                    >
                      {lang === 'en' ? 'Regenerate Recommendation' : 'ପୁଣି ସୁପାରିଶ ଉତ୍ପାଦନ କରନ୍ତୁ'}
                    </button>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="mt-4 bg-white rounded-lg p-4 border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {profitIncreasePercent > 0 ? `+${profitIncreasePercent.toFixed(0)}%` : '0%'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {lang === 'en' ? 'Profit Increase' : 'ଲାଭ ବୃଦ୍ଧି'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ₹{profitIncrease > 0 ? profitIncrease.toLocaleString() : '0'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {lang === 'en' ? 'Extra Income' : 'ଅତିରିକ୍ତ ଆୟ'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {totalAcreage > 0 ? (potentialOilseedProfit / totalAcreage).toLocaleString() : '0'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {lang === 'en' ? '₹/Acre (Oilseeds)' : '₹/ଏକର (ତେଲବିହନ)'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;

