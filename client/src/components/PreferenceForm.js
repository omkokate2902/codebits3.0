import React, { useState, useRef, useEffect } from 'react';
import { API } from '../utils/api';
import '../styles/components/PreferenceForm.css';
import { savePreferences, getHousingRecommendations } from '../services/api';

const PreferenceForm = ({ onSubmit, onTimelineData }) => {
  const fileInputRef = useRef(null);
  const mapRef = useRef(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [addressMarker, setAddressMarker] = useState(null);
  const [commuteCircle, setCommuteCircle] = useState(null);
  const [geocoder, setGeocoder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState({
    userCategory: 'moderate', // default category
    commute: {
      workAddress: '',
      travelMode: 'driving', // default active travel mode for UI
      coordinates: null, // will store lat/lng of the address
      travelModes: {
        walking: { enabled: false, distance: 5 },
        bicycling: { enabled: false, distance: 10 },
        transit: { enabled: false, distance: 15 },
        driving: { enabled: true, distance: 20 }
      }
    },
    // Store lifestyle preferences as an array of selected items
    lifestylePreferences: [],
    // Store must-haves with priority (1 being highest)
    mustHaves: {},
    // Store custom lifestyle preferences
    customLifestyles: []
  });

  // State for new custom lifestyle
  const [newLifestyle, setNewLifestyle] = useState('');

  // State for drag and drop
  const [draggedItem, setDraggedItem] = useState(null);
  const [priorityItems, setPriorityItems] = useState([]);
  const [prioritizedMustHaves, setPrioritizedMustHaves] = useState([]);
  
  const travelModes = [
    { id: 'walking', label: 'Walking', icon: '🚶', maxDistance: 10 },
    { id: 'bicycling', label: 'Bicycling', icon: '🚲', maxDistance: 20 },
    { id: 'transit', label: 'Public Transit', icon: '🚌', maxDistance: 30 },
    { id: 'driving', label: 'Driving', icon: '🚗', maxDistance: 50 }
  ];

  const userCategories = [
    {
      id: 'budget',
      name: 'Budget Explorer',
      icon: '💰',
      description: 'Thrifty and cost-conscious',
      priceRange: '₹10,000 - ₹20,000/month',
      color: '#4cb963'
    },
    {
      id: 'moderate',
      name: 'Balanced Dweller',
      icon: '⚖️',
      description: 'Moderate spending habits',
      priceRange: '₹20,000 - ₹40,000/month',
      color: '#4a6fa5'
    },
    {
      id: 'comfort',
      name: 'Comfort Seeker',
      icon: '🛋️',
      description: 'Values comfort and convenience',
      priceRange: '₹40,000 - ₹60,000/month',
      color: '#f4a261'
    },
    {
      id: 'premium',
      name: 'Premium Lifestyle',
      icon: '✨',
      description: 'Enjoys premium amenities',
      priceRange: '₹60,000 - ₹80,000/month',
      color: '#e76f51'
    },
    {
      id: 'luxury',
      name: 'Luxury Connoisseur',
      icon: '👑',
      description: 'Seeks the finest experiences',
      priceRange: '₹80,000+/month',
      color: '#9c6644'
    }
  ];

  // Initialize Google Maps
  useEffect(() => {
    // Load Google Maps API script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      // Clean up
      if (addressMarker) {
        addressMarker.setMap(null);
      }
      if (commuteCircle) {
        commuteCircle.setMap(null);
      }
    };
  }, []);

  // Initialize map
  const initializeMap = () => {
    if (!mapRef.current) return;

    // Default to Bangalore, India
    const defaultLocation = { lat: 12.9716, lng: 77.5946 };
    
    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultLocation,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true
    });

    setMapInstance(map);
    setGeocoder(new window.google.maps.Geocoder());
  };

  // Update map when address or commute preferences change
  useEffect(() => {
    if (!mapInstance || !geocoder) return;

    const { workAddress, travelMode } = preferences.commute;
    
    if (workAddress.trim()) {
      geocodeAddress(workAddress);
    }
  }, [mapInstance, geocoder, preferences.commute.workAddress, preferences.commute.travelMode]);

  // Geocode address and update map
  const geocodeAddress = (address) => {
    if (!geocoder) return;

    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        
        // Update preferences with coordinates
        setPreferences(prev => ({
          ...prev,
          commute: {
            ...prev.commute,
            coordinates: {
              lat: location.lat(),
              lng: location.lng()
            }
          }
        }));

        // Update map center
        mapInstance.setCenter(location);
        
        // Update marker
        if (addressMarker) {
          addressMarker.setMap(null);
        }
        
        const marker = new window.google.maps.Marker({
          map: mapInstance,
          position: location,
          title: address,
          animation: window.google.maps.Animation.DROP
        });
        
        setAddressMarker(marker);
        
        // Draw commute circle
        updateCommuteCircle(location);
      }
    });
  };

  // Update commute circle on map
  const updateCommuteCircle = (center) => {
    if (!mapInstance) return;
    
    // Remove existing circles
    if (commuteCircle) {
      // If it's an array, clear all circles
      if (Array.isArray(commuteCircle)) {
        commuteCircle.forEach(circle => circle.setMap(null));
      } else {
        // If it's a single circle, clear it
        commuteCircle.setMap(null);
      }
    }
    
    // Create new circles for each enabled travel mode
    const circles = [];
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(center);
    
    // Get all enabled travel modes
    Object.entries(preferences.commute.travelModes).forEach(([modeId, modeData]) => {
      if (modeData.enabled) {
        // Get color based on travel mode
        const circleColor = getTravelModeColor(modeId);
        
        // Create new circle
        const circle = new window.google.maps.Circle({
          map: mapInstance,
          center: center,
          radius: modeData.distance * 1000, // convert km to meters
          strokeColor: circleColor,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: circleColor,
          fillOpacity: 0.1
        });
        
        circles.push(circle);
        
        // Extend bounds to include this circle
        const circleBounds = circle.getBounds();
        if (circleBounds) {
          bounds.union(circleBounds);
        }
      }
    });
    
    // Store all circles
    setCommuteCircle(circles);
    
    // Adjust map zoom to fit all circles
    if (circles.length > 0) {
      mapInstance.fitBounds(bounds);
    }
  };

  // Get color for travel mode
  const getTravelModeColor = (mode) => {
    const colors = {
      walking: '#4cb963', // green
      bicycling: '#f4a261', // orange
      transit: '#4a6fa5', // blue
      driving: '#e76f51' // red
    };
    
    return colors[mode] || '#4a6fa5';
  };

  const handleInputChange = (category, field, value) => {
    setPreferences({
      ...preferences,
      [category]: {
        ...preferences[category],
        [field]: value
      }
    });
  };

  const handleCheckboxChange = (category, item) => {
    if (category === 'lifestylePreferences') {
      setPreferences(prev => {
        // If item is already in the array, remove it, otherwise add it
        const newPreferences = prev.lifestylePreferences.includes(item)
          ? prev.lifestylePreferences.filter(i => i !== item)
          : [...prev.lifestylePreferences, item];
          
        return {
          ...prev,
          lifestylePreferences: newPreferences
        };
      });
    } else if (category === 'mustHaves') {
      setPreferences(prev => {
        // Toggle the must-have item
        const newMustHaves = { ...prev.mustHaves };
        
        if (newMustHaves[item]) {
          // If it already exists, remove it
          delete newMustHaves[item];
        } else {
          // Add it with the next priority number
          const nextPriority = Object.keys(newMustHaves).length + 1;
          newMustHaves[item] = nextPriority;
        }
        
        return {
          ...prev,
          mustHaves: newMustHaves
        };
      });
    }
  };

  const handleCategorySelect = (categoryId) => {
    setPreferences({
      ...preferences,
      userCategory: categoryId
    });
  };

  const handleTravelModeSelect = (modeId) => {
    // Get the selected travel mode
    const selectedMode = travelModes.find(mode => mode.id === modeId);
    
    // Update preferences with new travel mode
    setPreferences(prev => {
      // Toggle the enabled state for this travel mode
      const isCurrentlyEnabled = prev.commute.travelModes[modeId].enabled;
      
      return {
        ...prev,
        commute: {
          ...prev.commute,
          // Set this as the active travel mode for UI
          travelMode: modeId,
          travelModes: {
            ...prev.commute.travelModes,
            [modeId]: {
              ...prev.commute.travelModes[modeId],
              enabled: !isCurrentlyEnabled,
              // If enabling, ensure distance is within limits
              distance: !isCurrentlyEnabled 
                ? Math.min(prev.commute.travelModes[modeId].distance, selectedMode.maxDistance)
                : prev.commute.travelModes[modeId].distance
            }
          }
        }
      };
    });
    
    // If coordinates exist, update the circle on the map
    if (preferences.commute.coordinates) {
      updateCommuteCircle(preferences.commute.coordinates);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.json')) {
        setSelectedFile(file);
        setUploadStatus('ready');
      } else {
        setUploadStatus('error');
        setSelectedFile(null);
        alert('Please select a valid JSON file from Google Takeout');
      }
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('error');
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      console.log('Uploading file:', selectedFile.name);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);
      
      // Use our API utility to upload the file
      const response = await API.user.uploadFile(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
      console.log('Upload successful:', response);
      
      // If the server returns timeline data, pass it to the parent component
      if (response.data && onTimelineData) {
        onTimelineData(response.data);
      }
      
      // If the server suggests a user category, update it
      if (response.suggestedCategory) {
        setPreferences(prev => ({
          ...prev,
          userCategory: response.suggestedCategory
        }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      
      // Show a more specific error message
      if (error.message) {
        alert(`Upload failed: ${error.message}`);
      } else {
        alert('Upload failed. Please try again.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Count selected lifestyle preferences
      const lifestyleCount = Object.values(preferences.lifestylePreferences)
        .filter(Boolean).length + (preferences.customLifestyles?.length || 0);
      
      // Validate at least 3 lifestyle preferences are selected
      if (lifestyleCount < 3) {
        setError('Please select at least 3 lifestyle preferences');
        setLoading(false);
        return;
      }
      
      // Format must-haves with priorities
      const finalPreferences = {
        ...preferences,
        prioritizedMustHaves: prioritizedMustHaves.map((item, index) => ({
          name: item,
          priority: index + 1
        }))
      };
      
      console.log('Submitting preferences:', finalPreferences);
      
      // Save preferences to backend
      const saveResponse = await savePreferences(finalPreferences);
      console.log('Preferences saved:', saveResponse);
      
      // Get housing recommendations
      const recommendationsResponse = await getHousingRecommendations(finalPreferences);
      console.log('Recommendations received:', recommendationsResponse);
      
      if (recommendationsResponse.success) {
        // Pass both preferences and recommendations to the parent component
        onSubmit({
          preferences: finalPreferences,
          recommendations: recommendationsResponse.recommendations
        });
      } else {
        throw new Error(recommendationsResponse.error || 'Failed to get recommendations');
      }
    } catch (error) {
      console.error('Error during form submission:', error);
      setError(error.message || 'An error occurred while processing your request');
    } finally {
      setLoading(false);
    }
  };

  // Get the current travel mode object
  const currentTravelMode = travelModes.find(mode => mode.id === preferences.commute.travelMode) || travelModes[3];

  // Function to add a new custom lifestyle
  const addCustomLifestyle = () => {
    if (!newLifestyle.trim()) return;
    
    // Check if this lifestyle already exists in the default ones
    if (Object.keys(preferences.lifestylePreferences).includes(newLifestyle.toLowerCase().replace(/\s+/g, ''))) {
      alert('This lifestyle preference already exists!');
      return;
    }
    
    // Check if it already exists in custom lifestyles
    if (preferences.customLifestyles.some(item => 
      item.name.toLowerCase() === newLifestyle.toLowerCase())) {
      alert('This lifestyle preference already exists!');
      return;
    }
    
    // Add the new custom lifestyle
    setPreferences(prev => ({
      ...prev,
      customLifestyles: [
        ...prev.customLifestyles,
        { name: newLifestyle, value: true }
      ]
    }));
    
    // Clear the input
    setNewLifestyle('');
  };

  // Function to handle custom lifestyle checkbox change
  const handleCustomLifestyleChange = (index) => {
    setPreferences(prev => ({
      ...prev,
      customLifestyles: prev.customLifestyles.map((item, i) => 
        i === index ? { ...item, value: !item.value } : item
      )
    }));
  };

  // Function to remove a custom lifestyle
  const removeCustomLifestyle = (index) => {
    setPreferences(prev => ({
      ...prev,
      customLifestyles: prev.customLifestyles.filter((_, i) => i !== index)
    }));
  };

  // Function to validate the JSON data format
  const validateDataFormat = (data) => {
    // Check if the data has the required structure
    if (!data.userCategory) {
      console.warn('Missing userCategory in preferences data');
    }
    
    if (!data.commute || !data.commute.travelModes) {
      console.warn('Missing commute data or travel modes in preferences data');
    }
    
    // Count selected lifestyle preferences
    const lifestyleCount = data.lifestylePreferences.length;
    const mustHavesCount = Object.keys(data.mustHaves).length;
    const customCount = (data.customLifestyles || []).filter(item => item.value).length;
    
    console.log(`Selected preferences: ${lifestyleCount} lifestyle, ${mustHavesCount} must-haves, ${customCount} custom`);
    
    if (lifestyleCount + mustHavesCount + customCount < 3) {
      console.warn('Less than 3 lifestyle preferences selected');
    }
    
    // Check if prioritizedMustHaves is properly formatted
    if (data.prioritizedMustHaves) {
      console.log('Prioritized must-haves:', data.prioritizedMustHaves);
      
      // Check if priorities are sequential
      const priorities = data.prioritizedMustHaves.map(item => item.priority);
      const isSequential = priorities.every((p, i) => p === i + 1);
      
      if (!isSequential) {
        console.warn('Priorities are not sequential');
      }
    }
    
    // Check if the format matches the expected format
    const expectedFormat = {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      method: "POST",
      body: JSON.stringify({ preferences: data })
    };
    
    return expectedFormat;
  };

  // All available lifestyle options
  const lifestyleOptions = [
    'accessibility', 'activeLifestyle', 'affordability', 'amenities', 
    'artsAndMusic', 'casual', 'casualDining', 'cleanliness', 
    'community', 'convenient', 'cultural', 'entertainment', 
    'familyFriendly', 'fineDining', 'greenSpaces', 'healthy', 
    'internationalCuisine', 'nightlife', 'outdoorActivities', 
    'quiet', 'quietness', 'relaxing', 'safety', 'shopping', 
    'socialGatherings'
  ];

  // Must-have options
  const mustHaveOptions = [
    'parking', 'publicTransport', 'parks', 'schools', 'groceryStores', 'gym'
  ];

  // Function to get the priority label
  const getPriorityLabel = (item) => {
    const priority = preferences.mustHaves[item];
    if (!priority) return '';
    return `Priority ${priority}`;
  };

  // Effect to initialize priority items from must-haves
  useEffect(() => {
    // Convert must-haves object to array of items with priorities
    const items = Object.entries(preferences.mustHaves).map(([name, priority]) => ({
      name,
      priority
    }));
    
    // Sort by priority
    items.sort((a, b) => a.priority - b.priority);
    
    setPriorityItems(items);
    
    // Update prioritizedMustHaves array
    setPrioritizedMustHaves(items.map(item => item.name));
  }, [preferences.mustHaves]);
  
  // Handle drag start
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    // For Firefox
    e.dataTransfer.setData('text/plain', item.name);
  };
  
  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  // Handle drop
  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    
    if (draggedItem) {
      const newItems = [...priorityItems];
      const draggedIndex = newItems.findIndex(item => item.name === draggedItem.name);
      
      // Remove the dragged item
      const [removed] = newItems.splice(draggedIndex, 1);
      
      // Insert at the new position
      newItems.splice(targetIndex, 0, removed);
      
      // Update priorities
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        priority: index + 1
      }));
      
      setPriorityItems(updatedItems);
      
      // Update prioritizedMustHaves
      setPrioritizedMustHaves(updatedItems.map(item => item.name));
      
      // Update preferences.mustHaves
      const newMustHaves = {};
      updatedItems.forEach(item => {
        newMustHaves[item.name] = item.priority;
      });
      
      setPreferences(prev => ({
        ...prev,
        mustHaves: newMustHaves
      }));
      
      setDraggedItem(null);
    }
  };
  
  // Handle adding an item to priorities
  const addToPriorities = (item) => {
    // Check if already in priorities
    if (priorityItems.some(i => i.name === item)) return;
    
    // Add to the end with next priority
    const nextPriority = priorityItems.length + 1;
    const newItem = { name: item, priority: nextPriority };
    
    const newItems = [...priorityItems, newItem];
    setPriorityItems(newItems);
    
    // Update prioritizedMustHaves
    setPrioritizedMustHaves([...prioritizedMustHaves, item]);
    
    // Update preferences.mustHaves
    const newMustHaves = { ...preferences.mustHaves };
    newMustHaves[item] = nextPriority;
    
    setPreferences(prev => ({
      ...prev,
      mustHaves: newMustHaves
    }));
  };
  
  // Handle removing an item from priorities
  const removeFromPriorities = (item) => {
    const newItems = priorityItems.filter(i => i.name !== item);
    
    // Recalculate priorities
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      priority: index + 1
    }));
    
    setPriorityItems(updatedItems);
    
    // Update prioritizedMustHaves
    setPrioritizedMustHaves(updatedItems.map(item => item.name));
    
    // Update preferences.mustHaves
    const newMustHaves = {};
    updatedItems.forEach(item => {
      newMustHaves[item.name] = item.priority;
    });
    
    setPreferences(prev => ({
      ...prev,
      mustHaves: newMustHaves
    }));
  };

  return (
    <form className="preference-form" onSubmit={handleSubmit}>
      <div className="form-section upload-section">
        <h3>Upload Your Google Timeline Data</h3>
        <p className="section-description">
          Upload your timeline.json file from Google Takeout to get personalized recommendations based on your movement patterns.
        </p>
        
        <div className="file-upload-container">
          <div className="file-input-wrapper">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="file-input"
              id="timeline-upload"
            />
            <label htmlFor="timeline-upload" className="file-label">
              {selectedFile ? selectedFile.name : 'Choose timeline.json file'}
            </label>
          </div>
          
          <button 
            type="button" 
            className={`upload-btn ${!selectedFile ? 'disabled' : ''}`}
            onClick={handleFileUpload}
            disabled={!selectedFile || uploadStatus === 'uploading'}
          >
            {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
        
        {uploadStatus === 'uploading' && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">
              {uploadProgress < 100 ? `${uploadProgress}% Uploaded` : 'Processing file...'}
            </span>
          </div>
        )}
        
        {uploadStatus === 'success' && (
          <div className="upload-success">
            <span className="success-icon">✓</span>
            <span>File uploaded successfully! We'll analyze your movement patterns.</span>
          </div>
        )}
        
        {uploadStatus === 'error' && (
          <div className="upload-error">
            <span className="error-icon">✗</span>
            <span>Error uploading file. Please try again.</span>
          </div>
        )}
      </div>

      <div className="form-section">
        <h3>Select Your Spending Category</h3>
        <p className="section-description">
          Choose the category that best describes your monthly spending habits in India.
        </p>
        
        <div className="category-selector">
          {userCategories.map((category) => (
            <div 
              key={category.id}
              className={`category-card ${preferences.userCategory === category.id ? 'selected' : ''}`}
              onClick={() => handleCategorySelect(category.id)}
              style={{ borderColor: preferences.userCategory === category.id ? category.color : 'transparent' }}
            >
              <div className="category-icon" style={{ backgroundColor: category.color }}>
                {category.icon}
              </div>
              <h4 className="category-name">{category.name}</h4>
              <p className="category-description">{category.description}</p>
              <div className="category-price">{category.priceRange}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-section commute-section">
        <h3>Commute Preferences</h3>
        <p className="section-description">
          Enter your work/school address and select how far you're willing to travel.
        </p>
        
        <div className="input-group">
          <label>Work/School Address</label>
          <input
            type="text"
            value={preferences.commute.workAddress}
            onChange={(e) => handleInputChange('commute', 'workAddress', e.target.value)}
            placeholder="Enter your work/school address"
          />
        </div>
        
        <div className="travel-mode-selector">
          <label>How will you travel?</label>
          <div className="travel-modes">
            {travelModes.map((mode) => (
              <div
                key={mode.id}
                className={`travel-mode ${preferences.commute.travelMode === mode.id ? 'active' : ''} ${preferences.commute.travelModes[mode.id].enabled ? 'enabled' : ''}`}
                onClick={() => handleTravelModeSelect(mode.id)}
                style={{ 
                  borderColor: preferences.commute.travelModes[mode.id].enabled 
                    ? getTravelModeColor(mode.id) 
                    : 'transparent' 
                }}
              >
                <div className="travel-mode-icon" style={{ backgroundColor: getTravelModeColor(mode.id) }}>
                  {mode.icon}
                </div>
                <div className="travel-mode-label">{mode.label}</div>
                {preferences.commute.travelModes[mode.id].enabled && (
                  <div className="travel-mode-distance">
                    {preferences.commute.travelModes[mode.id].distance} km
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="distance-slider-container">
          <label>
            Maximum Travel Distance: <span className="distance-value">{preferences.commute.travelModes[preferences.commute.travelMode].distance} km</span>
          </label>
          <input
            type="range"
            min="1"
            max={currentTravelMode.maxDistance}
            step="1"
            value={preferences.commute.travelModes[preferences.commute.travelMode].distance}
            onChange={(e) => handleInputChange('commute', 'travelModes', {
              ...preferences.commute.travelModes,
              [preferences.commute.travelMode]: {
                ...preferences.commute.travelModes[preferences.commute.travelMode],
                distance: parseInt(e.target.value)
              }
            })}
            className="distance-slider"
          />
          <div className="distance-range">
            <span>1 km</span>
            <span>{currentTravelMode.maxDistance} km</span>
          </div>
        </div>
        
        <div className="commute-map-container">
          <div ref={mapRef} className="commute-map"></div>
          {!preferences.commute.workAddress && (
            <div className="map-overlay">
              <p>Enter an address above to see your commute range</p>
            </div>
          )}
        </div>
      </div>

      <div className="form-section">
        <h2>What is important to you?</h2>
        <p className="section-description">We use these lifestyle preferences to help you narrow down the best places to visit, so please select at least 3. You can always change these later.</p>
        
        <div className="lifestyle-grid">
          {lifestyleOptions.map((item) => (
            <div 
              key={item} 
              className={`lifestyle-item ${preferences.lifestylePreferences.includes(item) ? 'selected' : ''}`}
              onClick={() => handleCheckboxChange('lifestylePreferences', item)}
            >
              {item.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
            </div>
          ))}
          
          {/* Custom lifestyle preferences */}
          {preferences.customLifestyles.map((item, index) => (
            <div 
              key={`custom-${index}`} 
              className={`lifestyle-item ${item.value ? 'selected' : ''}`}
              onClick={() => handleCustomLifestyleChange(index)}
            >
              {item.name}
              <button
                type="button"
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCustomLifestyle(index);
                }}
                aria-label={`Remove ${item.name}`}
              >
                ×
              </button>
            </div>
          ))}
          
          {/* Add new preference button */}
          <div className="lifestyle-item add-preference">
            <input
              type="text"
              value={newLifestyle}
              onChange={(e) => setNewLifestyle(e.target.value)}
              placeholder="Add a New Preference Here"
              className="new-preference-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newLifestyle.trim()) {
                  e.preventDefault();
                  addCustomLifestyle();
                }
              }}
            />
            <button
              type="button"
              className="add-btn"
              onClick={addCustomLifestyle}
              disabled={!newLifestyle.trim()}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2>What Matters Most for You?</h2>
        <p className="section-description">Drag and drop to set priorities for what matters most in your neighborhood.</p>
        
        <div className="priority-section">
          <div className="priority-list">
            {priorityItems.map((item, index) => (
              <div 
                key={item.name}
                className="priority-item"
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="priority-rank">{index + 1}</div>
                <div className="priority-name">
                  {item.name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </div>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeFromPriorities(item.name)}
                  aria-label={`Remove ${item.name}`}
                >
                  ×
                </button>
              </div>
            ))}
            {priorityItems.length === 0 && (
              <div className="empty-priorities">
                <p>Select items from below to add to your priorities</p>
              </div>
            )}
          </div>
          
          <div className="available-items">
            <h3>Available Items</h3>
            <div className="available-items-grid">
              {mustHaveOptions.map((item) => (
                <div 
                  key={item}
                  className={`available-item ${priorityItems.some(i => i.name === item) ? 'in-list' : ''}`}
                  onClick={() => !priorityItems.some(i => i.name === item) && addToPriorities(item)}
                >
                  {item.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  {!priorityItems.some(i => i.name === item) && (
                    <span className="add-icon">+</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        <button 
          type="submit" 
          className={`submit-btn ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Finding Your Perfect Neighborhood...
            </>
          ) : (
            'Find My Perfect Neighborhood'
          )}
        </button>
      </div>
    </form>
  );
};

export default PreferenceForm; 