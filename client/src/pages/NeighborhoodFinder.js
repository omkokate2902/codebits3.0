import React, { useState, useEffect, useCallback } from 'react';
import PreferenceForm from '../components/PreferenceForm';
import NeighborhoodCard from '../components/NeighborhoodCard';
import MapView from '../components/MapView';
import '../styles/pages/NeighborhoodFinder.css';

const NeighborhoodFinder = () => {
  const [preferences, setPreferences] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapLocations, setMapLocations] = useState([]);
  const [timelineData, setTimelineData] = useState(null);

  // Price ranges for each user category in INR
  const categoryPriceRanges = {
    budget: { min: 10000, max: 20000 },
    moderate: { min: 20000, max: 40000 },
    comfort: { min: 40000, max: 60000 },
    premium: { min: 60000, max: 80000 },
    luxury: { min: 80000, max: 150000 }
  };

  // Travel mode speeds in km/h (approximate)
  const travelModeSpeeds = {
    walking: 5,
    bicycling: 15,
    transit: 25,
    driving: 40
  };

  const fetchNeighborhoods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Convert user category to budget range
      const userCategory = preferences.userCategory;
      const budgetRange = categoryPriceRanges[userCategory];

      // Calculate approximate commute time based on distance and travel mode
      const { maxCommuteDistance, travelMode } = preferences.commute;
      const speedKmh = travelModeSpeeds[travelMode] || travelModeSpeeds.driving;
      const approximateCommuteTime = Math.round((maxCommuteDistance / speedKmh) * 60); // in minutes

      // Prepare data for API call
      const requestData = {
        ...preferences,
        budget: budgetRange,
        commute: {
          ...preferences.commute,
          approximateCommuteTime
        },
        timelineData: timelineData
      };

      // API call to backend
      const response = await fetch('http://192.168.0.118:3000/neighborhoods/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch neighborhoods');
      }

      const data = await response.json();
      setNeighborhoods(data.neighborhoods);
      
      // Format data for map
      const locations = data.neighborhoods.map(neighborhood => ({
        name: neighborhood.name,
        description: `${neighborhood.name} - Avg. Rent: ₹${neighborhood.averageRent}/mo`,
        address: `${neighborhood.name}, ${neighborhood.city}, ${neighborhood.state}`,
        latitude: neighborhood.latitude,
        longitude: neighborhood.longitude
      }));
      
      setMapLocations(locations);
      
    } catch (err) {
      console.error('Error fetching neighborhoods:', err);
      setError('Failed to fetch neighborhoods. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [preferences, timelineData]);

  useEffect(() => {
    if (preferences) {
      fetchNeighborhoods();
    }
  }, [preferences, fetchNeighborhoods]);

  const handlePreferenceSubmit = (formData) => {
    setPreferences(formData);
    setLoading(true);
  };

  // Handle timeline data from the server
  const handleTimelineData = (data) => {
    setTimelineData(data);
  };

  // Mock data for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && preferences) {
      // Simulate API response with mock data
      setTimeout(() => {
        const mockNeighborhoods = [
          {
            id: 1,
            name: 'Koramangala',
            city: 'Bangalore',
            state: 'Karnataka',
            averageRent: 35000,
            safetyScore: 8,
            walkabilityScore: 7,
            image: 'https://via.placeholder.com/300x200',
            description: 'Popular tech hub with vibrant nightlife, restaurants, and cafes. Home to many startups and young professionals.',
            amenities: ['Restaurants', 'Cafes', 'Pubs', 'Parks', 'Gyms'],
            latitude: 12.9352,
            longitude: 77.6245
          },
          {
            id: 2,
            name: 'Indiranagar',
            city: 'Bangalore',
            state: 'Karnataka',
            averageRent: 40000,
            safetyScore: 7,
            walkabilityScore: 8,
            image: 'https://via.placeholder.com/300x200',
            description: 'Upscale residential area with trendy boutiques, microbreweries, and a lively music scene.',
            amenities: ['Shopping', 'Restaurants', 'Pubs', 'Metro Station'],
            latitude: 12.9784,
            longitude: 77.6408
          },
          {
            id: 3,
            name: 'HSR Layout',
            city: 'Bangalore',
            state: 'Karnataka',
            averageRent: 30000,
            safetyScore: 8,
            walkabilityScore: 6,
            image: 'https://via.placeholder.com/300x200',
            description: 'Well-planned residential area with good connectivity, parks, and a growing tech presence.',
            amenities: ['Parks', 'Cafes', 'Supermarkets', 'Gyms'],
            latitude: 12.9116,
            longitude: 77.6741
          },
          {
            id: 4,
            name: 'Whitefield',
            city: 'Bangalore',
            state: 'Karnataka',
            averageRent: 25000,
            safetyScore: 7,
            walkabilityScore: 5,
            image: 'https://via.placeholder.com/300x200',
            description: 'Major IT hub with tech parks, shopping malls, and residential communities.',
            amenities: ['IT Parks', 'Malls', 'International Schools', 'Apartments'],
            latitude: 12.9698,
            longitude: 77.7499
          },
          {
            id: 5,
            name: 'Jayanagar',
            city: 'Bangalore',
            state: 'Karnataka',
            averageRent: 28000,
            safetyScore: 9,
            walkabilityScore: 8,
            image: 'https://via.placeholder.com/300x200',
            description: 'Traditional residential area with excellent markets, parks, and cultural venues.',
            amenities: ['Shopping Complex', 'Parks', 'Temples', 'Restaurants'],
            latitude: 12.9299,
            longitude: 77.5933
          }
        ];
        
        setNeighborhoods(mockNeighborhoods);
        
        // Format data for map
        const locations = mockNeighborhoods.map(neighborhood => ({
          name: neighborhood.name,
          description: `${neighborhood.name} - Avg. Rent: ₹${neighborhood.averageRent}/mo`,
          address: `${neighborhood.name}, ${neighborhood.city}, ${neighborhood.state}`,
          latitude: neighborhood.latitude,
          longitude: neighborhood.longitude
        }));
        
        setMapLocations(locations);
        setLoading(false);
      }, 1500);
    }
  }, [preferences]);

  return (
    <div className="neighborhood-finder-page">
      <div className="page-header">
        <h1>Find Your Perfect Neighborhood</h1>
        <p>Tell us your preferences and we'll find neighborhoods that match your needs.</p>
      </div>

      {!preferences ? (
        <div className="preferences-section">
          <PreferenceForm onSubmit={handlePreferenceSubmit} onTimelineData={handleTimelineData} />
        </div>
      ) : (
        <div className="results-section">
          {loading ? (
            <div className="loading-indicator">
              <p>Finding neighborhoods that match your preferences...</p>
              <div className="spinner"></div>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => setPreferences(null)}>Try Again</button>
            </div>
          ) : (
            <>
              <div className="results-header">
                <h2>Recommended Neighborhoods</h2>
                <div className="results-info">
                  <div className="result-badges">
                    <span className="category-badge" style={{ 
                      backgroundColor: getCategoryColor(preferences.userCategory),
                      color: 'white'
                    }}>
                      {getCategoryName(preferences.userCategory)}
                    </span>
                    <span className="travel-badge" style={{
                      backgroundColor: getTravelModeColor(preferences.commute.travelMode),
                      color: 'white'
                    }}>
                      {getTravelModeIcon(preferences.commute.travelMode)} {preferences.commute.maxCommuteDistance} km
                    </span>
                  </div>
                  <button onClick={() => setPreferences(null)} className="edit-preferences-btn">
                    Edit Preferences
                  </button>
                </div>
              </div>
              
              <div className="map-section">
                <MapView locations={mapLocations} />
              </div>
              
              <div className="neighborhoods-grid">
                {neighborhoods.length > 0 ? (
                  neighborhoods.map(neighborhood => (
                    <NeighborhoodCard key={neighborhood.id} neighborhood={neighborhood} />
                  ))
                ) : (
                  <div className="no-results">
                    <p>No neighborhoods found matching your criteria. Try adjusting your preferences.</p>
                    <button onClick={() => setPreferences(null)}>Adjust Preferences</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to get category name
function getCategoryName(categoryId) {
  const categories = {
    budget: 'Budget Explorer',
    moderate: 'Balanced Dweller',
    comfort: 'Comfort Seeker',
    premium: 'Premium Lifestyle',
    luxury: 'Luxury Connoisseur'
  };
  return categories[categoryId] || categoryId;
}

// Helper function to get category color
function getCategoryColor(categoryId) {
  const colors = {
    budget: '#4cb963',
    moderate: '#4a6fa5',
    comfort: '#f4a261',
    premium: '#e76f51',
    luxury: '#9c6644'
  };
  return colors[categoryId] || '#4a6fa5';
}

// Helper function to get travel mode icon
function getTravelModeIcon(modeId) {
  const icons = {
    walking: '🚶',
    bicycling: '🚲',
    transit: '🚌',
    driving: '🚗'
  };
  return icons[modeId] || '🚗';
}

// Helper function to get travel mode color
function getTravelModeColor(modeId) {
  const colors = {
    walking: '#4cb963', // green
    bicycling: '#f4a261', // orange
    transit: '#4a6fa5', // blue
    driving: '#e76f51' // red
  };
  return colors[modeId] || '#4a6fa5';
}

export default NeighborhoodFinder; 