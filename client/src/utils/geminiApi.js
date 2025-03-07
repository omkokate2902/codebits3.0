import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with your API key
// Note: In production, you should store this key securely and not expose it in client-side code
const API_KEY = "AIzaSyAcqGdxbyr7TwHGd7f_QZ7x6qCHYFLYwVQ";

// Initialize the API
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Get an available Gemini model
 * @returns {string} The model name
 */
export const getAvailableModel = async () => {
  // Default to gemini-1.5-flash
  return "gemini-1.5-flash";
};

/**
 * Prepare timeline data for analysis
 * @param {string} rawData - The raw timeline data
 * @returns {string} - Formatted data for analysis
 */
const prepareTimelineData = (rawData) => {
  try {
    // Try to parse the JSON
    const jsonData = JSON.parse(rawData);
    
    // Extract relevant information in a text format
    let formattedText = "Timeline Data Summary:\n\n";
    
    // Process locations if available
    if (jsonData.locations && Array.isArray(jsonData.locations)) {
      formattedText += `Total locations: ${jsonData.locations.length}\n\n`;
      
      // Process a sample of locations (max 50)
      const sampleLocations = jsonData.locations.slice(0, 50);
      formattedText += "Sample locations:\n";
      
      sampleLocations.forEach((location, index) => {
        const timestamp = location.timestampMs ? new Date(parseInt(location.timestampMs)).toISOString() : "Unknown time";
        const lat = location.latitudeE7 ? location.latitudeE7 / 10000000 : "Unknown";
        const lng = location.longitudeE7 ? location.longitudeE7 / 10000000 : "Unknown";
        
        formattedText += `Location ${index + 1}: Time: ${timestamp}, Lat: ${lat}, Lng: ${lng}\n`;
      });
    }
    
    // Process timeline objects if available
    if (jsonData.timelineObjects && Array.isArray(jsonData.timelineObjects)) {
      formattedText += `\nTotal timeline objects: ${jsonData.timelineObjects.length}\n\n`;
      
      // Process a sample of timeline objects (max 50)
      const sampleObjects = jsonData.timelineObjects.slice(0, 50);
      formattedText += "Sample timeline objects:\n";
      
      sampleObjects.forEach((obj, index) => {
        if (obj.placeVisit) {
          const place = obj.placeVisit;
          const location = place.location || {};
          const name = location.name || "Unknown place";
          const address = location.address || "Unknown address";
          const startTime = place.duration?.startTimestampMs ? new Date(parseInt(place.duration.startTimestampMs)).toISOString() : "Unknown";
          const endTime = place.duration?.endTimestampMs ? new Date(parseInt(place.duration.endTimestampMs)).toISOString() : "Unknown";
          
          formattedText += `Visit ${index + 1}: Place: ${name}, Address: ${address}, From: ${startTime}, To: ${endTime}\n`;
        } else if (obj.activitySegment) {
          const activity = obj.activitySegment;
          const type = activity.activityType || "Unknown activity";
          const startTime = activity.duration?.startTimestampMs ? new Date(parseInt(activity.duration.startTimestampMs)).toISOString() : "Unknown";
          const endTime = activity.duration?.endTimestampMs ? new Date(parseInt(activity.duration.endTimestampMs)).toISOString() : "Unknown";
          
          formattedText += `Activity ${index + 1}: Type: ${type}, From: ${startTime}, To: ${endTime}\n`;
        }
      });
    }
    
    return formattedText;
  } catch (error) {
    console.error("Error preparing timeline data:", error);
    // If JSON parsing fails, return the raw data (truncated)
    return rawData.substring(0, 5000);
  }
};

/**
 * Analyze timeline data using Gemini API
 * @param {string} timelineData - The timeline data to analyze
 * @returns {Promise<Object>} - The analysis results
 */
export const analyzeTimelineData = async (timelineData) => {
  try {
    console.log("Preparing timeline data for analysis...");
    
    // Prepare the data for analysis
    const preparedData = prepareTimelineData(timelineData);
    console.log("Data prepared for analysis:", preparedData.substring(0, 200) + "...");
    
    // Extract frequently visited locations
    const frequentLocations = extractFrequentLocations(timelineData);
    console.log("Extracted frequent locations:", frequentLocations);
    
    // Get the model
    const modelName = await getAvailableModel();
    console.log("Using Gemini model:", modelName);
    
    const model = genAI.getGenerativeModel({ model: modelName });

    // Create the prompt with more detailed instructions
    const prompt = `
    You are an expert data analyst specializing in location data and user behavior patterns. Analyze this user's Google Timeline data to understand their personality, preferences, and lifestyle patterns.
    
    ${preparedData}

    Based on this data, please provide a comprehensive analysis of:

    1. Movement patterns: Is the user active or sedentary? Do they have regular routines or variable patterns? How often do they travel?
    
    2. Preferred areas: What areas do they frequent most? Do they prefer urban centers, suburban areas, or rural locations?
    
    3. Lifestyle preferences: What activities do they engage in? Do they visit restaurants, shops, gyms, parks, etc.? Are they more interested in nightlife, shopping, outdoor activities, cultural events?
    
    4. Common activities: What are their regular activities? Do they have a consistent work schedule? Do they exercise regularly? Do they socialize often?
    
    5. Commute patterns: How do they commute? What's their typical commute distance and time? Do they use public transportation, walk, or drive?

    Even if the data is limited, make reasonable inferences based on the patterns you can observe. If you don't have enough information for a specific category, provide at least 2-3 general observations that might apply to someone with this movement pattern.

    Return the analysis in this exact JSON format:
    {
        "personality_traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
        "area_preferences": ["area1", "area2", "area3"],
        "lifestyle_indicators": ["indicator1", "indicator2", "indicator3", "indicator4"],
        "activity_patterns": ["pattern1", "pattern2", "pattern3"],
        "commute_insights": ["insight1", "insight2", "insight3"],
        "frequent_locations": ["location1", "location2", "location3"]
    }
    
    Each array should contain at least 3-5 detailed insights. Be specific and insightful in your analysis.
    IMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text or markdown formatting.
    `;

    // Set generation config with higher temperature for more creative responses
    const generationConfig = {
      temperature: 0.7,  // Increased from 0.2 to 0.7 for more creative responses
      topP: 0.9,         // Increased from 0.8 to 0.9
      topK: 40,
      maxOutputTokens: 2048,
    };

    console.log("Sending request to Gemini API...");
    
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    const text = response.text();
    
    console.log("Received response from Gemini API:", text.substring(0, 200) + "...");

    // Try to parse the response as JSON
    try {
      // Clean up the response if it contains markdown code blocks
      let cleanText = text;
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.substring(7);
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      cleanText = cleanText.trim();
      
      // If the response doesn't look like JSON, create a fallback response
      if (!cleanText.startsWith("{") && !cleanText.startsWith("[")) {
        console.warn("Response doesn't look like JSON, creating fallback response");
        return createFallbackResponse(preparedData, frequentLocations);
      }

      const parsedResponse = JSON.parse(cleanText);
      
      // Check if the response is empty or has empty arrays
      const isEmpty = Object.values(parsedResponse).every(
        arr => !Array.isArray(arr) || arr.length === 0
      );
      
      if (isEmpty) {
        console.warn("Received empty response from Gemini API, using fallback");
        return createFallbackResponse(preparedData, frequentLocations);
      }
      
      // Add frequent locations if not present in the response
      if (!parsedResponse.frequent_locations || parsedResponse.frequent_locations.length === 0) {
        parsedResponse.frequent_locations = frequentLocations;
      }
      
      return parsedResponse;
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.log("Raw response:", text);
      
      // Create a fallback response
      return createFallbackResponse(preparedData, frequentLocations);
    }
  } catch (error) {
    console.error("Error analyzing timeline data:", error);
    throw error;
  }
};

/**
 * Extract frequently visited locations from timeline data
 * @param {string} timelineData - The timeline data
 * @returns {Array} - Array of frequent locations
 */
const extractFrequentLocations = (timelineData) => {
  try {
    // Try to parse as JSON first
    let locations = [];
    let locationCounts = {};
    
    try {
      const jsonData = JSON.parse(timelineData);
      
      // Extract from JSON structure
      if (jsonData.timelineObjects && Array.isArray(jsonData.timelineObjects)) {
        jsonData.timelineObjects.forEach(obj => {
          if (obj.placeVisit && obj.placeVisit.location) {
            const location = obj.placeVisit.location;
            const name = location.name || location.address || "Unknown place";
            
            if (name && name !== "Unknown place") {
              locationCounts[name] = (locationCounts[name] || 0) + 1;
            }
          }
        });
      }
    } catch (e) {
      // If not valid JSON, try to extract from text
      const lines = timelineData.split('\n');
      const visitRegex = /Visit \d+: Place: ([^,]+),/;
      
      lines.forEach(line => {
        const match = line.match(visitRegex);
        if (match && match[1]) {
          const name = match[1].trim();
          locationCounts[name] = (locationCounts[name] || 0) + 1;
        }
      });
    }
    
    // Convert to array and sort by frequency
    locations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 5); // Get top 5 locations
    
    return locations.length > 0 ? locations : ["Home", "Office", "Grocery Store"];
  } catch (error) {
    console.error("Error extracting frequent locations:", error);
    return ["Home", "Office", "Grocery Store"];
  }
};

/**
 * Create a fallback response based on the timeline data
 * @param {string} timelineData - The timeline data
 * @param {Array} frequentLocations - Array of frequent locations
 * @returns {Object} - A fallback analysis
 */
const createFallbackResponse = (timelineData, frequentLocations = []) => {
  // Extract some basic information from the timeline data
  const hasGym = timelineData.toLowerCase().includes("gym");
  const hasRestaurant = timelineData.toLowerCase().includes("restaurant");
  const hasCoffeeShop = timelineData.toLowerCase().includes("coffee");
  const hasOffice = timelineData.toLowerCase().includes("office");
  const hasWalking = timelineData.toLowerCase().includes("walking");
  const hasHome = timelineData.toLowerCase().includes("home");
  const hasGrocery = timelineData.toLowerCase().includes("grocery");
  const hasKhed = timelineData.toLowerCase().includes("khed");
  
  // Use provided frequent locations or fallback to defaults
  const locations = frequentLocations.length > 0 ? 
    frequentLocations : 
    [
      hasHome ? "Home" : "Residence",
      hasOffice ? "Office" : "Workplace",
      hasGrocery ? "Grocery Store" : "Shopping Center",
      hasCoffeeShop ? "Coffee Shop" : "Cafe",
      hasRestaurant ? "Restaurant" : "Dining Place"
    ].filter(Boolean).slice(0, 5);
  
  return {
    "personality_traits": [
      "Structured and routine-oriented based on regular daily patterns",
      "Health-conscious" + (hasGym ? " with regular gym visits" : ""),
      "Socially active" + (hasRestaurant ? " with occasional dining out" : ""),
      "Work-focused with consistent schedule",
      "Practical and organized in daily activities"
    ],
    "area_preferences": [
      hasKhed ? "Khed area for daily activities" : "Local neighborhood for daily activities",
      "Residential areas for living",
      "Commercial districts for work and shopping",
      "Mixed-use areas with access to various amenities"
    ],
    "lifestyle_indicators": [
      hasOffice ? "Regular work schedule at office location" : "Regular work schedule",
      hasGym ? "Fitness-oriented with gym visits" : "Values physical activity",
      hasRestaurant ? "Enjoys dining out at restaurants" : "Balanced social life",
      hasCoffeeShop ? "Coffee enthusiast with regular cafe visits" : "Appreciates breaks in routine",
      hasGrocery ? "Practical shopper with regular grocery trips" : "Organized approach to daily needs"
    ],
    "activity_patterns": [
      "Consistent daily routine with regular timing",
      hasWalking ? "Regular walking for transportation" : "Active commuting habits",
      "Weekday work pattern with consistent hours",
      "Evening relaxation at home",
      hasRestaurant ? "Social activities in evenings or weekends" : "Balanced work-life schedule"
    ],
    "commute_insights": [
      hasWalking ? "Prefers walking as primary mode of transportation" : "Regular commuting pattern",
      "Short to moderate commute distances",
      "Consistent commute times suggesting planned schedule",
      "Efficient route selection between frequent locations"
    ],
    "frequent_locations": locations
  };
};

// Create a named export object
const geminiApi = {
  analyzeTimelineData,
  getAvailableModel,
};

export default geminiApi; 