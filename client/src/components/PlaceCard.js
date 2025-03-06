import React from 'react';
import '../styles/components/PlaceCard.css';

const PlaceCard = ({ place }) => {
  const { 
    name, 
    type, 
    address, 
    rating, 
    image, 
    description,
    distance,
    priceLevel,
    openNow,
    website
  } = place;

  // Convert price level to dollar signs
  const getPriceLevel = (level) => {
    return level ? '$'.repeat(level) : 'N/A';
  };

  return (
    <div className="place-card">
      <div className="place-image">
        <img src={image} alt={name} />
        {openNow && <span className="open-badge">Open Now</span>}
      </div>
      <div className="place-content">
        <h3>{name}</h3>
        <p className="place-type">{type}</p>
        <p className="place-address">{address}</p>
        <p className="place-description">{description}</p>
        
        <div className="place-stats">
          <div className="stat">
            <span className="stat-label">Rating:</span>
            <span className="stat-value">{rating}/5</span>
          </div>
          <div className="stat">
            <span className="stat-label">Price:</span>
            <span className="stat-value">{getPriceLevel(priceLevel)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Distance:</span>
            <span className="stat-value">{distance} mi</span>
          </div>
        </div>
        
        <div className="place-actions">
          <a href={`https://maps.google.com/?q=${address}`} target="_blank" rel="noopener noreferrer" className="directions-btn">Get Directions</a>
          {website && <a href={website} target="_blank" rel="noopener noreferrer" className="website-btn">Visit Website</a>}
        </div>
      </div>
    </div>
  );
};

export default PlaceCard; 