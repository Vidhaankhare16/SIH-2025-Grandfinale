import { FarmerListing } from '../types';

// User-specific data for farmers
export const getFarmerData = (userId: string) => {
  const data: Record<string, {
    listings: FarmerListing[];
    location: string;
    district: string;
    currentCrops: string[];
    totalAcreage: number;
  }> = {
    farmer_1: {
      location: 'Khordha, Odisha',
      district: 'Khordha',
      currentCrops: ['Groundnut', 'Mustard'],
      totalAcreage: 2.5,
      listings: [
        {
          id: 'listing_1',
          farmerId: 'farmer_1',
          farmerName: 'Ramesh Kumar',
          cropName: 'Groundnut',
          quantity: 36.25, // 2.5 acres × 14.5 qtl/acre
          minimumPrice: 6850, // Market price slightly above MSP
          quality: 'Organic',
          location: 'Khordha, Odisha',
          expectedHarvestDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          bids: [],
        },
        {
          id: 'listing_2',
          farmerId: 'farmer_1',
          farmerName: 'Ramesh Kumar',
          cropName: 'Mustard',
          quantity: 28.75, // 2.5 acres × 11.5 qtl/acre
          minimumPrice: 5620, // Market price above MSP
          quality: 'Chemical Based',
          location: 'Khordha, Odisha',
          expectedHarvestDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          bids: [],
        },
      ],
    },
    farmer_2: {
      location: 'Cuttack, Odisha',
      district: 'Cuttack',
      currentCrops: ['Soybean', 'Sunflower'],
      totalAcreage: 1.8,
      listings: [
        {
          id: 'listing_3',
          farmerId: 'farmer_2',
          farmerName: 'Suresh Patra',
          cropName: 'Soybean',
          quantity: 17.1, // 1.8 acres × 9.5 qtl/acre
          minimumPrice: 4520, // Market price above MSP
          quality: 'Chemical Based',
          location: 'Cuttack, Odisha',
          expectedHarvestDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          bids: [],
        },
        {
          id: 'listing_4',
          farmerId: 'farmer_2',
          farmerName: 'Suresh Patra',
          cropName: 'Sunflower',
          quantity: 17.64, // 1.8 acres × 9.8 qtl/acre
          minimumPrice: 6580, // Market price above MSP
          quality: 'Organic',
          location: 'Cuttack, Odisha',
          expectedHarvestDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          bids: [],
        },
      ],
    },
  };

  return data[userId] || data.farmer_1;
};

