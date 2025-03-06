import React from 'react';
import '../styles/components/SocialGroupCard.css';

const SocialGroupCard = ({ group }) => {
  const { 
    name, 
    type, 
    description, 
    memberCount, 
    image, 
    location,
    meetupFrequency,
    interests,
    link
  } = group;

  return (
    <div className="social-group-card">
      <div className="group-image">
        <img src={image} alt={name} />
      </div>
      <div className="group-content">
        <h3>{name}</h3>
        <p className="group-type">{type}</p>
        <p className="group-description">{description}</p>
        
        <div className="group-details">
          <div className="detail">
            <span className="detail-label">Members:</span>
            <span className="detail-value">{memberCount}</span>
          </div>
          {location && (
            <div className="detail">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{location}</span>
            </div>
          )}
          {meetupFrequency && (
            <div className="detail">
              <span className="detail-label">Meets:</span>
              <span className="detail-value">{meetupFrequency}</span>
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
          {link && (
            <a 
              href={link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="join-group-btn"
            >
              Join Group
            </a>
          )}
          <button className="save-group-btn">Save</button>
        </div>
      </div>
    </div>
  );
};

export default SocialGroupCard; 