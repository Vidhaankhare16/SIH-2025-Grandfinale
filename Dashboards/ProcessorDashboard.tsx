import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  ShoppingCart, CheckCircle, XCircle, Clock, Truck, MapPin, TrendingUp, IndianRupee, BarChart3, Package, 
  FileText, AlertCircle, Calendar, Filter, Search, Download, Eye, Check, X, Activity, Cloud, Navigation
} from 'lucide-react';
import { getProcessorData, PurchaseOrder, QualityRecord, ProcessorFinancials, Shipment, MarketIntelligence } from '../services/processorService';
import { getAllFPOSalesOffers, acceptFPOSalesOffer, rejectFPOSalesOffer, FPOSalesOffer, subscribeToSalesOffers } from '../services/fpoProcessorSalesService';

declare const L: any;

interface ProcessorDashboardProps {
  userId?: string;
  lang?: string;
}

const ProcessorDashboard: React.FC<ProcessorDashboardProps> = ({ userId = 'processor_1', lang = 'en' }) => {
  const [activeTab, setActiveTab] = useState<'purchases' | 'quality' | 'finance' | 'logistics' | 'market'>('purchases');
  
  // Translation helper
  const t = (en: string, or: string) => lang === 'en' ? en : or;
  
  // Data states
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [qualityRecords, setQualityRecords] = useState<QualityRecord[]>([]);
  const [financials, setFinancials] = useState<ProcessorFinancials | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [marketData, setMarketData] = useState<MarketIntelligence | null>(null);
  const [fpoSalesOffers, setFpoSalesOffers] = useState<FPOSalesOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<FPOSalesOffer | null>(null);
  
  // UI states
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<QualityRecord | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      const data = getProcessorData(userId);
      setPurchaseOrders(data.purchaseOrders);
      setQualityRecords(data.qualityRecords);
      setFinancials(data.financials);
      setShipments(data.shipments);
      setMarketData(data.marketIntelligence);
      
      // Load FPO sales offers
      try {
        const offers = await getAllFPOSalesOffers();
        setFpoSalesOffers(offers);
      } catch (error) {
        console.error('Error loading FPO sales offers:', error);
        setFpoSalesOffers([]);
      }
    };
    
    loadData();
  }, [userId]);
  
  // Refresh FPO offers with real-time subscription
  useEffect(() => {
    const loadOffers = async () => {
      try {
        const offers = await getAllFPOSalesOffers();
        setFpoSalesOffers(offers);
      } catch (error) {
        console.error('Error loading FPO sales offers:', error);
        setFpoSalesOffers([]);
      }
    };
    
    loadOffers();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToSalesOffers((updatedOffers) => {
      console.log('Real-time update: Sales offers updated for processor', updatedOffers);
      setFpoSalesOffers(updatedOffers);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Initialize map for logistics
  useEffect(() => {
    if (activeTab === 'logistics' && mapContainerRef.current && !mapInstanceRef.current) {
      // Check if Leaflet is loaded
      if (typeof L === 'undefined') {
        console.warn('Leaflet library not loaded. Please ensure Leaflet is included in index.html');
        return;
      }

      mapInstanceRef.current = L.map(mapContainerRef.current).setView([20.2961, 85.8245], 8);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Add shipment markers
      shipments.forEach(shipment => {
        const marker = L.marker([shipment.source.location.lat, shipment.source.location.lng]).addTo(mapInstanceRef.current);
        marker.bindPopup(`
          <strong>${shipment.source.name}</strong><br>
          Crop: ${shipment.cropType}<br>
          Quantity: ${shipment.quantity} qtl<br>
          Status: ${shipment.status}
        `);
      });
    }

    // Cleanup map when tab changes
    return () => {
      if (activeTab !== 'logistics' && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab, shipments]);

  // Filter purchase orders
  const filteredOrders = purchaseOrders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.cropType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle order actions
  const handleAcceptOrder = (orderId: string) => {
    setPurchaseOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'accepted' as const } : order
    ));
  };

  const handleRejectOrder = (orderId: string) => {
    setPurchaseOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'rejected' as const } : order
    ));
  };

  // Calculate statistics
  const purchaseStats = {
    total: purchaseOrders.length,
    pending: purchaseOrders.filter(o => o.status === 'pending').length,
    accepted: purchaseOrders.filter(o => o.status === 'accepted').length,
    inTransit: purchaseOrders.filter(o => o.status === 'in-transit').length,
    totalValue: purchaseOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  };

  const qualityStats = {
    total: qualityRecords.length,
    passed: qualityRecords.filter(q => q.status === 'passed').length,
    failed: qualityRecords.filter(q => q.status === 'failed').length,
    conditional: qualityRecords.filter(q => q.status === 'conditional').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('Processor Dashboard', 'ପ୍ରକ୍ରିୟାକରଣ ଡ୍ୟାସବୋର୍ଡ୍')}</h1>
              <p className="text-sm text-gray-600">{t('Manage purchases, quality, finances, and supply chain', 'କିଣାମେଲା, ଗୁଣବତ୍ତା, ଅର୍ଥ, ଏବଂ ସପ୍ଲାଇ ଚେନ୍ ପରିଚାଳନା କରନ୍ତୁ')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'purchases'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} />
                {t('Purchases', 'କିଣାମେଲା')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('quality')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'quality'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={18} />
                {t('Quality Control', 'ଗୁଣବତ୍ତା ନିୟନ୍ତ୍ରଣ')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'finance'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <IndianRupee size={18} />
                {t('Finances', 'ଅର୍ଥ')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('logistics')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'logistics'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Truck size={18} />
                {t('Logistics', 'ଲଜିଷ୍ଟିକ୍ସ')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('market')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'market'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={18} />
                {t('Market Intelligence', 'ବଜାର ବୁଦ୍ଧିମତା')}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Purchase & Procurement Management */}
        {activeTab === 'purchases' && (
          <div className="space-y-6">
            {/* FPO Sales Offers Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={24} className="text-green-600" />
                {t('FPO Sales Offers', 'FPO ବିକ୍ରୟ ଅଫର୍')}
                <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                  {fpoSalesOffers.filter(o => o.status === 'pending').length} {t('New', 'ନୂତନ')}
                </span>
              </h2>
              
              {fpoSalesOffers.filter(o => o.status === 'pending').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>{t('No new FPO sales offers available', 'କୌଣସି ନୂତନ FPO ବିକ୍ରୟ ଅଫର୍ ଉପଲବ୍ଧ ନାହିଁ')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fpoSalesOffers
                    .filter(o => o.status === 'pending')
                    .map((offer) => (
                      <div key={offer.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 border-2 border-green-200 hover:border-green-400 transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                              {offer.cropType} - {offer.quantity} quintals
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-gray-600">{t('FPO:', 'FPO:')}</span>
                                <span className="font-bold ml-1">{offer.fpoName}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">{t('Price:', 'ମୂଲ୍ୟ:')}</span>
                                <span className="font-bold text-green-700 ml-1">₹{offer.pricePerQuintal.toLocaleString()}/qtl</span>
                              </div>
                              <div>
                                <span className="text-gray-600">{t('Quality:', 'ଗୁଣବତ୍ତା:')}</span>
                                <span className="font-bold ml-1">{offer.quality}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">{t('Total:', 'ମୋଟ:')}</span>
                                <span className="font-bold text-green-700 ml-1">₹{offer.totalValue.toLocaleString()}</span>
                              </div>
                            </div>
                            {offer.warehouseName && (
                              <div className="text-sm text-gray-600 mt-2">
                                <span className="font-semibold">{t('Warehouse:', 'ଗୋଦାମ:')}</span> {offer.warehouseName}
                              </div>
                            )}
                            {offer.notes && (
                              <div className="text-sm text-gray-600 mt-1 italic">
                                "{offer.notes}"
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={async () => {
                              try {
                                const processorName = userId === 'processor_1' ? 'Odisha Oil Processors Ltd' : 'Bhubaneswar Processing Unit';
                                acceptFPOSalesOffer(offer.id, userId, processorName);
                                const updatedOffers = await getAllFPOSalesOffers();
                                setFpoSalesOffers(updatedOffers);
                                alert(t('Offer accepted! FPO will see this in real-time.', 'ଅଫର୍ ଗ୍ରହଣ କରାଗଲା! FPO ଏହାକୁ ରିଅଲ-ଟାଇମରେ ଦେଖିବେ |'));
                              } catch (error) {
                                console.error('Error accepting offer:', error);
                                alert(t('Failed to accept offer. Please try again.', 'ଅଫର୍ ଗ୍ରହଣ କରିବାରେ ବିଫଳ | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |'));
                              }
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                          >
                            <Check size={18} />
                            {t('Accept Offer', 'ଅଫର୍ ଗ୍ରହଣ କରନ୍ତୁ')}
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(t('Reject this offer?', 'ଏହି ଅଫର୍ ପ୍ରତ୍ୟାଖ୍ୟାନ କରିବେ?'))) {
                                try {
                                  rejectFPOSalesOffer(offer.id);
                                  const updatedOffers = await getAllFPOSalesOffers();
                                  setFpoSalesOffers(updatedOffers);
                                  alert(t('Offer rejected.', 'ଅଫର୍ ପ୍ରତ୍ୟାଖ୍ୟାନ କରାଗଲା |'));
                                } catch (error) {
                                  console.error('Error rejecting offer:', error);
                                  alert(t('Failed to reject offer. Please try again.', 'ଅଫର୍ ପ୍ରତ୍ୟାଖ୍ୟାନ କରିବାରେ ବିଫଳ | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |'));
                                }
                              }
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                          >
                            <X size={18} />
                            {t('Reject', 'ପ୍ରତ୍ୟାଖ୍ୟାନ')}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Total Orders</div>
                <div className="text-2xl font-bold text-gray-900">{purchaseStats.total}</div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 shadow-sm">
                <div className="text-sm text-yellow-700 mb-1">Pending</div>
                <div className="text-2xl font-bold text-yellow-700">{purchaseStats.pending}</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200 shadow-sm">
                <div className="text-sm text-green-700 mb-1">Accepted</div>
                <div className="text-2xl font-bold text-green-700">{purchaseStats.accepted}</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                <div className="text-sm text-blue-700 mb-1">In Transit</div>
                <div className="text-2xl font-bold text-blue-700">{purchaseStats.inTransit}</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 shadow-sm">
                <div className="text-sm text-purple-700 mb-1">Total Value</div>
                <div className="text-2xl font-bold text-purple-700">₹{(purchaseStats.totalValue / 100000).toFixed(1)}L</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by order number, supplier, or crop..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="in-transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Qtl</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                          <div className="text-xs text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.supplierName}</div>
                          <div className="text-xs text-gray-500">{order.supplierType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.cropType}</div>
                          <div className="text-xs text-gray-500">{order.quality}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.quantity} qtl</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{order.pricePerQuintal.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{order.totalAmount.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            order.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {order.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptOrder(order.id)}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1"
                              >
                                <Check size={16} /> Accept
                              </button>
                              <button
                                onClick={() => handleRejectOrder(order.id)}
                                className="text-red-600 hover:text-red-900 flex items-center gap-1"
                              >
                                <X size={16} /> Reject
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-900 flex items-center gap-1"
                          >
                            <Eye size={16} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Quality Control & Certification */}
        {activeTab === 'quality' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Total Tests</div>
                <div className="text-2xl font-bold text-gray-900">{qualityStats.total}</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200 shadow-sm">
                <div className="text-sm text-green-700 mb-1">Passed</div>
                <div className="text-2xl font-bold text-green-700">{qualityStats.passed}</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200 shadow-sm">
                <div className="text-sm text-red-700 mb-1">Failed</div>
                <div className="text-2xl font-bold text-red-700">{qualityStats.failed}</div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 shadow-sm">
                <div className="text-sm text-yellow-700 mb-1">Conditional</div>
                <div className="text-2xl font-bold text-yellow-700">{qualityStats.conditional}</div>
              </div>
            </div>

            {/* Quality Records */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Quality Test Records</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moisture</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oil Content</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certifications</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {qualityRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.batchNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(record.testDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.parameters.moisture}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.parameters.oilContent}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {record.certification.fssai && <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">FSSAI</span>}
                            {record.certification.organic && <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Organic</span>}
                            {record.certification.other?.map((cert, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">{cert}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            record.status === 'passed' ? 'bg-green-100 text-green-800' :
                            record.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedQuality(record);
                              setShowQualityModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-900 text-sm"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Financial Dashboard */}
        {activeTab === 'finance' && financials && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
                <div className="text-3xl font-bold text-green-600">₹{(financials.totalRevenue / 100000).toFixed(1)}L</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-2">Total Costs</div>
                <div className="text-3xl font-bold text-red-600">₹{(financials.totalCosts / 100000).toFixed(1)}L</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-2">Net Profit</div>
                <div className="text-3xl font-bold text-blue-600">₹{(financials.netProfit / 100000).toFixed(1)}L</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-2">Profit Margin</div>
                <div className="text-3xl font-bold text-purple-600">{((financials.netProfit / financials.totalRevenue) * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Cost Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Raw Materials', value: financials.costBreakdown.rawMaterials },
                        { name: 'Processing', value: financials.costBreakdown.processing },
                        { name: 'Overhead', value: financials.costBreakdown.overhead },
                        { name: 'Logistics', value: financials.costBreakdown.logistics }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {['#8884d8', '#82ca9d', '#ffc658', '#ff7300'].map((color, idx) => (
                        <Cell key={`cell-${idx}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `₹${(value / 1000).toFixed(0)}K`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Status</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm text-gray-700">Pending Payments (to suppliers)</span>
                    <span className="font-bold text-yellow-700">₹{(financials.paymentStatus.pendingPayments / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-700">Pending Receivables (from customers)</span>
                    <span className="font-bold text-blue-700">₹{(financials.paymentStatus.pendingReceivables / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-700">Paid This Month</span>
                    <span className="font-bold text-green-700">₹{(financials.paymentStatus.paidThisMonth / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-700">Received This Month</span>
                    <span className="font-bold text-green-700">₹{(financials.paymentStatus.receivedThisMonth / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {financials.transactions.map((txn, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{new Date(txn.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            txn.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {txn.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{txn.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{txn.description}</td>
                        <td className={`px-4 py-3 text-sm font-medium ${
                          txn.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Supply Chain & Logistics */}
        {activeTab === 'logistics' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Total Shipments</div>
                <div className="text-2xl font-bold text-gray-900">{shipments.length}</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                <div className="text-sm text-blue-700 mb-1">In Transit</div>
                <div className="text-2xl font-bold text-blue-700">{shipments.filter(s => s.status === 'in-transit').length}</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200 shadow-sm">
                <div className="text-sm text-green-700 mb-1">Delivered</div>
                <div className="text-2xl font-bold text-green-700">{shipments.filter(s => s.status === 'delivered').length}</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 shadow-sm">
                <div className="text-sm text-purple-700 mb-1">Total Logistics Cost</div>
                <div className="text-2xl font-bold text-purple-700">₹{(shipments.reduce((sum, s) => sum + s.estimatedCost, 0) / 1000).toFixed(0)}K</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Shipments List */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Active Shipments</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {shipments.map((shipment) => (
                    <div key={shipment.id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-medium text-gray-900">{shipment.source.name}</div>
                          <div className="text-sm text-gray-500">{shipment.cropType} • {shipment.quantity} qtl</div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          shipment.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                          shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {shipment.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Truck size={16} />
                        <span>{shipment.vehicleNumber}</span>
                      </div>
                      {shipment.route && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Navigation size={16} />
                          <span>{shipment.route}</span>
                        </div>
                      )}
                      <div className="mt-3 text-sm">
                        <span className="text-gray-600">Est. Cost: </span>
                        <span className="font-medium text-gray-900">₹{shipment.estimatedCost.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Shipment Tracking Map</h3>
                </div>
                <div ref={mapContainerRef} className="h-96 w-full" />
              </div>
            </div>
          </div>
        )}

        {/* Market Intelligence */}
        {activeTab === 'market' && marketData && (
          <div className="space-y-6">
            {/* Current Prices */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Current Market Prices</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(marketData.currentPrices).map(([crop, price]) => (
                  <div key={crop} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">{crop}</div>
                    <div className="text-2xl font-bold text-gray-900">₹{price.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">per quintal</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Trends */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Price Trends (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={marketData.priceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Line type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} name="Market Price" />
                  <Line type="monotone" dataKey="msp" stroke="#82ca9d" strokeWidth={2} name="MSP" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Demand Forecast & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Demand Forecast</h3>
                <div className="space-y-3">
                  {Object.entries(marketData.demandForecast).map(([crop, demand]) => (
                    <div key={crop} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">{crop}</span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        demand === 'High' ? 'bg-green-100 text-green-800' :
                        demand === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {demand}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Best Purchase/Sell Times</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Best Purchase Time</h4>
                    <div className="space-y-2">
                      {Object.entries(marketData.bestPurchaseTime).map(([crop, time]) => (
                        <div key={crop} className="text-sm">
                          <span className="font-medium text-gray-900">{crop}:</span>
                          <span className="text-gray-600 ml-2">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Best Sell Time</h4>
                    <div className="space-y-2">
                      {Object.entries(marketData.bestSellTime).map(([product, time]) => (
                        <div key={product} className="text-sm">
                          <span className="font-medium text-gray-900">{product}:</span>
                          <span className="text-gray-600 ml-2">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Order Number</div>
                  <div className="font-medium text-gray-900">{selectedOrder.orderNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="font-medium text-gray-900">{selectedOrder.status}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Supplier</div>
                  <div className="font-medium text-gray-900">{selectedOrder.supplierName} ({selectedOrder.supplierType})</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Crop Type</div>
                  <div className="font-medium text-gray-900">{selectedOrder.cropType} ({selectedOrder.quality})</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Quantity</div>
                  <div className="font-medium text-gray-900">{selectedOrder.quantity} quintals</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Price per Quintal</div>
                  <div className="font-medium text-gray-900">₹{selectedOrder.pricePerQuintal.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="font-medium text-gray-900">₹{selectedOrder.totalAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Expected Delivery</div>
                  <div className="font-medium text-gray-900">{new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString()}</div>
                </div>
              </div>
              {selectedOrder.notes && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Notes</div>
                  <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quality Detail Modal */}
      {showQualityModal && selectedQuality && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Quality Test Details</h3>
              <button onClick={() => setShowQualityModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Batch Number</div>
                  <div className="font-medium text-gray-900">{selectedQuality.batchNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Test Date</div>
                  <div className="font-medium text-gray-900">{new Date(selectedQuality.testDate).toLocaleDateString()}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Test Parameters</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Moisture</div>
                    <div className="text-lg font-bold text-gray-900">{selectedQuality.parameters.moisture}%</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Oil Content</div>
                    <div className="text-lg font-bold text-gray-900">{selectedQuality.parameters.oilContent}%</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Foreign Matter</div>
                    <div className="text-lg font-bold text-gray-900">{selectedQuality.parameters.foreignMatter}%</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Damaged Seeds</div>
                    <div className="text-lg font-bold text-gray-900">{selectedQuality.parameters.damagedSeeds}%</div>
                  </div>
                  {selectedQuality.parameters.aflatoxin && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Aflatoxin</div>
                      <div className="text-lg font-bold text-gray-900">{selectedQuality.parameters.aflatoxin} ppb</div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-3">Certifications</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedQuality.certification.fssai && (
                    <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">FSSAI Certified</span>
                  )}
                  {selectedQuality.certification.organic && (
                    <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg font-medium">Organic Certified</span>
                  )}
                  {selectedQuality.certification.other?.map((cert, idx) => (
                    <span key={idx} className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium">{cert}</span>
                  ))}
                </div>
              </div>

              {selectedQuality.remarks && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Remarks</div>
                  <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedQuality.remarks}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessorDashboard;

