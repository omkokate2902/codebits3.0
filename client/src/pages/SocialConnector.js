import React, { useState, useEffect, useContext, useCallback } from 'react';
import SocialGroupCard from '../components/SocialGroupCard';
import MapView from '../components/MapView';
import { AuthContext } from '../context/AuthContext';
import * as userStorage from '../utils/userStorage';
import '../styles/pages/SocialConnector.css';

const SocialConnector = () => {
  const { user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    interest: 'all',
    radius: 10
  });
  const [mapLocations, setMapLocations] = useState([]);
  const [location, setLocation] = useState({ lat: 37.7749, lng: -122.4194 });
  const [interests, setInterests] = useState(['Sports', 'Music', 'Art', 'Technology', 'Food', 'Travel']);
  const [userProfile, setUserProfile] = useState(null);
  const [compatibleUsers, setCompatibleUsers] = useState([]);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Sample data for groups
  const sampleGroups = [
    {
      id: 1,
      name: 'Tech Enthusiasts',
      description: 'A group for tech lovers to discuss the latest trends and innovations.',
      members: 128,
      location: 'San Francisco',
      distance: '1.2 miles',
      interests: ['Technology', 'Innovation', 'Coding'],
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      coordinates: { lat: 37.7833, lng: -122.4167 }
    },
    {
      id: 2,
      name: 'Foodies Club',
      description: 'Explore the best restaurants and food spots in the city.',
      members: 256,
      location: 'San Francisco',
      distance: '0.8 miles',
      interests: ['Food', 'Dining', 'Cooking'],
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      coordinates: { lat: 37.7937, lng: -122.4048 }
    },
    {
      id: 3,
      name: 'Outdoor Adventures',
      description: 'Join us for hiking, camping, and outdoor activities.',
      members: 189,
      location: 'San Francisco',
      distance: '2.5 miles',
      interests: ['Outdoors', 'Hiking', 'Adventure'],
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      coordinates: { lat: 37.7694, lng: -122.4862 }
    },
    {
      id: 4,
      name: 'Book Club',
      description: 'Monthly meetups to discuss interesting books and literature.',
      members: 76,
      location: 'San Francisco',
      distance: '1.5 miles',
      interests: ['Reading', 'Literature', 'Education'],
      image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      coordinates: { lat: 37.7583, lng: -122.4294 }
    }
  ];

  // Sample data for compatible users
  const sampleCompatibleUsers = [
    {
      id: 1,
      name: 'Alex Johnson',
      persona: 'active',
      compatibilityScore: 92,
      traits: ['Outdoor enthusiast', 'Early riser', 'Health-conscious'],
      preferences: {
        budget: '$1200-1500',
        location: 'Downtown',
        moveInDate: '2023-08-01'
      }
    },
    {
      id: 2,
      name: 'Jamie Smith',
      persona: 'social',
      compatibilityScore: 87,
      traits: ['Outgoing', 'Creative', 'Music lover'],
      preferences: {
        budget: '$1000-1300',
        location: 'Mission District',
        moveInDate: '2023-07-15'
      }
    },
    {
      id: 3,
      name: 'Taylor Wong',
      persona: 'balanced',
      compatibilityScore: 85,
      traits: ['Clean', 'Respectful', 'Professional'],
      preferences: {
        budget: '$1400-1800',
        location: 'Marina District',
        moveInDate: '2023-08-15'
      }
    }
  ];

  // Sample user profile data
  const sampleUserProfile = {
    userId: user?.uid || 'sample-user-id',
    name: user?.displayName || 'Sample User',
    email: user?.email || 'sample@example.com',
    persona: 'active',
    preferences: {
      userCategory: 'moderate',
      lifestylePreferences: ['activeLifestyle', 'outdoorActivities', 'quietness', 'cleanliness'],
      prioritizedMustHaves: [
        { name: 'parking', priority: 1 },
        { name: 'publicTransport', priority: 2 },
        { name: 'parks', priority: 3 }
      ]
    },
    analysisResults: {
      personality_traits: [
        'Active lifestyle enthusiast',
        'Early riser',
        'Organized',
        'Health-conscious',
        'Nature lover'
      ],
      lifestyle_indicators: [
        'Regular exercise routine',
        'Enjoys outdoor activities',
        'Prefers quiet environments',
        'Values cleanliness',
        'Environmentally conscious'
      ],
      frequent_locations: [
        'Gym',
        'Park',
        'Grocery Store',
        'Coffee Shop',
        'Hiking Trail'
      ]
    }
  };

  useEffect(() => {
    // Set sample data instead of fetching
    setGroups(sampleGroups);
    setCompatibleUsers(sampleCompatibleUsers);
    setUserProfile(sampleUserProfile);
    
    // Create map locations from sample groups
    const locations = sampleGroups.map(group => ({
      id: group.id,
      name: group.name,
      position: group.coordinates,
      type: 'group'
    }));
    setMapLocations(locations);
    
    // Comment out the actual API calls
    /*
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to San Francisco if location access is denied
          setLocation({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      // Default to San Francisco if geolocation is not supported
      setLocation({ lat: 37.7749, lng: -122.4194 });
    }

    // Fetch user interests if logged in
    if (user) {
      fetchUserInterests();
      fetchUserProfile();
    }
    */
  }, [user]);

  // Comment out the useEffect that depends on fetchSocialGroups
  /*
  useEffect(() => {
    if (location) {
      fetchSocialGroups();
    }
  }, [location, filters, fetchSocialGroups]);
  */

  // Commented out API functions
  /*
  const fetchUserInterests = useCallback(async () => {
    try {
      // API call to backend
      const response = await fetch('http://localhost:3000/user/interests', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user interests');
      }

      const data = await response.json();
      setInterests(data.interests);
    } catch (err) {
      console.error('Error fetching user interests:', err);
    }
  }, [user]);

  const fetchSocialGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // API call to backend
      const response = await fetch('http://localhost:3000/social/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user ? `Bearer ${user.token}` : ''
        },
        body: JSON.stringify({
          location,
          ...filters
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch social groups');
      }

      const data = await response.json();
      setGroups(data.groups);
      
      // Format data for map
      const locations = data.groups.map(group => ({
        id: group.id,
        name: group.name,
        position: group.coordinates,
        type: 'group'
      }));
      setMapLocations(locations);
      
    } catch (err) {
      console.error('Error fetching social groups:', err);
      setError('Failed to load social groups. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [location, filters, user]);

  // Fetch user profile data from local storage and send to backend
  const fetchUserProfile = useCallback(async () => {
    if (!user || !user.uid) return;
    
    try {
      // Get user data from local storage
      const userData = userStorage.getUserData(user.uid);
      const preferences = userStorage.getUserPreferences(user.uid);
      const analysisResults = userStorage.getUserAnalysis(user.uid);
      const persona = userStorage.getUserPersona(user.uid);
      
      if (!userData && !preferences && !analysisResults && !persona) {
        console.log('No user data found in local storage');
        return;
      }
      
      // Combine all user data
      const userProfileData = {
        userId: user.uid,
        name: user.displayName || 'Anonymous User',
        email: user.email,
        preferences: preferences || {},
        analysisResults: analysisResults || {},
        persona: persona || 'balanced',
        timestamp: new Date().toISOString()
      };
      
      setUserProfile(userProfileData);
      
      // Send user profile data to backend
      const response = await fetch('http://localhost:3000/social/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(userProfileData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send user profile data');
      }
      
      // Get compatible users from response
      const data = await response.json();
      if (data.compatibleUsers) {
        setCompatibleUsers(data.compatibleUsers);
        console.log('Compatible users:', data.compatibleUsers);
      }
    } catch (err) {
      console.error('Error sending user profile data:', err);
      setError('Failed to process user profile data');
    }
  }, [user]);
  */

  // Mock data for development
  const groupTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'social', label: 'Social' },
    { value: 'activity', label: 'Activity' },
    { value: 'professional', label: 'Professional' },
    { value: 'hobby', label: 'Hobbies' }
  ];

  // Render compatible users section
  const renderCompatibleUsers = () => {
    if (!compatibleUsers || compatibleUsers.length === 0) {
      return (
        <div className="no-matches">
          <h3>No compatible roommates found yet</h3>
          <p>We'll notify you when we find potential matches based on your preferences.</p>
        </div>
      );
    }
    
    return (
      <div className="compatible-users">
        <h3>Potential Roommate Matches</h3>
        <div className="users-grid">
          {compatibleUsers.map((compatibleUser, index) => (
            <div key={index} className="user-card">
              <div className="user-avatar" style={{ backgroundColor: getAvatarColor(compatibleUser.persona) }}>
                {compatibleUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <h4>{compatibleUser.name}</h4>
                <div className="user-persona">
                  <span className="persona-badge" style={{ backgroundColor: getPersonaColor(compatibleUser.persona) }}>
                    {compatibleUser.persona.charAt(0).toUpperCase() + compatibleUser.persona.slice(1)}
                  </span>
                </div>
                <div className="compatibility">
                  <div className="compatibility-bar">
                    <div 
                      className="compatibility-fill" 
                      style={{ width: `${compatibleUser.compatibilityScore}%` }}
                    ></div>
                  </div>
                  <span>{compatibleUser.compatibilityScore}% Match</span>
                </div>
                <div className="user-traits">
                  {compatibleUser.traits && compatibleUser.traits.slice(0, 3).map((trait, i) => (
                    <span key={i} className="trait-badge">{trait}</span>
                  ))}
                </div>
                <button className="connect-btn" onClick={() => alert(`Connect request sent to ${compatibleUser.name}`)}>
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper function to get avatar color based on persona
  const getAvatarColor = (persona) => {
    const colors = {
      'luxury': '#8e44ad',
      'active': '#27ae60',
      'social': '#e67e22',
      'budget': '#3498db',
      'family': '#e74c3c',
      'balanced': '#2c3e50'
    };
    return colors[persona] || colors.balanced;
  };

  // Helper function to get persona badge color
  const getPersonaColor = (persona) => {
    const colors = {
      'luxury': '#9b59b6',
      'active': '#2ecc71',
      'social': '#f39c12',
      'budget': '#3498db',
      'family': '#e74c3c',
      'balanced': '#34495e'
    };
    return colors[persona] || colors.balanced;
  };

  // Toggle user profile view
  const toggleUserProfile = () => {
    setShowUserProfile(!showUserProfile);
  };

  // Render user profile section
  const renderUserProfile = () => {
    if (!userProfile) return null;
    
    return (
      <div className={`user-profile-overlay ${showUserProfile ? 'active' : ''}`}>
        <div className="user-profile-container">
          <button className="close-profile" onClick={toggleUserProfile}>×</button>
          <h2>Your Profile</h2>
          
          <div className="profile-section">
            <h3>Personal Info</h3>
            <p><strong>Name:</strong> {userProfile.name}</p>
            <p><strong>Email:</strong> {userProfile.email}</p>
            <p><strong>Persona:</strong> 
              <span className="persona-badge" style={{ backgroundColor: getPersonaColor(userProfile.persona) }}>
                {userProfile.persona.charAt(0).toUpperCase() + userProfile.persona.slice(1)}
              </span>
            </p>
          </div>
          
          {userProfile.analysisResults && (
            <div className="profile-section">
              <h3>Personality Traits</h3>
              <div className="traits-list">
                {userProfile.analysisResults.personality_traits && 
                 userProfile.analysisResults.personality_traits.map((trait, index) => (
                  <span key={index} className="trait-badge">{trait}</span>
                ))}
              </div>
              
              <h3>Lifestyle Indicators</h3>
              <div className="traits-list">
                {userProfile.analysisResults.lifestyle_indicators && 
                 userProfile.analysisResults.lifestyle_indicators.map((indicator, index) => (
                  <span key={index} className="trait-badge">{indicator}</span>
                ))}
              </div>
            </div>
          )}
          
          {userProfile.preferences && (
            <div className="profile-section">
              <h3>Housing Preferences</h3>
              {userProfile.preferences.userCategory && (
                <p><strong>Budget Category:</strong> {userProfile.preferences.userCategory}</p>
              )}
              
              {userProfile.preferences.lifestylePreferences && userProfile.preferences.lifestylePreferences.length > 0 && (
                <div>
                  <h4>Lifestyle Preferences</h4>
                  <div className="traits-list">
                    {userProfile.preferences.lifestylePreferences.map((pref, index) => (
                      <span key={index} className="trait-badge">
                        {pref.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {userProfile.preferences.prioritizedMustHaves && userProfile.preferences.prioritizedMustHaves.length > 0 && (
                <div>
                  <h4>Must-Haves</h4>
                  <div className="traits-list">
                    {userProfile.preferences.prioritizedMustHaves.map((item, index) => (
                      <span key={index} className="trait-badge priority-badge">
                        {item.name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        <small> (Priority {item.priority})</small>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="social-connector-container">
      <div className="social-header">
        <h1>Connect with Roommates & Social Groups</h1>
        <p>Find roommates with similar interests and join local social groups in your area</p>
        
        {user && userProfile && (
          <button className="view-profile-btn" onClick={toggleUserProfile}>
            View Your Profile
          </button>
        )}
      </div>
      
      {/* Render user profile overlay */}
      {renderUserProfile()}
      
      <div className="social-content">
        <div className="social-sidebar">
          <div className="filter-section">
            <div className="filter-group">
              <label htmlFor="type">Group Type</label>
              <select 
                id="type" 
                name="type" 
                value={filters.type} 
                onChange={handleFilterChange}
              >
                {groupTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="interest">Interest</label>
              <select 
                id="interest" 
                name="interest" 
                value={filters.interest} 
                onChange={handleFilterChange}
              >
                <option value="all">All Interests</option>
                {interests.map(interest => (
                  <option key={interest} value={interest.toLowerCase()}>{interest}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="radius">Distance (miles)</label>
              <select 
                id="radius" 
                name="radius" 
                value={filters.radius} 
                onChange={handleFilterChange}
              >
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
              </select>
            </div>
          </div>
          
          {/* Render compatible users section */}
          {user && compatibleUsers && (
            <div className="compatible-users-section">
              {renderCompatibleUsers()}
            </div>
          )}
        </div>
        
        <div className="social-main">
          {loading ? (
            <div className="loading-indicator">
              <p>Finding social groups near you...</p>
              {/* Add a spinner component here */}
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => alert('Refreshing data...')}>Try Again</button>
            </div>
          ) : (
            <>
              <div className="map-section">
                <MapView 
                  locations={mapLocations} 
                  center={location}
                  zoom={11}
                />
              </div>
              
              <div className="groups-grid">
                {groups.length > 0 ? (
                  groups.map(group => (
                    <SocialGroupCard key={group.id} group={group} />
                  ))
                ) : (
                  <div className="no-results">
                    <p>No social groups found matching your criteria. Try adjusting your filters.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialConnector; 