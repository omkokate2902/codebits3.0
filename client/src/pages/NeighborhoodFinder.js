import React, { useState, useEffect, useCallback } from 'react';
import PreferenceForm from '../components/PreferenceForm';
import ReviewSelection from '../components/ReviewSelection';
import NeighborhoodCard from '../components/NeighborhoodCard';
import MapView from '../components/MapView';
import { API } from '../utils/api';
import '../styles/pages/NeighborhoodFinder.css';

const NeighborhoodFinder = () => {
  const [preferences, setPreferences] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapLocations, setMapLocations] = useState([]);
  const [timelineData, setTimelineData] = useState(null);
  const [currentStep, setCurrentStep] = useState('form'); // 'form', 'review', or 'results'
  const [reviewPreferences, setReviewPreferences] = useState(null);

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

  // Load user preferences from backend when component mounts
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const data = await API.user.getPreferences();
        if (data.preferences) {
          console.log('Loaded user preferences:', data.preferences);
          setPreferences(data.preferences);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    
    loadUserPreferences();
  }, []);

  const fetchNeighborhoods = useCallback(async () => {
    if (!preferences) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Make API call to get neighborhood recommendations
      const data = await API.neighborhoods.search(preferences);
      setNeighborhoods(data.neighborhoods || []);
      
      // Prepare map locations from neighborhoods
      const locations = data.neighborhoods.map(n => ({
        latitude: n.location.lat,
        longitude: n.location.lng,
        name: n.name,
        description: n.description
      }));
      
      setMapLocations(locations);
      setCurrentStep('results');
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      setError('Failed to fetch neighborhood recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [preferences]);

  const handlePreferenceSubmit = (formData) => {
    console.log('Form submitted with data:', formData);
    setReviewPreferences(formData);
    setCurrentStep('review');
  };

  const handleTimelineData = (data) => {
    setTimelineData(data);
  };

  const handleReviewBack = () => {
    setCurrentStep('form');
  };

  const handleReviewConfirm = () => {
    setPreferences(reviewPreferences);
    fetchNeighborhoods();
  };

  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'form':
        return (
          <PreferenceForm 
            onSubmit={handlePreferenceSubmit} 
            onTimelineData={handleTimelineData} 
          />
        );
      case 'review':
        return (
          <ReviewSelection 
            preferences={reviewPreferences} 
            onConfirm={handleReviewConfirm} 
            onBack={handleReviewBack} 
          />
        );
      case 'results':
        return (
          <div className="results-container">
            {loading ? (
              <div className="loading-container">
                <div className="loader"></div>
                <p>Finding the perfect neighborhoods for you...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <h3>Error</h3>
                <p>{error}</p>
                <button onClick={() => setCurrentStep('review')}>Go Back</button>
              </div>
            ) : (
              <>
                <div className="map-container">
                  <MapView locations={mapLocations} />
                </div>
                <div className="neighborhoods-list">
                  <h2>Recommended Neighborhoods</h2>
                  {neighborhoods.length > 0 ? (
                    neighborhoods.map((neighborhood, index) => (
                      <NeighborhoodCard 
                        key={index} 
                        neighborhood={neighborhood} 
                        userCategory={preferences.userCategory}
                      />
                    ))
                  ) : (
                    <p>No neighborhoods found matching your criteria.</p>
                  )}
                </div>
              </>
            )}
          </div>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="neighborhood-finder">
      {renderCurrentStep()}
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