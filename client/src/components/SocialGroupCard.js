import React from 'react';
import '../styles/components/SocialGroupCard.css';

const SocialGroupCard = ({ group }) => {
  const { 
    name, 
    description, 
    members,
    location,
    distance,
    interests,
    image
  } = group;

  return (
    <div className="social-group-card">
      <div className="group-image">
        <img src={image || 'https://via.placeholder.com/300x200'} alt={name} />
      </div>
      <div className="group-content">
        <h3>{name}</h3>
        <p className="group-description">{description}</p>
        
        <div className="group-details">
          <div className="detail">
            <span className="detail-label">Members:</span>
            <span className="detail-value">{members}</span>
          </div>
          {location && (
            <div className="detail">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{location}</span>
            </div>
          )}
          {distance && (
            <div className="detail">
              <span className="detail-label">Distance:</span>
              <span className="detail-value">{distance}</span>
            </div>
          )}
        </div>
        
        {interests && interests.length > 0 && (
          <div className="group-interests">
            <h4>Interests:</h4>
            <div className="interest-tags">
              {interests.map((interest, index) => (
                <span key={index} className="interest-tag">{interest}</span>
              ))}
            </div>
          </div>
        )}
        
        <div className="group-actions">
          <button className="join-group-btn">Join Group</button>
          <button className="save-group-btn">Save</button>
        </div>
      </div>
    </div>
  );
};

export default SocialGroupCard; 