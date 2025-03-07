import React, { useState, useEffect, useContext, useCallback } from 'react';
import PlaceCard from '../components/PlaceCard';
import MapView from '../components/MapView';
import { AuthContext } from '../context/AuthContext';
import * as userStorage from '../utils/userStorage';
import { analyzeTimelineData } from '../utils/geminiApi';
import '../styles/pages/PlaceRecommender.css';

const PlaceRecommender = () => {
  const { user } = useContext(AuthContext);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    radius: 5,
    priceLevel: 0
  });
  const [mapLocations, setMapLocations] = useState([]);
  const [location, setLocation] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [userAnalysis, setUserAnalysis] = useState(null);

  // Load user data from storage
  useEffect(() => {
    if (user && user.uid) {
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
      
      // Fetch recommended neighborhoods
      fetchNeighborhoods();
    }
  }, [user]);

    // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to San Francisco if location access is denied
          setLocation({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      // Default to San Francisco if geolocation is not supported
      setLocation({ lat: 37.7749, lng: -122.4194 });
    }
  }, []);

  // Fetch places when location, filters, or selected neighborhood changes
  useEffect(() => {
    if (location && (selectedNeighborhood || !neighborhoods.length)) {
      fetchPlaces();
    }
  }, [location, filters, selectedNeighborhood]);

  // Fetch recommended neighborhoods
  const fetchNeighborhoods = useCallback(async () => {
    try {
      setLoading(true);
      
      // In a real app, this would be an API call to your backend
      // const response = await fetch('http://localhost:3000/neighborhoods/recommendations', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${user.token}`
      //   },
      //   body: JSON.stringify({ userId: user.uid })
      // });
      
      // const data = await response.json();
      // setNeighborhoods(data.neighborhoods);
      
      // For now, use mock data
      setTimeout(() => {
        const mockNeighborhoods = [
          {
            id: 1,
            name: 'Mission District',
            city: 'San Francisco',
            state: 'CA',
            description: 'Vibrant neighborhood with diverse dining options and cultural attractions.',
            coordinates: { lat: 37.7599, lng: -122.4148 },
            matchScore: 92
          },
          {
            id: 2,
            name: 'SoMa',
            city: 'San Francisco',
            state: 'CA',
            description: 'Urban area with tech companies, warehouses, and modern apartment buildings.',
            coordinates: { lat: 37.7785, lng: -122.3950 },
            matchScore: 87
          },
          {
            id: 3,
            name: 'Marina District',
            city: 'San Francisco',
            state: 'CA',
            description: 'Upscale area with waterfront views, boutique shopping, and fitness options.',
            coordinates: { lat: 37.8030, lng: -122.4378 },
            matchScore: 85
          }
        ];
        
        setNeighborhoods(mockNeighborhoods);
        
        // Select the highest matching neighborhood by default
        if (mockNeighborhoods.length > 0) {
          const bestMatch = mockNeighborhoods.reduce((prev, current) => 
            (prev.matchScore > current.matchScore) ? prev : current
          );
          setSelectedNeighborhood(bestMatch);
          
          // Update location to the selected neighborhood
          setLocation(bestMatch.coordinates);
        }
        
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching neighborhoods:', err);
      setError('Failed to fetch neighborhood recommendations.');
      setLoading(false);
    }
  }, [user]);

  // Fetch places based on user preferences and selected neighborhood
  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Determine place types to fetch based on user preferences
      const placeTypes = determinePreferredPlaceTypes();
      console.log('Determined place types:', placeTypes);
      
      // In a real app, this would be an API call to your backend
      // const response = await fetch('http://localhost:3000/places/recommendations', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': user ? `Bearer ${user.token}` : ''
      //   },
      //   body: JSON.stringify({
      //     location: selectedNeighborhood ? selectedNeighborhood.coordinates : location,
      //     placeTypes,
      //     ...filters
      //   }),
      // });
      
      // const data = await response.json();
      // setPlaces(data.places);
      
      // For now, use mock data
      setTimeout(() => {
        // Generate mock places based on user preferences
        const mockPlaces = generateMockPlaces(placeTypes);
        setPlaces(mockPlaces);
        
        // Format data for map
        const locations = mockPlaces.map(place => ({
          name: place.name,
          description: `${place.name} - ${place.type}`,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude
        }));
        
        setMapLocations(locations);
        setLoading(false);
      }, 1500);
    } catch (err) {
      console.error('Error fetching places:', err);
      setError('Failed to fetch place recommendations. Please try again.');
      setLoading(false);
    }
  }, [location, filters, selectedNeighborhood, user, userPreferences, userAnalysis]);

  // Determine place types based on user preferences
  const determinePreferredPlaceTypes = () => {
    const placeTypes = [];
    
    // If we have user preferences
    if (userPreferences) {
      const { lifestylePreferences, mustHaves } = userPreferences;
      
      // Map lifestyle preferences to place types
      const lifestyleToPlaceType = {
        'activeLifestyle': ['gym', 'park', 'sports_complex'],
        'outdoorActivities': ['park', 'hiking_trail', 'beach'],
        'shopping': ['shopping_mall', 'clothing_store', 'department_store'],
        'casualDining': ['restaurant', 'cafe', 'fast_food'],
        'fineDining': ['restaurant'],
        'nightlife': ['bar', 'night_club'],
        'cultural': ['museum', 'art_gallery', 'theater'],
        'artsAndMusic': ['art_gallery', 'concert_hall', 'music_venue'],
        'familyFriendly': ['park', 'amusement_park', 'zoo'],
        'quiet': ['library', 'bookstore', 'cafe'],
        'community': ['community_center', 'library'],
        'socialGatherings': ['restaurant', 'bar', 'event_venue']
      };
      
      // Add place types based on lifestyle preferences
      lifestylePreferences.forEach(pref => {
        if (lifestyleToPlaceType[pref]) {
          placeTypes.push(...lifestyleToPlaceType[pref]);
        }
      });
      
      // Add place types based on must-haves
      const mustHaveToPlaceType = {
        'parking': ['parking'],
        'publicTransport': ['transit_station', 'bus_station', 'subway_station'],
        'parks': ['park'],
        'schools': ['school', 'university'],
        'groceryStores': ['grocery_store', 'supermarket'],
        'gym': ['gym']
      };
      
      // If mustHaves is an object with keys
      if (typeof mustHaves === 'object' && Object.keys(mustHaves).length > 0) {
        Object.keys(mustHaves).forEach(mustHave => {
          if (mustHaveToPlaceType[mustHave]) {
            placeTypes.push(...mustHaveToPlaceType[mustHave]);
          }
        });
      }
      // If mustHaves is an array of objects with name property
      else if (Array.isArray(userPreferences.prioritizedMustHaves)) {
        userPreferences.prioritizedMustHaves.forEach(item => {
          if (mustHaveToPlaceType[item.name]) {
            placeTypes.push(...mustHaveToPlaceType[item.name]);
          }
        });
      }
    }
    
    // If we have user analysis
    if (userAnalysis) {
      const { lifestyle_indicators } = userAnalysis;
      
      // Map lifestyle indicators to place types
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
      
      // Add place types based on lifestyle indicators
      if (lifestyle_indicators && Array.isArray(lifestyle_indicators)) {
        lifestyle_indicators.forEach(indicator => {
          const lowerIndicator = indicator.toLowerCase();
          
          // Check each keyword
          Object.entries(indicatorKeywords).forEach(([keyword, types]) => {
            if (lowerIndicator.includes(keyword)) {
              placeTypes.push(...types);
            }
          });
        });
      }
    }
    
    // Remove duplicates and return
    return [...new Set(placeTypes)];
  };

  // Generate mock places based on preferred place types
  const generateMockPlaces = (placeTypes) => {
    const mockPlacesByType = {
      'restaurant': [
        {
          id: 101,
          name: 'Farm Table',
          type: 'Restaurant',
          address: '754 Post St, San Francisco, CA',
          rating: 4.6,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqFUxlDdKUhu_aUwxGq4u7MnDw1OaX9YU9uKs-Q6-EJbYGVU7Gxdw9RLnN7fYMUVoIgRgYKJVd4s9-_X1-EwZzR_-Ql-_Gg=s1600-w400',
          description: 'Farm-to-table restaurant with seasonal ingredients and cozy atmosphere.',
          distance: 0.7,
          priceLevel: 2,
          openNow: true,
          website: 'https://farmtablesf.com',
          latitude: 37.7885,
          longitude: -122.4124
        },
        {
          id: 102,
          name: 'Liholiho Yacht Club',
          type: 'Restaurant',
          address: '871 Sutter St, San Francisco, CA',
          rating: 4.7,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqHYeT9k3aFXbihQHHY_FQdZmFRwvQUXIO0jFN-mLnGXlZOXUKp6CA8zzJYl9LHmJKbw-dxVRJA7iy0wvS4c_x4APXzQdA=s1600-w400',
          description: 'Modern Hawaiian cuisine with creative cocktails in a vibrant setting.',
          distance: 0.9,
          priceLevel: 3,
          openNow: true,
          website: 'https://liholihoyachtclub.com',
          latitude: 37.7882,
          longitude: -122.4143
        }
      ],
      'cafe': [
        {
          id: 201,
          name: 'Sightglass Coffee',
          type: 'Cafe',
          address: '270 7th St, San Francisco, CA',
          rating: 4.5,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqGFF_YxaOjHXKJYfyBqUgcaYh9iIbZV1Yx5qOKQQQhKTnLrS_gR_oDGq7WKPz5-Iy-Ry5QQCpKg7Ib9QfJmXHlvOQlKlw=s1600-w400',
          description: 'Artisanal coffee roaster with industrial-chic space and pour-over options.',
          distance: 1.2,
          priceLevel: 2,
          openNow: true,
          website: 'https://sightglasscoffee.com',
          latitude: 37.7762,
          longitude: -122.4093
        },
        {
          id: 202,
          name: 'Ritual Coffee Roasters',
          type: 'Cafe',
          address: '1026 Valencia St, San Francisco, CA',
          rating: 4.4,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqELZPdZWl9S5Lfgc4qGLDyS_EEH-UkQTCfvO4YTrEVmGVzYlZ1FLvCJKpP_F9xrr_IQPQnBKvvj-_YQnQGvZ-_Hs9Ib=s1600-w400',
          description: 'Specialty coffee shop known for single-origin beans and minimalist decor.',
          distance: 1.5,
          priceLevel: 2,
          openNow: true,
          website: 'https://ritualcoffee.com',
          latitude: 37.7568,
          longitude: -122.4213
        }
      ],
      'gym': [
        {
          id: 301,
          name: 'Equinox',
          type: 'Gym',
          address: '301 Pine St, San Francisco, CA',
          rating: 4.3,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqFcLNQvJoQPUZwIX9085Tl7pZ_h9PnQAkRZ-UhzZ9OV9GnjL-gKrFgV_LrJAYWKgQGDTc9LJVvIgW_NZzMJ-gYQXQXQrQ=s1600-w400',
          description: 'Luxury fitness club with state-of-the-art equipment and premium amenities.',
          distance: 1.8,
          priceLevel: 4,
          openNow: true,
          website: 'https://equinox.com',
          latitude: 37.7908,
          longitude: -122.4008
        },
        {
          id: 302,
          name: 'Fitness SF',
          type: 'Gym',
          address: '1001 Brannan St, San Francisco, CA',
          rating: 4.2,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqHvVUiYnHH-ky_Jx4r_Xm9zJCQRJgCsR9252YQnuVYYQnQZcBvF_V7tE_KjnG_aqWKcjuTCkTXzB9UdplLlBdz-Fy-Ouw=s1600-w400',
          description: 'Modern gym with comprehensive equipment and group fitness classes.',
          distance: 2.1,
          priceLevel: 3,
          openNow: true,
          website: 'https://fitnesssf.com',
          latitude: 37.7720,
          longitude: -122.4069
        }
      ],
      'park': [
        {
          id: 401,
          name: 'Dolores Park',
          type: 'Park',
          address: 'Dolores St & 19th St, San Francisco, CA',
          rating: 4.8,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqFQJYVjO9Qzm9u_-ZVNx6J-ioE3K9LQtLV-naTCnbJ_BEQFSuQBRcNO_QdOJTZ-_-zLRl4W9ZnhHl-UUzwcQqXJZnQKvw=s1600-w400',
          description: 'Popular urban park with stunning city views, picnic areas, and tennis courts.',
          distance: 1.3,
          priceLevel: 0,
          openNow: true,
          website: 'https://sfrecpark.org/destination/mission-dolores-park/',
          latitude: 37.7596,
          longitude: -122.4269
        },
        {
          id: 402,
          name: 'Golden Gate Park',
          type: 'Park',
          address: 'Golden Gate Park, San Francisco, CA',
          rating: 4.9,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqGQh0WMT9XRl7gk8tX4-HGQQYPVODtN-Ld_5qcCGDuFB6X_0CTM9pDjqGldkKQkXpIGYEcb5YnvhOXQH9rx_XZbKQnJrA=s1600-w400',
          description: 'Iconic urban park with gardens, museums, and recreational areas.',
          distance: 2.5,
          priceLevel: 0,
          openNow: true,
          website: 'https://goldengatepark.com',
          latitude: 37.7694,
          longitude: -122.4862
        }
      ],
      'shopping_mall': [
        {
          id: 501,
          name: 'Westfield San Francisco Centre',
          type: 'Shopping Mall',
          address: '865 Market St, San Francisco, CA',
          rating: 4.3,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqGQJJVZZFYw-Q_xyFl8CdQTOepWj0G9DsKvVxGGn5Tz5PuXWXNzGOLEXhrYJ-Hy-Iy-Ry5QQCpKg7Ib9QfJmXHlvOQlKlw=s1600-w400',
          description: 'Upscale shopping mall with department stores, boutiques, and dining options.',
          distance: 1.7,
          priceLevel: 3,
          openNow: true,
          website: 'https://westfield.com/sanfrancisco',
          latitude: 37.7841,
          longitude: -122.4076
        }
      ],
      'museum': [
        {
          id: 601,
          name: 'SFMOMA',
          type: 'Museum',
          address: '151 3rd St, San Francisco, CA',
          rating: 4.7,
          image: 'https://lh3.googleusercontent.com/places/ANXAkqFQJYVjO9Qzm9u_-ZVNx6J-ioE3K9LQtLV-naTCnbJ_BEQFSuQBRcNO_QdOJTZ-_-zLRl4W9ZnhHl-UUzwcQqXJZnQKvw=s1600-w400',
          description: 'Modern art museum with an extensive collection and striking architecture.',
          distance: 1.4,
          priceLevel: 2,
          openNow: true,
          website: 'https://sfmoma.org',
          latitude: 37.7858,
          longitude: -122.4008
        }
      ]
    };
    
    // If no specific place types, return a mix of everything
    if (!placeTypes.length) {
      return Object.values(mockPlacesByType).flat();
    }
    
    // Filter to only include requested place types
    let result = [];
    placeTypes.forEach(type => {
      // Map Google place types to our mock data categories
      const mappedType = type.includes('restaurant') ? 'restaurant' :
                         type.includes('cafe') ? 'cafe' :
                         type.includes('gym') ? 'gym' :
                         type.includes('park') ? 'park' :
                         type.includes('shop') || type.includes('store') || type.includes('mall') ? 'shopping_mall' :
                         type.includes('museum') || type.includes('gallery') ? 'museum' :
                         null;
      
      if (mappedType && mockPlacesByType[mappedType]) {
        result = [...result, ...mockPlacesByType[mappedType]];
      }
    });
    
    // Remove duplicates by ID
    const uniqueResult = Array.from(new Map(result.map(item => [item.id, item])).values());
    
    // If we still have no results, return a mix of everything
    return uniqueResult.length > 0 ? uniqueResult : Object.values(mockPlacesByType).flat();
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle neighborhood selection
  const handleNeighborhoodSelect = (neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    setLocation(neighborhood.coordinates);
  };

  // Get place types for filter dropdown
  const placeTypes = [
    { value: 'all', label: 'All Places' },
    { value: 'restaurant', label: 'Restaurants' },
    { value: 'cafe', label: 'Cafes' },
    { value: 'gym', label: 'Gyms' },
    { value: 'park', label: 'Parks' },
    { value: 'shopping', label: 'Shopping' },
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
            </div>
          ))}
        </div>
      </div>

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
          <label htmlFor="radius">Distance (miles)</label>
          <select 
            id="radius" 
            name="radius" 
            value={filters.radius} 
            onChange={handleFilterChange}
          >
            <option value="1">1 mile</option>
            <option value="3">3 miles</option>
            <option value="5">5 miles</option>
            <option value="10">10 miles</option>
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
            <option value="1">$</option>
            <option value="2">$$</option>
            <option value="3">$$$</option>
            <option value="4">$$$$</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-indicator">
          <p>Finding places near you...</p>
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchPlaces}>Try Again</button>
        </div>
      ) : (
        <>
          <div className="map-section">
            <MapView 
              locations={mapLocations} 
              center={location}
              zoom={13}
            />
          </div>
          
          <div className="places-grid">
            {places.length > 0 ? (
              places.map(place => (
                <PlaceCard key={place.id} place={place} />
              ))
            ) : (
              <div className="no-results">
                <p>No places found matching your criteria. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PlaceRecommender; 