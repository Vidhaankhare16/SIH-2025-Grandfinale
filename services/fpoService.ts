import { ConnectedFarmer, FPOFinance } from "../types";

/**
 * Engagement Score Logic Explanation:
 * 
 * The engagement score (0-100%) measures how actively a farmer engages with the FPO.
 * It is calculated based on multiple factors:
 * 
 * 1. Transaction Frequency (40% weight):
 *    - Based on totalTransactions: More transactions = higher score
 *    - Farmers with 15+ transactions typically score 80-92%
 *    - Farmers with 6-12 transactions typically score 65-85%
 *    - Farmers with <6 transactions typically score 45-70%
 * 
 * 2. Transaction Value (30% weight):
 *    - Based on totalValue: Higher transaction values = higher score
 *    - Farmers with ₹15L+ total value typically score 85-92%
 *    - Farmers with ₹10L-15L typically score 75-85%
 *    - Farmers with <₹5L typically score 45-70%
 * 
 * 3. Activity Recency (20% weight):
 *    - Based on lastActivity: More recent activity = higher score
 *    - Activity within last 1-2 days: +15-20 points
 *    - Activity within last 3-7 days: +5-10 points
 *    - Activity >7 days ago: 0-5 points
 * 
 * 4. Status (10% weight):
 *    - Active farmers: +10 points
 *    - Inactive farmers: 0 points
 * 
 * Score Ranges:
 * - High (80-100%): Highly engaged, frequent transactions, high value, recent activity
 * - Medium (50-79%): Moderate engagement, regular transactions, moderate value
 * - Low (<50%): Low engagement, few transactions, low value, or inactive
 * 
 * Example: A farmer with 15 transactions, ₹16.85L total value, active status, 
 * and activity 1 day ago would score ~92% (high engagement).
 */

// User-specific data for FPOs
export const getFPOData = (userId: string) => {
  const data: Record<string, {
    connectedFarmers: ConnectedFarmer[];
    finances: FPOFinance;
    warehouses: Array<{ id: string; name: string; location: { lat: number; lng: number }; capacity: number; utilization: number; cropType: string[]; lastUpdated: string }>;
    vehicles: Array<{ id: string; vehicleNumber: string; type: 'truck' | 'tractor' | 'tempo'; capacity: number; currentLocation: { lat: number; lng: number }; status: 'available' | 'in-transit' | 'loading' | 'maintenance'; driverName?: string; driverPhone?: string; currentLoad?: number; assignedRoute?: string; lastUpdated: string }>;
  }> = {
    fpo_1: {
      connectedFarmers: [
        {
          id: 'farmer_1',
          name: 'Ramesh Kumar',
          location: 'Khordha, Odisha',
          district: 'Khordha',
          cropType: 'Groundnut',
          acreage: 2.5,
          production: 36.25, // 2.5 × 14.5 qtl/acre
          revenue: 248312, // 36.25 × 6850
          profit: 137512, // Revenue - (2.5 × 34800 investment)
          engagementScore: 85,
          lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 12,
          totalValue: 1158000,
          coordinates: { lat: 20.1861, lng: 85.7145 }, // Unique location within Khordha
        },
        {
          id: 'farmer_3',
          name: 'Anita Behera',
          location: 'Puri, Odisha',
          district: 'Puri',
          cropType: 'Mustard',
          acreage: 3.0,
          production: 34.5, // 3.0 × 11.5 qtl/acre
          revenue: 193890, // 34.5 × 5620
          profit: 87090, // Revenue - (3.0 × 31600 investment)
          engagementScore: 92,
          lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 15,
          totalValue: 1685000,
          coordinates: { lat: 19.8035, lng: 85.8212 }, // Unique location within Puri
        },
        {
          id: 'farmer_4',
          name: 'Bikash Das',
          location: 'Ganjam, Odisha',
          district: 'Ganjam',
          cropType: 'Groundnut',
          acreage: 1.5,
          production: 21.75, // 1.5 × 14.5 qtl/acre
          revenue: 148987, // 21.75 × 6850
          profit: 46987, // Revenue - (1.5 × 34800 investment)
          engagementScore: 70,
          lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 6,
          totalValue: 425000,
          coordinates: { lat: 19.3044, lng: 85.0400 }, // Unique location within Ganjam
        },
        {
          id: 'farmer_7',
          name: 'Prabhat Nayak',
          location: 'Khordha, Odisha',
          district: 'Khordha',
          cropType: 'Groundnut',
          acreage: 2.2,
          production: 31.9, // 2.2 × 14.5 qtl/acre
          revenue: 218515, // 31.9 × 6850
          profit: 121915, // Revenue - (2.2 × 34800 investment)
          engagementScore: 78,
          lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 9,
          totalValue: 1025000,
          coordinates: { lat: 20.2061, lng: 85.7345 }, // Unique location within Khordha
        },
        {
          id: 'farmer_8',
          name: 'Manas Rout',
          location: 'Puri, Odisha',
          district: 'Puri',
          cropType: 'Mustard',
          acreage: 2.8,
          production: 32.2, // 2.8 × 11.5 qtl/acre
          revenue: 180964, // 32.2 × 5620
          profit: 90064, // Revenue - (2.8 × 31600 investment)
          engagementScore: 82,
          lastActivity: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 11,
          totalValue: 1520000,
          coordinates: { lat: 19.8235, lng: 85.8412 }, // Unique location within Puri
        },
        {
          id: 'farmer_9',
          name: 'Sangita Mohanty',
          location: 'Ganjam, Odisha',
          district: 'Ganjam',
          cropType: 'Soybean',
          acreage: 1.8,
          production: 17.1, // 1.8 × 9.5 qtl/acre
          revenue: 77352, // 17.1 × 4520
          profit: 26032, // Revenue - (1.8 × 29200 investment)
          engagementScore: 68,
          lastActivity: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 7,
          totalValue: 485000,
          coordinates: { lat: 19.3244, lng: 85.0600 }, // Unique location within Ganjam
        },
        {
          id: 'farmer_10',
          name: 'Dilip Sahoo',
          location: 'Khordha, Odisha',
          district: 'Khordha',
          cropType: 'Groundnut',
          acreage: 1.2,
          production: 17.4, // 1.2 × 14.5 qtl/acre
          revenue: 119190, // 17.4 × 6850
          profit: 37790, // Revenue - (1.2 × 34800 investment)
          engagementScore: 65,
          lastActivity: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 5,
          totalValue: 385000,
          coordinates: { lat: 20.1761, lng: 85.7045 }, // Unique location within Khordha
        },
        {
          id: 'farmer_11',
          name: 'Rashmi Behera',
          location: 'Puri, Odisha',
          district: 'Puri',
          cropType: 'Sunflower',
          acreage: 2.5,
          production: 24.5, // 2.5 × 9.8 qtl/acre
          revenue: 161210, // 24.5 × 6580
          profit: 85560, // Revenue - (2.5 × 30250 investment)
          engagementScore: 75,
          lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 10,
          totalValue: 1120000,
          coordinates: { lat: 19.7935, lng: 85.8112 }, // Unique location within Puri
        },
        {
          id: 'farmer_12',
          name: 'Niranjan Patra',
          location: 'Ganjam, Odisha',
          district: 'Ganjam',
          cropType: 'Mustard',
          acreage: 1.6,
          production: 18.4, // 1.6 × 11.5 qtl/acre
          revenue: 103408, // 18.4 × 5620
          profit: 52928, // Revenue - (1.6 × 31600 investment)
          engagementScore: 72,
          lastActivity: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 8,
          totalValue: 720000,
          coordinates: { lat: 19.2944, lng: 85.0300 }, // Unique location within Ganjam
        },
      ],
      finances: {
        totalFunds: 6850000,
        availableFunds: 4280000,
        committedFunds: 2120000,
        pendingPayments: 450000,
        revenue: 12450000,
        expenses: 8950000,
        profit: 3500000,
        transactions: [
          {
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'income',
            amount: 428500,
            description: 'Sale of Groundnut to Processor',
          },
          {
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'expense',
            amount: 118500,
            description: 'Payment to Farmers',
          },
          {
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'income',
            amount: 365200,
            description: 'Sale of Soybean',
          },
          {
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'expense',
            amount: 95000,
            description: 'Transportation & Logistics',
          },
          {
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'income',
            amount: 392000,
            description: 'Sale of Mustard',
          },
        ],
      },
      warehouses: [
        { id: '1', name: 'WH-Bhubaneswar-Alpha', location: { lat: 20.2961, lng: 85.8245 }, capacity: 1250, utilization: 892, cropType: ['Groundnut'], lastUpdated: '2h ago' },
        { id: '2', name: 'WH-Cuttack-Central', location: { lat: 20.4625, lng: 85.8828 }, capacity: 1800, utilization: 485, cropType: ['Soybean'], lastUpdated: '1d ago' },
      ],
      vehicles: [
        { id: 'v1', vehicleNumber: 'OD-01-AB-1234', type: 'truck', capacity: 45, currentLocation: { lat: 20.2961, lng: 85.8245 }, status: 'available', driverName: 'Rajesh Kumar', driverPhone: '+91-9876543210', lastUpdated: '2h ago' },
        { id: 'v2', vehicleNumber: 'OD-01-CD-5678', type: 'truck', capacity: 70, currentLocation: { lat: 20.4625, lng: 85.8828 }, status: 'in-transit', driverName: 'Suresh Patra', driverPhone: '+91-9876543211', currentLoad: 58, assignedRoute: 'Farm A → WH-Bhubaneswar', lastUpdated: '30m ago' },
        { id: 'v3', vehicleNumber: 'OD-01-EF-9012', type: 'tractor', capacity: 45, currentLocation: { lat: 19.8135, lng: 85.8312 }, status: 'available', driverName: 'Mohan Das', driverPhone: '+91-9876543212', lastUpdated: '1h ago' },
      ],
    },
    fpo_2: {
      connectedFarmers: [
        {
          id: 'farmer_2',
          name: 'Suresh Patra',
          location: 'Cuttack, Odisha',
          district: 'Cuttack',
          cropType: 'Soybean',
          acreage: 1.0,
          production: 9.5, // 1.0 × 9.5 qtl/acre
          revenue: 42940, // 9.5 × 4520
          profit: 13740, // Revenue - (1.0 × 29200 investment)
          engagementScore: 65,
          lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 8,
          totalValue: 625000,
          coordinates: { lat: 20.4525, lng: 85.8728 }, // Unique location within Cuttack
        },
        {
          id: 'farmer_5',
          name: 'Prakash Mohanty',
          location: 'Bhadrak, Odisha',
          district: 'Bhadrak',
          cropType: 'Sunflower',
          acreage: 2.0,
          production: 19.6, // 2.0 × 9.8 qtl/acre
          revenue: 128968, // 19.6 × 6580
          profit: 68468, // Revenue - (2.0 × 30250 investment)
          engagementScore: 78,
          lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 10,
          totalValue: 895000,
          coordinates: { lat: 21.0444, lng: 86.4914 }, // Unique location within Bhadrak
        },
        {
          id: 'farmer_6',
          name: 'Laxmi Sahoo',
          location: 'Jajpur, Odisha',
          district: 'Jajpur',
          cropType: 'Sesame',
          acreage: 0.8,
          production: 2.24, // 0.8 × 2.8 qtl/acre
          revenue: 17472, // 2.24 × 7800 (MSP)
          profit: -1168, // Revenue - (0.8 × 23300 investment) - small loss due to low yield
          engagementScore: 45,
          lastActivity: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'inactive',
          totalTransactions: 3,
          totalValue: 115000,
          coordinates: { lat: 20.8525, lng: 86.1728 }, // Unique location within Jajpur
        },
        {
          id: 'farmer_13',
          name: 'Bijay Kumar',
          location: 'Cuttack, Odisha',
          district: 'Cuttack',
          cropType: 'Soybean',
          acreage: 1.5,
          production: 14.25, // 1.5 × 9.5 qtl/acre
          revenue: 64350, // 14.25 × 4520
          profit: 20610, // Revenue - (1.5 × 29200 investment)
          engagementScore: 70,
          lastActivity: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 9,
          totalValue: 685000,
          coordinates: { lat: 20.4725, lng: 85.8928 }, // Unique location within Cuttack
        },
        {
          id: 'farmer_14',
          name: 'Sunita Das',
          location: 'Bhadrak, Odisha',
          district: 'Bhadrak',
          cropType: 'Sunflower',
          acreage: 1.8,
          production: 17.64, // 1.8 × 9.8 qtl/acre
          revenue: 116071, // 17.64 × 6580
          profit: 61621, // Revenue - (1.8 × 30250 investment)
          engagementScore: 73,
          lastActivity: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 7,
          totalValue: 825000,
          coordinates: { lat: 21.0644, lng: 86.5114 }, // Unique location within Bhadrak
        },
        {
          id: 'farmer_15',
          name: 'Ganesh Behera',
          location: 'Jajpur, Odisha',
          district: 'Jajpur',
          cropType: 'Groundnut',
          acreage: 2.3,
          production: 33.35, // 2.3 × 14.5 qtl/acre
          revenue: 228447, // 33.35 × 6850
          profit: 148447, // Revenue - (2.3 × 34800 investment)
          engagementScore: 80,
          lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 13,
          totalValue: 1285000,
          coordinates: { lat: 20.8725, lng: 86.1928 }, // Unique location within Jajpur
        },
        {
          id: 'farmer_16',
          name: 'Kamala Nayak',
          location: 'Cuttack, Odisha',
          district: 'Cuttack',
          cropType: 'Mustard',
          acreage: 1.4,
          production: 16.1, // 1.4 × 11.5 qtl/acre
          revenue: 90482, // 16.1 × 5620
          profit: 45242, // Revenue - (1.4 × 31600 investment)
          engagementScore: 67,
          lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 6,
          totalValue: 550000,
          coordinates: { lat: 20.4425, lng: 85.8628 }, // Unique location within Cuttack
        },
        {
          id: 'farmer_17',
          name: 'Harihar Rout',
          location: 'Bhadrak, Odisha',
          district: 'Bhadrak',
          cropType: 'Soybean',
          acreage: 2.2,
          production: 20.9, // 2.2 × 9.5 qtl/acre
          revenue: 94468, // 20.9 × 4520
          profit: 30188, // Revenue - (2.2 × 29200 investment)
          engagementScore: 69,
          lastActivity: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 8,
          totalValue: 745000,
          coordinates: { lat: 21.0344, lng: 86.4814 }, // Unique location within Bhadrak
        },
        {
          id: 'farmer_18',
          name: 'Padmini Mohanty',
          location: 'Jajpur, Odisha',
          district: 'Jajpur',
          cropType: 'Sesame',
          acreage: 1.2,
          production: 3.36, // 1.2 × 2.8 qtl/acre
          revenue: 26208, // 3.36 × 7800 (MSP)
          profit: 8208, // Revenue - (1.2 × 23300 investment)
          engagementScore: 55,
          lastActivity: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 4,
          totalValue: 185000,
          coordinates: { lat: 20.8425, lng: 86.1528 }, // Unique location within Jajpur
        },
        {
          id: 'farmer_19',
          name: 'Rabi Sahoo',
          location: 'Cuttack, Odisha',
          district: 'Cuttack',
          cropType: 'Sunflower',
          acreage: 2.5,
          production: 24.5, // 2.5 × 9.8 qtl/acre
          revenue: 161210, // 24.5 × 6580
          profit: 85560, // Revenue - (2.5 × 30250 investment)
          engagementScore: 76,
          lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 11,
          totalValue: 1120000,
          coordinates: { lat: 20.4825, lng: 85.9028 }, // Unique location within Cuttack
        },
        {
          id: 'farmer_20',
          name: 'Sibani Patra',
          location: 'Bhadrak, Odisha',
          district: 'Bhadrak',
          cropType: 'Groundnut',
          acreage: 1.8,
          production: 26.1, // 1.8 × 14.5 qtl/acre
          revenue: 178785, // 26.1 × 6850
          profit: 56865, // Revenue - (1.8 × 34800 investment)
          engagementScore: 71,
          lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 7,
          totalValue: 925000,
          coordinates: { lat: 21.0244, lng: 86.4714 }, // Unique location within Bhadrak
        },
        {
          id: 'farmer_21',
          name: 'Narayan Behera',
          location: 'Jajpur, Odisha',
          district: 'Jajpur',
          cropType: 'Mustard',
          acreage: 2.4,
          production: 27.6, // 2.4 × 11.5 qtl/acre
          revenue: 155112, // 27.6 × 5620
          profit: 79392, // Revenue - (2.4 × 31600 investment)
          engagementScore: 74,
          lastActivity: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 9,
          totalValue: 1085000,
          coordinates: { lat: 20.8625, lng: 86.2028 }, // Unique location within Jajpur
        },
        {
          id: 'farmer_22',
          name: 'Lalita Das',
          location: 'Cuttack, Odisha',
          district: 'Cuttack',
          cropType: 'Soybean',
          acreage: 0.9,
          production: 8.55, // 0.9 × 9.5 qtl/acre
          revenue: 38646, // 8.55 × 4520
          profit: 12366, // Revenue - (0.9 × 29200 investment)
          engagementScore: 62,
          lastActivity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 5,
          totalValue: 420000,
          coordinates: { lat: 20.4325, lng: 85.8528 }, // Unique location within Cuttack
        },
        {
          id: 'farmer_23',
          name: 'Biswajit Nayak',
          location: 'Bhadrak, Odisha',
          district: 'Bhadrak',
          cropType: 'Sunflower',
          acreage: 1.5,
          production: 14.7, // 1.5 × 9.8 qtl/acre
          revenue: 96726, // 14.7 × 6580
          profit: 51426, // Revenue - (1.5 × 30250 investment)
          engagementScore: 68,
          lastActivity: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 6,
          totalValue: 685000,
          coordinates: { lat: 21.0144, lng: 86.4614 }, // Unique location within Bhadrak
        },
        {
          id: 'farmer_24',
          name: 'Manasi Rout',
          location: 'Jajpur, Odisha',
          district: 'Jajpur',
          cropType: 'Sesame',
          acreage: 0.6,
          production: 1.68, // 0.6 × 2.8 qtl/acre
          revenue: 13104, // 1.68 × 7800 (MSP)
          profit: -896, // Revenue - (0.6 × 23300 investment) - small loss
          engagementScore: 48,
          lastActivity: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'inactive',
          totalTransactions: 2,
          totalValue: 95000,
          coordinates: { lat: 20.8325, lng: 86.1328 }, // Unique location within Jajpur
        },
        {
          id: 'farmer_25',
          name: 'Debasis Mohanty',
          location: 'Cuttack, Odisha',
          district: 'Cuttack',
          cropType: 'Groundnut',
          acreage: 2.1,
          production: 30.45, // 2.1 × 14.5 qtl/acre
          revenue: 208582, // 30.45 × 6850
          profit: 135382, // Revenue - (2.1 × 34800 investment)
          engagementScore: 83,
          lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 14,
          totalValue: 1350000,
          coordinates: { lat: 20.4925, lng: 85.9128 }, // Unique location within Cuttack
        },
        {
          id: 'farmer_26',
          name: 'Sujata Sahoo',
          location: 'Bhadrak, Odisha',
          district: 'Bhadrak',
          cropType: 'Mustard',
          acreage: 1.7,
          production: 19.55, // 1.7 × 11.5 qtl/acre
          revenue: 109871, // 19.55 × 5620
          profit: 56231, // Revenue - (1.7 × 31600 investment)
          engagementScore: 77,
          lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 10,
          totalValue: 985000,
        },
        {
          id: 'farmer_27',
          name: 'Ashok Patra',
          location: 'Jajpur, Odisha',
          district: 'Jajpur',
          cropType: 'Soybean',
          acreage: 1.3,
          production: 12.35, // 1.3 × 9.5 qtl/acre
          revenue: 55822, // 12.35 × 4520
          profit: 17942, // Revenue - (1.3 × 29200 investment)
          engagementScore: 66,
          lastActivity: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          totalTransactions: 7,
          totalValue: 580000,
        },
      ],
      finances: {
        totalFunds: 4850000,
        availableFunds: 3120000,
        committedFunds: 1280000,
        pendingPayments: 450000,
        revenue: 7850000,
        expenses: 6120000,
        profit: 1730000,
        transactions: [
          {
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'income',
            amount: 268500,
            description: 'Sale of Sunflower',
          },
          {
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'expense',
            amount: 92500,
            description: 'Transportation Costs',
          },
          {
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'income',
            amount: 188200,
            description: 'Sale of Soybean',
          },
          {
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'expense',
            amount: 112000,
            description: 'Payment to Farmers',
          },
        ],
      },
      warehouses: [
        { id: '1', name: 'WH-Bhubaneswar-Beta', location: { lat: 20.3500, lng: 85.9000 }, capacity: 950, utilization: 612, cropType: ['Soybean', 'Sunflower'], lastUpdated: '3h ago' },
        { id: '2', name: 'WH-Cuttack-North', location: { lat: 20.5000, lng: 85.9500 }, capacity: 1350, utilization: 728, cropType: ['Sunflower'], lastUpdated: '5h ago' },
        { id: '3', name: 'WH-Puri-East', location: { lat: 19.8500, lng: 85.9000 }, capacity: 680, utilization: 485, cropType: ['Sesame'], lastUpdated: '1d ago' },
      ],
      vehicles: [
        { id: 'v1', vehicleNumber: 'OD-02-XY-3456', type: 'truck', capacity: 52, currentLocation: { lat: 20.3500, lng: 85.9000 }, status: 'available', driverName: 'Amit Singh', driverPhone: '+91-9876543213', lastUpdated: '1h ago' },
        { id: 'v2', vehicleNumber: 'OD-02-ZW-7890', type: 'truck', capacity: 75, currentLocation: { lat: 20.5000, lng: 85.9500 }, status: 'loading', driverName: 'Deepak Rout', driverPhone: '+91-9876543214', currentLoad: 0, assignedRoute: 'WH-Cuttack → Market', lastUpdated: '20m ago' },
        { id: 'v3', vehicleNumber: 'OD-02-QR-2468', type: 'tempo', capacity: 25, currentLocation: { lat: 19.8500, lng: 85.9000 }, status: 'available', driverName: 'Niranjan Panda', driverPhone: '+91-9876543215', lastUpdated: '4h ago' },
        { id: 'v4', vehicleNumber: 'OD-02-ST-1357', type: 'truck', capacity: 90, currentLocation: { lat: 20.4000, lng: 85.8500 }, status: 'in-transit', driverName: 'Biswajit Nayak', driverPhone: '+91-9876543216', currentLoad: 72, assignedRoute: 'Farm → WH-Bhubaneswar', lastUpdated: '45m ago' },
      ],
    },
  };

  return data[userId] || data.fpo_1;
};

// Function to get empty/default FPO data (for new accounts)
export const getEmptyFPOData = () => {
  return {
    connectedFarmers: [],
    finances: {
      totalFunds: 0,
      availableFunds: 0,
      committedFunds: 0,
      pendingPayments: 0,
      revenue: 0,
      expenses: 0,
      profit: 0,
      transactions: [],
    },
    warehouses: [],
    vehicles: [],
  };
};

// Function to override FPO data for a specific user (for new account creation)
// Note: This is a workaround since the data is hardcoded. In production, this would be in a database.
// For now, we'll rely on the component to initialize with empty data when userId doesn't match predefined ones.
export const clearFPODataForUser = (userId: string): void => {
  // Since data is hardcoded, we can't actually clear it here
  // But we can ensure that new users get empty data by checking in getFPOData
  // The component should handle this by checking if userId starts with the role prefix
  // and doesn't match predefined IDs, then use empty data
  console.log(`FPO data should be cleared for user: ${userId}`);
};

// Legacy functions for backward compatibility
export const getConnectedFarmers = (userId?: string): ConnectedFarmer[] => {
  if (userId) {
    return getFPOData(userId).connectedFarmers;
  }
  return getFPOData('fpo_1').connectedFarmers;
};

export const getFPOFinance = (userId?: string): FPOFinance | null => {
  if (userId) {
    return getFPOData(userId).finances;
  }
  return getFPOData('fpo_1').finances;
};

export const getFarmerById = (farmerId: string): ConnectedFarmer | null => {
  // Search across all FPOs
  const fpo1Data = getFPOData('fpo_1');
  const fpo2Data = getFPOData('fpo_2');
  const allFarmers = [...fpo1Data.connectedFarmers, ...fpo2Data.connectedFarmers];
  return allFarmers.find(f => f.id === farmerId) || null;
};
