
export enum UserRole {
  FARMER = 'FARMER',
  FPO = 'FPO',
  PROCESSOR = 'PROCESSOR',
  RETAILER = 'RETAILER',
  NONE = 'NONE'
}

export interface CropData {
  name: string;
  season: string;
  sowingMonth: string;
  msp: number;
  marketPrice: number;
  demandLevel: 'High' | 'Medium' | 'Low';
  supplyLevel: 'High' | 'Medium' | 'Low';
}

export interface Scheme {
  name: string;
  benefit: string;
  eligibility: string;
}

export interface AdvisoryPlan {
  cropName: string;
  localName: string;
  suitabilityReason: string;
  duration: string;
  roi: string;
  economics: {
    netProfit: number;
    revenue: number;
    cost: number;
    comparisonText: string;
  };
  marketOutlook: {
    demand: 'High' | 'Medium' | 'Low';
    supply: 'High' | 'Medium' | 'Low';
    msp: number;
    marketPrice: number;
    strategy: string;
  };
  timeline: { day: string; task: string }[];
  shoppingList: string[];
  subsidies: { name: string; details: string }[];
}

export interface Warehouse {
  id: string;
  name: string;
  location: { lat: number; lng: number }; // Real GPS coordinates
  capacity: number;
  utilization: number;
  cropType: string[];
  lastUpdated?: string;
}

export interface Farm {
  id: string;
  farmerName: string;
  location: { lat: number; lng: number };
  crop: string;
  harvestReady: boolean;
  quantity: number; // in tonnes
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isVoice?: boolean;
}


// Bidding System Types
export interface Bid {
  id: string;
  fpoId: string;
  fpoName: string;
  bidPrice: number;
  quantity: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface FarmerListing {
  id: string;
  farmerId: string;
  farmerName: string;
  cropName: string;
  quantity: number;
  minimumPrice: number;
  quality: 'Organic' | 'Chemical Based';
  location: string;
  expectedHarvestDate: string;
  status: 'active' | 'sold' | 'closed';
  createdAt: string;
  bids: Bid[];
}

// Price Prediction Types
export interface PricePrediction {
  predictedPrice: number;
  trend: 'Increasing' | 'Stable' | 'Decreasing';
  confidence: number;
  factors: string[];
}

// FPO Types
export interface ConnectedFarmer {
  id: string;
  name: string;
  location: string;
  district: string;
  cropType: string;
  acreage: number;
  production: number;
  revenue: number;
  profit: number;
  totalTransactions: number;
  totalValue: number;
  engagementScore: number;
  status: 'active' | 'inactive';
  coordinates?: { lat: number; lng: number };
}

export interface FPOFinance {
  totalFunds: number;
  availableFunds: number;
  committedFunds: number;
  pendingPayments: number;
  revenue: number;
  expenses: number;
  profit: number;
  transactions: Array<{
    id: string;
    date: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
  }>;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  type: 'truck' | 'tractor' | 'tempo';
  brand: string;
  capacity: number;
  status: 'available' | 'in-transit' | 'maintenance';
  driverName: string;
  driverPhone: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
}

export interface LogisticsAssignment {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  quantity: number;
  source: {
    type: 'farm' | 'warehouse';
    id: string;
    name: string;
    location: { lat: number; lng: number };
  };
  destination: {
    type: 'warehouse' | 'processor';
    id: string;
    name: string;
    location: { lat: number; lng: number };
  };
  cropType: string;
  status: 'pending' | 'loading' | 'in-transit' | 'delivered';
  assignedDate: string;
  estimatedArrival: string;
  priority: 'high' | 'medium' | 'low';
}
