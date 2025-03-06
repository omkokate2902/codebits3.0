import React, { useState, useEffect, useContext } from 'react';
import PlaceCard from '../components/PlaceCard';
import MapView from '../components/MapView';
import { AuthContext } from '../context/AuthContext';
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

  useEffect(() => {
    // Get user's current location
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

  useEffect(() => {
    if (location) {
      fetchPlaces();
    }
  }, [location, filters, fetchPlaces]);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      setError(null);

      // API call to backend
      const response = await fetch('http://192.168.0.118:3000/places/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user ? `Bearer ${user.token}` : ''
        },
        body: JSON.stringify({
          location,
          ...filters
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch place recommendations');
      }

      const data = await response.json();
      setPlaces(data.places);
      
      // Format data for map
      const locations = data.places.map(place => ({
        name: place.name,
        description: `${place.name} - ${place.type}`,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude
      }));
      
      setMapLocations(locations);
      
    } catch (err) {
      console.error('Error fetching places:', err);
      setError('Failed to fetch place recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && location) {
      // Simulate API response with mock data
      setTimeout(() => {
        const mockPlaces = [
          {
            id: 1,
            name: 'Golden Gate Park',
            type: 'Park',
            address: 'Golden Gate Park, San Francisco, CA',
            rating: 4.8,
            image: 'https://via.placeholder.com/300x200',
            description: 'Iconic urban park with gardens, museums, and recreational areas.',
            distance: 2.3,
            priceLevel: 0,
            openNow: true,
            website: 'https://goldengatepark.com',
            latitude: 37.7694,
            longitude: -122.4862
          },
          {
            id: 2,
            name: 'Blue Bottle Coffee',
            type: 'Cafe',
            address: '315 Linden St, San Francisco, CA',
            rating: 4.5,
            image: 'https://via.placeholder.com/300x200',
            description: 'Trendy cafe known for pour-over coffee and minimalist aesthetic.',
            distance: 1.2,
            priceLevel: 2,
            openNow: true,
            website: 'https://bluebottlecoffee.com',
            latitude: 37.7767,
            longitude: -122.4233
          },
          {
            id: 3,
            name: 'Fitness SF',
            type: 'Gym',
            address: '1001 Brannan St, San Francisco, CA',
            rating: 4.3,
            image: 'https://via.placeholder.com/300x200',
            description: 'Modern gym with state-of-the-art equipment and fitness classes.',
            distance: 0.8,
            priceLevel: 3,
            openNow: true,
            website: 'https://fitnesssf.com',
            latitude: 37.7720,
            longitude: -122.4069
          }
        ];
        
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
    }
  }, [location, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

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
        <p>Find restaurants, cafes, gyms, and more based on your preferences and Google history.</p>
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
          {/* Add a spinner component here */}
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
              zoom={12}
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

// Memoize the component to prevent unnecessary re-renders
export default React.memo(PlaceRecommender); 