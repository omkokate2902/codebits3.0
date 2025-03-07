import React, { useState } from 'react';
import '../styles/components/NeighborhoodCard.css';

const NeighborhoodCard = ({ neighborhood, userCategory }) => {
  const [expanded, setExpanded] = useState(false);

  // Get color based on user category
  const getCategoryColor = () => {
    const colors = {
      'budget': '#4cb963',
      'moderate': '#4a6fa5',
      'comfort': '#f4a261',
      'premium': '#e76f51',
      'luxury': '#9c6644'
    };
    return colors[userCategory] || '#4a6fa5';
  };

  return (
    <div className={`neighborhood-card ${expanded ? 'expanded' : ''}`}>
      <div 
        className="neighborhood-header" 
        style={{ backgroundColor: getCategoryColor() }}
        onClick={() => setExpanded(!expanded)}
      >
        <h3>{neighborhood.name}</h3>
        <div className="neighborhood-location">{neighborhood.city}, {neighborhood.state}</div>
        <div className="expand-icon">{expanded ? '−' : '+'}</div>
      </div>
      
      <div className="neighborhood-overview">
        <div className="neighborhood-rent">{neighborhood.averageRent}</div>
        <div className="neighborhood-scores">
          <div className="score-item">
            <div className="score-label">Safety</div>
            <div className="score-bar">
              <div 
                className="score-fill" 
                style={{ width: `${neighborhood.safetyScore * 10}%`, backgroundColor: getCategoryColor() }}
              ></div>
            </div>
            <div className="score-value">{neighborhood.safetyScore}/10</div>
          </div>
          <div className="score-item">
            <div className="score-label">Walkability</div>
            <div className="score-bar">
              <div 
                className="score-fill" 
                style={{ width: `${neighborhood.walkabilityScore * 10}%`, backgroundColor: getCategoryColor() }}
              ></div>
            </div>
            <div className="score-value">{neighborhood.walkabilityScore}/10</div>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="neighborhood-details">
          <div className="detail-section">
            <h4>Description</h4>
            <p>{neighborhood.description}</p>
          </div>
          
          <div className="detail-section">
            <h4>Commute Details</h4>
            <div className="commute-info">
              <div className="commute-item">
                <span className="commute-label">Distance:</span>
                <span className="commute-value">{neighborhood.commuteDetails.distance}</span>
              </div>
              <div className="commute-item">
                <span className="commute-label">Time:</span>
                <span className="commute-value">{neighborhood.commuteDetails.time}</span>
              </div>
              <div className="commute-item">
                <span className="commute-label">Mode:</span>
                <span className="commute-value">{neighborhood.commuteDetails.travelMode}</span>
              </div>
            </div>
          </div>
          
          <div className="detail-section">
            <h4>Amenities</h4>
            <div className="amenities-list">
              {neighborhood.amenities.map((amenity, index) => (
                <div key={index} className="amenity-tag">{amenity}</div>
              ))}
            </div>
          </div>
          
          {neighborhood.matchingFactors && (
            <div className="detail-section">
              <h4>Matching Factors</h4>
              <div className="factors-list">
                {neighborhood.matchingFactors.map((factor, index) => (
                  <div key={index} className="factor-tag">{factor}</div>
                ))}
              </div>
            </div>
          )}
          
          {neighborhood.nearbyHighlights && (
            <div className="detail-section">
              <h4>Nearby Highlights</h4>
              <div className="highlights-list">
                {neighborhood.nearbyHighlights.map((highlight, index) => (
                  <div key={index} className="highlight-item">{highlight}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NeighborhoodCard; 