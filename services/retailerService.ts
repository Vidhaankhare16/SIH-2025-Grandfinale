// Service for retailer operations
// Provides processor factory listings and logistics management

import { calculateDistance, Location } from './pathfindingService';

export interface ProcessorFactory {
  id: string;
  name: string;
  location: Location;
  address: string;
  contactInfo: string;
  cropsProcessed: string[];
  processingCapacity: number; // in MT per month
  priceRange: { min: number; max: number }; // per quintal
  paymentTerms: string;
  facilities: string[];
  rating: number;
  distance?: number; // Distance from retailer in km
  description: string;
}

export interface LogisticsProjection {
  processorId: string;
  processorName: string;
  cropType: string;
  quantity: number; // in quintals
  purchasePrice: number; // per quintal from processor
  sellingPrice: number; // per quintal to customers
  distance: number; // in km
  transportCost: number;
  handlingCost: number;
  storageCost: number;
  totalCost: number;
  revenue: number;
  profit: number;
  profitMargin: number; // percentage
  estimatedDeliveryDays: number;
}

// Mock processor factories in Odisha
const processorFactories: ProcessorFactory[] = [
  {
    id: 'proc_factory_1',
    name: 'Odisha Oil Processing Unit - Bhubaneswar',
    location: { lat: 20.2961, lng: 85.8245 },
    address: 'Industrial Area, Bhubaneswar, Odisha - 751013',
    contactInfo: '+91-674-2567890',
    cropsProcessed: ['Groundnut', 'Mustard', 'Soybean', 'Sunflower'],
    processingCapacity: 500, // MT/month
    priceRange: { min: 6500, max: 7200 },
    paymentTerms: 'Bank transfer, 15 days credit for bulk orders',
    facilities: ['Bulk Purchase', 'Quality Testing', 'Direct Processing', 'Storage', 'Cold Storage'],
    rating: 4.7,
    description: 'Large processing unit offering premium prices for quality produce, bulk purchase preferred'
  },
  {
    id: 'proc_factory_2',
    name: 'Cuttack Oil Mills',
    location: { lat: 20.4625, lng: 85.8828 },
    address: 'Cuttack Industrial Estate, Odisha - 753001',
    contactInfo: '+91-671-2345678',
    cropsProcessed: ['Groundnut', 'Mustard', 'Soybean'],
    processingCapacity: 350, // MT/month
    priceRange: { min: 6400, max: 7100 },
    paymentTerms: 'Bank transfer, 10 days credit',
    facilities: ['Bulk Purchase', 'Quality Testing', 'Processing', 'Storage'],
    rating: 4.5,
    description: 'Established processor with good reputation and fair pricing'
  },
  {
    id: 'proc_factory_3',
    name: 'Ganjam Oil Processing Plant',
    location: { lat: 19.3144, lng: 85.0500 },
    address: 'Berhampur, Ganjam, Odisha - 760001',
    contactInfo: '+91-680-2234567',
    cropsProcessed: ['Groundnut', 'Mustard', 'Sesame'],
    processingCapacity: 280, // MT/month
    priceRange: { min: 6350, max: 7050 },
    paymentTerms: 'Bank transfer, 12 days credit',
    facilities: ['Bulk Purchase', 'Quality Testing', 'Storage'],
    rating: 4.4,
    description: 'Regional processor with good logistics network'
  },
  {
    id: 'proc_factory_4',
    name: 'Sambalpur Oil Processing Center',
    location: { lat: 21.4700, lng: 83.9700 },
    address: 'Industrial Area, Sambalpur, Odisha - 768001',
    contactInfo: '+91-663-2456789',
    cropsProcessed: ['Groundnut', 'Soybean', 'Sunflower'],
    processingCapacity: 400, // MT/month
    priceRange: { min: 6450, max: 7150 },
    paymentTerms: 'Bank transfer, 14 days credit',
    facilities: ['Bulk Purchase', 'Quality Testing', 'Processing', 'Storage', 'Packaging'],
    rating: 4.6,
    description: 'Well-equipped processing center with modern facilities'
  },
  {
    id: 'proc_factory_5',
    name: 'Bhadrak Oil Extraction Unit',
    location: { lat: 21.0544, lng: 86.5014 },
    address: 'Bhadrak Industrial Zone, Odisha - 756100',
    contactInfo: '+91-6784-223456',
    cropsProcessed: ['Mustard', 'Groundnut', 'Sesame'],
    processingCapacity: 320, // MT/month
    priceRange: { min: 6300, max: 7000 },
    paymentTerms: 'Bank transfer, 10 days credit',
    facilities: ['Bulk Purchase', 'Quality Testing', 'Processing'],
    rating: 4.3,
    description: 'Efficient processing unit with competitive pricing'
  },
  {
    id: 'proc_factory_6',
    name: 'Jajpur Oil Mills',
    location: { lat: 20.8625, lng: 86.1828 },
    address: 'Jajpur Road, Odisha - 755019',
    contactInfo: '+91-6728-234567',
    cropsProcessed: ['Groundnut', 'Mustard', 'Soybean'],
    processingCapacity: 250, // MT/month
    priceRange: { min: 6400, max: 7100 },
    paymentTerms: 'Bank transfer, 12 days credit',
    facilities: ['Bulk Purchase', 'Quality Testing', 'Storage'],
    rating: 4.2,
    description: 'Local processor with good quality standards'
  }
];

// Default retailer location (can be updated based on user's actual location)
const defaultRetailerLocation: Location = { lat: 20.2961, lng: 85.8245 }; // Bhubaneswar

/**
 * Get all processor factories within a specified radius (in km)
 */
export const getProcessorsWithinRadius = (
  retailerLocation: Location = defaultRetailerLocation,
  radiusKm: number = 300
): ProcessorFactory[] => {
  return processorFactories
    .map(processor => {
      const distance = calculateDistance(retailerLocation, processor.location);
      return { ...processor, distance };
    })
    .filter(processor => processor.distance! <= radiusKm)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
};

/**
 * Get all processor factories (for display)
 */
export const getAllProcessorFactories = (): ProcessorFactory[] => {
  return processorFactories;
};

/**
 * Calculate logistics cost for transporting goods
 */
export const calculateLogisticsCost = (
  distance: number, // in km
  quantity: number, // in quintals
  vehicleType: 'truck' | 'tempo' = 'truck'
): {
  transportCost: number;
  handlingCost: number;
  storageCost: number;
  totalCost: number;
} => {
  // Transport cost: More realistic - ₹2-3 per km per quintal (bulk transport is cheaper)
  // For trucks: ₹2.5 per km per quintal, for tempo: ₹3 per km per quintal
  const costPerKmPerQuintal = vehicleType === 'truck' ? 2.5 : 3;
  // Round trip cost
  const transportCost = Math.max(0, distance * quantity * costPerKmPerQuintal * 2);

  // Handling cost: ₹40-60 per quintal (realistic for loading/unloading)
  const handlingCostPerQuintal = 50;
  const handlingCost = Math.max(0, quantity * handlingCostPerQuintal);

  // Storage cost: ₹25-35 per quintal per day (assuming 3-5 days average storage)
  const storageDays = Math.min(5, Math.max(3, Math.ceil(distance / 100))); // 3-5 days based on distance
  const storageCostPerDay = 30;
  const storageCost = Math.max(0, quantity * storageCostPerDay * storageDays);

  const totalCost = Math.max(0, transportCost + handlingCost + storageCost);

  return {
    transportCost: Math.round(transportCost),
    handlingCost: Math.round(handlingCost),
    storageCost: Math.round(storageCost),
    totalCost: Math.round(totalCost)
  };
};

/**
 * Calculate profit projection for a logistics scenario
 */
export const calculateProfitProjection = (
  processorId: string,
  cropType: string,
  quantity: number, // in quintals
  retailerLocation: Location = defaultRetailerLocation
): LogisticsProjection | null => {
  const processor = processorFactories.find(p => p.id === processorId);
  if (!processor) return null;

  // If quantity is zero or negative, return zero profit projection
  if (quantity <= 0) {
    const distance = Math.max(0, calculateDistance(retailerLocation, processor.location));
    const purchasePrice = Math.max(0, Math.round((processor.priceRange.min + processor.priceRange.max) / 2));
    const sellingPrice = Math.max(0, Math.round(purchasePrice * 1.15)); // 15% markup
    
    return {
      processorId: processor.id,
      processorName: processor.name,
      cropType,
      quantity: 0,
      purchasePrice: Math.round(purchasePrice),
      sellingPrice: Math.round(sellingPrice),
      distance: Math.round(distance * 10) / 10,
      transportCost: 0,
      handlingCost: 0,
      storageCost: 0,
      totalCost: 0,
      revenue: 0,
      profit: 0,
      profitMargin: 0,
      estimatedDeliveryDays: 1
    };
  }

  const distance = Math.max(0, calculateDistance(retailerLocation, processor.location));
  
  // Purchase price (average of price range, rounded)
  const purchasePrice = Math.max(0, Math.round((processor.priceRange.min + processor.priceRange.max) / 2));
  
  // Selling price (retailer markup: 12-18% on purchase price - realistic retail margin)
  const markup = 0.15; // 15% markup (realistic for retail)
  const sellingPrice = Math.max(0, Math.round(purchasePrice * (1 + markup)));

  // Calculate logistics costs
  const logistics = calculateLogisticsCost(distance, quantity);
  
  // Total cost = purchase cost + logistics
  const purchaseCost = Math.max(0, quantity * purchasePrice);
  const totalCost = Math.max(0, purchaseCost + logistics.totalCost);
  
  // Revenue
  const revenue = Math.max(0, quantity * sellingPrice);
  
  // Profit - ensure it's never negative, but allow realistic small profits
  const profit = Math.max(0, revenue - totalCost);
  
  // Profit margin - ensure it's reasonable (0-20% is realistic for retail)
  const profitMargin = revenue > 0 ? Math.max(0, Math.min(20, (profit / revenue) * 100)) : 0;

  // Estimated delivery days (based on distance) - minimum 1 day
  const estimatedDeliveryDays = Math.max(1, Math.min(7, Math.ceil(distance / 150))); // 150 km per day, max 7 days

  return {
    processorId: processor.id,
    processorName: processor.name,
    cropType,
    quantity: Math.max(0, quantity),
    purchasePrice: Math.round(purchasePrice),
    sellingPrice: Math.round(sellingPrice),
    distance: Math.round(distance * 10) / 10, // Round to 1 decimal
    transportCost: logistics.transportCost,
    handlingCost: logistics.handlingCost,
    storageCost: logistics.storageCost,
    totalCost: Math.round(totalCost),
    revenue: Math.round(revenue),
    profit: Math.round(profit),
    profitMargin: Math.round(profitMargin * 10) / 10, // Round to 1 decimal
    estimatedDeliveryDays
  };
};

/**
 * Get multiple profit projections for comparison
 */
export const getProfitProjections = (
  cropType: string,
  quantity: number,
  retailerLocation: Location = defaultRetailerLocation
): LogisticsProjection[] => {
  const processors = getProcessorsWithinRadius(retailerLocation, 300);
  
  return processors
    .filter(p => p.cropsProcessed.includes(cropType))
    .map(p => calculateProfitProjection(p.id, cropType, quantity, retailerLocation))
    .filter((p): p is LogisticsProjection => p !== null)
    .sort((a, b) => b.profit - a.profit); // Sort by profit (highest first)
};

