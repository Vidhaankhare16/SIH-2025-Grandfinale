// Processor-specific data service

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  supplierType: 'FPO' | 'Farmer';
  cropType: string;
  quantity: number; // in quintals
  quality: 'Organic' | 'Chemical Based';
  pricePerQuintal: number;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'in-transit' | 'delivered' | 'completed';
  orderDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  location: { lat: number; lng: number };
  notes?: string;
}

export interface QualityRecord {
  id: string;
  orderId: string;
  batchNumber: string;
  testDate: string;
  parameters: {
    moisture: number; // %
    oilContent: number; // %
    foreignMatter: number; // %
    damagedSeeds: number; // %
    aflatoxin?: number; // ppb
  };
  certification: {
    fssai: boolean;
    organic: boolean;
    other?: string[];
  };
  status: 'passed' | 'failed' | 'conditional';
  remarks?: string;
}

export interface ProcessorFinancials {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  costBreakdown: {
    rawMaterials: number;
    processing: number;
    overhead: number;
    logistics: number;
  };
  paymentStatus: {
    pendingPayments: number; // to suppliers
    pendingReceivables: number; // from customers
    paidThisMonth: number;
    receivedThisMonth: number;
  };
  transactions: Array<{
    date: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description: string;
  }>;
}

export interface Shipment {
  id: string;
  orderId: string;
  vehicleId: string;
  vehicleNumber: string;
  source: {
    type: 'FPO' | 'Farmer';
    id: string;
    name: string;
    location: { lat: number; lng: number };
  };
  destination: {
    type: 'Warehouse' | 'Processing Unit';
    id: string;
    name: string;
    location: { lat: number; lng: number };
  };
  cropType: string;
  quantity: number;
  status: 'scheduled' | 'in-transit' | 'delivered' | 'delayed';
  scheduledDate: string;
  actualDeliveryDate?: string;
  route?: string;
  estimatedCost: number;
}

export interface MarketIntelligence {
  currentPrices: Record<string, number>; // crop -> price per quintal
  priceTrends: Array<{
    date: string;
    crop: string;
    price: number;
    msp: number;
  }>;
  demandForecast: Record<string, 'High' | 'Medium' | 'Low'>;
  bestPurchaseTime: Record<string, string>;
  bestSellTime: Record<string, string>;
}

// Mock data for processor
export const getProcessorData = (userId: string = 'processor_1') => {
  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po_1',
      orderNumber: 'PO-2024-001',
      supplierId: 'fpo_1',
      supplierName: 'Odisha FPO Cooperative',
      supplierType: 'FPO',
      cropType: 'Groundnut',
      quantity: 150,
      quality: 'Organic',
      pricePerQuintal: 6850,
      totalAmount: 1027500,
      status: 'accepted',
      orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      location: { lat: 20.2961, lng: 85.8245 },
      notes: 'High quality organic groundnut'
    },
    {
      id: 'po_2',
      orderNumber: 'PO-2024-002',
      supplierId: 'farmer_1',
      supplierName: 'Ramesh Kumar',
      supplierType: 'Farmer',
      cropType: 'Mustard',
      quantity: 85,
      quality: 'Chemical Based',
      pricePerQuintal: 5620,
      totalAmount: 477700,
      status: 'pending',
      orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      location: { lat: 20.1961, lng: 85.7245 }
    },
    {
      id: 'po_3',
      orderNumber: 'PO-2024-003',
      supplierId: 'fpo_2',
      supplierName: 'Cuttack Farmers Collective',
      supplierType: 'FPO',
      cropType: 'Soybean',
      quantity: 200,
      quality: 'Organic',
      pricePerQuintal: 4520,
      totalAmount: 904000,
      status: 'in-transit',
      orderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      location: { lat: 20.4625, lng: 85.8828 }
    }
  ];

  const qualityRecords: QualityRecord[] = [
    {
      id: 'qc_1',
      orderId: 'po_3',
      batchNumber: 'BATCH-2024-001',
      testDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      parameters: {
        moisture: 8.5,
        oilContent: 18.2,
        foreignMatter: 1.2,
        damagedSeeds: 2.1,
        aflatoxin: 8
      },
      certification: {
        fssai: true,
        organic: true,
        other: ['ISO 22000']
      },
      status: 'passed',
      remarks: 'Excellent quality, meets all standards'
    }
  ];

  const financials: ProcessorFinancials = {
    totalRevenue: 12500000,
    totalCosts: 9850000,
    netProfit: 2650000,
    costBreakdown: {
      rawMaterials: 6200000,
      processing: 2800000,
      overhead: 650000,
      logistics: 200000
    },
    paymentStatus: {
      pendingPayments: 450000,
      pendingReceivables: 680000,
      paidThisMonth: 1200000,
      receivedThisMonth: 1850000
    },
    transactions: [
      {
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'income',
        category: 'Product Sales',
        amount: 450000,
        description: 'Sale of processed groundnut oil'
      },
      {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'expense',
        category: 'Raw Materials',
        amount: 320000,
        description: 'Payment to FPO for groundnut purchase'
      },
      {
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'expense',
        category: 'Processing',
        amount: 85000,
        description: 'Processing costs - labor and machinery'
      }
    ]
  };

  const shipments: Shipment[] = [
    {
      id: 'ship_1',
      orderId: 'po_3',
      vehicleId: 'v1',
      vehicleNumber: 'OD-03-AB-1234',
      source: {
        type: 'FPO',
        id: 'fpo_2',
        name: 'Cuttack Farmers Collective',
        location: { lat: 20.4625, lng: 85.8828 }
      },
      destination: {
        type: 'Processing Unit',
        id: 'proc_1',
        name: 'Main Processing Unit',
        location: { lat: 20.3500, lng: 85.9000 }
      },
      cropType: 'Soybean',
      quantity: 200,
      status: 'in-transit',
      scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      route: 'Cuttack → Bhubaneswar (NH-16)',
      estimatedCost: 15000
    }
  ];

  const marketIntelligence: MarketIntelligence = {
    currentPrices: {
      'Groundnut': 6850,
      'Mustard': 5620,
      'Soybean': 4520,
      'Sunflower': 6580,
      'Sesame': 7800
    },
    priceTrends: [
      { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), crop: 'Groundnut', price: 6650, msp: 6377 },
      { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), crop: 'Groundnut', price: 6750, msp: 6377 },
      { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), crop: 'Groundnut', price: 6800, msp: 6377 },
      { date: new Date().toISOString(), crop: 'Groundnut', price: 6850, msp: 6377 }
    ],
    demandForecast: {
      'Groundnut': 'High',
      'Mustard': 'Medium',
      'Soybean': 'High',
      'Sunflower': 'Low',
      'Sesame': 'Medium'
    },
    bestPurchaseTime: {
      'Groundnut': 'October-November (Post-harvest, better prices)',
      'Mustard': 'March-April (Rabi harvest season)',
      'Soybean': 'October-November (Kharif harvest)'
    },
    bestSellTime: {
      'Groundnut Oil': 'December-January (Festival demand)',
      'Mustard Oil': 'Year-round (stable demand)',
      'Soybean Oil': 'Year-round (high demand)'
    }
  };

  return {
    purchaseOrders,
    qualityRecords,
    financials,
    shipments,
    marketIntelligence
  };
};


