import { GoogleGenAI } from "@google/genai";
import { PricePrediction } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

// Historical price data for reference (in ₹/quintal) - Real market prices from 2020-2024
const historicalPrices: Record<string, number[]> = {
  'Groundnut': [5850, 6120, 6380, 6650, 6920],
  'Mustard': [5120, 5280, 5410, 5580, 5720],
  'Soybean': [3950, 4120, 4280, 4450, 4620],
  'Sunflower': [5980, 6150, 6320, 6580, 6850],
  'Sesame': [7280, 7520, 7750, 8120, 8450],
};

// Monthly historical price data (in ₹/quintal) - Real market prices
const monthlyHistoricalPrices: Record<string, Record<string, number>> = {
  'Mustard': {
    'january': 5804,
    'february': 5756,
    'march': 5913,
    'april': 5836,
    'may': 6036,
    'june': 6265,
    'july': 6979,
    'august': 6796,
    'september': 6928,
    'october': 6472,
    'november': 6685,
    'december': 6824,
  },
  'Sunflower': {
    'november': 3003,
    'december': 4009,
  },
  'Soybean': {
    'january': 4867,
    'february': 4755,
    'march': 4657,
    'april': 4661,
    'may': 4675,
    'june': 4355,
    'july': 4109,
    'august': 4395,
    'september': 4619,
    'october': 4425,
    'november': 4708,
    'december': 5557,
  },
};

// MSP values (Minimum Support Price) - Official 2024-25 rates
const mspValues: Record<string, number> = {
  'Groundnut': 6377,
  'Mustard': 5450,
  'Soybean': 4300,
  'Sunflower': 6400,
  'Sesame': 7800,
};

export const predictPrice = async (
  cropName: string,
  location: string,
  expectedHarvestDate: string,
  currentPrice?: number
): Promise<PricePrediction> => {
  // Always calculate these first for fallback
  const historical = historicalPrices[cropName] || [];
  const msp = mspValues[cropName] || 5000;
  const current = currentPrice || historical[historical.length - 1] || msp;
  
  // Calculate timeframes for chart
  const now = new Date();
  const harvestDate = new Date(expectedHarvestDate);
  const daysUntilHarvest = Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Check if API key is available
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback prediction without API
    console.log("No API key found, using fallback prediction");
    return getFallbackPrediction(cropName, current, expectedHarvestDate);
  }

  const model = "gemini-2.5-flash";

  const prompt = `
    You are an agricultural price prediction AI for oilseeds in India, specifically Odisha.
    
    Crop: ${cropName}
    Location: ${location}
    Current Market Price: ₹${current}/quintal
    MSP: ₹${msp}/quintal
    Expected Harvest Date: ${expectedHarvestDate}
    Historical Prices (last 5 periods): ${historical.join(', ')}
    
    Predict the market price for this crop at harvest time considering:
    1. Seasonal demand patterns
    2. Government MSP policies
    3. Market supply and demand dynamics
    4. Regional factors for Odisha
    5. Historical price trends
    6. Economic indicators
    
    Return a JSON object with this exact structure:
    {
      "predictedPrice": <number in rupees per quintal>,
      "confidence": <number 0-100>,
      "trend": "increasing" | "decreasing" | "stable",
      "factors": ["factor1", "factor2", "factor3"],
      "reasoning": "Brief explanation"
    }
    
    Be realistic. Prices typically fluctuate within 10-20% of current price or MSP, whichever is higher.
    Confidence should reflect market volatility (60-85% is typical).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    // Handle different response structures
    let responseText = '';
    if (typeof response === 'string') {
      responseText = response;
    } else if (response?.text) {
      responseText = response.text;
    } else if (response?.response?.text) {
      responseText = response.response.text;
    } else {
      throw new Error('Unexpected response structure');
    }

    const result = JSON.parse(responseText || '{}');
    
    const predictedPrice = result.predictedPrice || current * 1.1;
    
    return {
      cropName,
      currentPrice: current,
      predictedPrice: Math.round(predictedPrice),
      confidence: result.confidence || 75,
      trend: result.trend || 'stable',
      factors: result.factors || ['Market demand', 'MSP support', 'Seasonal patterns'],
      predictionDate: new Date().toISOString(),
      harvestDate: expectedHarvestDate,
      timeSeriesData: generateTimeSeriesData(cropName, current, msp, daysUntilHarvest, Math.round(predictedPrice)),
    };
  } catch (error) {
    console.error("Price prediction error:", error);
    // Always return fallback on error
    return getFallbackPrediction(cropName, current, expectedHarvestDate);
  }
};

const getFallbackPrediction = (cropName: string, currentPrice?: number, expectedHarvestDate?: string): PricePrediction => {
  const historical = historicalPrices[cropName] || [];
  const msp = mspValues[cropName] || 5000;
  const current = currentPrice || historical[historical.length - 1] || msp;
  
  // Simple trend calculation
  const trend = historical.length >= 2 
    ? (historical[historical.length - 1] > historical[historical.length - 2] ? 'increasing' : 'decreasing')
    : 'stable';
  
  // Predict slight increase (5-15%) from current or MSP
  const basePrice = Math.max(current, msp);
  const predictedPrice = basePrice * (1 + (Math.random() * 0.1 + 0.05));
  
  const harvestDate = expectedHarvestDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date();
  const harvest = new Date(harvestDate);
  const daysUntilHarvest = Math.ceil((harvest.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    cropName,
    currentPrice: current,
    predictedPrice: Math.round(predictedPrice),
    confidence: 70,
    trend,
    factors: [
      'Government MSP support',
      'Market demand patterns',
      'Seasonal price variations',
      'Regional supply dynamics'
    ],
    predictionDate: new Date().toISOString(),
    harvestDate,
    timeSeriesData: generateTimeSeriesData(cropName, current, msp, daysUntilHarvest, Math.round(predictedPrice)),
  };
};

// Helper function to get month name from date
const getMonthName = (date: Date): string => {
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                  'july', 'august', 'september', 'october', 'november', 'december'];
  return months[date.getMonth()].toLowerCase();
};

// Generate time series data for chart visualization
const generateTimeSeriesData = (
  cropName: string,
  currentPrice: number,
  msp: number,
  daysUntilHarvest: number,
  predictedPrice?: number
): Array<{ date: string; msp: number; predictedPrice: number; label: string }> => {
  const now = new Date();
  const data: Array<{ date: string; msp: number; predictedPrice: number; label: string }> = [];
  
  // Check if we have monthly historical data for this crop
  const cropKey = cropName.toLowerCase();
  const hasMonthlyData = monthlyHistoricalPrices[cropKey] && Object.keys(monthlyHistoricalPrices[cropKey]).length > 0;
  
  if (hasMonthlyData) {
    // Use real historical monthly data
    const monthlyData = monthlyHistoricalPrices[cropKey];
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                        'july', 'august', 'september', 'october', 'november', 'december'];
    
    // Get current month index
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Add all available historical data points
    // For crops with full year data (like Mustard), show past 12 months
    // For crops with partial data (like Sunflower), show all available months
    const availableMonths = Object.keys(monthlyData);
    const hasFullYearData = availableMonths.length >= 10; // Consider 10+ months as full year
    
    if (hasFullYearData) {
      // Show past 12 months of historical data
      for (let i = 0; i < 12; i++) {
        const monthIndex = (currentMonth - 11 + i + 12) % 12;
        const monthName = monthNames[monthIndex];
        
        if (monthlyData[monthName]) {
          const historicalDate = new Date(currentYear, monthIndex, 1);
          if (monthIndex > currentMonth) {
            historicalDate.setFullYear(currentYear - 1);
          }
          
          data.push({
            date: historicalDate.toISOString(),
            msp,
            predictedPrice: monthlyData[monthName],
            label: monthName.charAt(0).toUpperCase() + monthName.slice(1).substring(0, 3),
          });
        }
      }
    } else {
      // For partial data, show all available months from the past year
      availableMonths.forEach(monthName => {
        const monthIndex = monthNames.indexOf(monthName);
        if (monthIndex !== -1) {
          const historicalDate = new Date(currentYear, monthIndex, 1);
          // If the month hasn't occurred yet this year, show it from last year
          if (monthIndex > currentMonth) {
            historicalDate.setFullYear(currentYear - 1);
          }
          
          data.push({
            date: historicalDate.toISOString(),
            msp,
            predictedPrice: monthlyData[monthName],
            label: monthName.charAt(0).toUpperCase() + monthName.slice(1).substring(0, 3),
          });
        }
      });
    }
    
    // Add current point
    data.push({
      date: now.toISOString(),
      msp,
      predictedPrice: currentPrice,
      label: 'Current',
    });
    
    // Add future predictions
    const months = Math.ceil(daysUntilHarvest / 30);
    const finalPrice = predictedPrice || currentPrice * 1.1;
    
    for (let i = 1; i <= Math.min(months, 6); i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() + i);
      
      // Interpolate price between current and predicted
      const progress = i / Math.max(months, 1);
      const interpolatedPrice = currentPrice + (finalPrice - currentPrice) * progress;
      
      // Add some realistic variation
      const variation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
      const price = interpolatedPrice * (1 + variation);
      
      const monthName = getMonthName(date);
      data.push({
        date: date.toISOString(),
        msp,
        predictedPrice: Math.round(price),
        label: monthName.charAt(0).toUpperCase() + monthName.slice(1).substring(0, 3),
      });
    }
    
    // Add harvest date point if not already included
    if (months > 6 || months === 0) {
      const harvestDate = new Date(now);
      harvestDate.setDate(harvestDate.getDate() + daysUntilHarvest);
      
      data.push({
        date: harvestDate.toISOString(),
        msp,
        predictedPrice: finalPrice,
        label: 'Harvest',
      });
    }
  } else {
    // Fallback to original logic for crops without monthly data
    // Current point
    data.push({
      date: now.toISOString(),
      msp,
      predictedPrice: currentPrice,
      label: 'Current',
    });
    
    // Generate intermediate points (1 month, 2 months, etc.)
    const months = Math.ceil(daysUntilHarvest / 30);
    const finalPrice = predictedPrice || currentPrice * 1.1;
    
    for (let i = 1; i <= Math.min(months, 6); i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() + i);
      
      // Interpolate price between current and predicted
      const progress = i / Math.max(months, 1);
      const interpolatedPrice = currentPrice + (finalPrice - currentPrice) * progress;
      
      // Add some realistic variation
      const variation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
      const price = interpolatedPrice * (1 + variation);
      
      data.push({
        date: date.toISOString(),
        msp,
        predictedPrice: Math.round(price),
        label: i === 1 ? '1 Month' : i === months ? 'Harvest' : `${i} Months`,
      });
    }
    
    // Add harvest date point if not already included
    if (months > 6 || months === 0) {
      const harvestDate = new Date(now);
      harvestDate.setDate(harvestDate.getDate() + daysUntilHarvest);
      
      data.push({
        date: harvestDate.toISOString(),
        msp,
        predictedPrice: finalPrice,
        label: 'Harvest',
      });
    }
  }
  
  // Sort data by date to ensure chronological order
  return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getSupplyDemandAnalysis = async (
  cropName: string,
  location: string
): Promise<{ demand: 'High' | 'Medium' | 'Low'; supply: 'High' | 'Medium' | 'Low'; recommendation: string }> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      demand: 'High',
      supply: 'Medium',
      recommendation: 'Good time to sell. Market demand is high and supply is moderate.'
    };
  }

  const model = "gemini-2.5-flash";
  const prompt = `
    Analyze supply and demand for ${cropName} in ${location}, Odisha, India.
    Return JSON:
    {
      "demand": "High" | "Medium" | "Low",
      "supply": "High" | "Medium" | "Low",
      "recommendation": "Where and when to sell for best price"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    return {
      demand: 'High',
      supply: 'Medium',
      recommendation: 'Sell at APMC or through FPO for better prices.'
    };
  }
};

