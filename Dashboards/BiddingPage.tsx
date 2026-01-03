import React, { useState, useEffect } from 'react';
import { ArrowLeft, Gavel, ShoppingCart, CheckCircle, X, TrendingUp, Sparkles, Loader } from 'lucide-react';
import { createFarmerListing, getFarmerListings, acceptBid, rejectBid, getAllListings, subscribeToBids } from '../services/biddingService';
import { FarmerListing, Bid, PricePrediction } from '../types';
import { getUserById } from '../services/authService';
import { getFarmerData } from '../services/farmerService';
import { predictPrice } from '../services/pricePredictionService';
import { validatePrice } from '../services/inputValidationService';

// MSP values (Minimum Support Price) - Official 2024-25 rates
const mspValues: Record<string, number> = {
  'Groundnut': 6377,
  'Mustard': 5450,
  'Soybean': 4300,
  'Sunflower': 6400,
  'Sesame': 7800,
};

interface BiddingPageProps {
  lang: string;
  location: string;
  userId?: string;
  onBack: () => void;
}

const BiddingPage: React.FC<BiddingPageProps> = ({ lang, location, userId = 'farmer_1', onBack }) => {
  // Translation helper
  const t = (en: string, or: string) => lang === 'en' ? en : or;
  const [myListings, setMyListings] = useState<FarmerListing[]>([]);
  
  // Load user-specific data
  useEffect(() => {
    const loadInitialData = async () => {
      const farmerData = getFarmerData(userId);
      // Initialize with user's existing listings
      const allListings = await getAllListings();
      const existingListings = allListings.filter(l => l.farmerId === userId);
      setMyListings(existingListings.length > 0 ? existingListings : farmerData.listings);
    };
    loadInitialData();
  }, [userId]);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [newListing, setNewListing] = useState({
    cropName: 'Groundnut',
    quantity: 0,
    minimumPrice: 0,
    quality: 'Organic' as 'Organic' | 'Chemical Based',
    expectedHarvestDate: '',
  });
  const [pricePrediction, setPricePrediction] = useState<PricePrediction | null>(null);
  const [predictingPrice, setPredictingPrice] = useState(false);
  const [pricePredictionLoaded, setPricePredictionLoaded] = useState(false);
  
  const crops = ['Groundnut', 'Mustard', 'Soybean', 'Sunflower', 'Sesame'];
  const user = getUserById(userId);
  const farmerId = userId;
  const farmerName = user?.name || 'Farmer';

  // Load farmer listings and user-specific data
  useEffect(() => {
    const loadListings = async () => {
      const listings = await getFarmerListings(farmerId);
      const farmerData = getFarmerData(userId);
      // Merge existing listings with user's default listings
      const existingListings = listings.length > 0 ? listings : farmerData.listings;
      setMyListings(existingListings);
    };
    
    loadListings();
    
    // Subscribe to real-time bid updates for all farmer's listings
    const unsubscribeFunctions: (() => void)[] = [];
    
    const setupSubscriptions = async () => {
      const listings = await getFarmerListings(farmerId);
      listings.forEach(listing => {
        const unsubscribe = subscribeToBids(listing.id, (updatedBids) => {
          setMyListings(prevListings => 
            prevListings.map(l => 
              l.id === listing.id ? { ...l, bids: updatedBids } : l
            )
          );
        });
        unsubscribeFunctions.push(unsubscribe);
      });
    };
    
    setupSubscriptions();
    
    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }, [userId, farmerId]);

  // Load saved price prediction when crop changes
  useEffect(() => {
    if (newListing.cropName) {
      try {
        const savedPrediction = localStorage.getItem('farmerPricePrediction');
        const savedCrop = localStorage.getItem('farmerPricePredictionCrop');
        if (savedPrediction && savedCrop === newListing.cropName) {
          const prediction = JSON.parse(savedPrediction) as PricePrediction;
          setPricePrediction(prediction);
          // Auto-populate minimum price with predicted price if not already set
          if (newListing.minimumPrice === 0 && prediction.predictedPrice > 0) {
            setNewListing(prev => ({ ...prev, minimumPrice: Math.round(prediction.predictedPrice) }));
          }
          setPricePredictionLoaded(true);
        } else {
          setPricePrediction(null);
          setPricePredictionLoaded(false);
        }
      } catch (error) {
        console.error('Error loading price prediction:', error);
        setPricePrediction(null);
        setPricePredictionLoaded(false);
      }
    }
  }, [newListing.cropName]);

  // Handle crop change - reset price prediction
  const handleCropChange = (cropName: string) => {
    setNewListing({ ...newListing, cropName, minimumPrice: 0 });
    setPricePrediction(null);
    setPricePredictionLoaded(false);
  };

  // Predict price for the selected crop
  const handlePredictPrice = async () => {
    if (!newListing.cropName || !location) {
      alert(lang === 'en' ? 'Please select a crop and ensure location is available' : 'ଦୟାକରି ଏକ ଫସଲ ବାଛନ୍ତୁ ଏବଂ ସ୍ଥାନ ଉପଲବ୍ଧ ଅଛି ନିଶ୍ଚିତ କରନ୍ତୁ');
      return;
    }

    setPredictingPrice(true);
    try {
      const harvestDate = newListing.expectedHarvestDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const prediction = await predictPrice(newListing.cropName, location, harvestDate);
      setPricePrediction(prediction);
      
      // Auto-populate minimum price with predicted price
      if (prediction && prediction.predictedPrice && prediction.predictedPrice > 0) {
        setNewListing(prev => ({ ...prev, minimumPrice: Math.round(prediction.predictedPrice) }));
      }
      
      // Save to localStorage
      localStorage.setItem('farmerPricePrediction', JSON.stringify(prediction));
      localStorage.setItem('farmerPricePredictionCrop', newListing.cropName);
      
      setPricePredictionLoaded(true);
    } catch (error) {
      console.error('Error predicting price:', error);
      alert(lang === 'en' ? 'Failed to predict price. Please try again.' : 'ମୂଲ୍ୟ ଭବିଷ୍ୟବାଣୀ କରିବାରେ ବିଫଳ | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |');
    } finally {
      setPredictingPrice(false);
    }
  };

  const handleCreateListing = async () => {
    if (!newListing.cropName || newListing.quantity <= 0 || newListing.minimumPrice <= 0) {
      alert(lang === 'en' ? 'Please fill all required fields' : 'ଦୟାକରି ସମସ୍ତ ଆବଶ୍ୟକ କ୍ଷେତ୍ର ପୂରଣ କରନ୍ତୁ');
      return;
    }

    try {
      const listing = await createFarmerListing({
        farmerId,
        farmerName,
        cropName: newListing.cropName,
        quantity: newListing.quantity,
        minimumPrice: newListing.minimumPrice,
        quality: newListing.quality,
        location,
        expectedHarvestDate: newListing.expectedHarvestDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });

      setMyListings([...myListings, listing]);
      setNewListing({
        cropName: 'Groundnut',
        quantity: 0,
        minimumPrice: 0,
        quality: 'Organic',
        expectedHarvestDate: '',
      });
      setShowCreateListing(false);
      alert(lang === 'en' ? 'Listing created successfully! FPOs will see it in real-time.' : 'ତାଲିକା ସଫଳତାର ସହିତ ସୃଷ୍ଟି ହୋଇଛି! FPO ମାନେ ଏହାକୁ ରିଅଲ-ଟାଇମରେ ଦେଖିବେ |');
    } catch (error) {
      console.error('Error creating listing:', error);
      alert(lang === 'en' ? 'Failed to create listing. Please try again.' : 'ତାଲିକା ସୃଷ୍ଟି କରିବାରେ ବିଫଳ | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |');
    }
  };

  const handleAcceptBid = (listingId: string, bidId: string) => {
    if (acceptBid(listingId, bidId)) {
      const listings = getFarmerListings(farmerId);
      setMyListings(listings);
      alert(lang === 'en' ? 'Bid accepted!' : 'ବିଡ୍ ଗ୍ରହଣ କରାଗଲା!');
    }
  };

  const handleRejectBid = (listingId: string, bidId: string) => {
    if (rejectBid(listingId, bidId)) {
      const listings = getFarmerListings(farmerId);
      setMyListings(listings);
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
                {lang === 'en' ? 'Bidding System' : 'ବିଡିଂ ସିଷ୍ଟମ୍'}
              </h1>
              <p className="text-sm text-gray-600">
                {lang === 'en' ? 'List your produce and receive bids from FPOs' : 'ଆପଣଙ୍କର ଉତ୍ପାଦନ ତାଲିକା କରନ୍ତୁ ଏବଂ FPO ମାନଙ୍କଠାରୁ ବିଡ୍ ପାଆନ୍ତୁ'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Gavel size={24} className="text-enam-green" />
              {lang === 'en' ? 'My Listings' : 'ମୋର ତାଲିକା'}
            </h2>
            <button
              onClick={() => setShowCreateListing(true)}
              className="bg-enam-green hover:bg-enam-dark text-white px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
            >
              <ShoppingCart size={18} />
              {lang === 'en' ? 'Create Listing' : 'ତାଲିକା ସୃଷ୍ଟି କରନ୍ତୁ'}
            </button>
          </div>

          {/* Create Listing Form */}
          {showCreateListing && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-enam-green">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {lang === 'en' ? 'Create New Listing' : 'ନୂତନ ତାଲିକା ସୃଷ୍ଟି କରନ୍ତୁ'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {lang === 'en' ? 'Crop' : 'ଫସଲ'} *
                  </label>
                  <select
                    value={newListing.cropName}
                    onChange={(e) => handleCropChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                  >
                    {crops.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {lang === 'en' ? 'Quantity (quintals)' : 'ପରିମାଣ (କ୍ୱିଣ୍ଟାଲ)'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newListing.quantity || ''}
                    onChange={(e) => setNewListing({ ...newListing, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-700">
                      {lang === 'en' ? 'Minimum Price (₹/quintal)' : 'ସର୍ବନିମ୍ନ ମୂଲ୍ୟ (₹/କ୍ୱିଣ୍ଟାଲ)'} *
                    </label>
                    <button
                      type="button"
                      onClick={handlePredictPrice}
                      disabled={predictingPrice || !newListing.cropName}
                      className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {predictingPrice ? (
                        <>
                          <Loader size={14} className="animate-spin" />
                          {lang === 'en' ? 'Predicting...' : 'ଭବିଷ୍ୟବାଣୀ...'}
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          {lang === 'en' ? 'AI Price Predictor' : 'AI ମୂଲ୍ୟ ଭବିଷ୍ୟବାଣୀ'}
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="number"
                    min="1000"
                    max="25000"
                    step="10"
                    value={newListing.minimumPrice || ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '' || inputValue === null) {
                        setNewListing({ ...newListing, minimumPrice: 0 });
                        return;
                      }
                      const numValue = parseFloat(inputValue);
                      if (numValue > 25000) {
                        alert(t('Maximum price per quintal is ₹25,000', 'ପ୍ରତି କ୍ୱିଣ୍ଟାଲରେ ସର୍ବାଧିକ ମୂଲ୍ୟ ₹୨୫,୦୦୦'));
                        setNewListing({ ...newListing, minimumPrice: 25000 });
                        return;
                      }
                      const validation = validatePrice(inputValue);
                      if (validation.valid && validation.sanitized <= 25000) {
                        setNewListing({ ...newListing, minimumPrice: validation.sanitized });
                      }
                    }}
                    onBlur={(e) => {
                      const numValue = parseFloat(e.target.value);
                      if (!e.target.value || numValue < 1000) {
                        setNewListing({ ...newListing, minimumPrice: 1000 });
                      } else if (numValue > 25000) {
                        setNewListing({ ...newListing, minimumPrice: 25000 });
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    placeholder={lang === 'en' ? 'Enter minimum price or use AI predictor' : 'ସର୍ବନିମ୍ନ ମୂଲ୍ୟ ପ୍ରବେଶ କରନ୍ତୁ କିମ୍ବା AI ଭବିଷ୍ୟବାଣୀ ବ୍ୟବହାର କରନ୍ତୁ'}
                  />
                  {pricePrediction && pricePredictionLoaded && pricePrediction.predictedPrice && (
                    <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-purple-600" />
                          <span className="text-xs font-semibold text-gray-700">
                            {lang === 'en' ? 'AI Predicted Price:' : 'AI ଭବିଷ୍ୟବାଣୀ ମୂଲ୍ୟ:'}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-purple-700">
                          ₹{pricePrediction.predictedPrice?.toLocaleString() || '0'}/qtl
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {(() => {
                          const msp = mspValues[newListing.cropName] || 0;
                          return lang === 'en' 
                            ? `Trend: ${pricePrediction.trend || 'N/A'} | MSP: ₹${msp.toLocaleString()}/qtl`
                            : `ପ୍ରବୃତ୍ତି: ${pricePrediction.trend || 'N/A'} | MSP: ₹${msp.toLocaleString()}/qtl`;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {lang === 'en' ? 'Quality' : 'ଗୁଣବତ୍ତା'}
                  </label>
                  <select
                    value={newListing.quality}
                    onChange={(e) => setNewListing({ ...newListing, quality: e.target.value as 'Organic' | 'Chemical Based' })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                  >
                    <option value="Organic">{lang === 'en' ? 'Organic' : 'ଜୈବିକ'}</option>
                    <option value="Chemical Based">{lang === 'en' ? 'Chemical Based' : 'ରାସାୟନିକ ଆଧାରିତ'}</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {lang === 'en' ? 'Expected Harvest Date' : 'ଆଶାକୃତ କଟାଣ ତାରିଖ'}
                  </label>
                  <input
                    type="date"
                    value={newListing.expectedHarvestDate}
                    onChange={(e) => setNewListing({ ...newListing, expectedHarvestDate: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCreateListing}
                  className="bg-enam-green hover:bg-enam-dark text-white px-6 py-3 rounded-lg font-bold transition"
                >
                  {lang === 'en' ? 'Create Listing' : 'ତାଲିକା ସୃଷ୍ଟି କରନ୍ତୁ'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateListing(false);
                    setNewListing({
                      cropName: 'Groundnut',
                      quantity: 0,
                      minimumPrice: 0,
                      quality: 'Organic',
                      expectedHarvestDate: '',
                    });
                    setPricePrediction(null);
                    setPricePredictionLoaded(false);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold transition"
                >
                  {lang === 'en' ? 'Cancel' : 'ବାତିଲ୍'}
                </button>
              </div>
            </div>
          )}

          {/* Listings */}
          {myListings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart size={48} className="mx-auto mb-4 text-gray-400" />
              <p>
                {lang === 'en' 
                  ? 'No listings yet. Create your first listing to start receiving bids from FPOs.'
                  : 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ତାଲିକା ନାହିଁ | FPO ମାନଙ୍କଠାରୁ ବିଡ୍ ପାଇବା ପାଇଁ ଆପଣଙ୍କର ପ୍ରଥମ ତାଲିକା ସୃଷ୍ଟି କରନ୍ତୁ |'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myListings.map((listing) => (
                <div key={listing.id} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {listing.cropName} - {listing.quantity} qtl
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          {lang === 'en' ? 'Min Price:' : 'ସର୍ବନିମ୍ନ ମୂଲ୍ୟ:'} ₹{listing.minimumPrice.toLocaleString()}/qtl
                        </span>
                        <span>
                          {lang === 'en' ? 'Quality:' : 'ଗୁଣବତ୍ତା:'} {listing.quality}
                        </span>
                        <span>
                          {lang === 'en' ? 'Harvest:' : 'କଟାଣ:'} {new Date(listing.expectedHarvestDate).toLocaleDateString()}
                        </span>
                        <span className={`px-3 py-1 rounded-full font-bold ${
                          listing.status === 'active' ? 'bg-green-100 text-green-700' :
                          listing.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {listing.status === 'active' ? t('Active', 'ସକ୍ରିୟ') :
                           listing.status === 'sold' ? t('Sold', 'ବିକ୍ରି') :
                           t('Closed', 'ବନ୍ଦ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">
                        {lang === 'en' ? 'Total Value' : 'ମୋଟ ମୂଲ୍ୟ'}
                      </div>
                      <div className="text-xl font-bold text-enam-green">
                        ₹{(listing.quantity * listing.minimumPrice).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Bids */}
                  {listing.bids && listing.bids.length > 0 ? (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <h4 className="font-bold text-gray-900 mb-3">
                        {lang === 'en' ? 'Bids Received' : 'ପ୍ରାପ୍ତ ବିଡ୍'} ({listing.bids.length})
                      </h4>
                      <div className="space-y-3">
                        {listing.bids
                          .sort((a, b) => b.bidPrice - a.bidPrice)
                          .map((bid) => (
                            <div key={bid.id} className="bg-white rounded-lg p-4 border-2 border-gray-200">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-bold text-gray-900 mb-1">{bid.fpoName}</div>
                                  <div className="text-sm text-gray-600 mb-2">
                                    {lang === 'en' ? 'Bid:' : 'ବିଡ୍:'} ₹{bid.bidPrice.toLocaleString()}/qtl
                                    {lang === 'en' ? ' for' : ' ପାଇଁ'} {bid.quantity} qtl
                                  </div>
                                  {bid.message && (
                                    <p className="text-sm text-gray-700 italic">"{bid.message}"</p>
                                  )}
                                  <div className="text-xs text-gray-500 mt-2">
                                    {new Date(bid.createdAt).toLocaleString()}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {listing.status === 'active' && bid.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleAcceptBid(listing.id, bid.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-1"
                                      >
                                        <CheckCircle size={16} />
                                        {lang === 'en' ? 'Accept' : 'ଗ୍ରହଣ କରନ୍ତୁ'}
                                      </button>
                                      <button
                                        onClick={() => handleRejectBid(listing.id, bid.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-1"
                                      >
                                        <X size={16} />
                                        {lang === 'en' ? 'Reject' : 'ପ୍ରତ୍ୟାଖ୍ୟାନ କରନ୍ତୁ'}
                                      </button>
                                    </>
                                  )}
                                  {bid.status === 'accepted' && (
                                    <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm">
                                      {lang === 'en' ? 'Accepted' : 'ଗ୍ରହଣ କରାଯାଇଛି'}
                                    </span>
                                  )}
                                  {bid.status === 'rejected' && (
                                    <span className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold text-sm">
                                      {lang === 'en' ? 'Rejected' : 'ପ୍ରତ୍ୟାଖ୍ୟାନ କରାଯାଇଛି'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : listing.status === 'active' ? (
                    <div className="mt-4 pt-4 border-t border-gray-300 text-center text-gray-500">
                      {lang === 'en' ? 'No bids yet. FPOs will see your listing and can place bids.' : 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ବିଡ୍ ନାହିଁ | FPO ମାନେ ଆପଣଙ୍କର ତାଲିକା ଦେଖିବେ ଏବଂ ବିଡ୍ ଦେଇପାରିବେ |'}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BiddingPage;

