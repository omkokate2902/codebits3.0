import React, { useState } from 'react';
import '../styles/components/ReviewSelection.css';

const ReviewSelection = ({ preferences, recommendations, onConfirm, onBack }) => {
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Format the commute preferences
  const formatCommutePreferences = () => {
    const { commute } = preferences;
    const enabledModes = Object.entries(commute.travelModes)
      .filter(([_, details]) => details.enabled)
      .map(([mode, details]) => `${mode} (${details.distance} km)`);

    return (
      <div className="review-section">
        <h3>Commute Preferences</h3>
        {commute.workAddress && (
          <p><strong>Work Address:</strong> {commute.workAddress}</p>
        )}
        {enabledModes.length > 0 ? (
          <div>
            <p><strong>Travel Modes:</strong></p>
            <ul>
              {enabledModes.map((mode, index) => (
                <li key={index}>{mode}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No travel modes selected.</p>
        )}
      </div>
    );
  };

  // Format the lifestyle preferences
  const formatLifestylePreferences = () => {
    const { lifestylePreferences } = preferences;
    
    return (
      <div className="review-section">
        <h3>Lifestyle Preferences</h3>
        {lifestylePreferences.length > 0 ? (
          <ul className="preference-list">
            {lifestylePreferences.map((pref, index) => (
              <li key={index}>
                {pref.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </li>
            ))}
          </ul>
        ) : (
          <p>No lifestyle preferences selected.</p>
        )}
      </div>
    );
  };

  // Format the must-have preferences
  const formatMustHaves = () => {
    // Use prioritizedMustHaves if available, otherwise use mustHaves
    const prioritizedItems = preferences.prioritizedMustHaves || 
      Object.entries(preferences.mustHaves)
        .map(([item, priority]) => ({ name: item, priority }))
        .sort((a, b) => a.priority - b.priority);
    
    return (
      <div className="review-section">
        <h3>Must-Have Preferences</h3>
        {prioritizedItems.length > 0 ? (
          <ul className="preference-list">
            {prioritizedItems.map(({ name, priority }, index) => (
              <li key={index}>
                <span className="priority-indicator">Priority {priority}:</span> 
                {name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </li>
            ))}
          </ul>
        ) : (
          <p>No must-have preferences selected.</p>
        )}
      </div>
    );
  };

  // Format custom lifestyle preferences
  const formatCustomLifestyles = () => {
    const { customLifestyles } = preferences;
    const selectedCustom = customLifestyles.filter(item => item.value);
    
    if (selectedCustom.length === 0) return null;
    
    return (
      <div className="review-section">
        <h3>Custom Preferences</h3>
        <ul className="preference-list">
          {selectedCustom.map((item, index) => (
            <li key={index}>{item.name}</li>
          ))}
        </ul>
      </div>
    );
  };

  // Display neighborhood recommendations
  const displayRecommendations = () => {
    if (!recommendations || recommendations.length === 0) {
      return (
        <div className="review-section">
          <h3>Recommendations</h3>
          <p>No neighborhood recommendations found.</p>
        </div>
      );
    }

    return (
      <div className="recommendations-preview">
        <h3>Top Neighborhood Recommendations</h3>
        <div className="recommendations-grid">
          {recommendations.slice(0, 3).map((neighborhood, index) => (
            <div key={index} className="neighborhood-card">
              <div className="neighborhood-header">
                <h4>{neighborhood.name}</h4>
                <div className="neighborhood-location">{neighborhood.city}, {neighborhood.state}</div>
              </div>
              <div className="neighborhood-details">
                <div className="neighborhood-rent">{neighborhood.averageRent}</div>
                <div className="neighborhood-scores">
                  <span className="score">
                    <i className="fas fa-shield-alt"></i> Safety: {neighborhood.safetyScore}/10
                  </span>
                  <span className="score">
                    <i className="fas fa-walking"></i> Walkability: {neighborhood.walkabilityScore}/10
                  </span>
                </div>
                <p className="neighborhood-description">{neighborhood.description}</p>
                <div className="neighborhood-commute">
                  <strong>Commute:</strong> {neighborhood.commuteDetails.distance} ({neighborhood.commuteDetails.time} by {neighborhood.commuteDetails.travelMode})
                </div>
                <div className="neighborhood-amenities">
                  <strong>Amenities:</strong> {neighborhood.amenities.join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="view-all-button">
          <button onClick={() => onConfirm()}>View All Recommendations</button>
        </div>
      </div>
    );
  };

  return (
    <div className="review-container">
      <div className="review-header">
        <h2>Review Your Selections</h2>
        <p>Please review your preferences before we find your perfect neighborhood.</p>
      </div>
      
      {!showRecommendations ? (
        <>
          <div className="preferences-summary">
            {formatCommutePreferences()}
            {formatLifestylePreferences()}
            {formatMustHaves()}
            {formatCustomLifestyles()}
          </div>
          
          <div className="review-actions">
            <button onClick={onBack} className="back-btn">Go Back & Edit</button>
            <button onClick={() => setShowRecommendations(true)} className="confirm-btn">Show Recommendations</button>
          </div>
        </>
      ) : (
        <>
          {displayRecommendations()}
          <div className="review-actions">
            <button onClick={() => setShowRecommendations(false)} className="back-btn">Back to Preferences</button>
            <button onClick={onConfirm} className="confirm-btn">Find My Perfect Neighborhood</button>
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewSelection; 