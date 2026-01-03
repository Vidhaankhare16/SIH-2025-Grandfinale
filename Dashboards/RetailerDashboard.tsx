import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, IndianRupee, ShoppingBag, BarChart3, Users, Factory, Truck, MapPin, Phone, Star, Calculator, ArrowRight, Filter } from 'lucide-react';
import { getProcessorsWithinRadius, getAllProcessorFactories, getProfitProjections, calculateProfitProjection, ProcessorFactory, LogisticsProjection } from '../services/retailerService';
import { Location } from '../services/pathfindingService';

interface RetailerDashboardProps {
  lang?: string;
  location?: string;
}

const RetailerDashboard: React.FC<RetailerDashboardProps> = ({ lang = 'en', location: locationString = '' }) => {
  const t = (en: string, or: string) => lang === 'en' ? en : or;
  const [activeTab, setActiveTab] = useState<'factories' | 'logistics'>('factories');
  const [processors, setProcessors] = useState<ProcessorFactory[]>([]);
  const [retailerLocation, setRetailerLocation] = useState<Location>({ lat: 20.2961, lng: 85.8245 }); // Default: Bhubaneswar
  const [selectedCrop, setSelectedCrop] = useState<string>('Groundnut');
  const [projectionQuantity, setProjectionQuantity] = useState<number | ''>(100);
  const [projections, setProjections] = useState<LogisticsProjection[]>([]);
  const [showProjectionDetails, setShowProjectionDetails] = useState(false);
  const [selectedProjection, setSelectedProjection] = useState<LogisticsProjection | null>(null);

  const crops = ['Groundnut', 'Mustard', 'Soybean', 'Sunflower', 'Sesame'];

  // Parse location string to coordinates
  useEffect(() => {
    if (locationString) {
      const latLngMatch = locationString.match(/Lat\s*([\d.]+).*Lng\s*([\d.]+)/i);
      if (latLngMatch) {
        const lat = parseFloat(latLngMatch[1]);
        const lng = parseFloat(latLngMatch[2]);
        setRetailerLocation({ lat, lng });
      }
    }
  }, [locationString]);

  // Load processors within 300km radius
  useEffect(() => {
    const nearbyProcessors = getProcessorsWithinRadius(retailerLocation, 300);
    setProcessors(nearbyProcessors);
  }, [retailerLocation]);

  // Calculate profit projections when crop or quantity changes
  useEffect(() => {
    if (activeTab === 'logistics') {
      const quantity = typeof projectionQuantity === 'number' ? projectionQuantity : 0;
      if (quantity > 0) {
        const proj = getProfitProjections(selectedCrop, quantity, retailerLocation);
        setProjections(proj);
      } else {
        // Clear projections when quantity is zero or empty
        setProjections([]);
      }
    }
  }, [activeTab, selectedCrop, projectionQuantity, retailerLocation]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('Retailer Dashboard', 'ଖୁଚୁରା ବିକ୍ରେତା ଡ୍ୟାସବୋର୍ଡ୍')}</h1>
          <p className="text-gray-600 mt-1">{t('Manage your retail operations and logistics', 'ଆପଣଙ୍କର ଖୁଚୁରା କାର୍ଯ୍ୟ ଏବଂ ଲଜିଷ୍ଟିକ୍ସ ପରିଚାଳନା କରନ୍ତୁ')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('factories')}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === 'factories'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Factory size={18} className="inline mr-2" />
              {t('Factory Listings', 'କାରଖାନା ତାଲିକା')}
            </button>
            <button
              onClick={() => setActiveTab('logistics')}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === 'logistics'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calculator size={18} className="inline mr-2" />
              {t('Logistics Manager', 'ଲଜିଷ୍ଟିକ୍ସ ପରିଚାଳକ')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'factories' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('Processor Factories (Within 300km)', 'ପ୍ରକ୍ରିୟାକରଣ କାରଖାନା (୩୦୦ କିମି ମଧ୍ୟରେ)')}
                </h2>
                <p className="text-gray-600 mt-1">
                  {t(`Found ${processors.length} processors within 300km radius`, `${processors.length} ପ୍ରକ୍ରିୟାକରଣ ୩୦୦ କିମି ବ୍ୟାସାର୍ଦ୍ଧ ମଧ୍ୟରେ ମିଳିଲା`)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processors.map((processor) => (
                <div key={processor.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{processor.name}</h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin size={14} className="mr-1" />
                        <span>{processor.distance?.toFixed(1)} km {t('away', 'ଦୂରରେ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
                      <Star size={14} className="text-yellow-500 mr-1" />
                      <span className="text-sm font-semibold text-yellow-700">{processor.rating}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">{processor.address}</p>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Phone size={14} className="mr-2" />
                      <span>{processor.contactInfo}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      {t('Crops Processed:', 'ପ୍ରକ୍ରିୟାକରଣ କରାଯାଇଥିବା ଫସଲ:')}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {processor.cropsProcessed.map((crop) => (
                        <span key={crop} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {crop}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      {t('Price Range:', 'ମୂଲ୍ୟ ପରିସର:')}
                    </p>
                    <p className="text-sm font-bold text-green-700">
                      ₹{processor.priceRange.min.toLocaleString()} - ₹{processor.priceRange.max.toLocaleString()} / {t('quintal', 'କ୍ୱିଣ୍ଟାଲ')}
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      {t('Capacity:', 'କ୍ଷମତା:')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {processor.processingCapacity} MT / {t('month', 'ମାସ')}
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      {t('Facilities:', 'ସୁବିଧା:')}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {processor.facilities.slice(0, 3).map((facility) => (
                        <span key={facility} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {facility}
                        </span>
                      ))}
                      {processor.facilities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{processor.facilities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-4">{processor.description}</p>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">
                      {t('Payment Terms:', 'ଦେୟ ଶର୍ତ୍ତ:')}
                    </p>
                    <p className="text-xs text-gray-700">{processor.paymentTerms}</p>
                  </div>
                </div>
              ))}
            </div>

            {processors.length === 0 && (
              <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
                <Factory size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {t('No processors found within 300km radius', '୩୦୦ କିମି ବ୍ୟାସାର୍ଦ୍ଧ ମଧ୍ୟରେ କୌଣସି ପ୍ରକ୍ରିୟାକରଣ ମିଳିଲା ନାହିଁ')}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logistics' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('Profit Projections', 'ଲାଭ ପ୍ରକ୍ଷେପଣ')}
              </h2>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('Crop Type', 'ଫସଲ ପ୍ରକାର')}
                    </label>
                    <select
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      {crops.map((crop) => (
                        <option key={crop} value={crop}>{crop}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('Quantity (quintals)', 'ପରିମାଣ (କ୍ୱିଣ୍ଟାଲ)')}
                      <span className="text-xs font-normal text-gray-500 ml-2">
                        ({t('Max:', 'ସର୍ବାଧିକ:')} 1000 {t('quintals', 'କ୍ୱିଣ୍ଟାଲ')})
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={projectionQuantity === '' ? '' : projectionQuantity}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Allow empty string for clearing
                        if (inputValue === '' || inputValue === null || inputValue === undefined) {
                          setProjectionQuantity('');
                          return;
                        }
                        const numValue = parseFloat(inputValue);
                        if (isNaN(numValue)) {
                          setProjectionQuantity('');
                          return;
                        }
                        if (numValue > 1000) {
                          alert(
                            t(
                              'Maximum quantity is 1000 quintals. Please enter a value between 1 and 1000.',
                              'ସର୍ବାଧିକ ପରିମାଣ ହେଉଛି ୧୦୦୦ କ୍ୱିଣ୍ଟାଲ | ଦୟାକରି ୧ ରୁ ୧୦୦୦ ମଧ୍ୟରେ ଏକ ମୂଲ୍ୟ ପ୍ରବେଶ କରନ୍ତୁ |'
                            )
                          );
                          setProjectionQuantity(1000);
                        } else if (numValue < 0) {
                          setProjectionQuantity(0);
                        } else {
                          setProjectionQuantity(numValue);
                        }
                      }}
                      onBlur={(e) => {
                        // Only validate if there's a value, allow empty
                        if (e.target.value === '' || e.target.value === null || e.target.value === undefined) {
                          setProjectionQuantity('');
                          return;
                        }
                        const quantity = typeof projectionQuantity === 'number' ? projectionQuantity : parseFloat(e.target.value) || 0;
                        if (quantity > 1000) {
                          setProjectionQuantity(1000);
                        } else if (quantity < 0) {
                          setProjectionQuantity(0);
                        } else {
                          // Keep the value as is (could be 0 or empty)
                          setProjectionQuantity(quantity);
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('Maximum quantity allowed is 1000 quintals to prevent number overflow.', 'ସଂଖ୍ୟା ଓଭରଫ୍ଲୋ ରୋକିବା ପାଇଁ ସର୍ବାଧିକ ଅନୁମୋଦିତ ପରିମାଣ ହେଉଛି ୧୦୦୦ କ୍ୱିଣ୍ଟାଲ |')}
                    </p>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        const quantity = typeof projectionQuantity === 'number' ? projectionQuantity : 0;
                        if (quantity > 0) {
                          const proj = getProfitProjections(selectedCrop, quantity, retailerLocation);
                          setProjections(proj);
                        } else {
                          // Clear projections if quantity is zero or empty
                          setProjections([]);
                        }
                      }}
                      disabled={typeof projectionQuantity === 'string' || projectionQuantity === 0}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('Calculate', 'ଗଣନା କରନ୍ତୁ')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {projections.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {t('Profit Projections by Processor', 'ପ୍ରକ୍ରିୟାକରଣ ଅନୁସାରେ ଲାଭ ପ୍ରକ୍ଷେପଣ')}
                </h3>
                {projections.map((proj) => (
                  <div key={proj.processorId} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{proj.processorName}</h4>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin size={14} className="mr-1" />
                          <span>{proj.distance.toFixed(1)} km {t('away', 'ଦୂରରେ')}</span>
                          <span className="mx-2">•</span>
                          <span>{proj.cropType}</span>
                          <span className="mx-2">•</span>
                          <span>{proj.quantity} {t('quintals', 'କ୍ୱିଣ୍ଟାଲ')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${proj.profit > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          ₹{Math.max(0, proj.profit).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {Math.max(0, proj.profitMargin).toFixed(1)}% {t('margin', 'ମାର୍ଜିନ୍')}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">{t('Purchase Price', 'କ୍ରୟ ମୂଲ୍ୟ')}</p>
                        <p className="text-sm font-semibold text-gray-900">₹{proj.purchasePrice.toLocaleString()}/qtl</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">{t('Selling Price', 'ବିକ୍ରୟ ମୂଲ୍ୟ')}</p>
                        <p className="text-sm font-semibold text-gray-900">₹{proj.sellingPrice.toLocaleString()}/qtl</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">{t('Total Cost', 'ମୋଟ ମୂଲ୍ୟ')}</p>
                        <p className="text-sm font-semibold text-gray-900">₹{proj.totalCost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">{t('Revenue', 'ଆୟ')}</p>
                        <p className="text-sm font-semibold text-green-700">₹{proj.revenue.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">{t('Logistics Cost:', 'ଲଜିଷ୍ଟିକ୍ସ ମୂଲ୍ୟ:')}</span>
                          <span className="ml-2">
                            ₹{proj.transportCost.toLocaleString()} ({t('transport', 'ପରିବହନ')}) + 
                            ₹{proj.handlingCost.toLocaleString()} ({t('handling', 'ହ୍ୟାଣ୍ଡଲିଂ')}) + 
                            ₹{proj.storageCost.toLocaleString()} ({t('storage', 'ଗଚ୍ଛିତ')})
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedProjection(proj);
                            setShowProjectionDetails(true);
                          }}
                          className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center"
                        >
                          {t('View Details', 'ବିବରଣୀ ଦେଖନ୍ତୁ')}
                          <ArrowRight size={14} className="ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {projections.length === 0 && (
              <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
                <Calculator size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {typeof projectionQuantity === 'number' && projectionQuantity > 0
                    ? t('Click "Calculate" to see profit projections', 'ଲାଭ ପ୍ରକ୍ଷେପଣ ଦେଖିବା ପାଇଁ "ଗଣନା କରନ୍ତୁ" କ୍ଲିକ୍ କରନ୍ତୁ')
                    : t('Enter a quantity greater than 0 to calculate profit projections', 'ଲାଭ ପ୍ରକ୍ଷେପଣ ଗଣନା କରିବା ପାଇଁ ୦ ରୁ ଅଧିକ ଏକ ପରିମାଣ ପ୍ରବେଶ କରନ୍ତୁ')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Projection Details Modal */}
      {showProjectionDetails && selectedProjection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {t('Profit Projection Details', 'ଲାଭ ପ୍ରକ୍ଷେପଣ ବିବରଣୀ')}
              </h3>
              <button
                onClick={() => setShowProjectionDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-2">{selectedProjection.processorName}</h4>
                <p className="text-sm text-gray-600">{selectedProjection.cropType} • {selectedProjection.quantity} {t('quintals', 'କ୍ୱିଣ୍ଟାଲ')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">{t('Total Revenue', 'ମୋଟ ଆୟ')}</p>
                  <p className="text-2xl font-bold text-green-700">₹{selectedProjection.revenue.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">{t('Total Cost', 'ମୋଟ ମୂଲ୍ୟ')}</p>
                  <p className="text-2xl font-bold text-red-700">₹{selectedProjection.totalCost.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">{t('Net Profit', 'ନିଟ୍ ଲାଭ')}</p>
                <p className="text-3xl font-bold text-blue-700">₹{Math.max(0, selectedProjection.profit).toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-1">{Math.max(0, selectedProjection.profitMargin).toFixed(2)}% {t('profit margin', 'ଲାଭ ମାର୍ଜିନ୍')}</p>
              </div>

              <div className="border-t pt-4">
                <h5 className="font-bold text-gray-900 mb-3">{t('Cost Breakdown', 'ମୂଲ୍ୟ ବିଭାଜନ')}</h5>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('Purchase Cost', 'କ୍ରୟ ମୂଲ୍ୟ')}</span>
                    <span className="font-semibold">₹{Math.max(0, selectedProjection.quantity * selectedProjection.purchasePrice).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('Transport Cost', 'ପରିବହନ ମୂଲ୍ୟ')}</span>
                    <span className="font-semibold">₹{selectedProjection.transportCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('Handling Cost', 'ହ୍ୟାଣ୍ଡଲିଂ ମୂଲ୍ୟ')}</span>
                    <span className="font-semibold">₹{selectedProjection.handlingCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('Storage Cost', 'ଗଚ୍ଛିତ ମୂଲ୍ୟ')}</span>
                    <span className="font-semibold">₹{selectedProjection.storageCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h5 className="font-bold text-gray-900 mb-3">{t('Logistics Information', 'ଲଜିଷ୍ଟିକ୍ସ ସୂଚନା')}</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('Distance', 'ଦୂରତା')}</span>
                    <span className="font-semibold">{selectedProjection.distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('Estimated Delivery Days', 'ଅନୁମାନିତ ବିତରଣ ଦିନ')}</span>
                    <span className="font-semibold">{selectedProjection.estimatedDeliveryDays} {t('days', 'ଦିନ')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowProjectionDetails(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                {t('Close', 'ବନ୍ଦ କରନ୍ତୁ')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetailerDashboard;
