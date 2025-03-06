import React from 'react';
import '../styles/components/NeighborhoodCard.css';

const NeighborhoodCard = ({ neighborhood }) => {
  const { 
    name, 
    city, 
    state, 
    averageRent, 
    safetyScore, 
    walkabilityScore, 
    image, 
    description,
    amenities 
  } = neighborhood;

  return (
    <div className="neighborhood-card">
      <div className="neighborhood-image">
        <img src={image} alt={name} />
      </div>
      <div className="neighborhood-content">
        <h3>{name}</h3>
        <p className="neighborhood-location">{city}, {state}</p>
        <p className="neighborhood-description">{description}</p>
        
        <div className="neighborhood-stats">
          <div className="stat">
            <span className="stat-label">Avg. Rent:</span>
            <span className="stat-value">${averageRent}/mo</span>
          </div>
          <div className="stat">
            <span className="stat-label">Safety:</span>
            <span className="stat-value">{safetyScore}/10</span>
          </div>
          <div className="stat">
            <span className="stat-label">Walkability:</span>
            <span className="stat-value">{walkabilityScore}/10</span>
          </div>
        </div>
        
        <div className="neighborhood-amenities">
          <h4>Nearby Amenities:</h4>
          <ul>
            {amenities.map((amenity, index) => (
              <li key={index}>{amenity}</li>
            ))}
          </ul>
        </div>
        
        <button className="view-details-btn">View Details</button>
      </div>
    </div>
  );
};

export default NeighborhoodCard; 