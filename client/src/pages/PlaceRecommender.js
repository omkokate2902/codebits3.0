import React, { useState, useEffect, useContext, useRef } from 'react';
import PlaceCard from '../components/PlaceCard';
import MapView from '../components/MapView';
import { AuthContext } from '../context/AuthContext';
import * as userStorage from '../utils/userStorage';
import { generatePlaceRecommendations } from '../utils/geminiApi';
import '../styles/pages/PlaceRecommender.css';

const PlaceRecommender = () => {
  const { user } = useContext(AuthContext);
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);
  
  // State variables
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [places, setPlaces] = useState([]);
  const [mapLocations, setMapLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [error, setError] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [userAnalysis, setUserAnalysis] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    radius: 5,
    priceLevel: 0
  });
  const [mapRadius, setMapRadius] = useState(null);

  // Initialize Google Maps API and Geocoder
  useEffect(() => {
    // Initialize geocoder if window.google is available
    if (window.google && !geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, []);

  // Load user data and neighborhoods when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (user && user.uid) {
        // Load user preferences and analysis
        const preferences = userStorage.getUserPreferences(user.uid);
        const analysis = userStorage.getUserAnalysis(user.uid);
        
        if (preferences) {
          setUserPreferences(preferences);
          console.log('Loaded user preferences:', preferences);
        }
        
        if (analysis) {
          setUserAnalysis(analysis);
          console.log('Loaded user analysis:', analysis);
        }
        
        // Load neighborhoods
        const storedNeighborhoods = userStorage.getRecommendedNeighborhoods(user.uid);
        if (storedNeighborhoods && storedNeighborhoods.length > 0) {
          console.log('Loaded recommended neighborhoods:', storedNeighborhoods);
          
          // Ensure all neighborhoods have coordinates
          const enhancedNeighborhoods = await Promise.all(
            storedNeighborhoods.map(async neighborhood => {
              if (!neighborhood.coordinates) {
                const coords = await geocodeAddress(`${neighborhood.name}, ${neighborhood.city}, ${neighborhood.state}`);
                return {
                  ...neighborhood,
                  coordinates: coords || getCityCoordinates(neighborhood.city)
                };
              }
              return neighborhood;
            })
          );
          
          setNeighborhoods(enhancedNeighborhoods);
        } else {
          setError('Please complete the Neighborhood Finder questionnaire to get personalized neighborhood recommendations.');
        }
      }
      setLoading(false);
    };
    
    loadData();
  }, [user]);

  // Geocode an address to get coordinates
  const geocodeAddress = async (address) => {
    if (!geocoderRef.current) {
      console.error('Geocoder not initialized');
      return null;
    }
    
    try {
      const result = await new Promise((resolve, reject) => {
        geocoderRef.current.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            resolve(results[0].geometry.location);
          } else {
            reject(new Error(`Geocode failed: ${status}`));
          }
        });
      });
      
      return {
        lat: result.lat(),
        lng: result.lng()
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  };

  // Get default coordinates for a city
  const getCityCoordinates = (city) => {
    const cityCoordinates = {
      'New Delhi': { lat: 28.6139, lng: 77.2090 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Bangalore': { lat: 12.9716, lng: 77.5946 },
      'Pune': { lat: 18.5204, lng: 73.8567 },
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Hyderabad': { lat: 17.3850, lng: 78.4867 },
      'Kolkata': { lat: 22.5726, lng: 88.3639 },
      'Jaipur': { lat: 26.9124, lng: 75.7873 }
    };
    return cityCoordinates[city] || cityCoordinates['New Delhi'];
  };

  // Handle neighborhood selection
  const handleNeighborhoodSelect = async (neighborhood) => {
    console.log('Neighborhood selected:', neighborhood);
    
    // Get coordinates for the neighborhood using its name
    const address = `${neighborhood.name}, ${neighborhood.city}, ${neighborhood.state}`;
    const coords = await geocodeAddress(address);
    
    // Set the neighborhood coordinates
    neighborhood.coordinates = coords || getCityCoordinates(neighborhood.city);
    console.log(`Coordinates for ${neighborhood.name}: ${JSON.stringify(neighborhood.coordinates)}`);
    
    setSelectedNeighborhood(neighborhood);
    setIsLoadingPlaces(true);
    setError(null);
    
    // Update map radius based on filters
    updateMapRadius(filters.radius);
    
    try {
      // Save selected neighborhood to userStorage
      if (user && user.uid) {
        userStorage.saveSelectedNeighborhood(user.uid, neighborhood);
      }
      
      // Determine place types based on user preferences
      const priorityPlaceTypes = determinePreferredPlaceTypes();
      console.log('Priority place types:', priorityPlaceTypes);
      
      // Create prompt for Gemini API
      const prompt = createPlaceRecommendationPrompt(neighborhood, priorityPlaceTypes, filters);
      console.log('Created place recommendation prompt');
      
      // Call Gemini API to get place recommendations
      console.log('Calling Gemini API for place recommendations...');
      const recommendedPlaces = await generatePlaceRecommendations(prompt);
      console.log('Received recommended places:', recommendedPlaces);
      
      // Process and set the places
      if (recommendedPlaces && recommendedPlaces.length > 0) {
        // Ensure all places have coordinates
        const placesWithCoordinates = await Promise.all(
          recommendedPlaces.map(async (place) => {
            // If coordinates are missing or invalid, try to geocode the address
            if (!place.coordinates || !place.coordinates.lat || !place.coordinates.lng) {
              const coords = await geocodeAddress(place.address);
              if (coords) {
                return { ...place, coordinates: coords };
              }
              
              // If geocoding fails, generate coordinates near the neighborhood
              return { 
                ...place, 
                coordinates: generateNearbyCoordinates(
                  neighborhood.coordinates, 
                  place.distance || Math.random() * filters.radius
                )
              };
            }
            return place;
          })
        );
        
        setPlaces(placesWithCoordinates);
        
        // Update map locations
        const mapPoints = placesWithCoordinates.map(place => ({
          id: place.id,
          name: place.name,
          coordinates: place.coordinates,
          category: place.category,
          description: place.description,
          address: place.address
        }));
        
        // Add the neighborhood as a special point
        mapPoints.unshift({
          id: 'neighborhood',
          name: neighborhood.name,
          coordinates: neighborhood.coordinates,
          category: 'neighborhood',
          description: neighborhood.description,
          address: `${neighborhood.name}, ${neighborhood.city}, ${neighborhood.state}`
        });
        
        setMapLocations(mapPoints);
      } else {
        setPlaces([]);
        setMapLocations([{
          id: 'neighborhood',
          name: neighborhood.name,
          coordinates: neighborhood.coordinates,
          category: 'neighborhood',
          description: neighborhood.description,
          address: `${neighborhood.name}, ${neighborhood.city}, ${neighborhood.state}`
        }]);
        setError('No places found for the selected criteria.');
      }
    } catch (err) {
      console.error('Error fetching places:', err);
      setError('Failed to load places. Please try again.');
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  // Generate coordinates near a center point
  const generateNearbyCoordinates = (center, distanceKm) => {
    // Earth's radius in kilometers
    const R = 6371;
    
    // Convert distance from kilometers to radians
    const radiusInRad = distanceKm / R;
    
    // Random angle
    const angle = Math.random() * 2 * Math.PI;
    
    // Convert center coordinates to radians
    const lat1 = center.lat * Math.PI / 180;
    const lng1 = center.lng * Math.PI / 180;
    
    // Calculate new position
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(radiusInRad) + 
                           Math.cos(lat1) * Math.sin(radiusInRad) * Math.cos(angle));
    const lng2 = lng1 + Math.atan2(Math.sin(angle) * Math.sin(radiusInRad) * Math.cos(lat1),
                                   Math.cos(radiusInRad) - Math.sin(lat1) * Math.sin(lat2));
    
    // Convert back to degrees
    return {
      lat: lat2 * 180 / Math.PI,
      lng: lng2 * 180 / Math.PI
    };
  };

  // Update map radius circle
  const updateMapRadius = (radius) => {
    setMapRadius({
      radius: radius * 1000, // Convert km to meters
      options: {
        strokeColor: '#4a6fa5',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4a6fa5',
        fillOpacity: 0.1
      }
    });
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === 'radius' || name === 'priceLevel' ? parseInt(value) : value;
    
    const newFilters = {
      ...filters,
      [name]: newValue
    };
    
    setFilters(newFilters);
    
    // Update map radius if radius filter changes
    if (name === 'radius') {
      updateMapRadius(newValue);
    }
    
    // If a neighborhood is selected, fetch places with new filters
    if (selectedNeighborhood) {
      handleNeighborhoodSelect(selectedNeighborhood);
    }
  };

  // Create a prompt for Gemini API to get place recommendations
  const createPlaceRecommendationPrompt = (neighborhood, priorityTypes, filters) => {
    const neighborhoodInfo = `Neighborhood: ${neighborhood.name}, ${neighborhood.city}, ${neighborhood.state}`;
    const coordinates = `Coordinates: ${neighborhood.name}, ${neighborhood.name}`;
    
    // Format priority types as a numbered list
    const priorityTypesList = priorityTypes.map((type, index) => 
      `${index + 1}. ${type}`
    ).join('\n');
    
    // Format amenities as a list
    const amenitiesList = neighborhood.amenities ? 
      `Neighborhood Amenities: ${neighborhood.amenities.join(', ')}` : '';
    
    // Include commute details
    const commuteDetails = neighborhood.commuteDetails ? 
      `Commute Details: Distance - ${neighborhood.commuteDetails.distance}, Time - ${neighborhood.commuteDetails.time}, Mode - ${neighborhood.commuteDetails.travelMode}` : '';
    
    // Include filter information
    const filterInfo = `
      Type Filter: ${filters.type}
      Radius: ${filters.radius} km
      Price Level: ${filters.priceLevel === 0 ? 'Any' : '₹'.repeat(filters.priceLevel)}
    `;
    
    // Create the prompt
    return `
      You are a local expert and place recommendation system for ${neighborhood.name}, ${neighborhood.city}, ${neighborhood.state}. I need detailed recommendations for places near this neighborhood based on specific priority categories.
      
      ${neighborhoodInfo}
      ${coordinates}
      ${amenitiesList}
      ${commuteDetails}
      
      Priority place categories (in order of importance):
      ${priorityTypesList}
      
      Filters:
      ${filterInfo}
      
      Please provide recommendations for places that match these criteria. For each place, include:
      1. Name (use realistic, specific place names that would actually exist in this area)
      2. Category (matching one of the priority types exactly)
      3. Description (2-3 sentences about what makes this place special)
      4. Address (use realistic street names and addresses for ${neighborhood.city})
      5. Coordinates (latitude and longitude near ${coordinates})
      6. Price level (1-4, where 1 is least expensive)
      7. Rating (1-5, with realistic ratings between 3.5-4.8)
      8. Distance from the neighborhood center (in km, between 0.1-5km)
      9. Website URL (create realistic website URLs)
      10. Image URL (use URLs like https://source.unsplash.com/400x300/?[place_type], for example https://source.unsplash.com/400x300/?restaurant for a restaurant image)
      
      The results should be sorted by priority category first (following the order above), and then by distance within each category.
      
      Format the response as a JSON array with the following structure:
      [
        {
          "id": "unique_id_string",
          "name": "Place Name",
          "category": "place_category",
          "description": "Brief description of the place",
          "address": "Full address",
          "coordinates": { "lat": latitude_number, "lng": longitude_number },
          "priceLevel": price_level_number,
          "rating": rating_number,
          "distance": distance_in_km_number,
          "imageUrl": "https://source.unsplash.com/400x300/?place_category",
          "website": "https://example.com",
          "priorityRank": priority_rank_number
        },
        ...
      ]
      
      The radius should be respected - only include places within ${filters.radius} km of the neighborhood center coordinates.
      ${filters.type !== 'all' ? `Filter results to only include places of type: ${filters.type}` : ''}
      ${filters.priceLevel > 0 ? `Filter results to only include places with price level up to: ${filters.priceLevel}` : ''}
      
      Include at least 3 places for each priority category, for a total of at least 15 places.
      Make sure all places are realistic and would actually exist in or near ${neighborhood.name}, ${neighborhood.city}.
      
      IMPORTANT: 
      1. Respond ONLY with valid JSON. Do not include any explanatory text or markdown formatting.
      2. Ensure all numeric values are actual numbers, not strings.
      3. Make sure the JSON is properly formatted with no trailing commas.
      4. Each place must have a unique ID.
      5. Each place must have coordinates that are actual numbers, not strings.
      6. Provide real-looking image URLs using the Unsplash format mentioned above.
    `;
  };

  // Determine preferred place types based on user preferences and analysis
  const determinePreferredPlaceTypes = () => {
    const placeTypes = [];
    
    // If we have user preferences
    if (userPreferences) {
      // Add place types based on lifestyle preferences
      if (userPreferences.lifestylePreferences && userPreferences.lifestylePreferences.length > 0) {
        const lifestyleToPlaceType = {
          'activeLifestyle': ['gym', 'sports_complex', 'park'],
          'outdoorActivities': ['park', 'hiking_trail', 'campground'],
          'shopping': ['shopping_mall', 'clothing_store', 'department_store'],
          'casualDining': ['restaurant', 'cafe', 'fast_food'],
          'fineDining': ['fine_dining', 'restaurant'],
          'nightlife': ['bar', 'night_club', 'lounge'],
          'cultural': ['museum', 'art_gallery', 'theater'],
          'artsAndMusic': ['concert_hall', 'art_gallery', 'music_venue'],
          'familyFriendly': ['park', 'family_restaurant', 'amusement_park'],
          'quiet': ['library', 'bookstore', 'cafe'],
          'community': ['community_center', 'place_of_worship'],
          'socialGatherings': ['event_venue', 'restaurant', 'bar']
        };
        
        userPreferences.lifestylePreferences.forEach(pref => {
          if (lifestyleToPlaceType[pref]) {
            placeTypes.push(...lifestyleToPlaceType[pref]);
          }
        });
      }
      
      // Add place types based on must-haves
      if (userPreferences.prioritizedMustHaves && userPreferences.prioritizedMustHaves.length > 0) {
        const mustHaveToPlaceType = {
          'groceryStores': ['grocery_store', 'supermarket'],
          'publicTransport': ['transit_station', 'bus_station', 'subway_station'],
          'parks': ['park', 'garden'],
          'restaurants': ['restaurant'],
          'cafes': ['cafe'],
          'bars': ['bar'],
          'schools': ['school', 'university'],
          'hospitals': ['hospital', 'medical_center'],
          'shoppingCenters': ['shopping_mall', 'department_store'],
          'gym': ['gym']
        };
        
        userPreferences.prioritizedMustHaves.forEach(item => {
          if (mustHaveToPlaceType[item.name]) {
            placeTypes.push(...mustHaveToPlaceType[item.name]);
          }
        });
      }
    }
    
    // If we have user analysis
    if (userAnalysis && userAnalysis.lifestyle_indicators) {
      const indicatorKeywords = {
        'active': ['gym', 'park', 'sports_complex'],
        'outdoor': ['park', 'hiking_trail'],
        'shopping': ['shopping_mall', 'store'],
        'dining': ['restaurant', 'cafe'],
        'restaurant': ['restaurant'],
        'coffee': ['cafe'],
        'art': ['art_gallery', 'museum'],
        'music': ['music_venue', 'concert_hall'],
        'social': ['bar', 'restaurant', 'cafe'],
        'quiet': ['library', 'bookstore', 'cafe'],
        'family': ['park', 'family_restaurant']
      };
      
      userAnalysis.lifestyle_indicators.forEach(indicator => {
        Object.keys(indicatorKeywords).forEach(keyword => {
          if (indicator.toLowerCase().includes(keyword)) {
            placeTypes.push(...indicatorKeywords[keyword]);
          }
        });
      });
    }
    
    // If we have no place types, add some defaults
    if (placeTypes.length === 0) {
      placeTypes.push('restaurant', 'cafe', 'park', 'gym', 'shopping_mall');
    }
    
    // Remove duplicates and return
    return [...new Set(placeTypes)];
  };

  // Filter places based on selected filters
  const filteredPlaces = places.filter(place => {
    // Filter by type
    if (filters.type !== 'all' && place.category !== filters.type) {
      return false;
    }
    
    // Filter by price level
    if (filters.priceLevel > 0 && place.priceLevel > filters.priceLevel) {
      return false;
    }
    
    // Filter by radius
    if (place.distance > filters.radius) {
      return false;
    }
    
    return true;
  });

  // Get place types for filter dropdown
  const placeTypes = [
    { value: 'all', label: 'All Places' },
    { value: 'restaurant', label: 'Restaurants' },
    { value: 'cafe', label: 'Cafes' },
    { value: 'gym', label: 'Gyms' },
    { value: 'park', label: 'Parks' },
    { value: 'shopping_mall', label: 'Shopping' },
    { value: 'entertainment', label: 'Entertainment' }
  ];

  return (
    <div className="place-recommender-page">
      <div className="page-header">
        <h1>Discover Places Near You</h1>
        <p>Find restaurants, cafes, gyms, and more based on your preferences and lifestyle.</p>
      </div>

      <div className="neighborhoods-section">
        <h2>Recommended Neighborhoods</h2>
        {loading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading recommended neighborhoods...</p>
          </div>
        ) : error && !neighborhoods.length ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : (
          <div className="neighborhoods-grid">
            {neighborhoods.map(neighborhood => (
              <div 
                key={neighborhood.id} 
                className={`neighborhood-card ${selectedNeighborhood && selectedNeighborhood.id === neighborhood.id ? 'selected' : ''}`}
                onClick={() => handleNeighborhoodSelect(neighborhood)}
              >
                <div className="match-score">
                  <span className="score-value">{neighborhood.matchScore}%</span>
                  <span className="score-label">Match</span>
                </div>
                <div className="neighborhood-content">
                  <h3>{neighborhood.name}</h3>
                  <p className="neighborhood-location">{neighborhood.city}, {neighborhood.state}</p>
                  <p className="neighborhood-description">{neighborhood.description}</p>
                </div>
                <div className="neighborhood-cta">
                  <button className="select-btn">
                    {selectedNeighborhood && selectedNeighborhood.id === neighborhood.id ? 'Selected' : 'Explore Places'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedNeighborhood && (
        <>
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="type">Place Type</label>
          <select 
            id="type" 
            name="type" 
            value={filters.type} 
            onChange={handleFilterChange}
          >
            {placeTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
              <label htmlFor="radius">Distance (km)</label>
          <select 
            id="radius" 
            name="radius" 
            value={filters.radius} 
            onChange={handleFilterChange}
          >
                <option value="1">1 km</option>
                <option value="2">2 km</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="priceLevel">Price Level</label>
          <select 
            id="priceLevel" 
            name="priceLevel" 
            value={filters.priceLevel} 
            onChange={handleFilterChange}
          >
            <option value="0">Any</option>
                <option value="1">₹</option>
                <option value="2">₹₹</option>
                <option value="3">₹₹₹</option>
                <option value="4">₹₹₹₹</option>
          </select>
        </div>
      </div>

          <div className="places-section">
            <h2>Places in {selectedNeighborhood.name}</h2>
            
            {isLoadingPlaces ? (
        <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Finding places in {selectedNeighborhood.name}...</p>
        </div>
            ) : error && !places.length ? (
        <div className="error-message">
          <p>{error}</p>
                <button onClick={() => handleNeighborhoodSelect(selectedNeighborhood)}>Try Again</button>
        </div>
      ) : (
              <div className="places-container">
                <div className="places-list">
                  {filteredPlaces.length > 0 ? (
                    filteredPlaces.map(place => (
                <PlaceCard key={place.id} place={place} />
              ))
            ) : (
                    <div className="no-places-message">
                <p>No places found matching your criteria. Try adjusting your filters.</p>
                    </div>
                  )}
                </div>
                
                <div className="map-container">
                  <MapView 
                    center={selectedNeighborhood.coordinates}
                    zoom={14}
                    markers={mapLocations}
                    radius={mapRadius}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PlaceRecommender; 