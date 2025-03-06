import React, { useState, useEffect, useContext, useCallback } from 'react';
import SocialGroupCard from '../components/SocialGroupCard';
import MapView from '../components/MapView';
import { AuthContext } from '../context/AuthContext';
import '../styles/pages/SocialConnector.css';

const SocialConnector = () => {
  const { user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    interest: 'all',
    radius: 10
  });
  const [mapLocations, setMapLocations] = useState([]);
  const [location, setLocation] = useState(null);
  const [interests, setInterests] = useState([]);

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
    }
  }, [user, fetchUserInterests]);

  useEffect(() => {
    if (location) {
      fetchSocialGroups();
    }
  }, [location, filters, fetchSocialGroups]);

  const fetchUserInterests = useCallback(async () => {
    try {
      // API call to backend
      const response = await fetch('http://192.168.0.118:3000/user/interests', {
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
      const response = await fetch('http://192.168.0.118:3000/social/groups', {
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
      const locations = data.groups
        .filter(group => group.latitude && group.longitude)
        .map(group => ({
          name: group.name,
          description: `${group.name} - ${group.type}`,
          address: group.location,
          latitude: group.latitude,
          longitude: group.longitude
        }));
      
      setMapLocations(locations);
      
    } catch (err) {
      console.error('Error fetching social groups:', err);
      setError('Failed to fetch social groups. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [location, filters, user]);

  // Mock data for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && location) {
      // Simulate API response with mock data
      setTimeout(() => {
        const mockGroups = [
          {
            id: 1,
            name: 'SF Runners Club',
            type: 'Sports',
            description: 'Group for running enthusiasts of all levels in San Francisco.',
            memberCount: 1250,
            image: 'https://via.placeholder.com/300x200',
            location: 'Golden Gate Park, San Francisco, CA',
            meetupFrequency: 'Weekly',
            interests: ['Running', 'Fitness', 'Outdoors'],
            link: 'https://meetup.com/sfrunners',
            latitude: 37.7694,
            longitude: -122.4862
          },
          {
            id: 2,
            name: 'Bay Area Tech Meetup',
            type: 'Professional',
            description: 'Network with tech professionals and learn about the latest technologies.',
            memberCount: 3500,
            image: 'https://via.placeholder.com/300x200',
            location: 'SoMa, San Francisco, CA',
            meetupFrequency: 'Monthly',
            interests: ['Technology', 'Networking', 'Career'],
            link: 'https://meetup.com/bayareatech',
            latitude: 37.7790,
            longitude: -122.3970
          },
          {
            id: 3,
            name: 'SF Board Game Night',
            type: 'Social',
            description: 'Come play board games and meet new friends in a casual setting.',
            memberCount: 850,
            image: 'https://via.placeholder.com/300x200',
            location: 'Mission District, San Francisco, CA',
            meetupFrequency: 'Bi-weekly',
            interests: ['Board Games', 'Social', 'Entertainment'],
            link: 'https://meetup.com/sfboardgames',
            latitude: 37.7599,
            longitude: -122.4148
          },
          {
            id: 4,
            name: 'SF Foodies',
            type: 'Food & Drink',
            description: 'Explore San Francisco\'s diverse culinary scene with fellow food enthusiasts.',
            memberCount: 2100,
            image: 'https://via.placeholder.com/300x200',
            location: 'Various locations, San Francisco, CA',
            meetupFrequency: 'Weekly',
            interests: ['Food', 'Dining', 'Social'],
            link: 'https://meetup.com/sffoodies',
            latitude: 37.7749,
            longitude: -122.4194
          }
        ];
        
        setGroups(mockGroups);
        
        // Format data for map
        const locations = mockGroups
          .filter(group => group.latitude && group.longitude)
          .map(group => ({
            name: group.name,
            description: `${group.name} - ${group.type}`,
            address: group.location,
            latitude: group.latitude,
            longitude: group.longitude
          }));
        
        setMapLocations(locations);
        
        // Mock interests
        setInterests(['Running', 'Technology', 'Food', 'Music', 'Art', 'Books']);
        
        setLoading(false);
      }, 1500);
    }
  }, [location, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const groupTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'sports', label: 'Sports & Fitness' },
    { value: 'professional', label: 'Professional' },
    { value: 'social', label: 'Social' },
    { value: 'food', label: 'Food & Drink' },
    { value: 'arts', label: 'Arts & Culture' },
    { value: 'education', label: 'Education' },
    { value: 'hobby', label: 'Hobbies' }
  ];

  return (
    <div className="social-connector-page">
      <div className="page-header">
        <h1>Connect Socially</h1>
        <p>Find groups, events, and communities that match your interests in your new location.</p>
      </div>

      <div className="filters-section">
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

      {loading ? (
        <div className="loading-indicator">
          <p>Finding social groups near you...</p>
          {/* Add a spinner component here */}
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchSocialGroups}>Try Again</button>
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
  );
};

export default SocialConnector; 