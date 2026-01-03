
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { X, BrainCircuit, Map as MapIcon, Plus, Save, Truck, Package, Gavel, TrendingUp, Users, IndianRupee, Warehouse as WarehouseIcon, TrendingDown, Activity, BarChart3, Navigation, Car, MapPin, ArrowRight, Sprout } from 'lucide-react';
import { Warehouse, Farm, FarmerListing, ConnectedFarmer, FPOFinance, Vehicle, LogisticsAssignment } from '../types';
import { getAllListings, createBid, subscribeToListings, subscribeToAllBids } from '../services/biddingService';
import { getConnectedFarmers, getFPOFinance, getFPOData } from '../services/fpoService';
import { findNearestWarehouse, findNearestFarmers, assignFarmersToWarehouses, generateRoute, calculateDistance, findOptimalRoute, calculateLogisticsCost as calculateLogisticsCostService, LogisticsCost, Location } from '../services/pathfindingService';
import { createFPOSalesOffer, getFPOSalesOffers, deleteFPOSalesOffer, FPOSalesOffer, subscribeToFPOSalesOffers } from '../services/fpoProcessorSalesService';
import { sanitizeText } from '@/services/inputValidationService';

declare const L: any;

// Route Visualizer Component
const RouteVisualizer: React.FC<{ route: string; lang: string }> = ({ route, lang }) => {
  const t = (en: string, or: string) => lang === 'en' ? en : or;
  
  // Parse route string: "Farm Ramesh (Khordha) (Groundnut, 4.8 MT) -> WH-Bhubaneswar-Alpha -> Farm Anita (Konark) (Mustard, 7.2 MT) -> WH-Puri-South"
  const parseRoute = (routeStr: string) => {
    const parts = routeStr.split('->').map(p => p.trim());
    const steps: Array<{ type: 'farm' | 'warehouse'; name: string; location?: string; crop?: string; quantity?: string; icon: any }> = [];
    
    parts.forEach((part, idx) => {
      if (part.toLowerCase().startsWith('farm')) {
        // Farm format: "Farm Ramesh (Khordha) (Groundnut, 4.8 MT)"
        const farmMatch = part.match(/Farm\s+([^(]+)\s*\(([^)]+)\)(?:\s*\(([^)]+)\))?/);
        if (farmMatch) {
          const farmerName = farmMatch[1].trim();
          const location = farmMatch[2].trim();
          const cropInfo = farmMatch[3]?.trim() || '';
          const cropMatch = cropInfo.match(/([^,]+),\s*([\d.]+)\s*MT/);
          
          steps.push({
            type: 'farm',
            name: farmerName,
            location: location,
            crop: cropMatch ? cropMatch[1].trim() : '',
            quantity: cropMatch ? `${cropMatch[2]} MT` : '',
            icon: Sprout
          });
        }
      } else if (part.toLowerCase().startsWith('wh-') || part.toLowerCase().includes('warehouse')) {
        // Warehouse format: "WH-Bhubaneswar-Alpha"
        steps.push({
          type: 'warehouse',
          name: part,
          icon: WarehouseIcon
        });
      }
    });
    
    return steps;
  };
  
  const steps = parseRoute(route);
  
  if (steps.length === 0) {
    return (
      <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
        {route}
      </div>
    );
  }
  
  return (
    <div className="relative pl-6 space-y-4">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-400 via-blue-400 to-green-500"></div>
      
      {steps.map((step, idx) => {
        const isFarm = step.type === 'farm';
        const isLast = idx === steps.length - 1;
        const bgColor = isFarm ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200';
        const iconColor = isFarm ? 'text-orange-600' : 'text-blue-600';
        const dotColor = isFarm ? 'bg-orange-400' : 'bg-blue-500';
        const Icon = step.icon;
        
        return (
          <div key={idx} className="relative">
            {/* Dot indicator */}
            <div className={`absolute -left-[29px] top-2 w-5 h-5 rounded-full ${dotColor} border-2 border-white shadow-lg flex items-center justify-center z-10`}>
              <Icon size={12} className="text-white" />
            </div>
            
            {/* Step card */}
            <div className={`${bgColor} rounded-lg p-3 border-2 shadow-sm hover:shadow-md transition`}>
              <div className="flex items-start gap-3">
                <div className={`${iconColor} shrink-0 mt-0.5`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-gray-900 mb-1">{step.name}</div>
                  {step.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                      <MapPin size={12} />
                      {step.location}
                    </div>
                  )}
                  {step.crop && (
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <span className="px-2 py-0.5 bg-white rounded text-xs font-semibold text-gray-700 border border-gray-200">
                        {step.crop}
                      </span>
                      {step.quantity && (
                        <span className="px-2 py-0.5 bg-white rounded text-xs font-bold text-green-700 border border-green-300">
                          {step.quantity}
                        </span>
                      )}
                    </div>
                  )}
                  {!step.crop && (
                    <div className="text-xs text-gray-500 mt-1">
                      {t('Warehouse', 'ଗୋଦାମ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Arrow connector (except for last item) */}
            {!isLast && (
              <div className="flex justify-center my-1">
                <ArrowRight size={16} className="text-gray-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface FPODashboardProps {
  initialTab?: 'overview' | 'logistics' | 'bidding' | 'finances' | 'fleet' | 'sell';
  userId?: string;
  lang?: string;
}

const FPODashboard: React.FC<FPODashboardProps> = ({ initialTab = 'overview', userId = 'fpo_1', lang = 'en' }) => {
  // Translation helper
  const t = (en: string, or: string) => lang === 'en' ? en : or;
  const [activeTab, setActiveTab] = useState<'overview' | 'logistics' | 'bidding' | 'finances' | 'fleet' | 'sell'>(initialTab);

  // Track previous initialTab to detect changes from parent
  const prevInitialTab = useRef(initialTab);
  
  // Update activeTab only when initialTab prop changes from parent (e.g., when clicking Home)
  useEffect(() => {
    if (prevInitialTab.current !== initialTab) {
      setActiveTab(initialTab);
      prevInitialTab.current = initialTab;
    }
  }, [initialTab]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState(0); // For slider: positive = add, negative = reduce
  const mapInstanceRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(true);
  
  // Connected farmers and finance
  const [connectedFarmers, setConnectedFarmers] = useState<ConnectedFarmer[]>([]);
  const [fpoFinance, setFpoFinance] = useState<FPOFinance | null>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<ConnectedFarmer | null>(null);
  const [selectedFarmerRoute, setSelectedFarmerRoute] = useState<{ path: Location[]; distance: number } | null>(null);
  const [selectedFarmerLogistics, setSelectedFarmerLogistics] = useState<LogisticsCost | null>(null);
  const [selectedFarmerWarehouse, setSelectedFarmerWarehouse] = useState<Warehouse | null>(null);
  const routePolylineRef = useRef<any>(null);

  // Initial Data - Realistic warehouse capacities and utilization
  const [warehouses, setWarehouses] = useState<Warehouse[]>([
    { id: '1', name: 'WH-Bhubaneswar-Alpha', location: { lat: 20.2961, lng: 85.8245 }, capacity: 1250, utilization: 892, cropType: ['Groundnut'], lastUpdated: '2h ago' },
    { id: '2', name: 'WH-Cuttack-Central', location: { lat: 20.4625, lng: 85.8828 }, capacity: 1800, utilization: 485, cropType: ['Soybean'], lastUpdated: '1d ago' },
    { id: '3', name: 'WH-Puri-South', location: { lat: 19.8135, lng: 85.8312 }, capacity: 1650, utilization: 1248, cropType: ['Mustard'], lastUpdated: '4h ago' },
  ]);

  const [newWhName, setNewWhName] = useState('');
  const [newWhCap, setNewWhCap] = useState(1000);
  
  // Bidding state
  const [farmerListings, setFarmerListings] = useState<FarmerListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<FarmerListing | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState(0);
  const [bidQuantity, setBidQuantity] = useState(0);
  const [bidMessage, setBidMessage] = useState('');
  const fpoId = userId;
  const fpoName = userId === 'fpo_1' ? 'Odisha FPO Cooperative' : 'Bhubaneswar FPO';
  
  // Sales to Processor state
  const [salesOffers, setSalesOffers] = useState<FPOSalesOffer[]>([]);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [newSalesOffer, setNewSalesOffer] = useState({
    cropType: 'Groundnut',
    quantity: 0,
    pricePerQuintal: 0,
    quality: 'Organic' as 'Organic' | 'Chemical Based',
    warehouseId: '',
    notes: '',
  });

  // Logistics cost per km for different vehicle types (in ₹)
  // Based on real-world Indian agricultural transport costs including fuel, driver wages, maintenance, and return trip
  const logisticsCostPerKm: Record<'truck' | 'tractor' | 'tempo', number> = {
    truck: 35,    // For quantities over 60 quintals - Large trucks with higher fuel consumption and driver costs
    tractor: 22,  // For quantities 30-60 quintals - Tractors with trailers, moderate fuel consumption
    tempo: 14,    // For quantities under 30 quintals - Small vehicles, lower capacity but still significant costs
  };

  // Determine vehicle type based on quantity
  const getVehicleTypeForQuantity = (quantity: number): 'truck' | 'tractor' | 'tempo' => {
    if (quantity > 60) return 'truck';
    if (quantity >= 30) return 'tractor';
    return 'tempo';
  };

  // Calculate logistics cost for a bid
  const calculateLogisticsCost = (quantity: number, farmerLocation?: { lat: number; lng: number }): {
    vehicleType: 'truck' | 'tractor' | 'tempo';
    distance: number;
    costPerKm: number;
    totalCost: number;
    warehouseName: string;
  } | null => {
    if (!farmerLocation || warehouses.length === 0) {
      return null;
    }

    // Find nearest warehouse
    const nearest = findNearestWarehouse(farmerLocation, warehouses.map(w => ({
      id: w.id,
      name: w.name,
      location: w.location,
      capacity: w.capacity,
      utilization: w.utilization,
    })));

    if (!nearest) return null;

    const vehicleType = getVehicleTypeForQuantity(quantity);
    const costPerKm = logisticsCostPerKm[vehicleType];
    const distance = nearest.distance;
    // To and fro = distance * 2
    const totalCost = distance * 2 * costPerKm;

    return {
      vehicleType,
      distance,
      costPerKm,
      totalCost,
      warehouseName: nearest.warehouseName,
    };
  };

  // Calculate logistics info for bid modal
  const bidLogisticsInfo = useMemo(() => {
    if (!selectedListing || !showBidModal) return null;
    const farmer = connectedFarmers.find(f => f.name === selectedListing.farmerName);
    const farmerLocation = farmer?.coordinates ? { lat: farmer.coordinates.lat, lng: farmer.coordinates.lng } : undefined;
    return calculateLogisticsCost(bidQuantity || selectedListing.quantity, farmerLocation);
  }, [selectedListing, showBidModal, bidQuantity, connectedFarmers, warehouses]);

  // Fleet Management State - loaded from user-specific service
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [assignments, setAssignments] = useState<LogisticsAssignment[]>([
    { id: 'a1', vehicleId: 'v2', vehicleNumber: 'OD-01-CD-5678', quantity: 60, source: { type: 'farm', id: 'f1', name: 'Ramesh Farm (Khordha)', location: { lat: 20.1961, lng: 85.7245 } }, destination: { type: 'warehouse', id: '1', name: 'WH-Bhubaneswar-Alpha', location: { lat: 20.2961, lng: 85.8245 } }, cropType: 'Groundnut', status: 'in-transit', assignedDate: '2024-01-15T08:00:00', estimatedArrival: '2024-01-15T10:30:00', priority: 'high' },
    { id: 'a2', vehicleId: 'v4', vehicleNumber: 'OD-01-GH-3456', quantity: 85, source: { type: 'warehouse', id: '2', name: 'WH-Cuttack-Central', location: { lat: 20.4625, lng: 85.8828 } }, destination: { type: 'processor', id: 'p1', name: 'Odisha Oil Processors', location: { lat: 20.3500, lng: 85.9000 } }, cropType: 'Soybean', status: 'loading', assignedDate: '2024-01-15T09:00:00', estimatedArrival: '2024-01-15T11:00:00', priority: 'medium' },
  ]);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicleNumber: '',
    type: 'truck' as 'truck' | 'tractor' | 'tempo',
    brand: '',
    capacity: 0,
    driverName: '',
    driverPhone: '',
  });
  const [newAssignment, setNewAssignment] = useState({
    quantity: 0,
    sourceId: '',
    destinationId: '',
    cropType: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
  });

  const farms: Farm[] = [
    { id: 'f1', farmerName: 'Ramesh (Khordha)', location: { lat: 20.1961, lng: 85.7245 }, crop: 'Groundnut', harvestReady: true, quantity: 4.8 },
    { id: 'f2', farmerName: 'Suresh (Jajpur)', location: { lat: 20.8625, lng: 86.1828 }, crop: 'Soybean', harvestReady: false, quantity: 1.9 },
    { id: 'f3', farmerName: 'Anita (Konark)', location: { lat: 19.8835, lng: 86.0912 }, crop: 'Mustard', harvestReady: true, quantity: 7.2 },
  ];

  const productionData = [
    { name: 'Jan', tonnes: 400 },
    { name: 'Feb', tonnes: 300 },
    { name: 'Mar', tonnes: 550 },
    { name: 'Apr', tonnes: 800 },
    { name: 'May', tonnes: 600 },
  ];

  useEffect(() => {
    return () => { setIsMounted(false); };
  }, []);


  // Load user-specific data
  useEffect(() => {
    // Check if this is a newly created user (not in predefined list: fpo_1 or fpo_2)
    // New users (e.g., fpo_1234567890) should start with empty data
    const isPredefinedUser = userId === 'fpo_1' || userId === 'fpo_2';
    
    if (!isPredefinedUser && userId.startsWith('fpo_')) {
      // New FPO account - start with completely empty data (no warehouses, no capital, no farmers, no fleet)
      setConnectedFarmers([]);
      setFpoFinance({
        totalFunds: 0,
        availableFunds: 0,
        committedFunds: 0,
        pendingPayments: 0,
        revenue: 0,
        expenses: 0,
        profit: 0,
        transactions: [],
      });
      setWarehouses([]);
      setVehicles([]);
    } else {
      // Existing/predefined user - load their data
      const fpoData = getFPOData(userId);
      setConnectedFarmers(fpoData.connectedFarmers);
      setFpoFinance(fpoData.finances);
      setWarehouses(fpoData.warehouses);
      setVehicles(fpoData.vehicles);
    }
  }, [userId]);

  // Load farmer listings for bidding and profit calculations with real-time updates
  useEffect(() => {
    const loadListings = async () => {
      const listings = await getAllListings();
      setFarmerListings(listings);
    };
    
    loadListings();
    
    // Subscribe to real-time listing updates
    const unsubscribe = subscribeToListings((updatedListings) => {
      console.log('Real-time update: New listings received', updatedListings);
      setFarmerListings(updatedListings);
    });
    
    // Subscribe to bid changes to refresh listings
    const unsubscribeBids = subscribeToAllBids(() => {
      console.log('Real-time update: Bid changed, refreshing listings');
      loadListings();
    });
    
    return () => {
      unsubscribe();
      unsubscribeBids();
    };
  }, [activeTab]); // Load on any tab change to ensure data is available

  // Load FPO sales offers with real-time updates
  useEffect(() => {
    const loadSalesOffers = async () => {
      const offers = await getFPOSalesOffers(fpoId);
      setSalesOffers(offers);
    };
    
    loadSalesOffers();
    
    // Subscribe to real-time sales offer updates for this FPO
    const unsubscribe = subscribeToFPOSalesOffers(fpoId, (updatedOffers) => {
      console.log('Real-time update: Sales offers updated', updatedOffers);
      setSalesOffers(updatedOffers);
    });
    
    return () => {
      unsubscribe();
    };
  }, [fpoId, activeTab]);

  // Map Initialization for Overview and Logistics
  useEffect(() => {
    if (activeTab !== 'logistics' && activeTab !== 'overview') {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
        if (mapContainerRef.current && typeof L !== 'undefined') {
          // Remove existing map if it exists
          if (mapInstanceRef.current) {
            // Clear route if exists
            if (routePolylineRef.current) {
              mapInstanceRef.current.removeLayer(routePolylineRef.current);
              routePolylineRef.current = null;
            }
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
          
          // Clear route state when map is reinitialized
          setSelectedFarmerRoute(null);
          setSelectedFarmerLogistics(null);
          setSelectedFarmerWarehouse(null);
          setSelectedFarmer(null);

          const map = L.map(mapContainerRef.current).setView([20.2961, 85.8245], 9);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

          // Add Warehouse Markers
          warehouses.forEach(w => {
            const utilizationPercent = (w.utilization / w.capacity) * 100;
            const color = utilizationPercent >= 90 ? '#ef4444' : utilizationPercent >= 70 ? '#f59e0b' : '#10b981';
            const icon = L.divIcon({
                className: 'custom-icon',
                html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`
            });
            const marker = L.marker([w.location.lat, w.location.lng], {icon}).addTo(map);
            const available = w.capacity - w.utilization;
            marker.bindPopup(`
              <b>${w.name}</b><br>
              Capacity: ${w.capacity} MT<br>
              Used: ${w.utilization} MT<br>
              Available: ${available} MT<br>
              Utilization: ${utilizationPercent.toFixed(0)}%<br>
              Crops: ${w.cropType.join(', ') || 'None'}
            `);
            marker.on('click', () => {
              setSelectedWarehouse(w);
              setStockAdjustment(0);
            });
          });

          // Add Connected Farmer Markers and shortest paths to warehouses
          if (activeTab === 'logistics' && connectedFarmers.length > 0) {
            // Use sample locations for farmers (in production, these would come from farmer data)
            const farmerLocations: Record<string, { lat: number; lng: number }> = {
              'Khordha': { lat: 20.1961, lng: 85.7245 },
              'Cuttack': { lat: 20.4625, lng: 85.8828 },
              'Puri': { lat: 19.8135, lng: 85.8312 },
              'Ganjam': { lat: 19.3144, lng: 85.0500 },
              'Bhadrak': { lat: 21.0544, lng: 86.5014 },
              'Jajpur': { lat: 20.8625, lng: 86.1828 },
            };

            // Assign farmers to nearest warehouses using shortest path algorithm
            const farmersWithLocations = connectedFarmers.map(f => ({
              id: f.id,
              name: f.name,
              location: farmerLocations[f.district] || { lat: 20.2961 + Math.random() * 0.5, lng: 85.8245 + Math.random() * 0.5 }
            }));

            const assignments = assignFarmersToWarehouses(farmersWithLocations, warehouses);

            // Draw paths and markers
            assignments.forEach(assignment => {
              if (assignment.assignedWarehouseId) {
                const farmerLoc = assignment.farmerLocation;
                const warehouse = warehouses.find(w => w.id === assignment.assignedWarehouseId);
                
                if (warehouse) {
                  // Add farmer marker
                  const farmerIcon = L.divIcon({
                    className: 'custom-icon',
                    html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`
                  });
                  const farmerMarker = L.marker([farmerLoc.lat, farmerLoc.lng], {icon: farmerIcon}).addTo(map);
                  
                  // Find farmer data for production quantity
                  const farmerData = connectedFarmers.find(cf => cf.name === assignment.farmerName);
                  const productionQuantity = farmerData?.production || 0;
                  
                  farmerMarker.bindPopup(`
                    <b>${assignment.farmerName}</b><br>
                    Nearest Warehouse: ${assignment.assignedWarehouseName}<br>
                    Distance: ${assignment.distance.toFixed(2)} km<br>
                    Production: ${productionQuantity} qtl<br>
                    <small>Click for optimized route</small>
                  `);
                  
                  // Add click handler to show optimized route using A*
                  farmerMarker.on('click', () => {
                    // Find optimal route using A* algorithm
                    const optimalRoute = findOptimalRoute(
                      farmerLoc,
                      warehouse.location,
                      warehouses.map(w => ({ id: w.id, name: w.name, location: w.location }))
                    );
                    
                    // Calculate logistics cost
                    const logistics = calculateLogisticsCostService(productionQuantity, optimalRoute.distance, farmerLoc);
                    
                    // Store route and logistics info
                    setSelectedFarmerRoute(optimalRoute);
                    setSelectedFarmerLogistics(logistics);
                    setSelectedFarmerWarehouse(warehouse);
                    setSelectedFarmer(farmerData || null);
                    
                    // Remove previous route if exists
                    if (routePolylineRef.current && mapInstanceRef.current) {
                      mapInstanceRef.current.removeLayer(routePolylineRef.current);
                      routePolylineRef.current = null;
                    }
                    
                    // Draw optimized route
                    const routePolyline = L.polyline(optimalRoute.path.map(p => [p.lat, p.lng]), {
                      color: '#10b981',
                      weight: 4,
                      opacity: 0.8,
                      dashArray: '10, 5'
                    }).addTo(map);
                    routePolylineRef.current = routePolyline;
                    mapInstanceRef.current = map;
                    
                    // Add start and end markers
                    L.marker([farmerLoc.lat, farmerLoc.lng], {
                      icon: L.divIcon({
                        className: 'custom-icon',
                        html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`
                      })
                    }).addTo(map).bindPopup(`<b>Start: ${assignment.farmerName}</b>`);
                    
                    L.marker([warehouse.location.lat, warehouse.location.lng], {
                      icon: L.divIcon({
                        className: 'custom-icon',
                        html: `<div style="background-color: #10b981; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`
                      })
                    }).addTo(map).bindPopup(`<b>Destination: ${warehouse.name}</b>`);
                    
                    // Add distance label at midpoint
                    const midPoint = optimalRoute.path[Math.floor(optimalRoute.path.length / 2)];
                    L.marker([midPoint.lat, midPoint.lng], {
                      icon: L.divIcon({
                        className: 'distance-label',
                        html: `<div style="background: #10b981; color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${optimalRoute.distance.toFixed(1)} km</div>`,
                        iconSize: [80, 24],
                        iconAnchor: [40, 12]
                      })
                    }).addTo(map);
                    
                    // Fit map to show entire route
                    const bounds = L.latLngBounds(optimalRoute.path.map(p => [p.lat, p.lng]));
                    map.fitBounds(bounds, { padding: [50, 50] });
                  });

                  // Draw initial path line from farmer to nearest warehouse (dashed, less prominent)
                  const route = generateRoute(farmerLoc, warehouse.location, 10);
                  const polyline = L.polyline(route.map(p => [p.lat, p.lng]), {
                    color: '#93c5fd',
                    weight: 1,
                    opacity: 0.3,
                    dashArray: '5, 5'
                  }).addTo(map);
                }
              }
            });
          } else if (activeTab === 'overview' && connectedFarmers.length > 0) {
            // Just show farmers without paths on overview
            const farmerLocations: Record<string, { lat: number; lng: number }> = {
              'Khordha': { lat: 20.1961, lng: 85.7245 },
              'Cuttack': { lat: 20.4625, lng: 85.8828 },
              'Puri': { lat: 19.8135, lng: 85.8312 },
              'Ganjam': { lat: 19.3144, lng: 85.0500 },
              'Bhadrak': { lat: 21.0544, lng: 86.5014 },
              'Jajpur': { lat: 20.8625, lng: 86.1828 },
            };

            connectedFarmers.forEach(f => {
              const loc = farmerLocations[f.district] || { lat: 20.2961 + Math.random() * 0.5, lng: 85.8245 + Math.random() * 0.5 };
              const icon = L.divIcon({
                  className: 'custom-icon',
                  html: `<div style="background-color: #3b82f6; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`
              });
              L.marker([loc.lat, loc.lng], {icon}).addTo(map)
               .bindPopup(`
                 <b>${f.name}</b><br>
                 ${f.location}<br>
                 Crop: ${f.cropType}<br>
                 Production: ${f.production} qtl<br>
                 Revenue: ₹${f.revenue.toLocaleString()}
               `);
            });
          }

          // Add Farm Markers (only on logistics tab, not in warehouse management section)
          // Note: This is for the route optimization section
          if (activeTab === 'logistics') {
            farms.forEach(f => {
              const icon = L.divIcon({
                  className: 'custom-icon',
                  html: `<div style="background-color: #f39c12; width: 8px; height: 8px; border-radius: 50%;"></div>`
              });
              L.marker([f.location.lat, f.location.lng], {icon}).addTo(map)
               .bindPopup(`<b>Farmer: ${f.farmerName}</b><br>Crop: ${f.crop} (${f.quantity}T)`);
            });
          }

          mapInstanceRef.current = map;
        }
    }, 200);

    return () => {
        clearTimeout(timer);
        if (mapInstanceRef.current && (activeTab !== 'logistics' && activeTab !== 'overview')) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, [activeTab, warehouses, connectedFarmers]);

  const handleAddWarehouse = () => {
      const newWh: Warehouse = {
          id: Date.now().toString(),
          name: newWhName,
          capacity: newWhCap,
          utilization: 0,
          location: { lat: 20.2961 + (Math.random() - 0.5) * 0.5, lng: 85.8245 + (Math.random() - 0.5) * 0.5 }, // Random nearby location for demo
          cropType: [],
          lastUpdated: 'Just now'
      };
      setWarehouses([...warehouses, newWh]);
      setShowAddModal(false);
      setNewWhName('');
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('FPO Command Center', 'FPO କମାଣ୍ଡ ସେଣ୍ଟର')}</h2>
            <p className="text-gray-500 text-sm">{t('Odisha Zone • Logistics', 'ଓଡ଼ିଶା ଜୋନ୍ • ଲଜିଷ୍ଟିକ୍ସ')}</p>
         </div>
         <div className="flex flex-wrap gap-2 w-full md:w-auto">
             {activeTab === 'logistics' && (
               <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 bg-govt-orange text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-orange-600 transition"
               >
                  <Plus size={16} /> Add Warehouse
               </button>
             )}
             <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-enam-dark text-white shadow' : 'text-gray-500'}`}
                >
                {t('Overview', 'ସମୀକ୍ଷା')}
                </button>
                <button 
                onClick={() => setActiveTab('logistics')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'logistics' ? 'bg-enam-dark text-white shadow' : 'text-gray-500'}`}
                >
                {t('Warehouses', 'ଗୋଦାମ')}
                </button>
                <button 
                onClick={() => setActiveTab('fleet')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${activeTab === 'fleet' ? 'bg-enam-dark text-white shadow' : 'text-gray-500'}`}
                >
                <Car size={14} /> {t('Fleet', 'ଯାନବାହାନ')}
                </button>
                <button 
                onClick={() => setActiveTab('finances')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${activeTab === 'finances' ? 'bg-enam-dark text-white shadow' : 'text-gray-500'}`}
                >
                <IndianRupee size={14} /> {t('Finances', 'ଅର୍ଥ')}
                </button>
                <button 
                onClick={() => setActiveTab('bidding')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${activeTab === 'bidding' ? 'bg-enam-dark text-white shadow' : 'text-gray-500'}`}
                >
                <Gavel size={14} /> {t('Bidding', 'ବିଡିଂ')}
                </button>
                <button 
                onClick={() => setActiveTab('sell')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${activeTab === 'sell' ? 'bg-enam-dark text-white shadow' : 'text-gray-500'}`}
                >
                <Package size={14} /> {t('Sell to Processor', 'ପ୍ରୋସେସରକୁ ବିକ୍ରୟ')}
                </button>
            </div>
         </div>
      </div>

      {activeTab === 'overview' && (
        <div id="fpo-overview" className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Users size={24} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                  {connectedFarmers.filter(f => f.status === 'active').length} {t('Active', 'ସକ୍ରିୟ')}
                </span>
              </div>
              <div className="text-3xl font-bold text-blue-900">{connectedFarmers.length}</div>
              <div className="text-sm text-blue-700 font-semibold">{t('Connected Farmers', 'ସଂଯୋଗିତ କୃଷକ')}</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <WarehouseIcon size={24} className="text-orange-600" />
                <span className="text-xs font-bold text-orange-700 bg-orange-200 px-2 py-1 rounded-full">
                  {warehouses.reduce((sum, w) => sum + w.utilization, 0)}/{warehouses.reduce((sum, w) => sum + w.capacity, 0)} MT
                </span>
              </div>
              <div className="text-3xl font-bold text-orange-900">{warehouses.length}</div>
              <div className="text-sm text-orange-700 font-semibold">{t('Warehouses', 'ଗୋଦାମ')}</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp size={24} className="text-green-600" />
                <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded-full">
                  {t('Projected', 'ପ୍ରକ୍ଷେପିତ')}
                </span>
              </div>
              <div className="text-3xl font-bold text-green-900">
                ₹{(() => {
                  // Calculate total projected profit from all listings
                  const totalProjectedProfit = farmerListings.reduce((sum, listing) => {
                    const farmer = connectedFarmers.find(f => f.name === listing.farmerName);
                    const farmerLocation = farmer?.coordinates ? { lat: farmer.coordinates.lat, lng: farmer.coordinates.lng } : undefined;
                    const logistics = calculateLogisticsCost(listing.quantity, farmerLocation);
                    const logisticsCost = logistics?.totalCost || 0;
                    const suggestedPrice = listing.minimumPrice * 1.05;
                    const purchaseCost = listing.quantity * suggestedPrice;
                    const estimatedSalePrice = listing.minimumPrice * 1.15;
                    const revenue = listing.quantity * estimatedSalePrice;
                    const profit = revenue - purchaseCost - logisticsCost;
                    return sum + (profit > 0 ? profit : 0);
                  }, 0);
                  return (totalProjectedProfit / 100000).toFixed(1);
                })()}L
              </div>
              <div className="text-sm text-green-700 font-semibold">{t('Max Profit Potential', 'ସର୍ବାଧିକ ଲାଭ ସମ୍ଭାବନା')}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <IndianRupee size={24} className="text-purple-600" />
                <span className="text-xs font-bold text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
                  {t('Net', 'ନିଟ୍')}
                </span>
              </div>
              <div className="text-3xl font-bold text-purple-900">
                ₹{fpoFinance ? (fpoFinance.profit / 100000).toFixed(1) : '0.0'}L
              </div>
              <div className="text-sm text-purple-700 font-semibold">{t('Current Profit', 'ବର୍ତ୍ତମାନର ଲାଭ')}</div>
            </div>
          </div>

          {/* Connected Farmers & EDA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Connected Farmers List */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users size={24} className="text-blue-600" />
                  {t('Connected Farmers', 'ସଂଯୋଗିତ କୃଷକ')} ({connectedFarmers.length})
                </h3>
              </div>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {connectedFarmers.map((farmer) => (
                  <div 
                    key={farmer.id} 
                    className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 hover:border-blue-300 transition cursor-pointer"
                    onClick={() => setSelectedFarmer(farmer)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">{farmer.name}</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                          <div><span className="font-semibold">{t('Location:', 'ସ୍ଥାନ:')}</span> {farmer.location}</div>
                          <div><span className="font-semibold">{t('Crop:', 'ଫସଲ:')}</span> {farmer.cropType}</div>
                          <div><span className="font-semibold">{t('Acreage:', 'ଏକର:')}</span> {farmer.acreage} {t('acres', 'ଏକର')}</div>
                          <div><span className="font-semibold">{t('Production:', 'ଉତ୍ପାଦନ:')}</span> {farmer.production} qtl</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          farmer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {farmer.status}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {t('Score:', 'ସ୍କୋର:')} {farmer.engagementScore}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">{t('Revenue:', 'ଆୟ:')}</span>
                        <span className="font-bold text-green-600 ml-1">₹{farmer.revenue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('Profit:', 'ଲାଭ:')}</span>
                        <span className="font-bold text-blue-600 ml-1">₹{farmer.profit.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('Transactions:', 'ଲେଖାଲେଖି:')}</span>
                        <span className="font-bold text-purple-600 ml-1">{farmer.totalTransactions}</span>
                      </div>
                    </div>
                    {farmer.coordinates && (() => {
                      const logistics = calculateLogisticsCost(farmer.production, farmer.coordinates);
                      if (logistics) {
                        const estimatedPurchaseCost = farmer.production * 6500; // Average purchase price
                        const estimatedSalePrice = 6500 * 1.15; // 15% markup
                        const estimatedRevenue = farmer.production * estimatedSalePrice;
                        const estimatedProfit = estimatedRevenue - estimatedPurchaseCost - logistics.totalCost;
                        return (
                          <div className="mt-2 pt-2 border-t border-gray-300 bg-blue-50 rounded p-2">
                            <div className="text-xs font-bold text-blue-900 mb-1">{t('Profit Projection (with Logistics)', 'ଲାଭ ପ୍ରକ୍ଷେପଣ (ଲଜିଷ୍ଟିକ୍ ସହିତ)')}</div>
                            <div className="flex items-center gap-3 text-xs">
                              <div>
                                <span className="text-gray-600">{t('Logistics:', 'ଲଜିଷ୍ଟିକ୍:')}</span>
                                <span className="font-bold text-blue-700 ml-1">₹{Math.round(logistics.totalCost).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">{t('Est. Profit:', 'ଆନୁମାନିକ ଲାଭ:')}</span>
                                <span className={`font-bold ml-1 ${estimatedProfit > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                  ₹{Math.round(estimatedProfit).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                ))}
              </div>
            </div>

            {/* EDA Analytics */}
            <div className="space-y-6">
              {/* Crop Distribution */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('Crop Distribution', 'ଫସଲ ବିତରଣ')}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        connectedFarmers.reduce((acc, f) => {
                          acc[f.cropType] = (acc[f.cropType] || 0) + f.production;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {['#84c225', '#1a5d1a', '#FF9933', '#138808', '#000080'].map((color, idx) => (
                        <Cell key={`cell-${idx}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* District-wise Stats */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('District-wise Production', 'ଜିଲ୍ଲା-ଉଇଜ୍ ଉତ୍ପାଦନ')}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={Object.entries(
                      connectedFarmers.reduce((acc, f) => {
                        acc[f.district] = (acc[f.district] || 0) + f.production;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([name, value]) => ({ name, value }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#84c225" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Engagement Score Distribution 
                  Engagement Score Logic:
                  - High (80-100%): Highly engaged farmers with frequent transactions (15+), high transaction values (₹15L+), and recent activity (within 1-2 days)
                  - Medium (50-79%): Moderate engagement with regular transactions (6-12), moderate values (₹5L-15L), and activity within 3-7 days
                  - Low (<50%): Low engagement with few transactions (<6), low values (<₹5L), or inactive status
                  Score is calculated based on: Transaction Frequency (40%), Transaction Value (30%), Activity Recency (20%), and Status (10%)
              */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('Engagement Levels', 'ସଂଲଗ୍ନତା ସ୍ତର')}</h3>
                <div className="space-y-2">
                  {[
                    { label: 'High (80-100%)', count: connectedFarmers.filter(f => f.engagementScore >= 80).length, color: 'bg-green-500' },
                    { label: 'Medium (50-79%)', count: connectedFarmers.filter(f => f.engagementScore >= 50 && f.engagementScore < 80).length, color: 'bg-yellow-500' },
                    { label: 'Low (<50%)', count: connectedFarmers.filter(f => f.engagementScore < 50).length, color: 'bg-red-500' },
                  ].map((level) => (
                    <div key={level.label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{level.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${level.color} h-2 rounded-full`}
                            style={{ width: `${(level.count / connectedFarmers.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-8">{level.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>


          {/* Farmer Detail Modal */}
          {selectedFarmer && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedFarmer.name}</h3>
                  <button
                    onClick={() => setSelectedFarmer(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Location</div>
                    <div className="font-bold text-gray-900">{selectedFarmer.location}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">District</div>
                    <div className="font-bold text-gray-900">{selectedFarmer.district}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Crop Type</div>
                    <div className="font-bold text-gray-900">{selectedFarmer.cropType}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Acreage</div>
                    <div className="font-bold text-gray-900">{selectedFarmer.acreage} acres</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                    <div className="text-xl font-bold text-green-600">₹{selectedFarmer.revenue.toLocaleString()}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-gray-600 mb-1">Net Profit</div>
                    <div className="text-xl font-bold text-blue-600">₹{selectedFarmer.profit.toLocaleString()}</div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                  <div className="text-sm text-gray-600 mb-2">Engagement Score</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          selectedFarmer.engagementScore >= 80 ? 'bg-green-500' :
                          selectedFarmer.engagementScore >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${selectedFarmer.engagementScore}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{selectedFarmer.engagementScore}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Transactions</div>
                    <div className="text-2xl font-bold text-gray-900">{selectedFarmer.totalTransactions}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Total Worth</div>
                    <div className="text-2xl font-bold text-purple-600">₹{(selectedFarmer.totalValue / 1000).toFixed(0)}K</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Production</div>
                    <div className="text-2xl font-bold text-orange-600">{selectedFarmer.production} qtl</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'logistics' && (
         <div id="fpo-logistics" className="space-y-6">
            {/* Warehouse Management with Geo-location */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <WarehouseIcon size={24} className="text-orange-600" />
                  Warehouse Management
                </h3>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 bg-govt-orange text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-orange-600 transition"
                >
                  <Plus size={16} /> Add Warehouse
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Warehouse List */}
                <div className="space-y-4">
                  {warehouses.map((warehouse) => {
                    const utilizationPercent = (warehouse.utilization / warehouse.capacity) * 100;
                    const available = warehouse.capacity - warehouse.utilization;
                    return (
                      <div 
                        key={warehouse.id}
                        className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 hover:border-orange-300 transition cursor-pointer"
                        onClick={() => {
                          setSelectedWarehouse(warehouse);
                          setStockAdjustment(0);
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1">{warehouse.name}</h4>
                            <div className="text-xs text-gray-600 mb-2">
                              📍 Lat: {warehouse.location.lat.toFixed(4)}, Lng: {warehouse.location.lng.toFixed(4)}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Capacity:</span>
                                <span className="font-bold ml-1">{warehouse.capacity} MT</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Used:</span>
                                <span className="font-bold ml-1">{warehouse.utilization} MT</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Available:</span>
                                <span className="font-bold text-green-600 ml-1">{available} MT</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              utilizationPercent >= 90 ? 'text-red-600' :
                              utilizationPercent >= 70 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {utilizationPercent.toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-500">Utilization</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full ${
                              utilizationPercent >= 90 ? 'bg-red-500' :
                              utilizationPercent >= 70 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${utilizationPercent}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>Crops: {warehouse.cropType.join(', ') || 'None'}</span>
                          <span>•</span>
                          <span>Updated: {warehouse.lastUpdated || 'Never'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Warehouse Map */}
                <div className="bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300" style={{ minHeight: '400px' }}>
                  <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '400px' }}></div>
                </div>
              </div>
            </div>
         </div>
      )}

      {/* Warehouse Details Modal */}
      {selectedWarehouse && (
        <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-2xl p-6 animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-xl">{selectedWarehouse.name}</h3>
                    <p className="text-xs text-gray-500">Last updated: {selectedWarehouse.lastUpdated}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      📍 Coordinates: {selectedWarehouse.location.lat.toFixed(6)}, {selectedWarehouse.location.lng.toFixed(6)}
                    </p>
                </div>
                <button onClick={() => setSelectedWarehouse(null)}><X size={24} /></button>
             </div>
             
             {/* Warehouse Stats */}
             <div className="grid grid-cols-3 gap-4 mb-6">
               <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                 <div className="text-sm text-gray-600 mb-1">Total Capacity</div>
                 <div className="text-2xl font-bold text-blue-600">{selectedWarehouse.capacity} MT</div>
               </div>
               <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                 <div className="text-sm text-gray-600 mb-1">Currently Used</div>
                 <div className="text-2xl font-bold text-orange-600">{selectedWarehouse.utilization} MT</div>
               </div>
               <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                 <div className="text-sm text-gray-600 mb-1">Available Space</div>
                 <div className="text-2xl font-bold text-green-600">{selectedWarehouse.capacity - selectedWarehouse.utilization} MT</div>
               </div>
             </div>

             {/* Utilization Progress */}
             <div className="mb-6">
                 <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-gray-700">Storage Utilization</span>
                    <span className="font-bold text-gray-900">{Math.round((selectedWarehouse.utilization / selectedWarehouse.capacity) * 100)}%</span>
                 </div>
                 <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                        className={`h-4 rounded-full ${
                          (selectedWarehouse.utilization / selectedWarehouse.capacity) * 100 >= 90 ? 'bg-red-500' :
                          (selectedWarehouse.utilization / selectedWarehouse.capacity) * 100 >= 70 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(selectedWarehouse.utilization / selectedWarehouse.capacity) * 100}%` }}
                    ></div>
                 </div>
                 {(selectedWarehouse.utilization / selectedWarehouse.capacity) * 100 >= 90 && (
                   <p className="text-xs text-red-600 mt-1">⚠️ Warehouse nearly full! Consider dispatching stock.</p>
                 )}
             </div>

             {/* Crop Types */}
             {selectedWarehouse.cropType.length > 0 && (
               <div className="mb-6">
                 <div className="text-sm font-bold text-gray-700 mb-2">Stored Crops</div>
                 <div className="flex flex-wrap gap-2">
                   {selectedWarehouse.cropType.map((crop, idx) => (
                     <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                       {crop}
                     </span>
                   ))}
                 </div>
               </div>
             )}

             <div className="space-y-4">
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-bold text-gray-700">
                                {stockAdjustment > 0 ? `Add Stock: +${stockAdjustment} MT` : 
                                 stockAdjustment < 0 ? `Reduce Stock: ${stockAdjustment} MT` : 
                                 'Stock Adjustment: 0 MT'}
                            </label>
                            <span className="text-xs text-gray-500">
                                Current: {selectedWarehouse.utilization} MT / {selectedWarehouse.capacity} MT
                            </span>
                        </div>
                        <div className="relative">
                            <input
                                type="range"
                                min={-selectedWarehouse.utilization}
                                max={selectedWarehouse.capacity - selectedWarehouse.utilization}
                                value={stockAdjustment}
                                onChange={(e) => setStockAdjustment(parseInt(e.target.value) || 0)}
                                step="1"
                                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Reduce: -{selectedWarehouse.utilization} MT</span>
                                <span>Add: +{selectedWarehouse.capacity - selectedWarehouse.utilization} MT</span>
                            </div>
                        </div>
                        {stockAdjustment !== 0 && (
                            <div className={`mt-2 p-2 rounded-lg text-xs ${
                                selectedWarehouse.utilization + stockAdjustment > selectedWarehouse.capacity 
                                    ? 'bg-red-50 text-red-700 border border-red-200' 
                                    : selectedWarehouse.utilization + stockAdjustment < 0
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                                {selectedWarehouse.utilization + stockAdjustment > selectedWarehouse.capacity ? (
                                    <span>⚠️ Exceeds capacity! Maximum allowed: {selectedWarehouse.capacity - selectedWarehouse.utilization} MT</span>
                                ) : selectedWarehouse.utilization + stockAdjustment < 0 ? (
                                    <span>⚠️ Cannot reduce below 0! Maximum reduction: {selectedWarehouse.utilization} MT</span>
                                ) : (
                                    <span>New utilization: {selectedWarehouse.utilization + stockAdjustment} MT ({(Math.round(((selectedWarehouse.utilization + stockAdjustment) / selectedWarehouse.capacity) * 100))}%)</span>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={async () => {
                            const newUtilization = selectedWarehouse.utilization + stockAdjustment;
                            if (newUtilization < 0 || newUtilization > selectedWarehouse.capacity) {
                                alert('Invalid stock adjustment! Please check the values.');
                                return;
                            }
                            const updatedWarehouses = warehouses.map(w => 
                                w.id === selectedWarehouse.id 
                                    ? { ...w, utilization: newUtilization, lastUpdated: 'Just now' }
                                    : w
                            );
                            setWarehouses(updatedWarehouses);
                            const updatedWarehouse = { ...selectedWarehouse, utilization: newUtilization, lastUpdated: 'Just now' };
                            setSelectedWarehouse(updatedWarehouse);
                            setStockAdjustment(0);
                            
                            alert(`Stock ${stockAdjustment > 0 ? 'added' : 'reduced'} successfully! New utilization: ${newUtilization} MT`);
                        }}
                        disabled={stockAdjustment === 0 || 
                                 selectedWarehouse.utilization + stockAdjustment < 0 || 
                                 selectedWarehouse.utilization + stockAdjustment > selectedWarehouse.capacity}
                        className="w-full bg-enam-dark text-white rounded-lg font-bold text-sm py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-enam-green transition"
                    >
                        {stockAdjustment === 0 ? 'No Change' : 
                         stockAdjustment > 0 ? `Add ${stockAdjustment} MT` : 
                         `Reduce ${Math.abs(stockAdjustment)} MT`}
                    </button>
                </div>

                {/* Nearest Farmers Section */}
                {selectedWarehouse && connectedFarmers.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin size={16} />
                      Nearest Farmers to {selectedWarehouse.name}
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(() => {
                        // Use actual coordinates from farmer data if available, otherwise fallback to district center
                        const farmerLocations: Record<string, { lat: number; lng: number }> = {
                          'Khordha': { lat: 20.1961, lng: 85.7245 },
                          'Cuttack': { lat: 20.4625, lng: 85.8828 },
                          'Puri': { lat: 19.8135, lng: 85.8312 },
                          'Ganjam': { lat: 19.3144, lng: 85.0500 },
                          'Bhadrak': { lat: 21.0544, lng: 86.5014 },
                          'Jajpur': { lat: 20.8625, lng: 86.1828 },
                        };
                        const farmersWithLocations = connectedFarmers.map(f => ({
                          id: f.id,
                          name: f.name,
                          location: f.coordinates || farmerLocations[f.district] || { lat: 20.2961, lng: 85.8245 }
                        }));
                        const nearestFarmers = findNearestFarmers(selectedWarehouse.location, farmersWithLocations, 5);
                        return nearestFarmers.map((farmer, idx) => (
                          <div key={farmer.farmerId} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:bg-gray-50 transition">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500 w-6">#{idx + 1}</span>
                              <span className="text-sm font-medium text-gray-900">{farmer.farmerName}</span>
                            </div>
                            <span className="text-xs text-gray-600 font-medium">{farmer.distance.toFixed(1)} km</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => {
                    setSelectedWarehouse(null);
                    setStockAdjustment(0);
                  }} 
                  className="w-full py-3 text-gray-500 font-bold text-sm hover:text-gray-800"
                >
                  Close
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Finances Tab */}
      {activeTab === 'finances' && fpoFinance && (
        <div className="space-y-6">
          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <IndianRupee size={24} className="text-green-600" />
                <TrendingUp size={16} className="text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-900">
                ₹{(fpoFinance.totalFunds / 100000).toFixed(1)}L
              </div>
              <div className="text-sm text-green-700 font-semibold">Total Funds</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <IndianRupee size={24} className="text-blue-600" />
                <TrendingUp size={16} className="text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-900">
                ₹{(fpoFinance.availableFunds / 100000).toFixed(1)}L
              </div>
              <div className="text-sm text-blue-700 font-semibold">Available Funds</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <IndianRupee size={24} className="text-yellow-600" />
                <Activity size={16} className="text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-yellow-900">
                ₹{(fpoFinance.committedFunds / 100000).toFixed(1)}L
              </div>
              <div className="text-sm text-yellow-700 font-semibold">Committed Funds</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 size={24} className="text-purple-600" />
                <Activity size={16} className="text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-900">
                ₹{(fpoFinance.profit / 100000).toFixed(1)}L
              </div>
              <div className="text-sm text-purple-700 font-semibold">Net Profit</div>
            </div>
          </div>

          {/* Profit Projection with Logistics */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm border-2 border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={24} className="text-green-600" />
              {t('Max Profit Opportunities (with Logistics)', 'ସର୍ବାଧିକ ଲାଭ ସୁଯୋଗ (ଲଜିଷ୍ଟିକ୍ ସହିତ)')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {farmerListings
                .map(listing => {
                  const farmer = connectedFarmers.find(f => f.name === listing.farmerName);
                  const farmerLocation = farmer?.coordinates ? { lat: farmer.coordinates.lat, lng: farmer.coordinates.lng } : undefined;
                  const logistics = calculateLogisticsCost(listing.quantity, farmerLocation);
                  const logisticsCost = logistics?.totalCost || 0;
                  const suggestedPrice = listing.minimumPrice * 1.05;
                  const purchaseCost = listing.quantity * suggestedPrice;
                  const estimatedSalePrice = listing.minimumPrice * 1.15;
                  const revenue = listing.quantity * estimatedSalePrice;
                  const profit = revenue - purchaseCost - logisticsCost;
                  return { listing, profit, logisticsCost, suggestedPrice };
                })
                .filter(item => item.profit > 0)
                .sort((a, b) => b.profit - a.profit)
                .slice(0, 3)
                .map((item, idx) => (
                  <div key={item.listing.id} className="bg-white rounded-lg p-4 border-2 border-green-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        #{idx + 1} {t('Best', 'ସର୍ବୋତ୍ତମ')}
                      </span>
                      <span className="text-xs text-gray-600">{item.listing.cropName}</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700 mb-1">
                      ₹{Math.round(item.profit).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {item.listing.quantity} qtl × ₹{Math.round(item.suggestedPrice).toLocaleString()}/qtl
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{t('Logistics:', 'ଲଜିଷ୍ଟିକ୍:')}</span>
                      <span className="font-bold text-blue-600">₹{Math.round(item.logisticsCost).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.listing.farmerName} - {item.listing.location}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Financial Overview */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <IndianRupee size={24} className="text-green-600" />
              {t('Financial Overview', 'ଆର୍ଥିକ ସମୀକ୍ଷା')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-gray-600 mb-1">Total Funds</div>
                <div className="text-2xl font-bold text-green-600">₹{(fpoFinance.totalFunds / 100000).toFixed(1)}L</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Available</div>
                <div className="text-2xl font-bold text-blue-600">₹{(fpoFinance.availableFunds / 100000).toFixed(1)}L</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-sm text-gray-600 mb-1">Committed</div>
                <div className="text-2xl font-bold text-yellow-600">₹{(fpoFinance.committedFunds / 100000).toFixed(1)}L</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-sm text-gray-600 mb-1">Pending Payments</div>
                <div className="text-2xl font-bold text-red-600">₹{(fpoFinance.pendingPayments / 100000).toFixed(1)}L</div>
              </div>
            </div>
            
            {/* Financial Chart */}
            <div className="h-64 w-full min-h-[256px]">
              <ResponsiveContainer width="100%" height={256} minHeight={200} minWidth={0}>
                <AreaChart data={fpoFinance.transactions.slice().reverse().map((t, idx) => ({
                  date: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                  income: t.type === 'income' ? t.amount : 0,
                  expense: t.type === 'expense' ? t.amount : 0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value: number) => `₹${(value / 1000).toFixed(0)}K`} />
                  <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="expense" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue vs Expenses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-sm font-semibold text-gray-700">Total Revenue</span>
                  <span className="text-xl font-bold text-green-600">₹{(fpoFinance.revenue / 100000).toFixed(1)}L</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-semibold text-gray-700">Total Expenses</span>
                  <span className="text-xl font-bold text-blue-600">₹{(fpoFinance.expenses / 100000).toFixed(1)}L</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <span className="text-sm font-semibold text-gray-700">Net Profit</span>
                  <span className="text-xl font-bold text-purple-600">₹{(fpoFinance.profit / 100000).toFixed(1)}L</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {fpoFinance.transactions.slice().reverse().slice(0, 10).map((transaction, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{transaction.description}</div>
                      <div className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div className={`text-sm font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}₹{(transaction.amount / 1000).toFixed(0)}K
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Management Tab */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          {/* Fleet Overview KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Car size={24} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                  {vehicles.filter(v => v.status === 'available').length} Free
                </span>
              </div>
              <div className="text-3xl font-bold text-blue-900">{vehicles.length}</div>
              <div className="text-sm text-blue-700 font-semibold">Total Vehicles</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Truck size={24} className="text-green-600" />
                <Activity size={16} className="text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-900">
                {vehicles.filter(v => v.status === 'in-transit').length}
              </div>
              <div className="text-sm text-green-700 font-semibold">In Transit</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Package size={24} className="text-orange-600" />
                <TrendingUp size={16} className="text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-orange-900">
                {assignments.filter(a => a.status === 'in-transit' || a.status === 'loading').reduce((sum, a) => sum + a.quantity, 0)}
              </div>
              <div className="text-sm text-orange-700 font-semibold">Total Load (qtl)</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Navigation size={24} className="text-purple-600" />
                <Activity size={16} className="text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-900">
                {assignments.filter(a => a.status === 'pending' || a.status === 'assigned').length}
              </div>
              <div className="text-sm text-purple-700 font-semibold">Pending Assignments</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle List */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Car size={24} className="text-blue-600" />
                  {t('Fleet Vehicles', 'ଯାନବାହାନ')}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddVehicleModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-blue-700 transition"
                  >
                    <Plus size={16} /> {t('Add Vehicle', 'ଯାନ ଯୋଡନ୍ତୁ')}
                  </button>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 bg-enam-green text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-enam-dark transition"
                  >
                    <Plus size={16} /> {t('New Assignment', 'ନୂତନ ନିୟୋଜନ')}
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {vehicles.map((vehicle) => {
                  const assignment = assignments.find(a => a.vehicleId === vehicle.id && (a.status === 'in-transit' || a.status === 'loading' || a.status === 'assigned'));
                  return (
                    <div
                      key={vehicle.id}
                      className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 hover:border-blue-300 transition cursor-pointer"
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">{vehicle.vehicleNumber}</h4>
                          <div className="text-xs text-gray-600 mb-2">
                            {vehicle.type.toUpperCase()} {vehicle.brand ? `• ${vehicle.brand}` : ''} • {t('Capacity', 'କ୍ଷମତା')}: {vehicle.capacity} qtl
                          </div>
                          {vehicle.driverName && (
                            <div className="text-sm text-gray-700">
                              <span className="font-semibold">{t('Driver', 'ଚାଳକ')}:</span> {vehicle.driverName} ({vehicle.driverPhone})
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            vehicle.status === 'available' ? 'bg-green-100 text-green-700' :
                            vehicle.status === 'in-transit' ? 'bg-blue-100 text-blue-700' :
                            vehicle.status === 'loading' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {vehicle.status}
                          </div>
                          {vehicle.currentLoad && (
                            <div className="text-xs text-gray-500 mt-1">
                              Load: {vehicle.currentLoad}/{vehicle.capacity} qtl
                            </div>
                          )}
                        </div>
                      </div>
                      {assignment && (
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <div className="text-xs text-gray-600">
                            <span className="font-semibold">Route:</span> {assignment.source.name} → {assignment.destination.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            <span className="font-semibold">Crop:</span> {assignment.cropType} • <span className="font-semibold">Qty:</span> {assignment.quantity} qtl
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Assignments */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Navigation size={24} className="text-purple-600" />
                Active Assignments
              </h3>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {assignments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Truck size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>No active assignments. Create a new assignment to get started.</p>
                  </div>
                ) : (
                  assignments
                    .filter(a => a.status !== 'completed' && a.status !== 'cancelled')
                    .map((assignment) => {
                      const vehicle = vehicles.find(v => v.id === assignment.vehicleId);
                      return (
                        <div
                          key={assignment.id}
                          className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 hover:border-purple-300 transition"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-1">{assignment.vehicleNumber}</h4>
                              <div className="text-xs text-gray-600 mb-2">
                                <div><span className="font-semibold">From:</span> {assignment.source.name}</div>
                                <div><span className="font-semibold">To:</span> {assignment.destination.name}</div>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Quantity:</span>
                                  <span className="font-bold ml-1">{assignment.quantity} qtl</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Crop:</span>
                                  <span className="font-bold ml-1">{assignment.cropType}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                assignment.status === 'in-transit' ? 'bg-blue-100 text-blue-700' :
                                assignment.status === 'loading' ? 'bg-yellow-100 text-yellow-700' :
                                assignment.status === 'assigned' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {assignment.status}
                              </div>
                              <div className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
                                assignment.priority === 'high' ? 'bg-red-100 text-red-700' :
                                assignment.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {assignment.priority} priority
                              </div>
                            </div>
                          </div>
                          {assignment.estimatedArrival && (
                            <div className="mt-2 pt-2 border-t border-gray-300 text-xs text-gray-600">
                              <span className="font-semibold">ETA:</span> {new Date(assignment.estimatedArrival).toLocaleString('en-IN')}
                            </div>
                          )}
                          {vehicle && vehicle.driverName && (
                            <div className="mt-1 text-xs text-gray-600">
                              <span className="font-semibold">Driver:</span> {vehicle.driverName} ({vehicle.driverPhone})
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Detail Modal */}
          {selectedVehicle && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedVehicle.vehicleNumber}</h3>
                  <button
                    onClick={() => setSelectedVehicle(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">{t('Vehicle Type', 'ଯାନର ପ୍ରକାର')}</div>
                    <div className="font-bold text-gray-900">{selectedVehicle.type.toUpperCase()}</div>
                  </div>
                  {selectedVehicle.brand && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">{t('Brand', 'ବ୍ରାଣ୍ଡ')}</div>
                      <div className="font-bold text-gray-900">{selectedVehicle.brand}</div>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">{t('Capacity', 'କ୍ଷମତା')}</div>
                    <div className="font-bold text-gray-900">{selectedVehicle.capacity} {t('quintals', 'କ୍ୱିଣ୍ଟାଲ')}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Status</div>
                    <div className={`font-bold ${
                      selectedVehicle.status === 'available' ? 'text-green-600' :
                      selectedVehicle.status === 'in-transit' ? 'text-blue-600' :
                      selectedVehicle.status === 'loading' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {selectedVehicle.status}
                    </div>
                  </div>
                  {selectedVehicle.driverName && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Driver</div>
                      <div className="font-bold text-gray-900">{selectedVehicle.driverName}</div>
                      <div className="text-xs text-gray-500">{selectedVehicle.driverPhone}</div>
                    </div>
                  )}
                </div>

                {selectedVehicle.currentLoad !== undefined && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-gray-700">Current Load</span>
                      <span className="font-bold text-gray-900">{selectedVehicle.currentLoad}/{selectedVehicle.capacity} qtl</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ width: `${(selectedVehicle.currentLoad / selectedVehicle.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {selectedVehicle.assignedRoute && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                    <div className="text-sm font-bold text-blue-900 mb-1">Current Route</div>
                    <div className="text-sm text-blue-700">{selectedVehicle.assignedRoute}</div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Last Updated</div>
                  <div className="font-bold text-gray-900">{selectedVehicle.lastUpdated}</div>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold mb-4">Create New Assignment</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Quantity (quintals) *</label>
                    <input
                      type="number"
                      min="1"
                      value={newAssignment.quantity || ''}
                      onChange={(e) => setNewAssignment({ ...newAssignment, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Crop Type *</label>
                    <select
                      value={newAssignment.cropType}
                      onChange={(e) => setNewAssignment({ ...newAssignment, cropType: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    >
                      <option value="">Select Crop</option>
                      <option value="Groundnut">Groundnut</option>
                      <option value="Mustard">Mustard</option>
                      <option value="Soybean">Soybean</option>
                      <option value="Sunflower">Sunflower</option>
                      <option value="Sesame">Sesame</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Priority *</label>
                    <select
                      value={newAssignment.priority}
                      onChange={(e) => setNewAssignment({ ...newAssignment, priority: e.target.value as 'high' | 'medium' | 'low' })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        // Auto-assign vehicle based on quantity
                        const availableVehicles = vehicles.filter(v => v.status === 'available' && v.capacity >= newAssignment.quantity);
                        if (availableVehicles.length > 0) {
                          const bestVehicle = availableVehicles.sort((a, b) => a.capacity - b.capacity)[0]; // Choose smallest suitable vehicle
                          const newAssign: LogisticsAssignment = {
                            id: `a${Date.now()}`,
                            vehicleId: bestVehicle.id,
                            vehicleNumber: bestVehicle.vehicleNumber,
                            quantity: newAssignment.quantity,
                            source: { type: 'farm', id: 'f1', name: 'Farm Location', location: { lat: 20.1961, lng: 85.7245 } },
                            destination: { type: 'warehouse', id: '1', name: 'WH-Bhubaneswar-Alpha', location: { lat: 20.2961, lng: 85.8245 } },
                            cropType: newAssignment.cropType,
                            status: 'assigned',
                            assignedDate: new Date().toISOString(),
                            priority: newAssignment.priority,
                          };
                          setAssignments([...assignments, newAssign]);
                          setVehicles(vehicles.map(v => v.id === bestVehicle.id ? { ...v, status: 'assigned' as const } : v));
                          setNewAssignment({ quantity: 0, sourceId: '', destinationId: '', cropType: '', priority: 'medium' });
                          setShowAssignModal(false);
                          alert('Assignment created successfully!');
                        } else {
                          alert('No available vehicles with sufficient capacity. Please try a smaller quantity or wait for vehicles to become available.');
                        }
                      }}
                      disabled={!newAssignment.quantity || !newAssignment.cropType}
                      className="flex-1 bg-enam-green hover:bg-enam-dark text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                    >
                      Create Assignment
                    </button>
                    <button
                      onClick={() => {
                        setShowAssignModal(false);
                        setNewAssignment({ quantity: 0, sourceId: '', destinationId: '', cropType: '', priority: 'medium' });
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg transition"
                    >
                      {t('Cancel', 'ବାତିଲ୍')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Vehicle Modal */}
          {showAddVehicleModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{t('Add New Vehicle', 'ନୂତନ ଯାନ ଯୋଡନ୍ତୁ')}</h3>
                  <button
                    onClick={() => {
                      setShowAddVehicleModal(false);
                      setNewVehicle({ vehicleNumber: '', type: 'truck', brand: '', capacity: 0, driverName: '', driverPhone: '' });
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('Vehicle Number', 'ଯାନ ସଂଖ୍ୟା')} *</label>
                    <input
                      type="text"
                      value={newVehicle.vehicleNumber}
                      onChange={(e) => setNewVehicle({ ...newVehicle, vehicleNumber: e.target.value })}
                      placeholder={t('e.g., OD-01-AB-1234', 'ଉଦାହରଣ: OD-01-AB-1234')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('Vehicle Type', 'ଯାନର ପ୍ରକାର')} *</label>
                    <select
                      value={newVehicle.type}
                      onChange={(e) => {
                        const newType = e.target.value as 'truck' | 'tractor' | 'tempo';
                        // If switching to truck and capacity exceeds 550, cap it
                        let newCapacity = newVehicle.capacity;
                        if (newType === 'truck' && newCapacity > 550) {
                          newCapacity = 550;
                        }
                        setNewVehicle({ ...newVehicle, type: newType, capacity: newCapacity });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    >
                      <option value="truck">{t('Truck', 'ଟ୍ରକ୍')} ({t('Over 60 quintals, Max 550', '୬୦ କ୍ୱିଣ୍ଟାଲରୁ ଅଧିକ, ସର୍ବାଧିକ ୫୫୦')})</option>
                      <option value="tractor">{t('Tractor', 'ଟ୍ରାକ୍ଟର୍')} ({t('30-60 quintals', '୩୦-୬୦ କ୍ୱିଣ୍ଟାଲ')})</option>
                      <option value="tempo">{t('Tempo', 'ଟେମ୍ପୋ')} ({t('Under 30 quintals', '୩୦ କ୍ୱିଣ୍ଟାଲରୁ କମ୍')})</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('Brand', 'ବ୍ରାଣ୍ଡ')}</label>
                    <input
                      type="text"
                      value={newVehicle.brand}
                      onChange={(e) => {
                        const sanitized = sanitizeText(e.target.value, 50);
                        setNewVehicle({ ...newVehicle, brand: sanitized });
                      }}
                      maxLength={50}
                      placeholder={t('e.g., Tata, Mahindra, Ashok Leyland', 'ଉଦାହରଣ: ଟାଟା, ମହିନ୍ଦ୍ରା, ଅଶୋକ ଲେଲାଣ୍ଡ')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('Capacity (quintals)', 'କ୍ଷମତା (କ୍ୱିଣ୍ଟାଲ)')} *
                      {newVehicle.type === 'truck' && (
                        <span className="text-xs font-normal text-gray-500 ml-2">
                          ({t('Max:', 'ସର୍ବାଧିକ:')} 550 {t('quintals', 'କ୍ୱିଣ୍ଟାଲ')})
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={newVehicle.type === 'truck' ? 550 : undefined}
                      value={newVehicle.capacity || ''}
                      onChange={(e) => {
                        const inputValue = parseFloat(e.target.value) || 0;
                        if (newVehicle.type === 'truck' && inputValue > 550) {
                          alert(
                            t(
                              'Truck capacity cannot exceed 550 quintals. Please enter a value between 1 and 550.',
                              'ଟ୍ରକ୍ କ୍ଷମତା ୫୫୦ କ୍ୱିଣ୍ଟାଲରୁ ଅଧିକ ହୋଇପାରିବ ନାହିଁ | ଦୟାକରି ୧ ରୁ ୫୫୦ ମଧ୍ୟରେ ଏକ ମୂଲ୍ୟ ପ୍ରବେଶ କରନ୍ତୁ |'
                            )
                          );
                          setNewVehicle({ ...newVehicle, capacity: 550 });
                        } else {
                          setNewVehicle({ ...newVehicle, capacity: inputValue });
                        }
                      }}
                      onBlur={(e) => {
                        if (newVehicle.type === 'truck' && newVehicle.capacity > 550) {
                          setNewVehicle({ ...newVehicle, capacity: 550 });
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                      placeholder={t('e.g., 50', 'ଉଦାହରଣ: ୫୦')}
                    />
                    {newVehicle.type === 'truck' && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t('Maximum capacity for trucks is 550 quintals.', 'ଟ୍ରକ୍ ପାଇଁ ସର୍ବାଧିକ କ୍ଷମତା ହେଉଛି ୫୫୦ କ୍ୱିଣ୍ଟାଲ |')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('Driver Name', 'ଚାଳକର ନାମ')}</label>
                    <input
                      type="text"
                      value={newVehicle.driverName}
                      onChange={(e) => setNewVehicle({ ...newVehicle, driverName: e.target.value })}
                      placeholder={t('Optional', 'ବିକଳ୍ପ')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('Driver Phone', 'ଚାଳକର ଫୋନ୍')}</label>
                    <input
                      type="tel"
                      value={newVehicle.driverPhone}
                      onChange={(e) => setNewVehicle({ ...newVehicle, driverPhone: e.target.value })}
                      placeholder={t('Optional', 'ବିକଳ୍ପ')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        if (!newVehicle.vehicleNumber || !newVehicle.capacity) {
                          alert(t('Please fill in all required fields', 'ଦୟାକରି ସମସ୍ତ ଆବଶ୍ୟକ କ୍ଷେତ୍ର ପୂରଣ କରନ୍ତୁ'));
                          return;
                        }
                        
                        // Get default location (first warehouse or default coordinates)
                        const defaultLocation = warehouses.length > 0 
                          ? warehouses[0].location 
                          : { lat: 20.2961, lng: 85.8245 }; // Default to Bhubaneswar

                        const vehicle: Vehicle = {
                          id: `v${Date.now()}`,
                          vehicleNumber: newVehicle.vehicleNumber,
                          type: newVehicle.type,
                          brand: newVehicle.brand || undefined,
                          capacity: newVehicle.capacity,
                          currentLocation: defaultLocation,
                          status: 'available',
                          driverName: newVehicle.driverName || undefined,
                          driverPhone: newVehicle.driverPhone || undefined,
                          lastUpdated: new Date().toISOString(),
                        };

                        setVehicles([...vehicles, vehicle]);
                        setNewVehicle({ vehicleNumber: '', type: 'truck', brand: '', capacity: 0, driverName: '', driverPhone: '' });
                        setShowAddVehicleModal(false);
                        alert(t('Vehicle added successfully!', 'ଯାନ ସଫଳତାର ସହିତ ଯୋଡାଗଲା!'));
                      }}
                      disabled={!newVehicle.vehicleNumber || !newVehicle.capacity}
                      className="flex-1 bg-enam-green hover:bg-enam-dark text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                    >
                      {t('Add Vehicle', 'ଯାନ ଯୋଡନ୍ତୁ')}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddVehicleModal(false);
                        setNewVehicle({ vehicleNumber: '', type: 'truck', brand: '', capacity: 0, driverName: '', driverPhone: '' });
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg transition"
                    >
                      {t('Cancel', 'ବାତିଲ୍')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bidding Tab */}
      {activeTab === 'bidding' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Gavel size={24} className="text-enam-green" />
              Available Farmer Listings
            </h3>
            
            {farmerListings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No active listings available. Farmers will appear here when they create listings.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {farmerListings.map((listing) => {
                  // Calculate logistics cost for this listing
                  const farmer = connectedFarmers.find(f => f.name === listing.farmerName);
                  const farmerLocation = farmer?.coordinates ? { lat: farmer.coordinates.lat, lng: farmer.coordinates.lng } : undefined;
                  const listingLogistics = calculateLogisticsCost(listing.quantity, farmerLocation);
                  
                  // Calculate profit projections at different bid prices
                  const minBidPrice = listing.minimumPrice;
                  const suggestedBidPrice = minBidPrice * 1.05; // 5% above minimum
                  const logisticsCost = listingLogistics?.totalCost || 0;
                  
                  // Profit at minimum price
                  const purchaseCostMin = listing.quantity * minBidPrice;
                  const estimatedSalePrice = minBidPrice * 1.15; // Assume 15% markup when selling to processor
                  const revenueMin = listing.quantity * estimatedSalePrice;
                  const profitMin = revenueMin - purchaseCostMin - logisticsCost;
                  const profitMarginMin = purchaseCostMin > 0 ? (profitMin / purchaseCostMin) * 100 : 0;
                  
                  // Profit at suggested price
                  const purchaseCostSuggested = listing.quantity * suggestedBidPrice;
                  const revenueSuggested = listing.quantity * estimatedSalePrice;
                  const profitSuggested = revenueSuggested - purchaseCostSuggested - logisticsCost;
                  const profitMarginSuggested = purchaseCostSuggested > 0 ? (profitSuggested / purchaseCostSuggested) * 100 : 0;
                  
                  return (
                    <div key={listing.id} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-enam-green transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">
                          {listing.cropName} - {listing.quantity} quintals
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-semibold">{t('Farmer', 'କୃଷକ')}:</span> {listing.farmerName}
                          </div>
                          <div>
                            <span className="font-semibold">{t('Location', 'ଅବସ୍ଥାନ')}:</span> {listing.location}
                          </div>
                          <div>
                            <span className="font-semibold">{t('Quality', 'ଗୁଣବତ୍ତା')}:</span> {listing.quality}
                          </div>
                          <div>
                            <span className="font-semibold">{t('Harvest', 'ଫସଲ')}:</span> {new Date(listing.expectedHarvestDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="bg-white rounded-lg px-4 py-2 border-2 border-orange-300">
                            <div className="text-xs text-gray-600">{t('Min Price', 'ନିମ୍ନ ମୂଲ୍ୟ')}</div>
                            <div className="text-xl font-bold text-orange-600">
                              ₹{listing.minimumPrice.toLocaleString()}/qtl
                            </div>
                          </div>
                          <div className="bg-white rounded-lg px-4 py-2 border border-gray-300">
                            <div className="text-xs text-gray-600">{t('Crop Value', 'ଫସଲ ମୂଲ୍ୟ')}</div>
                            <div className="text-lg font-bold text-gray-900">
                              ₹{(listing.quantity * listing.minimumPrice).toLocaleString()}
                            </div>
                          </div>
                          {listingLogistics && (
                            <div className="bg-blue-50 rounded-lg px-4 py-2 border border-blue-300">
                              <div className="text-xs text-gray-600">{t('Logistics', 'ଲଜିଷ୍ଟିକ୍')}</div>
                              <div className="text-lg font-bold text-blue-600">
                                ₹{Math.round(listingLogistics.totalCost).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {listingLogistics.distance.toFixed(1)} km ({listingLogistics.vehicleType})
                              </div>
                            </div>
                          )}
                          {listing.bids && listing.bids.length > 0 && (
                            <div className="bg-purple-50 rounded-lg px-4 py-2 border border-purple-300">
                              <div className="text-xs text-gray-600">{t('Bids', 'ବିଡ୍')}</div>
                              <div className="text-lg font-bold text-purple-600">
                                {listing.bids.length}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Profit Projection */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-bold text-green-900 flex items-center gap-2">
                              <TrendingUp size={18} />
                              {t('Profit Projection', 'ଲାଭ ପ୍ରକ୍ଷେପଣ')}
                            </h5>
                            {profitSuggested > profitMin && (
                              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">
                                {t('Best', 'ସର୍ବୋତ୍ତମ')}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded p-2 border border-green-300">
                              <div className="text-xs text-gray-600 mb-1">{t('At Min Price', 'ନିମ୍ନ ମୂଲ୍ୟରେ')}</div>
                              <div className="text-lg font-bold text-green-700">
                                ₹{Math.round(profitMin).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {profitMarginMin.toFixed(1)}% {t('margin', 'ମାର୍ଜିନ')}
                              </div>
                            </div>
                            <div className="bg-white rounded p-2 border-2 border-green-500">
                              <div className="text-xs text-gray-600 mb-1">{t('At Suggested Price', 'ସୁପାରିଶ ମୂଲ୍ୟରେ')}</div>
                              <div className="text-lg font-bold text-green-800">
                                ₹{Math.round(profitSuggested).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {profitMarginSuggested.toFixed(1)}% {t('margin', 'ମାର୍ଜିନ')}
                              </div>
                              <div className="text-xs text-green-700 font-semibold mt-1">
                                ₹{suggestedBidPrice.toLocaleString()}/qtl
                              </div>
                            </div>
                          </div>
                          {listingLogistics && (
                            <div className="mt-2 pt-2 border-t border-green-300 text-xs text-gray-600">
                              <span className="font-semibold">{t('Est. Sale Price', 'ଆନୁମାନିକ ବିକ୍ରୟ ମୂଲ୍ୟ')}:</span> ₹{estimatedSalePrice.toLocaleString()}/qtl 
                              <span className="ml-2">({t('15% markup', '୧୫% ମାର୍କଅପ')})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Existing Bids */}
                    {listing.bids && listing.bids.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <h5 className="font-bold text-gray-900 mb-2">Current Bids:</h5>
                        <div className="space-y-2">
                          {listing.bids
                            .sort((a, b) => b.bidPrice - a.bidPrice)
                            .map((bid) => (
                              <div key={bid.id} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                                <div>
                                  <span className="font-semibold">{bid.fpoName}:</span>
                                  <span className="ml-2">₹{bid.bidPrice.toLocaleString()}/qtl</span>
                                  <span className="text-sm text-gray-600 ml-2">({bid.quantity} qtl)</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  bid.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                  bid.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {bid.status}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedListing(listing);
                        setBidAmount(listing.minimumPrice);
                        setBidQuantity(listing.quantity);
                        setShowBidModal(true);
                      }}
                      className="mt-4 w-full bg-enam-green hover:bg-enam-dark text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <TrendingUp size={18} />
                      {t('Place Bid', 'ବିଡ୍ ରଖନ୍ତୁ')} ({t('Suggested', 'ସୁପାରିଶ')}: ₹{Math.round(suggestedBidPrice).toLocaleString()}/qtl)
                    </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bid Modal */}
      {showBidModal && selectedListing && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{t('Place Bid', 'ବିଡ୍ ରଖନ୍ତୁ')}</h3>
            <div className="space-y-4">
                {/* Total Cost Summary - Prominently Displayed */}
                {bidAmount > 0 && bidQuantity > 0 && (() => {
                  const totalPurchaseCost = (bidAmount || 0) * (bidQuantity || 0);
                  const totalLogisticsCost = bidLogisticsInfo?.totalCost || 0;
                  const totalRealCost = totalPurchaseCost + totalLogisticsCost;
                  
                  return (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300">
                      <div className="text-xs font-bold text-green-800 mb-2 uppercase tracking-wide">
                        {t('Total Real Cost You Will Pay', 'ଆପଣ ଦେବାକୁ ଥିବା ମୋଟ ପ୍ରକୃତ ଖର୍ଚ୍ଚ')}
                      </div>
                      <div className="text-3xl font-bold text-green-700 mb-3">
                        ₹{Math.round(totalRealCost).toLocaleString()}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white rounded p-2 border border-green-200">
                          <div className="text-gray-600">{t('Crop Purchase', 'ଫସଲ କ୍ରୟ')}</div>
                          <div className="font-bold text-green-700">₹{Math.round(totalPurchaseCost).toLocaleString()}</div>
                        </div>
                        <div className="bg-white rounded p-2 border border-blue-200">
                          <div className="text-gray-600">{t('Logistics', 'ଲଜିଷ୍ଟିକ୍')}</div>
                          <div className="font-bold text-blue-700">₹{Math.round(totalLogisticsCost).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">{t('Listing Details', 'ତାଲିକା ବିବରଣୀ')}</div>
                  <div className="font-bold text-gray-900">{selectedListing.cropName}</div>
                  <div className="text-sm text-gray-600">
                    {selectedListing.quantity} {t('quintals', 'କ୍ୱିଣ୍ଟାଲ')} • {t('Min', 'ନିମ୍ନ')}: ₹{selectedListing.minimumPrice.toLocaleString()}/qtl
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('Location', 'ଅବସ୍ଥାନ')}: {selectedListing.location}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('Your Bid Price (₹/quintal)', 'ଆପଣଙ୍କର ବିଡ୍ ମୂଲ୍ୟ (₹/କ୍ୱିଣ୍ଟାଲ)')} *
                  </label>
                  <input
                    type="number"
                    min={selectedListing.minimumPrice}
                    max={25000}
                    value={bidAmount || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      if (value > 25000) {
                        alert(t('Maximum bid price per quintal is ₹25,000', 'ପ୍ରତି କ୍ୱିଣ୍ଟାଲରେ ସର୍ବାଧିକ ବିଡ୍ ମୂଲ୍ୟ ₹୨୫,୦୦୦'));
                        setBidAmount(25000);
                      } else {
                        setBidAmount(value);
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    placeholder={`${t('Minimum', 'ନିମ୍ନ')}: ₹${selectedListing.minimumPrice.toLocaleString()}`}
                  />
                  {bidAmount < selectedListing.minimumPrice && (
                    <p className="text-xs text-red-600 mt-1">
                      {t('Bid must be at least', 'ବିଡ୍ ଅତିକମରେ ହେବା ଉଚିତ୍')} ₹{selectedListing.minimumPrice.toLocaleString()}/qtl
                    </p>
                  )}
                  {bidAmount > 25000 && (
                    <p className="text-xs text-red-600 mt-1">
                      {t('Maximum bid price is ₹25,000 per quintal', 'ସର୍ବାଧିକ ବିଡ୍ ମୂଲ୍ୟ ପ୍ରତି କ୍ୱିଣ୍ଟାଲରେ ₹୨୫,୦୦୦')}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('Quantity You Want (quintals)', 'ଆପଣ ଚାହୁଁଥିବା ପରିମାଣ (କ୍ୱିଣ୍ଟାଲ)')} *
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max={selectedListing.quantity}
                    step="0.1"
                    value={bidQuantity || ''}
                    onChange={(e) => setBidQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    placeholder={`${t('Max', 'ସର୍ବାଧିକ')}: ${selectedListing.quantity} qtl`}
                  />
                </div>

                {/* Logistics Cost Breakdown */}
                {bidLogisticsInfo && bidQuantity > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-sm font-bold text-blue-900 mb-3">{t('Logistics Cost Breakdown', 'ଲଜିଷ୍ଟିକ୍ ଖର୍ଚ୍ଚ ବିଭାଜନ')}</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('Vehicle Type', 'ଯାନର ପ୍ରକାର')}:</span>
                        <span className="font-bold text-gray-900">{bidLogisticsInfo.vehicleType.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('Nearest Warehouse', 'ନିକଟତମ ଗୋଦାମ')}:</span>
                        <span className="font-bold text-gray-900">{bidLogisticsInfo.warehouseName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('Distance (one way)', 'ଦୂରତା (ଏକ ଦିଗ)')}:</span>
                        <span className="font-bold text-gray-900">{bidLogisticsInfo.distance.toFixed(1)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('Cost per km', 'ପ୍ରତି କିମି ଖର୍ଚ୍ଚ')}:</span>
                        <span className="font-bold text-gray-900">₹{bidLogisticsInfo.costPerKm}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('Total Distance (to & fro)', 'ମୋଟ ଦୂରତା (ଯାଇ ଆସିବା)')}:</span>
                        <span className="font-bold text-gray-900">{(bidLogisticsInfo.distance * 2).toFixed(1)} km</span>
                      </div>
                      <div className="pt-2 border-t border-blue-300 flex justify-between">
                        <span className="font-bold text-blue-900">{t('Total Logistics Cost', 'ମୋଟ ଲଜିଷ୍ଟିକ୍ ଖର୍ଚ୍ଚ')}:</span>
                        <span className="font-bold text-blue-900 text-lg">₹{Math.round(bidLogisticsInfo.totalCost).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('Message (Optional)', 'ବାର୍ତ୍ତା (ବିକଳ୍ପ)')}
                  </label>
                  <textarea
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none"
                    rows={3}
                    placeholder={t('Add a message to the farmer...', 'କୃଷକଙ୍କୁ ଏକ ବାର୍ତ୍ତା ଯୋଡନ୍ତୁ...')}
                  />
                </div>
                
                {/* Cost Breakdown Summary */}
                {bidAmount > 0 && bidQuantity > 0 && (() => {
                  const totalPurchaseCost = (bidAmount || 0) * (bidQuantity || 0);
                  const totalLogisticsCost = bidLogisticsInfo?.totalCost || 0;
                  const totalRealCost = totalPurchaseCost + totalLogisticsCost;
                  
                  return (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-sm font-bold text-gray-700 mb-3">{t('Cost Breakdown', 'ଖର୍ଚ୍ଚ ବିଭାଜନ')}</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{t('Crop Purchase', 'ଫସଲ କ୍ରୟ')}:</span>
                          <span className="font-bold text-gray-900">
                            {bidQuantity} qtl × ₹{bidAmount.toLocaleString()}/qtl = ₹{Math.round(totalPurchaseCost).toLocaleString()}
                          </span>
                        </div>
                        {bidLogisticsInfo && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">{t('Logistics Cost', 'ଲଜିଷ୍ଟିକ୍ ଖର୍ଚ୍ଚ')}:</span>
                              <span className="font-bold text-blue-600">
                                ₹{Math.round(totalLogisticsCost).toLocaleString()}
                              </span>
                            </div>
                            <div className="pt-2 border-t-2 border-gray-300 flex justify-between items-center">
                              <span className="font-bold text-gray-900">{t('Total Real Cost', 'ମୋଟ ପ୍ରକୃତ ଖର୍ଚ୍ଚ')}:</span>
                              <span className="text-xl font-bold text-green-700">
                                ₹{Math.round(totalRealCost).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                              {t('This is the actual amount you will pay if your bid is accepted', 'ଯଦି ଆପଣଙ୍କର ବିଡ୍ ଗ୍ରହଣ କରାଯାଏ ତେବେ ଏହା ହେଉଛି ଆପଣ ପ୍ରକୃତରେ ଦେବାକୁ ଥିବା ରାଶି')}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={async () => {
                    if (bidAmount >= selectedListing.minimumPrice && bidQuantity > 0 && bidQuantity <= selectedListing.quantity) {
                      try {
                        await createBid(selectedListing.id, {
                          fpoId,
                          fpoName,
                          bidPrice: bidAmount,
                          quantity: bidQuantity,
                          message: bidMessage || undefined,
                        });
                        setShowBidModal(false);
                        setSelectedListing(null);
                        setBidAmount(0);
                        setBidQuantity(0);
                        setBidMessage('');
                        // Refresh listings
                        const listings = await getAllListings();
                        setFarmerListings(listings);
                        alert(t('Bid placed successfully! Farmer will see it in real-time.', 'ବିଡ୍ ସଫଳତାର ସହିତ ରଖାଗଲା! କୃଷକ ଏହାକୁ ରିଅଲ-ଟାଇମରେ ଦେଖିବେ |'));
                      } catch (error) {
                        console.error('Error placing bid:', error);
                        alert(t('Failed to place bid. Please try again.', 'ବିଡ୍ ରଖିବାରେ ବିଫଳ | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |'));
                      }
                    } else {
                      alert(t('Please check your bid amount and quantity', 'ଦୟାକରି ଆପଣଙ୍କର ବିଡ୍ ମୂଲ୍ୟ ଏବଂ ପରିମାଣ ଯାଞ୍ଚ କରନ୍ତୁ'));
                    }
                  }}
                  className="flex-1 bg-enam-green hover:bg-enam-dark text-white font-bold py-3 rounded-lg transition"
                >
                  {t('Submit Bid', 'ବିଡ୍ ଦାଖଲ କରନ୍ତୁ')}
                </button>
                <button
                  onClick={() => {
                    setShowBidModal(false);
                    setSelectedListing(null);
                    setBidAmount(0);
                    setBidQuantity(0);
                    setBidMessage('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg transition"
                >
                  {t('Cancel', 'ବାତିଲ୍')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sell to Processor Tab */}
      {activeTab === 'sell' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package size={24} className="text-green-600" />
                {t('Sell to Processors', 'ପ୍ରୋସେସରମାନଙ୍କୁ ବିକ୍ରୟ')}
              </h3>
              <button
                onClick={() => setShowSalesModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow transition"
              >
                <Plus size={16} /> {t('Create Sales Offer', 'ବିକ୍ରୟ ଅଫର୍ ସୃଷ୍ଟି କରନ୍ତୁ')}
              </button>
            </div>
            
            {salesOffers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-400" />
                <p>{t('No sales offers yet. Create one to sell your produce to processors.', 'ଏଯାଏଁ କୌଣସି ବିକ୍ରୟ ଅଫର୍ ନାହିଁ। ପ୍ରୋସେସରମାନଙ୍କୁ ଆପଣଙ୍କର ଉତ୍ପାଦନ ବିକ୍ରୟ କରିବାକୁ ଗୋଟିଏ ସୃଷ୍ଟି କରନ୍ତୁ।')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {salesOffers.map((offer) => (
                  <div key={offer.id} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-green-300 transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">
                          {offer.cropType} - {offer.quantity} quintals
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-semibold">{t('Price:', 'ମୂଲ୍ୟ:')}</span> ₹{offer.pricePerQuintal.toLocaleString()}/qtl
                          </div>
                          <div>
                            <span className="font-semibold">{t('Quality:', 'ଗୁଣବତ୍ତା:')}</span> {offer.quality}
                          </div>
                          <div>
                            <span className="font-semibold">{t('Total Value:', 'ମୋଟ ମୂଲ୍ୟ:')}</span> ₹{offer.totalValue.toLocaleString()}
                          </div>
                          <div>
                            <span className="font-semibold">{t('Status:', 'ସ୍ଥିତି:')}</span> 
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs font-bold ${
                              offer.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              offer.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              offer.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {offer.status}
                            </span>
                          </div>
                        </div>
                        {offer.processorName && (
                          <div className="text-sm text-blue-600 font-semibold">
                            {t('Accepted by:', 'ଗ୍ରହଣ କରିଛନ୍ତି:')} {offer.processorName}
                          </div>
                        )}
                      </div>
                    </div>
                    {offer.status === 'pending' && (
                      <button
                        onClick={async () => {
                          if (confirm(t('Delete this offer?', 'ଏହି ଅଫର୍ ବିଲୋପ କରିବେ?'))) {
                            try {
                              await deleteFPOSalesOffer(offer.id, fpoId);
                              const updatedOffers = await getFPOSalesOffers(fpoId);
                              setSalesOffers(updatedOffers);
                              alert(t('Offer deleted successfully!', 'ଅଫର୍ ସଫଳତାର ସହିତ ବିଲୋପ ହେଲା!'));
                            } catch (error) {
                              console.error('Error deleting offer:', error);
                              alert(t('Failed to delete offer. Please try again.', 'ଅଫର୍ ବିଲୋପ କରିବାରେ ବିଫଳ | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |'));
                            }
                          }
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 font-semibold"
                      >
                        {t('Delete Offer', 'ଅଫର୍ ବିଲୋପ କରନ୍ତୁ')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Sales Offer Modal */}
      {showSalesModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{t('Create Sales Offer', 'ବିକ୍ରୟ ଅଫର୍ ସୃଷ୍ଟି କରନ୍ତୁ')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t('Crop Type', 'ଫସଲ ପ୍ରକାର')} *
                </label>
                <select
                  value={newSalesOffer.cropType}
                  onChange={(e) => setNewSalesOffer({ ...newSalesOffer, cropType: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="Groundnut">Groundnut</option>
                  <option value="Mustard">Mustard</option>
                  <option value="Soybean">Soybean</option>
                  <option value="Sunflower">Sunflower</option>
                  <option value="Sesame">Sesame</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t('Quantity (quintals)', 'ପରିମାଣ (କ୍ୱିଣ୍ଟାଲ)')} *
                  {(() => {
                    // Calculate total available quantity across all warehouses (in quintals)
                    // 1 MT = 10 quintals
                    const totalAvailableMT = warehouses.reduce((sum, w) => {
                      const available = w.capacity - w.utilization;
                      return sum + available;
                    }, 0);
                    const totalAvailableQuintals = totalAvailableMT * 10; // Convert MT to quintals
                    return (
                      <span className="text-xs font-normal text-gray-500 ml-2">
                        ({t('Max available:', 'ସର୍ବାଧିକ ଉପଲବ୍ଧ:')} {totalAvailableQuintals.toFixed(1)} {t('quintals', 'କ୍ୱିଣ୍ଟାଲ')})
                      </span>
                    );
                  })()}
                </label>
                <input
                  type="number"
                  min="1"
                  max={(() => {
                    // Calculate total available quantity across all warehouses (in quintals)
                    const totalAvailableMT = warehouses.reduce((sum, w) => {
                      const available = w.capacity - w.utilization;
                      return sum + available;
                    }, 0);
                    return totalAvailableMT * 10; // Convert MT to quintals
                  })()}
                  step="0.1"
                  value={newSalesOffer.quantity || ''}
                  onChange={(e) => {
                    const inputValue = parseFloat(e.target.value) || 0;
                    // Calculate total available quantity across all warehouses (in quintals)
                    const totalAvailableMT = warehouses.reduce((sum, w) => {
                      const available = w.capacity - w.utilization;
                      return sum + available;
                    }, 0);
                    const maxAvailableQuintals = totalAvailableMT * 10; // Convert MT to quintals
                    
                    if (inputValue > maxAvailableQuintals) {
                      alert(
                        t(
                          `Maximum available quantity is ${maxAvailableQuintals.toFixed(1)} quintals across all warehouses. You cannot offer more than what is available.`,
                          `ସମସ୍ତ ଗୋଦାମରେ ସର୍ବାଧିକ ଉପଲବ୍ଧ ପରିମାଣ ହେଉଛି ${maxAvailableQuintals.toFixed(1)} କ୍ୱିଣ୍ଟାଲ | ଆପଣ ଉପଲବ୍ଧ ରୁ ଅଧିକ ଅଫର୍ କରିପାରିବେ ନାହିଁ |`
                        )
                      );
                      setNewSalesOffer({ ...newSalesOffer, quantity: maxAvailableQuintals });
                    } else {
                      setNewSalesOffer({ ...newSalesOffer, quantity: inputValue });
                    }
                  }}
                  onBlur={(e) => {
                    const inputValue = parseFloat(e.target.value) || 0;
                    const totalAvailableMT = warehouses.reduce((sum, w) => {
                      const available = w.capacity - w.utilization;
                      return sum + available;
                    }, 0);
                    const maxAvailableQuintals = totalAvailableMT * 10;
                    if (inputValue > maxAvailableQuintals) {
                      setNewSalesOffer({ ...newSalesOffer, quantity: maxAvailableQuintals });
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
                {(() => {
                  const totalAvailableMT = warehouses.reduce((sum, w) => {
                    const available = w.capacity - w.utilization;
                    return sum + available;
                  }, 0);
                  const totalAvailableQuintals = totalAvailableMT * 10;
                  return (
                    <p className="text-xs text-gray-500 mt-1">
                      {t(
                        `Total available across all warehouses: ${totalAvailableQuintals.toFixed(1)} quintals (${totalAvailableMT.toFixed(1)} MT)`,
                        `ସମସ୍ତ ଗୋଦାମରେ ମୋଟ ଉପଲବ୍ଧ: ${totalAvailableQuintals.toFixed(1)} କ୍ୱିଣ୍ଟାଲ (${totalAvailableMT.toFixed(1)} MT)`
                      )}
                    </p>
                  );
                })()}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t('Price per Quintal (₹)', 'ପ୍ରତି କ୍ୱିଣ୍ଟାଲ ମୂଲ୍ୟ (₹)')} *
                </label>
                <input
                  type="number"
                  min="0"
                  value={newSalesOffer.pricePerQuintal || ''}
                  onChange={(e) => setNewSalesOffer({ ...newSalesOffer, pricePerQuintal: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t('Quality', 'ଗୁଣବତ୍ତା')} *
                </label>
                <select
                  value={newSalesOffer.quality}
                  onChange={(e) => setNewSalesOffer({ ...newSalesOffer, quality: e.target.value as 'Organic' | 'Chemical Based' })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="Organic">Organic</option>
                  <option value="Chemical Based">Chemical Based</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t('Warehouse', 'ଗୋଦାମ')}
                </label>
                <select
                  value={newSalesOffer.warehouseId}
                  onChange={(e) => setNewSalesOffer({ ...newSalesOffer, warehouseId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">{t('Select Warehouse', 'ଗୋଦାମ ବାଛନ୍ତୁ')}</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t('Notes (Optional)', 'ଟିପ୍ପଣୀ (ବିକଳ୍ପ)')}
                </label>
                <textarea
                  value={newSalesOffer.notes}
                  onChange={(e) => setNewSalesOffer({ ...newSalesOffer, notes: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  rows={3}
                  placeholder={t('Add any additional information...', 'ଅତିରିକ୍ତ ସୂଚନା ଯୋଡନ୍ତୁ...')}
                />
              </div>
              
              {newSalesOffer.quantity > 0 && newSalesOffer.pricePerQuintal > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-gray-600 mb-1">{t('Total Offer Value', 'ମୋଟ ଅଫର୍ ମୂଲ୍ୟ')}</div>
                  <div className="text-2xl font-bold text-green-700">
                    ₹{(newSalesOffer.quantity * newSalesOffer.pricePerQuintal).toLocaleString()}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowSalesModal(false);
                    setNewSalesOffer({
                      cropType: 'Groundnut',
                      quantity: 0,
                      pricePerQuintal: 0,
                      quality: 'Organic',
                      warehouseId: '',
                      notes: '',
                    });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg transition"
                >
                  {t('Cancel', 'ବାତିଲ୍')}
                </button>
                <button
                  onClick={async () => {
                    if (newSalesOffer.quantity > 0 && newSalesOffer.pricePerQuintal > 0) {
                      try {
                        // Calculate total available quantity across all warehouses (in quintals)
                        const totalAvailableMT = warehouses.reduce((sum, w) => {
                          const available = w.capacity - w.utilization;
                          return sum + available;
                        }, 0);
                        const maxAvailableQuintals = totalAvailableMT * 10; // Convert MT to quintals
                        
                        // Check if total available quantity is sufficient
                        if (newSalesOffer.quantity > maxAvailableQuintals) {
                          alert(
                            t(
                              `Insufficient quantity available. Total available across all warehouses is ${maxAvailableQuintals.toFixed(1)} quintals (${totalAvailableMT.toFixed(1)} MT), but you are trying to offer ${newSalesOffer.quantity} quintals.`,
                              `ଅପର୍ଯ୍ୟାପ୍ତ ପରିମାଣ ଉପଲବ୍ଧ | ସମସ୍ତ ଗୋଦାମରେ ମୋଟ ଉପଲବ୍ଧ ହେଉଛି ${maxAvailableQuintals.toFixed(1)} କ୍ୱିଣ୍ଟାଲ (${totalAvailableMT.toFixed(1)} MT), କିନ୍ତୁ ଆପଣ ${newSalesOffer.quantity} କ୍ୱିଣ୍ଟାଲ ଅଫର୍ କରୁଛନ୍ତି |`
                            )
                          );
                          return;
                        }
                        
                        // Find selected warehouse or use first warehouse as default
                        const selectedWarehouse = newSalesOffer.warehouseId 
                          ? warehouses.find(w => w.id === newSalesOffer.warehouseId)
                          : warehouses[0];
                        
                        if (!selectedWarehouse) {
                          alert(t('No warehouse available. Please add a warehouse first.', 'କୌଣସି ଗୋଦାମ ଉପଲବ୍ଧ ନାହିଁ | ଦୟାକରି ପ୍ରଥମେ ଏକ ଗୋଦାମ ଯୋଡନ୍ତୁ |'));
                          return;
                        }
                        
                        // Validate warehouse quantity availability if warehouse is selected
                        if (newSalesOffer.warehouseId) {
                          // Convert quintals to MT: 1 quintal = 0.1 MT
                          const quantityInMT = newSalesOffer.quantity * 0.1;
                          const availableQuantity = selectedWarehouse.capacity - selectedWarehouse.utilization;
                          
                          if (quantityInMT > availableQuantity) {
                            alert(
                              t(
                                `Insufficient quantity available in selected warehouse. Warehouse "${selectedWarehouse.name}" has only ${availableQuantity.toFixed(1)} MT available, but you are trying to offer ${newSalesOffer.quantity} quintals (${quantityInMT.toFixed(1)} MT).`,
                                `ବାଛିଥିବା ଗୋଦାମରେ ଅପର୍ଯ୍ୟାପ୍ତ ପରିମାଣ ଉପଲବ୍ଧ | ଗୋଦାମ "${selectedWarehouse.name}"ରେ କେବଳ ${availableQuantity.toFixed(1)} MT ଉପଲବ୍ଧ, କିନ୍ତୁ ଆପଣ ${newSalesOffer.quantity} କ୍ୱିଣ୍ଟାଲ (${quantityInMT.toFixed(1)} MT) ଅଫର୍ କରୁଛନ୍ତି |`
                              )
                            );
                            return;
                          }
                        }
                        
                        const offer = await createFPOSalesOffer({
                          fpoId,
                          fpoName,
                          cropType: newSalesOffer.cropType,
                          quantity: newSalesOffer.quantity,
                          quality: newSalesOffer.quality,
                          pricePerQuintal: newSalesOffer.pricePerQuintal,
                          totalValue: newSalesOffer.quantity * newSalesOffer.pricePerQuintal,
                          location: selectedWarehouse.location,
                          warehouseId: newSalesOffer.warehouseId || selectedWarehouse.id,
                          warehouseName: selectedWarehouse.name,
                          notes: newSalesOffer.notes || undefined,
                        });
                        
                        const updatedOffers = await getFPOSalesOffers(fpoId);
                        setSalesOffers(updatedOffers);
                        setShowSalesModal(false);
                        setNewSalesOffer({
                          cropType: 'Groundnut',
                          quantity: 0,
                          pricePerQuintal: 0,
                          quality: 'Organic',
                          warehouseId: '',
                          notes: '',
                        });
                        alert(t('Sales offer created successfully! Processors will see it in real-time.', 'ବିକ୍ରୟ ଅଫର୍ ସଫଳତାର ସହିତ ସୃଷ୍ଟି ହେଲା! ପ୍ରୋସେସରମାନେ ଏହାକୁ ରିଅଲ-ଟାଇମରେ ଦେଖିବେ |'));
                      } catch (error) {
                        console.error('Error creating sales offer:', error);
                        alert(t('Failed to create sales offer. Please try again.', 'ବିକ୍ରୟ ଅଫର୍ ସୃଷ୍ଟି କରିବାରେ ବିଫଳ | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |'));
                      }
                    } else {
                      alert(t('Please fill in all required fields', 'ଦୟାକରି ସମସ୍ତ ଆବଶ୍ୟକ କ୍ଷେତ୍ର ପୂରଣ କରନ୍ତୁ'));
                    }
                  }}
                  disabled={newSalesOffer.quantity <= 0 || newSalesOffer.pricePerQuintal <= 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('Create Offer', 'ଅଫର୍ ସୃଷ୍ଟି କରନ୍ତୁ')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Farmer Route & Logistics Modal */}
      {selectedFarmerRoute && selectedFarmerLogistics && selectedFarmerWarehouse && selectedFarmer && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedFarmer.name}</h3>
                <p className="text-sm text-gray-600">{selectedFarmer.location}</p>
              </div>
              <button
                onClick={() => {
                  if (routePolylineRef.current && mapInstanceRef.current) {
                    mapInstanceRef.current.removeLayer(routePolylineRef.current);
                    routePolylineRef.current = null;
                  }
                  setSelectedFarmerRoute(null);
                  setSelectedFarmerLogistics(null);
                  setSelectedFarmerWarehouse(null);
                  setSelectedFarmer(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Route Information */}
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Navigation size={20} className="text-blue-600" />
                  {t('Optimized Route (A* Algorithm)', 'ଅନୁକୂଳିତ ରାସ୍ତା (A* ଆଲଗୋରିଦମ୍)')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">{t('From', 'ଠାରୁ')}</div>
                    <div className="font-bold text-gray-900">{selectedFarmer.name}</div>
                    <div className="text-xs text-gray-500">{selectedFarmer.location}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">{t('To', 'କୁ')}</div>
                    <div className="font-bold text-gray-900">{selectedFarmerWarehouse.name}</div>
                    <div className="text-xs text-gray-500">
                      {selectedFarmerWarehouse.location.lat.toFixed(4)}, {selectedFarmerWarehouse.location.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('Total Distance', 'ମୋଟ ଦୂରତା')}</span>
                    <span className="text-xl font-bold text-blue-600">{selectedFarmerRoute.distance.toFixed(2)} km</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('Route optimized using A* pathfinding algorithm', 'A* ପାଥଫାଇଣ୍ଡିଂ ଆଲଗୋରିଦମ୍ ବ୍ୟବହାର କରି ରାସ୍ତା ଅନୁକୂଳିତ')}
                  </div>
                </div>
              </div>

              {/* Logistics Cost */}
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Truck size={20} className="text-green-600" />
                  {t('Logistics Cost Breakdown', 'ଲଜିଷ୍ଟିକ୍ସ ମୂଲ୍ୟ ବିଭାଜନ')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('Production Quantity', 'ଉତ୍ପାଦନ ପରିମାଣ')}</span>
                    <span className="font-bold text-gray-900">{selectedFarmer.production} qtl</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('Recommended Vehicle', 'ସୁପାରିଶ କରାଯାଇଥିବା ଯାନ')}</span>
                    <span className="font-bold text-gray-900 capitalize">{selectedFarmerLogistics.vehicleType}</span>
                  </div>
                  <div className="pt-2 border-t border-green-200 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('Base Cost', 'ମୂଳ ମୂଲ୍ୟ')}</span>
                      <span className="font-semibold text-gray-700">₹{selectedFarmerLogistics.baseCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('Fuel Cost', 'ଇନ୍ଧନ ମୂଲ୍ୟ')}</span>
                      <span className="font-semibold text-gray-700">₹{selectedFarmerLogistics.fuelCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('Driver Cost', 'ଚାଳକ ମୂଲ୍ୟ')}</span>
                      <span className="font-semibold text-gray-700">₹{selectedFarmerLogistics.driverCost.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t-2 border-green-300">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">{t('Total Logistics Cost', 'ମୋଟ ଲଜିଷ୍ଟିକ୍ସ ମୂଲ୍ୟ')}</span>
                      <span className="text-2xl font-bold text-green-600">₹{selectedFarmerLogistics.totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Path Details */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-2 text-sm">{t('Route Path', 'ରାସ୍ତା ପାଥ୍')}</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>{t('Start', 'ଆରମ୍ଭ')}: {selectedFarmer.name}</span>
                  </div>
                  {selectedFarmerRoute.path.length > 2 && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span>{t('Intermediate waypoints', 'ମଧ୍ୟବର୍ତ୍ତୀ ଉପାୟ')}: {selectedFarmerRoute.path.length - 2}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>{t('Destination', 'ଗନ୍ତବ୍ୟସ୍ଥଳ')}: {selectedFarmerWarehouse.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Warehouse Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold mb-4">List New Warehouse</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Warehouse Name</label>
                        <input 
                            value={newWhName}
                            onChange={(e) => setNewWhName(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none" 
                            placeholder="e.g. WH-Rayagada-East"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Total Capacity (MT)</label>
                        <input 
                            type="number"
                            value={newWhCap}
                            onChange={(e) => setNewWhCap(Number(e.target.value))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-enam-green outline-none" 
                        />
                    </div>
                    
                    <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100 flex gap-2">
                        <MapIcon size={16} />
                        Location will be auto-detected from current GPS or default to random nearby point for this demo.
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button 
                            onClick={() => setShowAddModal(false)}
                            className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleAddWarehouse}
                            disabled={!newWhName}
                            className="flex-1 py-3 text-white font-bold bg-enam-dark rounded-lg disabled:opacity-50"
                        >
                            Save Warehouse
                        </button>
                    </div>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default FPODashboard;
