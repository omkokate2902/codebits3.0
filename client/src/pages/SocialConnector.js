import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import * as userStorage from '../utils/userStorage';
import { generateSocialEvents } from '../utils/geminiApi';
import '../styles/pages/SocialConnector.css';

const SocialConnector = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    date: 'all'
  });
  const [location, setLocation] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  const [userAnalysis, setUserAnalysis] = useState(null);
  const [userPersona, setUserPersona] = useState(null);
  const [isPersonalized, setIsPersonalized] = useState(false);

  // Define fetchEvents before any useEffect that depends on it
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user data from local storage if available
      let userData = {};
      let hasPersonalization = false;
      
      if (user && user.uid) {
        const preferences = userPreferences || userStorage.getUserPreferences(user.uid);
        const analysisResults = userAnalysis || userStorage.getUserAnalysis(user.uid);
        const persona = userPersona || userStorage.getUserPersona(user.uid);
        
        // Save to state for future use
        if (preferences && !userPreferences) setUserPreferences(preferences);
        if (analysisResults && !userAnalysis) setUserAnalysis(analysisResults);
        if (persona && !userPersona) setUserPersona(persona);
        
        // Check if we have data for personalization
        hasPersonalization = !!(
          (preferences && preferences.lifestylePreferences && preferences.lifestylePreferences.length > 0) ||
          (analysisResults && analysisResults.lifestyle_indicators && analysisResults.lifestyle_indicators.length > 0) ||
          persona
        );
        
        // Prepare user data for API request
        userData = {
          userId: user.uid,
          preferences: preferences || {},
          analysisResults: analysisResults || {},
          persona: persona || 'balanced'
        };
        
        console.log('User data for event personalization:', userData);
      }
      
      // Use Gemini API to generate social events instead of calling the backend
      console.log('Generating social events using Gemini API...');
      const eventsData = await generateSocialEvents();
      console.log('Events received from Gemini API:', eventsData);
      
      // Filter events based on user preferences if available
      let filteredEvents = [...eventsData];
      
      if (userData.preferences && userData.preferences.lifestylePreferences) {
        // Map lifestyle preferences to event categories
        const lifestyleToCategory = {
          'activeLifestyle': ['Sports', 'Fitness'],
          'outdoorActivities': ['Hiking', 'Adventure'],
          'shopping': ['Shopping', 'Market'],
          'casualDining': ['Food Festival', 'Street Food'],
          'fineDining': ['Fine Dining', 'Gourmet'],
          'nightlife': ['Party', 'Nightlife'],
          'cultural': ['Cultural', 'Festival'],
          'artsAndMusic': ['Concert', 'Art', 'Exhibition'],
          'familyFriendly': ['Family', 'Kids'],
          'quiet': ['Workshop', 'Seminar'],
          'community': ['Community', 'Meetup'],
          'socialGatherings': ['Social', 'Networking']
        };
        
        // Get relevant categories based on user preferences
        const relevantCategories = [];
        userData.preferences.lifestylePreferences.forEach(pref => {
          if (lifestyleToCategory[pref]) {
            relevantCategories.push(...lifestyleToCategory[pref]);
          }
        });
        
        // If we have relevant categories, boost events that match
        if (relevantCategories.length > 0) {
          // Sort events to prioritize those matching user preferences
          filteredEvents.sort((a, b) => {
            const aMatches = relevantCategories.some(cat => 
              a.category.toLowerCase().includes(cat.toLowerCase())
            );
            const bMatches = relevantCategories.some(cat => 
              b.category.toLowerCase().includes(cat.toLowerCase())
            );
            
            if (aMatches && !bMatches) return -1;
            if (!aMatches && bMatches) return 1;
            return 0;
          });
        }
      }
      
      // Apply filters from UI
      if (filters.category !== 'all') {
        filteredEvents = filteredEvents.filter(event => 
          event.category.toLowerCase() === filters.category.toLowerCase()
        );
      }
      
      if (filters.date !== 'all') {
        const filterMonth = new Date(filters.date).getMonth();
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getMonth() === filterMonth;
        });
      }
      
      // Set the filtered events
      setEvents(filteredEvents);
      
      // Update personalization state
      setIsPersonalized(hasPersonalization);
      
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, location, filters, userPreferences, userAnalysis, userPersona]);

  // Get user's location when component mounts
  useEffect(() => {
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
          // Default to a central location if location access is denied
          setLocation({ lat: 18.5204, lng: 73.8567 }); // Pune coordinates
        }
      );
    } else {
      // Default to a central location if geolocation is not supported
      setLocation({ lat: 18.5204, lng: 73.8567 }); // Pune coordinates
    }
  }, []);

  // Fetch events when component mounts or location changes
  useEffect(() => {
    if (location) {
      fetchEvents();
    }
  }, [location, fetchEvents]);

  useEffect(() => {
    // If user is logged in, fetch user profile
    if (user && user.uid) {
      fetchUserProfile(user.uid);
    }
  }, [user]);

  const fetchUserProfile = async (userId) => {
    try {
      // Get user data from local storage
      const userData = userStorage.getUserData(userId);
      const preferences = userStorage.getUserPreferences(userId);
      const analysisResults = userStorage.getUserAnalysis(userId);
      const persona = userStorage.getUserPersona(userId);
      
      // Save to state for future use
      if (preferences) setUserPreferences(preferences);
      if (analysisResults) setUserAnalysis(analysisResults);
      if (persona) setUserPersona(persona);
      
      if (!userData && !preferences && !analysisResults && !persona) {
        console.log('No user data found in local storage');
        return;
      }
      
      // Combine all user data
      const userProfileData = {
        userId: userId,
        name: user.displayName || 'Anonymous User',
        email: user.email,
        preferences: preferences || {},
        analysisResults: analysisResults || {},
        persona: persona || 'balanced',
        timestamp: new Date().toISOString()
      };
      
      setUserProfile(userProfileData);
      
      // In a real app, you would send this to your backend
      const response = await fetch('http://localhost:3000/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(userProfileData)
      });
      
      // After fetching user profile, refresh events with the user data
      fetchEvents();
      
    } catch (err) {
      console.error('Error processing user profile data:', err);
    }
  };

  // Get unique categories from events
  const getCategories = () => {
    const categories = events.map(event => event.category);
    return ['all', ...new Set(categories)];
  };

  // Get unique months from events
  const getMonths = () => {
    const months = events.map(event => {
      const date = new Date(event.date);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    });
    return ['all', ...new Set(months)];
  };

  // Filter events based on selected filters
  const getFilteredEvents = () => {
    return events.filter(event => {
      // Filter by category
      if (filters.category !== 'all' && event.category !== filters.category) {
        return false;
      }
      
      // Filter by date
      if (filters.date !== 'all') {
        const eventDate = new Date(event.date);
        const eventMonth = eventDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (eventMonth !== filters.date) {
          return false;
        }
      }
      
      return true;
    });
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

  // Get category color for styling
  const getCategoryColor = (category) => {
    const colors = {
      'Concert': '#9b59b6',
      'Meetup': '#2ecc71',
      'Party': '#f39c12',
      'Festival': '#e74c3c',
      'Open Mic': '#3498db',
      'Tech Gathering': '#1abc9c'
    };
    return colors[category] || '#34495e';
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Render events grid
  const renderEvents = () => {
    if (loading) {
      return (
        <div className="loading-indicator">
          <p>Finding events near you...</p>
          <div className="spinner"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchEvents}>Try Again</button>
        </div>
      );
    }
    
    return (
      <div className="events-grid">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event, index) => (
            <div key={index} className="event-card">
              <div className="event-category" style={{ backgroundColor: getCategoryColor(event.category) }}>
                {event.category}
              </div>
              <div className="event-content">
                <h3 className="event-name">{event.name}</h3>
                <div className="event-date">
                  <i className="event-icon">📅</i>
                  {formatDate(event.date)}
                </div>
                <div className="event-location">
                  <i className="event-icon">📍</i>
                  {event.location}
                </div>
                <div className="event-price">
                  <i className="event-icon">💰</i>
                  {event.ticket_details.price}
                </div>
                <div className="event-actions">
                  <a 
                    href={event.ticket_details.booking_link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="book-btn"
                  >
                    Book Tickets
                  </a>
                  <button className="save-btn">Save</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No events found matching your criteria. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    );
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div className="social-connector-container">
      <div className="social-header">
        <h1>Discover Events Near You</h1>
        <p>Find and join exciting events happening in your area</p>
        
        <div className="header-actions">
          {isPersonalized && (
            <div className="personalization-badge">
              <span className="personalization-icon">✨</span>
              <span className="personalization-text">Personalized for you</span>
            </div>
          )}
          
          {user && userProfile && (
            <button className="view-profile-btn" onClick={toggleUserProfile}>
              View Your Profile
            </button>
          )}
        </div>
      </div>

      {/* Render user profile overlay */}
      {renderUserProfile()}
      
      <div className="social-content">
        <div className="social-sidebar">
          <div className="filter-section">
        <div className="filter-group">
              <label htmlFor="category">Event Category</label>
          <select 
                id="category" 
                name="category" 
                value={filters.category} 
            onChange={handleFilterChange}
          >
                {getCategories().map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
              <label htmlFor="date">Event Month</label>
          <select 
                id="date" 
                name="date" 
                value={filters.date} 
            onChange={handleFilterChange}
          >
                {getMonths().map(month => (
                  <option key={month} value={month}>
                    {month === 'all' ? 'All Months' : month}
                  </option>
            ))}
          </select>
        </div>
          </div>
          
          <div className="events-summary">
            <h3>Upcoming Events</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value">{events.length}</span>
                <span className="stat-label">Total Events</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{getCategories().length - 1}</span>
                <span className="stat-label">Categories</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{getMonths().length - 1}</span>
                <span className="stat-label">Months</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="social-main">
          {renderEvents()}
        </div>
      </div>
    </div>
  );
};

export default SocialConnector; 