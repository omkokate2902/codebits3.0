import React from 'react';
import '../styles/components/PlaceCard.css';

const PlaceCard = ({ place }) => {
  // Extract properties from place with defaults to prevent errors
  const {
    name = 'Unknown Place',
    address = 'No address available',
    category = 'general',
    priceLevel = 0,
    rating = 0,
    distance = 0,
    description = 'No description available',
    imageUrl = '',
    website = '',
    isPriority = false
  } = place;

  // Format price level to rupee signs
  const getPriceLevel = (level) => {
    if (level === 0) return 'Free';
    return '₹'.repeat(level);
  };

  // Get icon based on category
  const getCategoryIcon = (category) => {
    const icons = {
      restaurant: '🍽️',
      cafe: '☕',
      gym: '💪',
      park: '🌳',
      shopping_mall: '🛍️',
      entertainment: '🎭',
      grocery_store: '🛒',
      hospital: '🏥',
      school: '🏫',
      bar: '🍸'
    };
    return icons[category] || '📍';
  };

  // Format distance
  const formatDistance = (distance) => {
    const dist = parseFloat(distance);
    if (isNaN(dist)) return 'Unknown distance';
    if (dist < 1) return `${Math.round(dist * 1000)} m`;
    return `${dist.toFixed(1)} km`;
  };

  // Format rating
  const formatRating = (rating) => {
    if (!rating) return 'No rating';
    const formattedRating = parseFloat(rating).toFixed(1);
    return formattedRating;
  };

  // Format category name for display
  const formatCategory = (category) => {
    if (!category) return 'General';
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="place-card">
      <div className="place-image-container">
        <img 
          src={imageUrl || `https://source.unsplash.com/400x300/?${category}`} 
          alt={name} 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://source.unsplash.com/400x300/?${category}`;
          }}
        />
        <div className="category-badge">
          <span className="category-icon">{getCategoryIcon(category)}</span>
          <span className="category-name">{formatCategory(category)}</span>
        </div>
        {isPriority && <div className="priority-badge">Priority</div>}
      </div>
      
      <div className="place-content">
        <div className="place-header">
          <h3>{name}</h3>
          <div className="rating-display">
            <span className="rating-number">{formatRating(rating)} ⭐</span>
          </div>
        </div>
        
        <p className="place-address">{address}</p>
        
        <div className="place-meta">
          <div className="meta-item">
            <span className="meta-icon">📏</span>
            {formatDistance(distance)}
          </div>
          {priceLevel > 0 && (
            <div className="meta-item">
              <span className="meta-icon">💰</span>
              {getPriceLevel(priceLevel)}
            </div>
          )}
        </div>
        
        <p className="place-description">{description}</p>
        
        <div className="place-actions">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="directions-btn"
          >
            Directions
          </a>
          
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="website-btn"
            >
              Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceCard; 