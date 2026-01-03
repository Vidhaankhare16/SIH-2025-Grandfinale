
import { GoogleGenAI } from "@google/genai";
import { AdvisoryPlan } from "../types";
import { getDistrictWeatherData, getRecommendedCrop, optimalSowingPeriods, cropRainfallRequirements } from "./weatherService";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

// Helper to check if API key exists
export const hasApiKey = () => !!(import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY);

export const getFarmingAdvisory = async (
  query: string, 
  language: string = 'English', 
  contextData: any = {},
  chatHistory: {role: string, text: string}[] = []
): Promise<string | AdvisoryPlan> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) return "API Key not configured.";

  const model = "gemini-2.5-flash";
  const mode = contextData?.mode || 'CHAT';
  
  // ---------------------------------------------------------
  // MODE 1: CHAT (Voice Assistant) - Returns Text/HTML
  // ---------------------------------------------------------
  if (mode === 'CHAT') {
    const systemPrompt = `
      You are 'Kisan Sahayak', an expert agricultural AI advisor for NMEO-OP in Odisha.
      Language: ${language}.
      
      ROLE:
      - Speak respectfully ("Kisan Bhai").
      - BE INQUISITIVE. If the user asks a broad question, ASK for their location (District) or land size first.
      - Keep answers concise for voice chat (under 50 words unless asked for details).
      - Use HTML for links (<a href="...">).
      
      KNOWLEDGE BASE:
      - NMEO-OP: https://nmeo.agricoop.gov.in/
      - PM-KISAN: https://pmkisan.gov.in/
      ${contextData?.location ? `User location hint: ${contextData.location}. Use this to tailor soil/weather suggestions.` : ''}
    `;

    try {
      const sanitizedHistory = chatHistory.slice(-10).map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text || '' }]
      }));

      const response = await ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: `System: ${systemPrompt.trim()}` }] },
          ...sanitizedHistory,
          { role: 'user', parts: [{ text: query }] }
        ]
      });
      return response.text || "I am unable to answer right now.";
    } catch (error) {
      return "Sorry, connection error.";
    }
  }

  // ---------------------------------------------------------
  // MODE 2: REPORT (Dashboard Plan) - Returns JSON
  // ---------------------------------------------------------
  if (mode === 'REPORT') {
    // Build soil information string
    let soilContext = '';
    if (contextData.hasSoilReport && contextData.soilCard) {
      const card = contextData.soilCard;
      soilContext = `
      SOIL HEALTH CARD DATA (Precise measurements):
      - Land Type: ${card.landType || 'midland'}
      - Chemical Parameters:
        * Nitrogen (N): ${card.nitrogen || 0} kg/ha
        * Phosphorus (P): ${card.phosphorus || 0} kg/ha
        * Potassium (K): ${card.potassium || 0} kg/ha
        * Organic Carbon (OC): ${card.organicCarbon || 0}%
        * Electrical Conductivity (EC): ${card.electricalConductivity || 0} dS/m
        * pH: ${card.pH || 7.0}
      - Micronutrients:
        * Boron: ${card.boron || 0} ppm
        * Sulphur: ${card.sulphur || 0} ppm
      
      Use these precise values to:
      1. Calculate exact fertilizer requirements (N, P, K deficiencies)
      2. Recommend specific micronutrient supplements if Boron or Sulphur are deficient
      3. Adjust pH if needed (add lime for acidic, gypsum for alkaline)
      4. Consider land type (upland/lowland/midland) for crop selection and water management
      `;
    } else {
      soilContext = `- Soil Type: ${contextData.soil || 'General'} (average district data)`;
    }

    // Get weather data for the district (with safe fallback)
    const districtName = contextData.district || 'Khordha';
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const season = (currentMonth >= 6 && currentMonth <= 9) ? 'kharif' : 'rabi';
    
    let weatherData;
    let recommendedCrop;
    let cropRainfall;
    let sowingPeriod;
    
    try {
      weatherData = getDistrictWeatherData(districtName);
      recommendedCrop = getRecommendedCrop(districtName, season, weatherData.averageRainfall);
      cropRainfall = cropRainfallRequirements[recommendedCrop.crop] || cropRainfallRequirements['Groundnut'];
      sowingPeriod = optimalSowingPeriods[recommendedCrop.crop] || optimalSowingPeriods['Groundnut'];
    } catch (error) {
      console.error("Error getting weather data:", error);
      // Fallback to default values
      weatherData = getDistrictWeatherData('Khordha');
      recommendedCrop = { crop: 'Groundnut', reason: 'Suitable for Odisha climate' };
      cropRainfall = cropRainfallRequirements['Groundnut'];
      sowingPeriod = optimalSowingPeriods['Groundnut'];
    }

    const prompt = `
      Generate a comprehensive Oilseed Cultivation Advisory Plan with complete timeline and supplements.
      
      CONTEXT DATA:
      - District: ${contextData.district || 'Odisha General'}
      - Farmer Location: ${contextData.location || 'Unknown'}
      - Current Date: ${currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
      - Current Month: ${currentMonth} (${season === 'kharif' ? 'Kharif Season (Monsoon)' : 'Rabi Season (Post-Monsoon)'})
      ${soilContext}
      - Water Source: ${contextData.water || 'Rainfed'}
      - Language: ${language}

      WEATHER & CLIMATE DATA (Real data for ${contextData.district || 'Odisha'}):
      - Average Annual Rainfall: ${weatherData.averageRainfall} mm
      - Monsoon Rainfall (June-Sept): ${weatherData.monsoonRainfall} mm
      - Rabi Rainfall (Oct-Mar): ${weatherData.rabiRainfall} mm
      - Temperature Range: ${weatherData.temperatureRange.min}°C - ${weatherData.temperatureRange.max}°C
      - Soil Type: ${weatherData.soilType}
      - Agro-Climatic Zone: ${weatherData.agroClimate}
      
      RECOMMENDED CROP: ${recommendedCrop.crop}
      Reason: ${recommendedCrop.reason}
      - Optimal Rainfall Requirement: ${cropRainfall.optimal} mm (District has ${season === 'kharif' ? weatherData.monsoonRainfall : weatherData.rabiRainfall} mm)
      - Optimal Sowing Period: ${season === 'kharif' ? sowingPeriod.kharif : sowingPeriod.rabi}
      
      The recommended crop MUST be ${recommendedCrop.crop} based on current season (${season}) and rainfall patterns.
      
      ${contextData.hasSoilReport && contextData.soilCard ? `
      IMPORTANT FERTILIZER RECOMMENDATIONS (based on soil health card):
      - Calculate exact fertilizer quantities in shoppingList based on deficiencies:
        * If N is low (<280 kg/ha), recommend Urea with exact quantity needed (typically 50-60 kg/acre)
        * If P is low (<22 kg/ha), recommend DAP/SSP with exact quantity needed (typically 40-50 kg/acre)
        * If K is low (<140 kg/ha), recommend MOP with exact quantity needed (typically 20-30 kg/acre)
        * If Boron is low (<0.5 ppm), recommend Borax 1-2 kg/acre in shoppingList
        * If Sulphur is low (<10 ppm), recommend Gypsum 200-300 kg/acre in shoppingList
      - Include pH correction recommendations if pH is outside 6.0-7.5 range (lime for acidic, gypsum for alkaline)
      - Consider land type (${contextData.soilCard.landType}) for water management in timeline:
        * Upland: Focus on water conservation, mulching, and drought-resistant practices
        * Lowland: Ensure proper drainage, avoid waterlogging
        * Midland: Balanced irrigation and drainage
      ` : `
      STANDARD FERTILIZER RECOMMENDATIONS (using district averages):
      - Urea: 50-60 kg/acre (split application - 50% at sowing, 50% at 30-40 days)
      - DAP: 40-50 kg/acre (basal application at sowing)
      - MOP: 20-30 kg/acre (basal application)
      - Gypsum: 200-300 kg/acre (for oilseeds, improves oil content)
      - Bio-fertilizers: Rhizobium culture for leguminous crops (Groundnut, Soybean)
      `}
      
      WEATHER-BASED RECOMMENDATIONS:
      - Current Season: ${season === 'kharif' ? 'Kharif (Monsoon Season)' : 'Rabi (Post-Monsoon Season)'}
      - Optimal Sowing Window: ${season === 'kharif' ? sowingPeriod.kharif : sowingPeriod.rabi}
      - Rainfall Suitability: District receives ${season === 'kharif' ? weatherData.monsoonRainfall : weatherData.rabiRainfall} mm during ${season} season, which is ${season === 'kharif' ? weatherData.monsoonRainfall >= cropRainfall.optimal ? 'adequate' : 'below optimal but manageable with proper water management' : weatherData.rabiRainfall >= cropRainfall.optimal ? 'adequate for rainfed cultivation' : 'supplemental irrigation may be needed'} for ${recommendedCrop.crop}
      - Temperature Considerations: Current temperature range (${weatherData.temperatureRange.min}°C - ${weatherData.temperatureRange.max}°C) is ${weatherData.temperatureRange.max <= 35 ? 'ideal' : weatherData.temperatureRange.max <= 38 ? 'suitable' : 'warm, ensure adequate irrigation'} for ${recommendedCrop.crop}
      - Climate Adaptation: For ${weatherData.agroClimate} agro-climatic zone, recommend ${weatherData.agroClimate === 'coastal' ? 'salt-tolerant varieties and proper drainage' : weatherData.agroClimate === 'plateau' ? 'drought-resistant varieties and water conservation' : weatherData.agroClimate === 'hilly' ? 'early maturing varieties and terrace farming practices' : 'standard practices with focus on soil conservation'}
      
      CRITICAL LANGUAGE REQUIREMENT:
      - ALL text in the response MUST be in ${language === 'Oriya' ? 'Odia (ଓଡ଼ିଆ)' : 'English'} language.
      - This includes: cropName, localName, suitabilityReason, timeline tasks, shoppingList items, subsidies, marketOutlook strategy, and economics comparisonText.
      - For timeline: The "day" field can remain in English format (e.g., "Day 7-10", "Sowing Day") but the "task" field MUST be in ${language === 'Oriya' ? 'Odia' : 'English'}.
      - For shoppingList: All items MUST be in ${language === 'Oriya' ? 'Odia' : 'English'}.
      - For subsidies: Both "name" and "details" MUST be in ${language === 'Oriya' ? 'Odia' : 'English'}.
      
      Return strictly a JSON object with this schema:
      {
        "cropName": "${language === 'Oriya' ? 'Odia Name' : 'English Name'}",
        "localName": "${language === 'Oriya' ? 'Odia Local Name' : 'Local Odia Name'}",
        "suitabilityReason": "${language === 'Oriya' ? 'Detailed explanation in Odia (2-3 sentences)' : 'Detailed explanation (2-3 sentences)'} covering: why this crop fits the district, how current weather/rainfall supports it, and how it compares to traditional crops in terms of profit, water requirement, and growing period.",
        "duration": "e.g., 100-110 Days",
        "roi": "e.g., 150%",
        "economics": {
          "netProfit": 35000, 
          "revenue": 55000,
          "cost": 20000,
          "comparisonText": "${language === 'Oriya' ? 'Text in Odia explaining profit comparison' : 'Earn ₹15,000-20,000 more per acre than Paddy. Oilseeds require 30-40% less water and have shorter growing period (100-120 days vs 140-160 days for paddy), allowing more crop cycles per year.'}"
        },
        "marketOutlook": {
          "demand": "High", 
          "supply": "Low", 
          "msp": 6700, 
          "marketPrice": 7200, 
          "strategy": "${language === 'Oriya' ? 'Short advice in Odia (e.g. Sell at APMC vs Hold)' : 'Short advice (e.g. Sell at APMC vs Hold)'}"
        },
        "timeline": [
          { "day": "Pre-Sowing (15 days before)", "task": "${language === 'Oriya' ? 'Detailed land preparation task in Odia' : 'Detailed land preparation, soil treatment, and input procurement'}" },
          { "day": "Sowing Day", "task": "${language === 'Oriya' ? 'Sowing method task in Odia' : 'Exact sowing method, spacing, seed rate, and initial irrigation'}" },
          { "day": "Day 7-10", "task": "${language === 'Oriya' ? 'First weeding task in Odia' : 'First weeding, gap filling, and initial pest monitoring'}" },
          { "day": "Day 20-25", "task": "${language === 'Oriya' ? 'First fertilizer task in Odia' : 'First fertilizer application, inter-cultivation, and pest control'}" },
          { "day": "Day 40-45", "task": "${language === 'Oriya' ? 'Second fertilizer task in Odia' : 'Second fertilizer application, weeding, and disease management'}" },
          { "day": "Day 60-70", "task": "${language === 'Oriya' ? 'Flowering stage task in Odia' : 'Flowering stage care, irrigation management, and pest monitoring'}" },
          { "day": "Day 80-90", "task": "${language === 'Oriya' ? 'Pod development task in Odia' : 'Pod/seed development care, final irrigation, and maturity assessment'}" },
          { "day": "Day 100-120", "task": "${language === 'Oriya' ? 'Harvest task in Odia' : 'Harvest timing, post-harvest handling, and storage preparation'}" }
        ],
        "shoppingList": [
          "Certified Seeds: [calculate based on spacing - typically 50-80 kg/acre]",
          "Urea: [calculate based on N deficiency from soil card or standard 50-60 kg/acre]",
          "DAP/SSP: [calculate based on P deficiency or standard 40-50 kg/acre]",
          "MOP: [calculate based on K deficiency or standard 20-30 kg/acre]",
          "Gypsum: [if pH correction needed or 200-300 kg/acre for oilseeds]",
          "Boron (Borax): [if Boron < 0.5 ppm, 1-2 kg/acre]",
          "Bio-fertilizers: Rhizobium culture for leguminous crops",
          "Pesticides: Neem-based or recommended pesticides for pest control",
          "Herbicides: Pre-emergence and post-emergence as needed"
        ],
        "subsidies": [
          { "name": "Scheme Name", "details": "Benefit details" }
        ]
      }
    `;

    try {
      console.log("Generating advisory for district:", contextData.district, "Season:", season);
      
      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("API timeout after 30 seconds")), 30000)
      );
      
      const apiPromise = ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });
      
      const response = await Promise.race([apiPromise, timeoutPromise]) as any;
      
      // Extract response text from different possible structures
      let responseText = '';
      if (typeof response === 'string') {
        responseText = response;
      } else if (response?.text) {
        responseText = response.text;
      } else if (response?.response?.text) {
        responseText = response.response.text;
      } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = response.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Unexpected response structure');
      }
      
      console.log("API Response received, parsing JSON...");
      console.log("Response length:", responseText.length);
      console.log("Response preview (first 200 chars):", responseText.substring(0, 200));
      
      // Clean the response - remove markdown code blocks if present
      responseText = responseText.trim();
      if (responseText.startsWith('```json')) {
        responseText = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        console.log("Removed markdown json wrapper");
      } else if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        console.log("Removed markdown wrapper");
      }
      
      // Try to parse JSON
      let parsed;
      try {
        parsed = JSON.parse(responseText || "{}");
        console.log("JSON parsed successfully. Keys:", Object.keys(parsed));
      } catch (parseError: any) {
        console.error("JSON Parse Error:", parseError);
        console.error("Error position:", parseError.message);
        console.error("Response text (first 1000 chars):", responseText.substring(0, 1000));
        // Try to find and fix common JSON issues
        try {
          // Remove any trailing commas before closing braces/brackets
          responseText = responseText.replace(/,(\s*[}\]])/g, '$1');
          parsed = JSON.parse(responseText);
          console.log("JSON parsed after fixing trailing commas");
        } catch (retryError) {
          console.error("Retry parse also failed");
          throw new Error("Failed to parse JSON response");
        }
      }
      
      // Validate required fields
      if (!parsed.cropName || !parsed.timeline || !parsed.shoppingList) {
        console.error("Missing required fields. Parsed object keys:", Object.keys(parsed));
        console.error("Has cropName:", !!parsed.cropName);
        console.error("Has timeline:", !!parsed.timeline);
        console.error("Has shoppingList:", !!parsed.shoppingList);
        throw new Error("Incomplete response from API");
      }
      
      console.log("Advisory generated successfully for:", parsed.cropName);
      return parsed;
    } catch (error) {
      console.error("Report Error", error);
      
      // Enhanced fallback with weather-based data
      const fallbackCrop = recommendedCrop?.crop || 'Groundnut';
      const fallbackData: AdvisoryPlan = {
        cropName: fallbackCrop,
        localName: fallbackCrop === 'Groundnut' ? 'ଚିନାବାଦାମ' : fallbackCrop === 'Mustard' ? 'ସରସୋ' : fallbackCrop === 'Soybean' ? 'ସୋୟାବିନ୍' : fallbackCrop === 'Sunflower' ? 'ସୂର୍ଯ୍ୟମୁଖୀ' : 'ତିଲ',
        suitabilityReason: `${fallbackCrop} is recommended for ${contextData.district || 'your district'} during ${season} season. District receives ${season === 'kharif' ? weatherData.monsoonRainfall : weatherData.rabiRainfall} mm rainfall, which is suitable for ${fallbackCrop} cultivation. This crop offers 30-40% higher profit than paddy with less water requirement.`,
        duration: fallbackCrop === 'Groundnut' ? "100-120 Days" : fallbackCrop === 'Mustard' ? "90-110 Days" : fallbackCrop === 'Soybean' ? "90-100 Days" : "90-100 Days",
        roi: "140%",
        economics: { 
          netProfit: 35000, 
          revenue: 55000, 
          cost: 20000, 
          comparisonText: "Earn ₹15,000-20,000 more per acre than Paddy. Oilseeds require 30-40% less water and have shorter growing period (100-120 days vs 140-160 days for paddy)." 
        },
        marketOutlook: { 
          demand: "High", 
          supply: "Medium", 
          msp: fallbackCrop === 'Groundnut' ? 6377 : fallbackCrop === 'Mustard' ? 5450 : 4300, 
          marketPrice: fallbackCrop === 'Groundnut' ? 6850 : fallbackCrop === 'Mustard' ? 5620 : 4520, 
          strategy: "Market price is above MSP. Sell directly to FPO for better prices." 
        },
        timeline: [
          { day: "Pre-Sowing (15 days before)", task: `Prepare land: deep ploughing, leveling, and apply FYM (5-6 tonnes/acre). Ensure proper drainage for ${weatherData.agroClimate} zone.` },
          { day: "Sowing Day", task: `Sow ${fallbackCrop} seeds at spacing 30x10 cm (for groundnut) or 45x15 cm (for mustard/soybean). Seed rate: 50-80 kg/acre. Apply basal fertilizers: DAP 40kg + MOP 20kg/acre.` },
          { day: "Day 7-10", task: "First weeding and gap filling. Monitor for initial pest attacks. Light irrigation if needed." },
          { day: "Day 20-25", task: "First top dressing: Apply Urea 25-30 kg/acre. Inter-cultivation and weeding. Pest monitoring and control if needed." },
          { day: "Day 40-45", task: "Second top dressing: Apply remaining Urea 25-30 kg/acre. Second weeding. Disease management if required." },
          { day: "Day 60-70", task: "Flowering stage: Ensure adequate moisture. Apply micronutrients if needed. Monitor for pod/seed development." },
          { day: "Day 80-90", task: "Pod/seed filling stage: Critical irrigation if rainfall is insufficient. Final pest and disease check." },
          { day: "Day 100-120", task: `Harvest when ${fallbackCrop === 'Groundnut' ? 'pods turn brown and kernels are mature' : 'pods turn yellow and seeds are hard'}. Dry properly before storage.` }
        ],
        shoppingList: [
          `Certified ${fallbackCrop} Seeds: 60-80 kg/acre`,
          "Urea: 50-60 kg/acre (split application)",
          "DAP: 40-50 kg/acre (basal)",
          "MOP: 20-30 kg/acre (basal)",
          "Gypsum: 200-300 kg/acre (for oil content)",
          fallbackCrop === 'Groundnut' || fallbackCrop === 'Soybean' ? "Rhizobium culture: 200g/acre" : "",
          "Neem-based pesticides: As per pest incidence",
          "FYM/Compost: 5-6 tonnes/acre"
        ].filter(Boolean),
        subsidies: [
          { name: "NMEO-OP", details: "Free seed minikits, 50% subsidy on inputs" },
          { name: "PM-KISAN", details: "Direct benefit transfer of ₹6,000/year" }
        ]
      };
      
      return fallbackData;
    }
  }

  return "";
};

export const getFPOLogisticsInsights = async (warehouseData: any[], farmData: any[], selectedWarehouseId?: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return JSON.stringify({
      storage_alert: "API key not configured",
      collection_route: "N/A",
      market_action: "Hold",
      optimization_tip: "Configure API key to get AI recommendations"
    });
  }

  const model = "gemini-2.5-flash";
  
  // Find selected warehouse if provided
  const selectedWarehouse = selectedWarehouseId 
    ? warehouseData.find(w => w.id === selectedWarehouseId)
    : null;
  
  // Calculate warehouse statistics
  const totalCapacity = warehouseData.reduce((sum, w) => sum + w.capacity, 0);
  const totalUtilization = warehouseData.reduce((sum, w) => sum + w.utilization, 0);
  const avgUtilization = totalCapacity > 0 ? (totalUtilization / totalCapacity) * 100 : 0;
  
  const warehouseSummary = warehouseData.map(w => ({
    name: w.name,
    capacity: w.capacity,
    utilization: w.utilization,
    available: w.capacity - w.utilization,
    utilizationPercent: ((w.utilization / w.capacity) * 100).toFixed(1),
    cropTypes: w.cropType || [],
    isSelected: w.id === selectedWarehouseId
  }));
  
  const prompt = `
    You are an AI logistics advisor for an FPO (Farmer Producer Organization) managing oilseed warehouses in Odisha, India.
    
    Current Warehouse Status:
    ${JSON.stringify(warehouseSummary, null, 2)}
    
    Overall Statistics:
    - Total Capacity: ${totalCapacity} MT
    - Total Utilization: ${totalUtilization} MT
    - Average Utilization: ${avgUtilization.toFixed(1)}%
    ${selectedWarehouse ? `
    Currently Selected Warehouse: ${selectedWarehouse.name}
    - Capacity: ${selectedWarehouse.capacity} MT
    - Current Stock: ${selectedWarehouse.utilization} MT
    - Available Space: ${selectedWarehouse.capacity - selectedWarehouse.utilization} MT
    - Utilization: ${((selectedWarehouse.utilization / selectedWarehouse.capacity) * 100).toFixed(1)}%
    - Crop Types: ${(selectedWarehouse.cropType || []).join(', ')}
    ` : ''}
    
    Farms with Harvest Ready Crops:
    ${JSON.stringify(farmData.filter(f => f.harvestReady), null, 2)}

    Provide strategic recommendations in JSON format with these exact keys:
    {
      "storage_alert": "A brief warning about warehouse capacity issues (if any), or 'All warehouses operating within capacity' if no issues",
      "collection_route": "An optimized sequence for collecting produce from farms (e.g., 'Farm A (Groundnut) -> Farm B (Mustard) -> Warehouse X')",
      "market_action": "Either 'Sell' or 'Hold' with brief reasoning",
      "optimization_tip": "A specific, actionable recommendation for ${selectedWarehouse ? `the ${selectedWarehouse.name} warehouse` : 'warehouse management'}. Consider current utilization, available space, crop types, and market conditions. Be specific and actionable."
    }
    
    Focus on:
    - Storage optimization based on current utilization levels
    - Efficient stock management
    - Market timing recommendations
    - Space allocation strategies
    
    Return ONLY valid JSON, no markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    // Extract response text from different possible structures
    let responseText = '';
    if (typeof response === 'string') {
      responseText = response;
    } else if (response?.text) {
      responseText = response.text;
    } else if (response?.response?.text) {
      responseText = response.response.text;
    } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      responseText = response.candidates[0].content.parts[0].text;
    } else {
      responseText = "{}";
    }
    
    // Clean the response - remove markdown code blocks if present
    responseText = responseText.trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Try to parse to validate JSON
    try {
      const parsed = JSON.parse(responseText);
      // Validate required fields
      if (!parsed.storage_alert || !parsed.collection_route || !parsed.market_action || !parsed.optimization_tip) {
        throw new Error("Missing required fields in JSON response");
      }
      return JSON.stringify(parsed);
    } catch (parseError) {
      console.error("Invalid JSON from Gemini:", parseError);
      console.error("Raw response text:", responseText.substring(0, 500));
      // Return a safe fallback JSON
      return JSON.stringify({
        storage_alert: "All warehouses operating within capacity",
        collection_route: "Optimize collection routes based on nearest farms to warehouses",
        market_action: "Hold - Monitor market prices",
        optimization_tip: "Maintain optimal stock levels and plan for upcoming harvest season"
      });
    }
  } catch (error) {
    console.error("Gemini FPO Error:", error);
    // Return a safe fallback JSON
    return JSON.stringify({
      storage_alert: "All warehouses operating within capacity",
      collection_route: "Optimize collection routes based on nearest farms to warehouses",
      market_action: "Hold - Monitor market prices",
      optimization_tip: "Maintain optimal stock levels and plan for upcoming harvest season"
    });
  }
};

export const getNearbyWarehouses = async (location: string): Promise<any[]> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) return [];

  const model = "gemini-2.5-flash";
  const prompt = `
    You are helping a farmer locate nearby warehouses for oilseeds.
    Location provided: ${location}
    Return a JSON array of up to 6 warehouses sorted by proximity.
    Each item must follow:
    {
      "name": "Warehouse Name",
      "distanceKm": 12.5,
      "capacity": 1500,
      "utilization": 900,
      "crops": ["Groundnut", "Mustard"],
      "address": "Optional address text",
      "contact": "Optional phone like 18001801551",
      "lat": 20.30,
      "lng": 85.82
    }
    Keep numbers realistic for Odisha region if possible. Distances in km. Lat/Lng must be valid coordinates near the provided location.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(response.text || "[]");
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (error) {
    console.error("Nearby Warehouses Error:", error);
    return [];
  }
};

export const resolveLocationToDistrictState = async (lat: number, lng: number): Promise<string | null> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) return null;

  const model = "gemini-2.5-flash";
  const prompt = `
    Given coordinates lat: ${lat}, lng: ${lng}, return the Indian district and state in "District, State" format.
    Keep it very short, no extra words. If unsure, return "Unknown".
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const text = (response.text || '').trim();
    if (!text || text.toLowerCase().includes('unknown')) return null;
    return text.replace(/\n+/g, ' ').trim();
  } catch (error) {
    console.error("Location Resolve Error:", error);
    return null;
  }
};
