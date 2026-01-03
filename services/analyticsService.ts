import { EntityPerformance, GovernmentStats, FarmerListing } from "../types";
import { getAllListings } from "./biddingService";

// Mock data storage (in production, this would be a database)
let farmersData: EntityPerformance[] = [];
let fposData: EntityPerformance[] = [];
let processorsData: EntityPerformance[] = [];

// Initialize with sample data
export const initializeAnalytics = () => {
  // Sample farmers - 9 for FPO 1, 15 for FPO 2 (24 total)
  farmersData = [
    // FPO 1 farmers
    {
      id: 'farmer_1',
      name: 'Ramesh Kumar',
      type: 'farmer',
      location: 'Khordha, Odisha',
      district: 'Khordha',
      oilseedAcreage: 2.5,
      production: 36.25,
      revenue: 248312,
      profit: 137512,
      engagementScore: 85,
      lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 60,
      mspCompliance: 90,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices', 'Consider expanding acreage'],
    },
    {
      id: 'farmer_3',
      name: 'Anita Behera',
      type: 'farmer',
      location: 'Puri, Odisha',
      district: 'Puri',
      oilseedAcreage: 3.0,
      production: 34.5,
      revenue: 193890,
      profit: 87090,
      engagementScore: 92,
      lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 80,
      mspCompliance: 95,
      status: 'excellent',
      supportNeeded: [],
      recommendations: ['Consider becoming a model farmer', 'Share knowledge with others'],
    },
    {
      id: 'farmer_4',
      name: 'Bikash Das',
      type: 'farmer',
      location: 'Ganjam, Odisha',
      district: 'Ganjam',
      oilseedAcreage: 1.5,
      production: 21.75,
      revenue: 148987,
      profit: 46987,
      engagementScore: 70,
      lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 45,
      mspCompliance: 75,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_7',
      name: 'Prabhat Nayak',
      type: 'farmer',
      location: 'Khordha, Odisha',
      district: 'Khordha',
      oilseedAcreage: 2.2,
      production: 31.9,
      revenue: 218515,
      profit: 121915,
      engagementScore: 78,
      lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 55,
      mspCompliance: 85,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_8',
      name: 'Manas Rout',
      type: 'farmer',
      location: 'Puri, Odisha',
      district: 'Puri',
      oilseedAcreage: 2.8,
      production: 32.2,
      revenue: 180964,
      profit: 90064,
      engagementScore: 82,
      lastActivity: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 65,
      mspCompliance: 88,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_9',
      name: 'Sangita Mohanty',
      type: 'farmer',
      location: 'Ganjam, Odisha',
      district: 'Ganjam',
      oilseedAcreage: 1.8,
      production: 17.1,
      revenue: 77352,
      profit: 26032,
      engagementScore: 68,
      lastActivity: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 40,
      mspCompliance: 70,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_10',
      name: 'Dilip Sahoo',
      type: 'farmer',
      location: 'Khordha, Odisha',
      district: 'Khordha',
      oilseedAcreage: 1.2,
      production: 17.4,
      revenue: 119190,
      profit: 37790,
      engagementScore: 65,
      lastActivity: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 35,
      mspCompliance: 68,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_11',
      name: 'Rashmi Behera',
      type: 'farmer',
      location: 'Puri, Odisha',
      district: 'Puri',
      oilseedAcreage: 2.5,
      production: 24.5,
      revenue: 161210,
      profit: 85560,
      engagementScore: 75,
      lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 50,
      mspCompliance: 78,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_12',
      name: 'Niranjan Patra',
      type: 'farmer',
      location: 'Ganjam, Odisha',
      district: 'Ganjam',
      oilseedAcreage: 1.6,
      production: 18.4,
      revenue: 103408,
      profit: 52928,
      engagementScore: 72,
      lastActivity: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 48,
      mspCompliance: 75,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    // FPO 2 farmers
    {
      id: 'farmer_2',
      name: 'Suresh Patra',
      type: 'farmer',
      location: 'Cuttack, Odisha',
      district: 'Cuttack',
      oilseedAcreage: 1.0,
      production: 9.5,
      revenue: 42940,
      profit: 13740,
      engagementScore: 65,
      lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 30,
      mspCompliance: 65,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_5',
      name: 'Prakash Mohanty',
      type: 'farmer',
      location: 'Bhadrak, Odisha',
      district: 'Bhadrak',
      oilseedAcreage: 2.0,
      production: 19.6,
      revenue: 128968,
      profit: 68468,
      engagementScore: 78,
      lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 55,
      mspCompliance: 80,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_6',
      name: 'Laxmi Sahoo',
      type: 'farmer',
      location: 'Jajpur, Odisha',
      district: 'Jajpur',
      oilseedAcreage: 0.8,
      production: 2.24,
      revenue: 17472,
      profit: -1168,
      engagementScore: 45,
      lastActivity: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 15,
      mspCompliance: 55,
      status: 'lagging',
      supportNeeded: ['Financial support', 'Training', 'Better seeds'],
      recommendations: ['Priority support needed', 'Field visit required'],
    },
    {
      id: 'farmer_13',
      name: 'Bijay Kumar',
      type: 'farmer',
      location: 'Cuttack, Odisha',
      district: 'Cuttack',
      oilseedAcreage: 1.5,
      production: 14.25,
      revenue: 64350,
      profit: 20610,
      engagementScore: 70,
      lastActivity: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 42,
      mspCompliance: 72,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_14',
      name: 'Sunita Das',
      type: 'farmer',
      location: 'Bhadrak, Odisha',
      district: 'Bhadrak',
      oilseedAcreage: 1.8,
      production: 17.64,
      revenue: 116071,
      profit: 61621,
      engagementScore: 73,
      lastActivity: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 50,
      mspCompliance: 76,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_15',
      name: 'Ganesh Behera',
      type: 'farmer',
      location: 'Jajpur, Odisha',
      district: 'Jajpur',
      oilseedAcreage: 2.3,
      production: 33.35,
      revenue: 228447,
      profit: 148447,
      engagementScore: 80,
      lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 60,
      mspCompliance: 85,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_16',
      name: 'Kamala Nayak',
      type: 'farmer',
      location: 'Cuttack, Odisha',
      district: 'Cuttack',
      oilseedAcreage: 1.4,
      production: 16.1,
      revenue: 90482,
      profit: 45242,
      engagementScore: 67,
      lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 38,
      mspCompliance: 70,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_17',
      name: 'Harihar Rout',
      type: 'farmer',
      location: 'Bhadrak, Odisha',
      district: 'Bhadrak',
      oilseedAcreage: 2.2,
      production: 20.9,
      revenue: 94468,
      profit: 30188,
      engagementScore: 69,
      lastActivity: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 45,
      mspCompliance: 73,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_18',
      name: 'Padmini Mohanty',
      type: 'farmer',
      location: 'Jajpur, Odisha',
      district: 'Jajpur',
      oilseedAcreage: 1.2,
      production: 3.36,
      revenue: 26208,
      profit: 8208,
      engagementScore: 55,
      lastActivity: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 25,
      mspCompliance: 60,
      status: 'at-risk',
      supportNeeded: ['Training', 'Better seeds'],
      recommendations: ['Improve cultivation practices'],
    },
    {
      id: 'farmer_19',
      name: 'Rabi Sahoo',
      type: 'farmer',
      location: 'Cuttack, Odisha',
      district: 'Cuttack',
      oilseedAcreage: 2.5,
      production: 24.5,
      revenue: 161210,
      profit: 85560,
      engagementScore: 76,
      lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 52,
      mspCompliance: 79,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_20',
      name: 'Sibani Patra',
      type: 'farmer',
      location: 'Bhadrak, Odisha',
      district: 'Bhadrak',
      oilseedAcreage: 1.8,
      production: 26.1,
      revenue: 178785,
      profit: 56865,
      engagementScore: 71,
      lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 48,
      mspCompliance: 74,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_21',
      name: 'Narayan Behera',
      type: 'farmer',
      location: 'Jajpur, Odisha',
      district: 'Jajpur',
      oilseedAcreage: 2.4,
      production: 27.6,
      revenue: 155112,
      profit: 79392,
      engagementScore: 74,
      lastActivity: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 53,
      mspCompliance: 77,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_22',
      name: 'Lalita Das',
      type: 'farmer',
      location: 'Cuttack, Odisha',
      district: 'Cuttack',
      oilseedAcreage: 0.9,
      production: 8.55,
      revenue: 38646,
      profit: 12366,
      engagementScore: 62,
      lastActivity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 28,
      mspCompliance: 65,
      status: 'at-risk',
      supportNeeded: ['Training'],
      recommendations: ['Improve cultivation practices'],
    },
    {
      id: 'farmer_23',
      name: 'Biswajit Nayak',
      type: 'farmer',
      location: 'Bhadrak, Odisha',
      district: 'Bhadrak',
      oilseedAcreage: 1.5,
      production: 14.7,
      revenue: 96726,
      profit: 51426,
      engagementScore: 68,
      lastActivity: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 40,
      mspCompliance: 71,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_24',
      name: 'Manasi Rout',
      type: 'farmer',
      location: 'Jajpur, Odisha',
      district: 'Jajpur',
      oilseedAcreage: 0.6,
      production: 1.68,
      revenue: 13104,
      profit: -896,
      engagementScore: 48,
      lastActivity: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 12,
      mspCompliance: 52,
      status: 'lagging',
      supportNeeded: ['Financial support', 'Training', 'Better seeds'],
      recommendations: ['Priority support needed'],
    },
    {
      id: 'farmer_25',
      name: 'Debasis Mohanty',
      type: 'farmer',
      location: 'Cuttack, Odisha',
      district: 'Cuttack',
      oilseedAcreage: 2.1,
      production: 30.45,
      revenue: 208582,
      profit: 135382,
      engagementScore: 83,
      lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 65,
      mspCompliance: 88,
      status: 'excellent',
      supportNeeded: [],
      recommendations: ['Consider becoming a model farmer'],
    },
    {
      id: 'farmer_26',
      name: 'Sujata Sahoo',
      type: 'farmer',
      location: 'Bhadrak, Odisha',
      district: 'Bhadrak',
      oilseedAcreage: 1.7,
      production: 19.55,
      revenue: 109871,
      profit: 56231,
      engagementScore: 77,
      lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 54,
      mspCompliance: 80,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
    {
      id: 'farmer_27',
      name: 'Ashok Patra',
      type: 'farmer',
      location: 'Jajpur, Odisha',
      district: 'Jajpur',
      oilseedAcreage: 1.3,
      production: 12.35,
      revenue: 55822,
      profit: 17942,
      engagementScore: 66,
      lastActivity: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 35,
      mspCompliance: 68,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Continue current practices'],
    },
  ];

  // Sample FPOs
  fposData = [
    {
      id: 'fpo_1',
      name: 'Odisha FPO Cooperative',
      type: 'fpo',
      location: 'Bhubaneswar, Odisha',
      district: 'Khordha',
      oilseedAcreage: 0, // Not applicable
      production: 233.5, // Total handled (quintals) - sum of 9 farmers
      revenue: 1450837,
      profit: 676978,
      engagementScore: 88,
      lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 75,
      mspCompliance: 85,
      status: 'on-track',
      supportNeeded: [],
      recommendations: ['Expand warehouse capacity', 'Increase farmer outreach'],
    },
    {
      id: 'fpo_2',
      name: 'Cuttack Farmers Collective',
      type: 'fpo',
      location: 'Cuttack, Odisha',
      district: 'Cuttack',
      oilseedAcreage: 0,
      production: 265.85, // Total handled (quintals) - sum of 15 farmers
      revenue: 1800000,
      profit: 680000,
      engagementScore: 55,
      lastActivity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 40,
      mspCompliance: 70,
      status: 'at-risk',
      supportNeeded: ['Infrastructure support', 'Training on FPO management', 'Market linkage'],
      recommendations: ['Improve farmer engagement', 'Better utilization of government schemes'],
    },
  ];

  // Sample Processors
  processorsData = [
    {
      id: 'processor_1',
      name: 'Odisha Oil Processing Unit',
      type: 'processor',
      location: 'Bhubaneswar, Odisha',
      district: 'Khordha',
      oilseedAcreage: 0,
      production: 985, // Processed (quintals)
      revenue: 6850000,
      profit: 1420000,
      engagementScore: 90,
      lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 85,
      mspCompliance: 0, // Not applicable
      status: 'excellent',
      supportNeeded: [],
      recommendations: ['Expand processing capacity', 'Export opportunities'],
    },
    {
      id: 'processor_2',
      name: 'Ganjam Oil Mills',
      type: 'processor',
      location: 'Ganjam, Odisha',
      district: 'Ganjam',
      oilseedAcreage: 0,
      production: 185,
      revenue: 1285000,
      profit: 185000,
      engagementScore: 40,
      lastActivity: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      schemeUtilization: 25,
      mspCompliance: 0,
      status: 'lagging',
      supportNeeded: ['Modern machinery', 'Financial assistance', 'Technical training', 'Quality certification'],
      recommendations: ['Priority support for modernization', 'Connect with larger processors for mentorship'],
    },
  ];
};

// Calculate performance status
const calculateStatus = (entity: EntityPerformance): 'on-track' | 'at-risk' | 'lagging' | 'excellent' => {
  const score = (
    (entity.engagementScore * 0.3) +
    (entity.schemeUtilization * 0.2) +
    (entity.mspCompliance * 0.2) +
    (entity.profit > 0 ? Math.min(100, (entity.profit / entity.revenue) * 200) * 0.3 : 0)
  );

  if (score >= 85) return 'excellent';
  if (score >= 70) return 'on-track';
  if (score >= 50) return 'at-risk';
  return 'lagging';
};

// Update entity status
const updateEntityStatus = (entity: EntityPerformance): EntityPerformance => {
  const status = calculateStatus(entity);
  return { ...entity, status };
};

// Get all entities with updated status
export const getAllEntities = (): EntityPerformance[] => {
  return [
    ...farmersData.map(updateEntityStatus),
    ...fposData.map(updateEntityStatus),
    ...processorsData.map(updateEntityStatus),
  ];
};

// Get lagging entities
export const getLaggingEntities = (): EntityPerformance[] => {
  return getAllEntities().filter(e => e.status === 'lagging' || e.status === 'at-risk');
};

// Get government stats
export const getGovernmentStats = (): GovernmentStats => {
  const allEntities = getAllEntities();
  const farmers = allEntities.filter(e => e.type === 'farmer');
  const fpos = allEntities.filter(e => e.type === 'fpo');
  const processors = allEntities.filter(e => e.type === 'processor');

  const activeFarmers = farmers.filter(f => 
    new Date(f.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;
  const activeFPOs = fpos.filter(f => 
    new Date(f.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;
  const activeProcessors = processors.filter(p => 
    new Date(p.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  const totalOilseedAcreage = farmers.reduce((sum, f) => sum + f.oilseedAcreage, 0);
  const totalProduction = allEntities.reduce((sum, e) => sum + e.production, 0);
  const totalRevenue = allEntities.reduce((sum, e) => sum + e.revenue, 0);
  const totalProfit = allEntities.reduce((sum, e) => sum + e.profit, 0);
  const averageProfitPerAcre = totalOilseedAcreage > 0 ? totalProfit / totalOilseedAcreage : 0;

  // Calculate NMEO-OP compliance (average scheme utilization and MSP compliance)
  const avgSchemeUtilization = allEntities.reduce((sum, e) => sum + e.schemeUtilization, 0) / allEntities.length;
  const avgMspCompliance = farmers.length > 0 
    ? farmers.reduce((sum, f) => sum + f.mspCompliance, 0) / farmers.length 
    : 0;
  const nmeoCompliance = (avgSchemeUtilization + avgMspCompliance) / 2;

  // District-wise stats
  const districtMap = new Map<string, {
    district: string;
    farmers: number;
    fpos: number;
    processors: number;
    production: number;
  }>();

  allEntities.forEach(entity => {
    const existing = districtMap.get(entity.district) || {
      district: entity.district,
      farmers: 0,
      fpos: 0,
      processors: 0,
      production: 0,
    };

    if (entity.type === 'farmer') existing.farmers++;
    if (entity.type === 'fpo') existing.fpos++;
    if (entity.type === 'processor') existing.processors++;
    existing.production += entity.production;

    districtMap.set(entity.district, existing);
  });

  const districtWiseStats = Array.from(districtMap.values()).map(dist => {
    const entities = allEntities.filter(e => e.district === dist.district);
    const avgScore = entities.reduce((sum, e) => sum + e.engagementScore + e.schemeUtilization, 0) / entities.length;
    let status: 'on-track' | 'at-risk' | 'lagging' = 'on-track';
    if (avgScore < 50) status = 'lagging';
    else if (avgScore < 70) status = 'at-risk';

    return { ...dist, status };
  });

  return {
    totalFarmers: farmers.length,
    activeFarmers,
    totalFPOs: fpos.length,
    activeFPOs,
    totalProcessors: processors.length,
    activeProcessors,
    totalOilseedAcreage,
    totalProduction,
    totalRevenue,
    averageProfitPerAcre,
    nmeoCompliance,
    laggingEntities: getLaggingEntities(),
    districtWiseStats,
  };
};

// Get entity by ID
export const getEntityById = (id: string): EntityPerformance | null => {
  const allEntities = getAllEntities();
  return allEntities.find(e => e.id === id) || null;
};

// Initialize on module load
initializeAnalytics();

