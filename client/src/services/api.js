import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }
  return response.json();
};

// Create headers with authentication token if available
const createHeaders = (token, contentType = 'application/json') => {
  const headers = {
    'Content-Type': contentType,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Get the authentication token from localStorage
const getToken = () => {
  return localStorage.getItem('authToken');
};

// API service object
const api = {
  // Auth endpoints
  auth: {
    verifyToken: (idToken) => {
      return fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }).then(handleResponse);
    }
  },
  
  // Neighborhood endpoints
  neighborhoods: {
    search: (preferences, token) => {
      return fetch(`${API_BASE_URL}/neighborhoods/search`, {
        method: 'POST',
        headers: createHeaders(token),
        body: JSON.stringify(preferences),
      }).then(handleResponse);
    },
    
    getDetails: (neighborhoodId, token) => {
      return fetch(`${API_BASE_URL}/neighborhoods/${neighborhoodId}`, {
        headers: createHeaders(token),
      }).then(handleResponse);
    }
  },
  
  // Places endpoints
  places: {
    getRecommendations: (params, token) => {
      return fetch(`${API_BASE_URL}/places/recommendations`, {
        method: 'POST',
        headers: createHeaders(token),
        body: JSON.stringify(params),
      }).then(handleResponse);
    },
    
    getDetails: (placeId, token) => {
      return fetch(`${API_BASE_URL}/places/${placeId}`, {
        headers: createHeaders(token),
      }).then(handleResponse);
    }
  },
  
  // Bot endpoints
  bot: {
    sendMessage: (message, token) => {
      return fetch(`${API_BASE_URL}/bot/message`, {
        method: 'POST',
        headers: createHeaders(token),
        body: JSON.stringify({ message }),
      }).then(handleResponse);
    }
  },
  
  // Social endpoints
  social: {
    getGroups: (params, token) => {
      return fetch(`${API_BASE_URL}/social/groups`, {
        method: 'POST',
        headers: createHeaders(token),
        body: JSON.stringify(params),
      }).then(handleResponse);
    },
    
    getGroupDetails: (groupId, token) => {
      return fetch(`${API_BASE_URL}/social/groups/${groupId}`, {
        headers: createHeaders(token),
      }).then(handleResponse);
    }
  },
  
  // User endpoints
  user: {
    getProfile: (token) => {
      return fetch(`${API_BASE_URL}/user/profile`, {
        headers: createHeaders(token),
      }).then(handleResponse);
    },
    
    updateProfile: (profileData, token) => {
      return fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: createHeaders(token),
        body: JSON.stringify(profileData),
      }).then(handleResponse);
    },
    
    getInterests: (token) => {
      return fetch(`${API_BASE_URL}/user/interests`, {
        headers: createHeaders(token),
      }).then(handleResponse);
    },
    
    updateInterests: (interests, token) => {
      return fetch(`${API_BASE_URL}/user/interests`, {
        method: 'PUT',
        headers: createHeaders(token),
        body: JSON.stringify({ interests }),
      }).then(handleResponse);
    }
  }
};

export default api;

export const savePreferences = async (preferences) => {
  try {
    // Format the data for the API
    const formattedData = {
      userCategory: preferences.userCategory,
      commute: preferences.commute,
      lifestylePreferences: Object.keys(preferences.lifestylePreferences)
        .filter(key => preferences.lifestylePreferences[key]),
      customLifestyles: preferences.customLifestyles || [],
      prioritizedMustHaves: preferences.prioritizedMustHaves || 
        Object.entries(preferences.mustHaves)
          .map(([name, priority]) => ({ name, priority }))
          .sort((a, b) => a.priority - b.priority)
    };

    console.log('Sending preferences to API:', formattedData);
    
    const response = await axios.post(`${API_BASE_URL}/api/housing/recommend-housing`, formattedData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error saving preferences:', error);
    throw error;
  }
};

export const getHousingRecommendations = async (preferences) => {
  try {
    console.log('Getting housing recommendations for preferences:', preferences);
    
    const response = await axios.post(`${API_BASE_URL}/api/housing/recommend-housing`, 
      { preferences },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        withCredentials: true
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting housing recommendations:', error);
    throw error;
  }
}; 