import React from 'react';
import MapView from './MapView';
import NeighborhoodCard from './NeighborhoodCard';
import '../styles/components/NeighborhoodResults.css';

const NeighborhoodResults = ({ recommendations, preferences, onBack }) => {
  // Prepare locations for the map
  const mapLocations = recommendations.map(neighborhood => {
    // Extract coordinates from the neighborhood data
    // This is a placeholder - in a real app, you would get actual coordinates
    const coordinates = {
      lat: 17.7197035 + (Math.random() - 0.5) * 0.05, // Add some random offset for demo
      lng: 73.3987688 + (Math.random() - 0.5) * 0.05  // Add some random offset for demo
    };
    
    return {
      ...neighborhood,
      coordinates
    };
  });

  return (
    <div className="results-container">
      <div className="results-header-container">
        <div className="results-header">
          <h2>Your Perfect Neighborhoods</h2>
          <p>Based on your preferences, we've found these neighborhoods that match your criteria.</p>
          <button onClick={onBack} className="back-btn">Back to Preferences</button>
        </div>
      </div>

      <div className="map-section">
        <h3>Neighborhood Map</h3>
        <MapView locations={mapLocations} />
      </div>
      
      <div className="neighborhoods-section">
        <h3>Recommended Neighborhoods</h3>
        <div className="neighborhoods-list">
          {recommendations.map((neighborhood, index) => (
            <NeighborhoodCard 
              key={index} 
              neighborhood={neighborhood} 
              userCategory={preferences.userCategory}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodResults; 