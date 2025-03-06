import React, { useState, useEffect } from 'react';
import { API } from '../utils/api';
import '../styles/components/ReviewSelection.css';

const ReviewSelection = ({ preferences, onConfirm, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the user persona from the backend
    const fetchPersona = async () => {
      try {
        setLoading(true);
        // Make a GET request to get the persona
        const response = await API.user.getPersona(preferences);
        setPersona(response.persona);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching persona:', error);
        setError('Failed to generate your persona. Please try again.');
        setLoading(false);
      }
    };

    fetchPersona();
  }, [preferences]);

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

  if (loading) {
    return (
      <div className="review-selection loading">
        <div className="loader"></div>
        <p>Generating your personalized profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-selection error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={onBack} className="back-btn">Go Back</button>
      </div>
    );
  }

  return (
    <div className="review-selection">
      <h2>Review Your Selections</h2>
      
      <div className="persona-section">
        <h3>Your Persona</h3>
        <div className="persona-text">
          {persona}
        </div>
      </div>
      
      <div className="preferences-summary">
        {formatCommutePreferences()}
        {formatLifestylePreferences()}
        {formatMustHaves()}
        {formatCustomLifestyles()}
      </div>
      
      <div className="review-actions">
        <button onClick={onBack} className="back-btn">Go Back & Edit</button>
        <button onClick={onConfirm} className="confirm-btn">Find My Perfect Neighborhood</button>
      </div>
    </div>
  );
};

export default ReviewSelection; 