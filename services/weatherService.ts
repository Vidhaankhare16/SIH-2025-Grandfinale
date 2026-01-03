// Weather and Climate Data for Odisha Districts
// Based on real-world data from IMD and agricultural research

export interface DistrictWeatherData {
  district: string;
  averageRainfall: number; // mm per year
  monsoonRainfall: number; // mm (June-September)
  rabiRainfall: number; // mm (October-March)
  temperatureRange: {
    min: number; // °C
    max: number; // °C
  };
  soilType: string;
  agroClimate: 'coastal' | 'plateau' | 'hilly' | 'plains';
}

// Real rainfall and climate data for major Odisha districts
export const districtWeatherData: Record<string, DistrictWeatherData> = {
  'Khordha': {
    district: 'Khordha',
    averageRainfall: 1450,
    monsoonRainfall: 1200,
    rabiRainfall: 150,
    temperatureRange: { min: 15, max: 38 },
    soilType: 'Red and Lateritic',
    agroClimate: 'coastal'
  },
  'Cuttack': {
    district: 'Cuttack',
    averageRainfall: 1500,
    monsoonRainfall: 1250,
    rabiRainfall: 180,
    temperatureRange: { min: 16, max: 39 },
    soilType: 'Alluvial',
    agroClimate: 'coastal'
  },
  'Puri': {
    district: 'Puri',
    averageRainfall: 1550,
    monsoonRainfall: 1300,
    rabiRainfall: 200,
    temperatureRange: { min: 18, max: 35 },
    soilType: 'Coastal Alluvial',
    agroClimate: 'coastal'
  },
  'Ganjam': {
    district: 'Ganjam',
    averageRainfall: 1200,
    monsoonRainfall: 1000,
    rabiRainfall: 120,
    temperatureRange: { min: 17, max: 37 },
    soilType: 'Red Sandy Loam',
    agroClimate: 'coastal'
  },
  'Bhadrak': {
    district: 'Bhadrak',
    averageRainfall: 1400,
    monsoonRainfall: 1150,
    rabiRainfall: 160,
    temperatureRange: { min: 15, max: 38 },
    soilType: 'Alluvial',
    agroClimate: 'coastal'
  },
  'Jajpur': {
    district: 'Jajpur',
    averageRainfall: 1350,
    monsoonRainfall: 1100,
    rabiRainfall: 140,
    temperatureRange: { min: 16, max: 38 },
    soilType: 'Alluvial',
    agroClimate: 'coastal'
  },
  'Kalahandi': {
    district: 'Kalahandi',
    averageRainfall: 1300,
    monsoonRainfall: 1100,
    rabiRainfall: 100,
    temperatureRange: { min: 12, max: 40 },
    soilType: 'Red and Lateritic',
    agroClimate: 'plateau'
  },
  'Kandhamal': {
    district: 'Kandhamal',
    averageRainfall: 1600,
    monsoonRainfall: 1400,
    rabiRainfall: 120,
    temperatureRange: { min: 10, max: 35 },
    soilType: 'Red and Lateritic',
    agroClimate: 'hilly'
  },
  'Sundargarh': {
    district: 'Sundargarh',
    averageRainfall: 1400,
    monsoonRainfall: 1200,
    rabiRainfall: 110,
    temperatureRange: { min: 11, max: 38 },
    soilType: 'Red and Lateritic',
    agroClimate: 'plateau'
  },
  'Balangir': {
    district: 'Balangir',
    averageRainfall: 1250,
    monsoonRainfall: 1050,
    rabiRainfall: 100,
    temperatureRange: { min: 13, max: 40 },
    soilType: 'Red Sandy Loam',
    agroClimate: 'plateau'
  },
  'Bargarh': {
    district: 'Bargarh',
    averageRainfall: 1350,
    monsoonRainfall: 1150,
    rabiRainfall: 110,
    temperatureRange: { min: 14, max: 39 },
    soilType: 'Black and Red',
    agroClimate: 'plains'
  },
  'Sambalpur': {
    district: 'Sambalpur',
    averageRainfall: 1400,
    monsoonRainfall: 1200,
    rabiRainfall: 120,
    temperatureRange: { min: 13, max: 39 },
    soilType: 'Red and Lateritic',
    agroClimate: 'plateau'
  }
};

// Get weather data for a district (with fallback)
export const getDistrictWeatherData = (districtName: string): DistrictWeatherData => {
  const normalized = districtName.trim();
  return districtWeatherData[normalized] || {
    district: normalized,
    averageRainfall: 1350, // State average
    monsoonRainfall: 1150,
    rabiRainfall: 120,
    temperatureRange: { min: 15, max: 38 },
    soilType: 'Mixed',
    agroClimate: 'plains'
  };
};

// Crop-specific rainfall requirements (mm)
export const cropRainfallRequirements: Record<string, { min: number; optimal: number; max: number }> = {
  'Groundnut': { min: 500, optimal: 600, max: 1000 },
  'Mustard': { min: 300, optimal: 400, max: 600 },
  'Soybean': { min: 450, optimal: 600, max: 1000 },
  'Sunflower': { min: 400, optimal: 500, max: 800 },
  'Sesame': { min: 300, optimal: 400, max: 600 }
};

// Optimal sowing periods for Odisha (based on rainfall patterns)
export const optimalSowingPeriods: Record<string, { kharif: string; rabi: string }> = {
  'Groundnut': {
    kharif: 'June 15 - July 15 (with onset of monsoon)',
    rabi: 'October 15 - November 15 (post-monsoon residual moisture)'
  },
  'Mustard': {
    kharif: 'Not recommended',
    rabi: 'October 20 - November 20 (utilizing rice fallow)'
  },
  'Soybean': {
    kharif: 'June 20 - July 10 (early monsoon)',
    rabi: 'Not recommended'
  },
  'Sunflower': {
    kharif: 'July 1 - July 20',
    rabi: 'October 15 - November 15'
  },
  'Sesame': {
    kharif: 'June 15 - July 15',
    rabi: 'October 10 - November 10'
  }
};

// Get recommended crop based on rainfall and season
export const getRecommendedCrop = (
  district: string,
  season: 'kharif' | 'rabi',
  rainfall: number
): { crop: string; reason: string } => {
  const weather = getDistrictWeatherData(district);
  const actualRainfall = season === 'kharif' ? weather.monsoonRainfall : weather.rabiRainfall;
  
  if (season === 'kharif') {
    if (actualRainfall >= 1100) {
      return { crop: 'Groundnut', reason: 'High rainfall suitable for groundnut cultivation' };
    } else if (actualRainfall >= 800) {
      return { crop: 'Soybean', reason: 'Moderate rainfall ideal for soybean' };
    } else {
      return { crop: 'Sesame', reason: 'Lower rainfall suitable for drought-tolerant sesame' };
    }
  } else {
    // Rabi season - utilize rice fallow
    if (actualRainfall >= 150) {
      return { crop: 'Mustard', reason: 'Residual moisture perfect for mustard in rice fallows' };
    } else if (actualRainfall >= 100) {
      return { crop: 'Sunflower', reason: 'Moderate residual moisture for sunflower' };
    } else {
      return { crop: 'Groundnut', reason: 'Lower moisture but suitable for groundnut with irrigation' };
    }
  }
};


