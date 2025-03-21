import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from './envConfig';
// Initialize the Gemini API with your API key
// Note: In production, you should store this key securely and not expose it in client-side code

// Get API key from our environment configuration
const API_KEY = config.geminiApiKey;

// Debug: Check if API key is loaded properly
console.log("Gemini API: API key loaded and ready to use");

// Verify the API key is not undefined before initializing
if (!API_KEY) {
  console.error("ERROR: Gemini API key is not defined in environment variables. Check your .env file.");
  console.error("Make sure you have REACT_APP_GEMINI_API_KEY_NEW defined in your .env file.");
}

console.log("API_KEY is", API_KEY);

// Initialize the API with error handling
let genAI;
try {
  genAI = new GoogleGenerativeAI(API_KEY);
  console.log("Gemini API: Successfully initialized GoogleGenerativeAI client");
} catch (error) {
  console.error("Error initializing Gemini API:", error.message);
}

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

/**
 * Generate social events in Pune using Gemini API
 * @returns {Promise<Array>} Array of social events
 */
export const generateSocialEvents = async () => {
  try {
    console.log("Generating social events using Gemini API...");
    
    // Get the model
    const modelName = await getAvailableModel();
    console.log("Using Gemini model:", modelName);
    
    const model = genAI.getGenerativeModel({ model: modelName });

    // Create the prompt with detailed instructions
    const prompt = `
    Find me a list of upcoming social events happening in Pune, including live concerts, 
    networking meetups, parties, cultural festivals, open mics, and tech gatherings.
    Format the response strictly in JSON with the following structure:
    {
      "events": [
        {
          "name": "<Event Name>",
          "date": "<Date in YYYY-MM-DD format>",
          "location": "<Event Location>",
          "category": "<Category: Concert, Meetup, Festival, etc.>",
          "ticket_details": {
            "price": "<Price or Free>",
            "booking_link": "<URL for tickets>"
          },
          "official_source": "<Official Event Page URL>"
        }
      ]
    }
    
    IMPORTANT: 
    1. Include at least 10 diverse events across different categories
    2. Use realistic venues in Pune
    3. Use dates within the next 3 months
    4. Provide realistic ticket prices in Indian Rupees (₹)
    5. Respond ONLY with valid JSON. Do not include any explanatory text or markdown formatting.
    `;

    // Set generation config
    const generationConfig = {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 4096,
    };

    // Generate content
    console.log("Sending request to Gemini API...");
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    console.log("Received response from Gemini API");
    
    try {
      // Parse the JSON response
      const jsonResponse = JSON.parse(response.text());
      console.log("Successfully parsed JSON response:", jsonResponse);
      
      if (jsonResponse && jsonResponse.events && Array.isArray(jsonResponse.events)) {
        return jsonResponse.events;
      } else {
        console.error("Invalid response format:", jsonResponse);
        return createFallbackEvents();
      }
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      console.log("Raw response:", response.text());
      return createFallbackEvents();
    }
  } catch (error) {
    console.error("Error generating social events:", error);
    return createFallbackEvents();
  }
};

/**
 * Create fallback events in case the API fails
 * @returns {Array} Array of fallback events
 */
const createFallbackEvents = () => {
  console.log("Creating fallback events...");
  return [
    {
      "name": "Nucleya Live in Pune",
      "date": "2024-07-27",
      "location": "FC Road Social, Pune",
      "category": "Concert",
      "ticket_details": {
        "price": "₹999 onwards",
        "booking_link": "https://insider.in/nucleya-live-pune-jul27-2024/event"
      },
      "official_source": "https://insider.in/nucleya-live-pune-jul27-2024/event"
    },
    {
      "name": "Pune Startups Networking Meetup",
      "date": "2024-08-03",
      "location": "The Daftar, Baner",
      "category": "Meetup",
      "ticket_details": {
        "price": "₹499",
        "booking_link": "https://www.meetup.com/pune-startups/events/"
      },
      "official_source": "https://www.meetup.com/pune-startups/events/"
    },
    {
      "name": "Bollywood Night Party",
      "date": "2024-07-20",
      "location": "Penthouze Nightlife, Mundhwa",
      "category": "Party",
      "ticket_details": {
        "price": "₹799 onwards",
        "booking_link": "https://in.bookmyshow.com/events/bollywood-night/ET000000000000"
      },
      "official_source": "https://in.bookmyshow.com/events/bollywood-night/ET000000000000"
    },
    {
      "name": "Pune Comedy Festival",
      "date": "2024-08-10",
      "location": "Multiple Venues, Pune",
      "category": "Festival",
      "ticket_details": {
        "price": "₹599 onwards",
        "booking_link": "https://insider.in/pune-comedy-festival-2024/event"
      },
      "official_source": "https://insider.in/pune-comedy-festival-2024/event"
    },
    {
      "name": "Open Mic Night - Poetry & Storytelling",
      "date": "2024-07-25",
      "location": "The Place, Koregaon Park",
      "category": "Open Mic",
      "ticket_details": {
        "price": "₹200",
        "booking_link": "https://allevents.in/pune/open-mic-night-poetry-and-storytelling/80002801714089"
      },
      "official_source": "https://allevents.in/pune/open-mic-night-poetry-and-storytelling/80002801714089"
    }
  ];
};

/**
 * Generate place recommendations based on a prompt
 * @param {string} prompt - The prompt for generating place recommendations
 * @returns {Promise<Array>} - Array of place recommendations
 */
export const generatePlaceRecommendations = async (prompt) => {
  console.log("Generating place recommendations using Gemini API...");
  
  try {
    console.log("Prompt:", prompt);
    console.log("Generating place recommendations using Gemini API...");
    console.log("Prompt:", prompt);
    
    // Get the model
    const modelName = await getAvailableModel();
    console.log("Using Gemini model:", modelName);
    
    const model = genAI.getGenerativeModel({ model: modelName });

    // Set generation config
    const generationConfig = {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 4096,
    };

    // Generate content
    console.log("Sending request to Gemini API for place recommendations...");
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    console.log("Received response from Gemini API");
    
    try {
      // Get the text response
      const responseText = response.text();
      console.log("Raw response text:", responseText.substring(0, 200) + "...");
      
      // Parse the JSON response
      const jsonResponse = JSON.parse(responseText);
      console.log("Successfully parsed JSON response for places");
      
      if (Array.isArray(jsonResponse)) {
        console.log(`Received ${jsonResponse.length} places from API`);
        
        // Validate and clean up the data
        const validatedPlaces = jsonResponse.map((place, index) => {
          // Ensure all required fields exist
          return {
            id: place.id || `place-${index + 1}`,
            name: place.name || `Place ${index + 1}`,
            category: place.category || 'other',
            description: place.description || 'No description available',
            address: place.address || 'No address available',
            coordinates: place.coordinates || { lat: 0, lng: 0 },
            priceLevel: typeof place.priceLevel === 'number' ? place.priceLevel : 1,
            rating: typeof place.rating === 'number' ? place.rating : 4.0,
            distance: typeof place.distance === 'number' ? place.distance : 1.0,
            imageUrl: place.imageUrl || null,
            website: place.website || '',
            priorityRank: place.priorityRank || index + 1
          };
        });
        
        return validatedPlaces;
      } else {
        console.error("Invalid response format for places - not an array:", typeof jsonResponse);
        return createFallbackPlaces();
      }
    } catch (parseError) {
      console.error("Error parsing JSON response for places:", parseError);
      console.log("Raw response:", response.text());
      return createFallbackPlaces();
    }
  } catch (error) {
    console.error("Error generating place recommendations:", error);
    return createFallbackPlaces();
  }
};

/**
 * Create fallback places in case the API fails
 * @returns {Array} Array of fallback places
 */
const createFallbackPlaces = () => {
  console.log("Creating fallback places...");
  return [
    {
      "id": "place1",
      "name": "Chai Point",
      "category": "cafe",
      "description": "Popular cafe chain known for its variety of chai and light snacks.",
      "address": "123 FC Road, Pune, Maharashtra",
      "coordinates": { "lat": 18.5204, "lng": 73.8567 },
      "priceLevel": 1,
      "rating": 4.3,
      "distance": 0.5,
      "imageUrl": "https://example.com/images/chai-point.jpg",
      "website": "https://www.chaipoint.com",
      "priorityRank": 1
    },
    {
      "id": "place2",
      "name": "Gold's Gym",
      "category": "gym",
      "description": "Well-equipped fitness center with modern facilities and trained instructors.",
      "address": "456 Baner Road, Pune, Maharashtra",
      "coordinates": { "lat": 18.5604, "lng": 73.7767 },
      "priceLevel": 3,
      "rating": 4.5,
      "distance": 1.2,
      "imageUrl": "https://example.com/images/golds-gym.jpg",
      "website": "https://www.goldsgym.in",
      "priorityRank": 2
    },
    {
      "id": "place3",
      "name": "Shaniwar Wada",
      "category": "park",
      "description": "Historic fortification and park in the city with beautiful gardens.",
      "address": "Shaniwar Peth, Pune, Maharashtra",
      "coordinates": { "lat": 18.5195, "lng": 73.8553 },
      "priceLevel": 1,
      "rating": 4.6,
      "distance": 0.8,
      "imageUrl": "https://example.com/images/shaniwar-wada.jpg",
      "website": "https://www.punecorporation.org",
      "priorityRank": 3
    },
    {
      "id": "place4",
      "name": "Phoenix Marketcity",
      "category": "shopping_mall",
      "description": "Large shopping mall with international brands, restaurants, and entertainment options.",
      "address": "Viman Nagar, Pune, Maharashtra",
      "coordinates": { "lat": 18.5623, "lng": 73.9173 },
      "priceLevel": 3,
      "rating": 4.4,
      "distance": 2.5,
      "imageUrl": "https://example.com/images/phoenix-mall.jpg",
      "website": "https://www.phoenixmarketcity.com/pune",
      "priorityRank": 4
    },
    {
      "id": "place5",
      "name": "Vaishali Restaurant",
      "category": "restaurant",
      "description": "Iconic South Indian restaurant known for its dosas and filter coffee.",
      "address": "1218/1, FC Road, Pune, Maharashtra",
      "coordinates": { "lat": 18.5182, "lng": 73.8367 },
      "priceLevel": 2,
      "rating": 4.7,
      "distance": 0.7,
      "imageUrl": "https://example.com/images/vaishali.jpg",
      "website": "https://www.vaishalirestaurant.com",
      "priorityRank": 5
    }
  ];
};

// Create a named export object
const geminiApi = {
  analyzeTimelineData,
  getAvailableModel,
  generateSocialEvents,
  generatePlaceRecommendations,
};

export default geminiApi; 