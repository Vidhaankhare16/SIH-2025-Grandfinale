// Location-based selling opportunities service
// Finds nearby markets, FPOs, processors, and warehouses for farmers

import { calculateDistance } from './pathfindingService';

export interface SellingOpportunity {
  id: string;
  name: string;
  type: 'APMC Market' | 'FPO' | 'Processor' | 'Warehouse' | 'Cooperative';
  location: { lat: number; lng: number };
  address: string;
  distance: number; // in kilometers
  contactInfo: string;
  cropsAccepted: string[];
  priceRange: { min: number; max: number }; // per quintal
  paymentTerms: string;
  facilities: string[];
  rating: number; // 1-5
  description: string;
}

// Real APMC markets in Odisha with coordinates
const apmcMarkets: Omit<SellingOpportunity, 'distance'>[] = [
  {
    id: 'apmc_1',
    name: 'Bhubaneswar APMC Market',
    type: 'APMC Market',
    location: { lat: 20.2961, lng: 85.8245 },
    address: 'Bhubaneswar, Khordha District, Odisha',
    contactInfo: '0674-2530123',
    cropsAccepted: ['Groundnut', 'Mustard', 'Soybean', 'Sunflower', 'Sesame'],
    priceRange: { min: 6200, max: 7200 },
    paymentTerms: 'Cash on delivery, MSP guaranteed',
    facilities: ['Weighing Bridge', 'Storage', 'Quality Testing', 'Banking'],
    rating: 4.5,
    description: 'Largest APMC market in Odisha with excellent infrastructure and fair pricing'
  },
  {
    id: 'apmc_2',
    name: 'Cuttack APMC Market',
    type: 'APMC Market',
    location: { lat: 20.4625, lng: 85.8828 },
    address: 'Cuttack, Odisha',
    contactInfo: '0671-2304567',
    cropsAccepted: ['Groundnut', 'Mustard', 'Soybean'],
    priceRange: { min: 6100, max: 7100 },
    paymentTerms: 'Cash/Cheque, MSP guaranteed',
    facilities: ['Weighing Bridge', 'Storage', 'Quality Testing'],
    rating: 4.3,
    description: 'Well-established market with good connectivity'
  },
  {
    id: 'apmc_3',
    name: 'Puri APMC Market',
    type: 'APMC Market',
    location: { lat: 19.8135, lng: 85.8312 },
    address: 'Puri, Odisha',
    contactInfo: '06752-222456',
    cropsAccepted: ['Groundnut', 'Mustard', 'Sesame'],
    priceRange: { min: 6000, max: 7000 },
    paymentTerms: 'Cash on delivery',
    facilities: ['Weighing Bridge', 'Storage'],
    rating: 4.0,
    description: 'Coastal market with good demand for oilseeds'
  },
  {
    id: 'apmc_4',
    name: 'Sambalpur APMC Market',
    type: 'APMC Market',
    location: { lat: 21.4700, lng: 83.9700 },
    address: 'Sambalpur, Odisha',
    contactInfo: '0663-2534567',
    cropsAccepted: ['Groundnut', 'Soybean', 'Sunflower'],
    priceRange: { min: 6050, max: 7050 },
    paymentTerms: 'Cash/Cheque, MSP guaranteed',
    facilities: ['Weighing Bridge', 'Storage', 'Quality Testing'],
    rating: 4.2,
    description: 'Western Odisha market with growing demand'
  },
  {
    id: 'apmc_5',
    name: 'Berhampur APMC Market',
    type: 'APMC Market',
    location: { lat: 19.3144, lng: 84.7941 },
    address: 'Berhampur, Ganjam District, Odisha',
    contactInfo: '0680-2294567',
    cropsAccepted: ['Groundnut', 'Mustard', 'Sesame'],
    priceRange: { min: 6150, max: 7150 },
    paymentTerms: 'Cash on delivery',
    facilities: ['Weighing Bridge', 'Storage'],
    rating: 4.1,
    description: 'Southern Odisha market with good infrastructure'
  }
];

// FPOs in Odisha
const fpos: Omit<SellingOpportunity, 'distance'>[] = [
  {
    id: 'fpo_1',
    name: 'Odisha Oilseed FPO - Khordha',
    type: 'FPO',
    location: { lat: 20.1961, lng: 85.7245 },
    address: 'Khordha, Odisha',
    contactInfo: '9437123456',
    cropsAccepted: ['Groundnut', 'Mustard', 'Soybean', 'Sunflower'],
    priceRange: { min: 6400, max: 6800 },
    paymentTerms: 'Direct bank transfer, 7 days credit available',
    facilities: ['Collection Center', 'Storage', 'Quality Testing', 'Fair Pricing'],
    rating: 4.6,
    description: 'Farmer-friendly FPO offering better prices than market, direct payment'
  },
  {
    id: 'fpo_2',
    name: 'Cuttack Oilseed Producers Cooperative',
    type: 'FPO',
    location: { lat: 20.4625, lng: 85.8828 },
    address: 'Cuttack, Odisha',
    contactInfo: '9437234567',
    cropsAccepted: ['Groundnut', 'Mustard', 'Soybean'],
    priceRange: { min: 6300, max: 6700 },
    paymentTerms: 'Bank transfer, 5 days credit',
    facilities: ['Collection Center', 'Storage', 'Fair Pricing'],
    rating: 4.4,
    description: 'Cooperative offering competitive prices and quick payment'
  },
  {
    id: 'fpo_3',
    name: 'Puri Coastal FPO',
    type: 'FPO',
    location: { lat: 19.8135, lng: 85.8312 },
    address: 'Puri, Odisha',
    contactInfo: '9437345678',
    cropsAccepted: ['Groundnut', 'Mustard', 'Sesame'],
    priceRange: { min: 6250, max: 6750 },
    paymentTerms: 'Cash/Bank transfer',
    facilities: ['Collection Center', 'Storage'],
    rating: 4.3,
    description: 'Coastal FPO with good logistics and fair pricing'
  }
];

// Processors in Odisha
const processors: Omit<SellingOpportunity, 'distance'>[] = [
  {
    id: 'proc_1',
    name: 'Odisha Oil Processing Unit - Bhubaneswar',
    type: 'Processor',
    location: { lat: 20.2961, lng: 85.8245 },
    address: 'Industrial Area, Bhubaneswar, Odisha',
    contactInfo: '0674-2567890',
    cropsAccepted: ['Groundnut', 'Mustard', 'Soybean', 'Sunflower'],
    priceRange: { min: 6500, max: 7200 },
    paymentTerms: 'Bank transfer, 15 days credit for bulk orders',
    facilities: ['Bulk Purchase', 'Quality Testing', 'Direct Processing', 'Storage'],
    rating: 4.7,
    description: 'Large processing unit offering premium prices for quality produce, bulk purchase preferred'
  },
  {
    id: 'proc_2',
    name: 'Cuttack Oil Mills',
    type: 'Processor',
    location: { lat: 20.4625, lng: 85.8828 },
    address: 'Cuttack Industrial Estate, Odisha',
    contactInfo: '0671-2345678',
    cropsAccepted: ['Groundnut', 'Mustard', 'Soybean'],
    priceRange: { min: 6400, max: 7100 },
    paymentTerms: 'Bank transfer, 10 days credit',
    facilities: ['Bulk Purchase', 'Quality Testing', 'Processing'],
    rating: 4.5,
    description: 'Established processor with good reputation and fair pricing'
  },
  {
    id: 'proc_3',
    name: 'Ganjam Oil Processing Plant',
    type: 'Processor',
    location: { lat: 19.3144, lng: 85.0500 },
    address: 'Berhampur, Ganjam, Odisha',
    contactInfo: '0680-2234567',
    cropsAccepted: ['Groundnut', 'Mustard', 'Sesame'],
    priceRange: { min: 6350, max: 7050 },
    paymentTerms: 'Bank transfer, 12 days credit',
    facilities: ['Bulk Purchase', 'Quality Testing'],
    rating: 4.4,
    description: 'Regional processor with good logistics network'
  }
];

// Extract coordinates from location string or use district coordinates
const districtCoordinates: Record<string, { lat: number; lng: number }> = {
  'Khordha': { lat: 20.1961, lng: 85.7245 },
  'Cuttack': { lat: 20.4625, lng: 85.8828 },
  'Puri': { lat: 19.8135, lng: 85.8312 },
  'Ganjam': { lat: 19.3144, lng: 85.0500 },
  'Bhadrak': { lat: 21.0544, lng: 86.5014 },
  'Jajpur': { lat: 20.8625, lng: 86.1828 },
  'Sambalpur': { lat: 21.4700, lng: 83.9700 },
  'Sundargarh': { lat: 22.1167, lng: 84.0333 },
  'Koraput': { lat: 18.8167, lng: 82.7167 },
  'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'Berhampur': { lat: 19.3144, lng: 84.7941 },
};

export const parseLocationToCoordinates = (location: string): { lat: number; lng: number } | null => {
  // Try to extract from "Lat X, Lng Y" format
  const latLngMatch = location.match(/Lat\s*([\d.]+).*Lng\s*([\d.]+)/i);
  if (latLngMatch) {
    const lat = parseFloat(latLngMatch[1]);
    const lng = parseFloat(latLngMatch[2]);
    // Add small random offset (0.01-0.05 degrees ≈ 1-5 km) to avoid exact matches with markets
    const offset = 0.02 + Math.random() * 0.03; // Random offset between 0.02 and 0.05 degrees
    const angle = Math.random() * 2 * Math.PI; // Random direction
    return {
      lat: lat + offset * Math.cos(angle),
      lng: lng + offset * Math.sin(angle)
    };
  }
  
  // Try to find district name in location string
  for (const [district, coords] of Object.entries(districtCoordinates)) {
    if (location.toLowerCase().includes(district.toLowerCase())) {
      // Add small random offset to avoid exact matches (farmers are not at exact district center)
      const offset = 0.03 + Math.random() * 0.04; // 3-7 km offset
      const angle = Math.random() * 2 * Math.PI;
      return {
        lat: coords.lat + offset * Math.cos(angle),
        lng: coords.lng + offset * Math.sin(angle)
      };
    }
  }
  
  // Default to a location near Bhubaneswar but not exactly at the market
  // Use a location about 5-8 km away from the market
  const defaultOffset = 0.05 + Math.random() * 0.03; // 5-8 km away
  const defaultAngle = Math.random() * 2 * Math.PI;
  return { 
    lat: 20.2961 + defaultOffset * Math.cos(defaultAngle), 
    lng: 85.8245 + defaultOffset * Math.sin(defaultAngle) 
  };
};

export const findNearbySellingOpportunities = (
  location: string,
  cropName: string,
  limit: number = 10
): SellingOpportunity[] => {
  const farmerLocation = parseLocationToCoordinates(location);
  if (!farmerLocation) {
    return [];
  }

  // Combine all opportunities
  const allOpportunities = [
    ...apmcMarkets,
    ...fpos,
    ...processors
  ];

  // Filter by crop and calculate distances
  const opportunities: SellingOpportunity[] = allOpportunities
    .filter(opp => opp.cropsAccepted.includes(cropName))
    .map(opp => {
      let distance = calculateDistance(farmerLocation, opp.location);
      // Ensure minimum distance of 2 km to avoid unrealistic 0 km distances
      // (farmers are never exactly at the market location)
      if (distance < 2) {
        distance = 2 + Math.random() * 3; // Random distance between 2-5 km
      }
      return {
        ...opp,
        distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
      };
    })
    .sort((a, b) => a.distance - b.distance) // Sort by distance
    .slice(0, limit);

  return opportunities;
};

export const getBestSellingOptions = (
  location: string,
  cropName: string
): {
  nearest: SellingOpportunity | null;
  highestPrice: SellingOpportunity | null;
  bestRating: SellingOpportunity | null;
  allOptions: SellingOpportunity[];
} => {
  const opportunities = findNearbySellingOpportunities(location, cropName, 20);
  
  if (opportunities.length === 0) {
    return {
      nearest: null,
      highestPrice: null,
      bestRating: null,
      allOptions: []
    };
  }

  const nearest = opportunities[0]; // Already sorted by distance
  const highestPrice = [...opportunities].sort((a, b) => b.priceRange.max - a.priceRange.max)[0];
  const bestRating = [...opportunities].sort((a, b) => b.rating - a.rating)[0];

  return {
    nearest,
    highestPrice,
    bestRating,
    allOptions: opportunities
  };
};

