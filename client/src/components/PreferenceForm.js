import React, { useState, useRef, useEffect } from 'react';
import '../styles/components/PreferenceForm.css';

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
  const [preferences, setPreferences] = useState({
    userCategory: 'moderate', // default category
    commute: {
      workAddress: '',
      maxCommuteDistance: 5, // in kilometers
      travelMode: 'driving', // default travel mode
      coordinates: null // will store lat/lng of the address
    },
    lifestyle: {
      nightlife: false,
      familyFriendly: false,
      outdoorActivities: false,
      shopping: false,
      dining: false,
      quietNeighborhood: false
    },
    mustHaves: {
      parking: false,
      publicTransport: false,
      parks: false,
      schools: false,
      groceryStores: false,
      gym: false
    }
  });

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

    const { workAddress, maxCommuteDistance } = preferences.commute;
    
    if (workAddress.trim()) {
      geocodeAddress(workAddress);
    }
  }, [mapInstance, geocoder, preferences.commute.workAddress, preferences.commute.maxCommuteDistance, preferences.commute.travelMode]);

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
    
    const { maxCommuteDistance, travelMode } = preferences.commute;
    
    // Remove existing circle
    if (commuteCircle) {
      commuteCircle.setMap(null);
    }
    
    // Get color based on travel mode
    const circleColor = getTravelModeColor(travelMode);
    
    // Create new circle
    const circle = new window.google.maps.Circle({
      map: mapInstance,
      center: center,
      radius: maxCommuteDistance * 1000, // convert km to meters
      strokeColor: circleColor,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: circleColor,
      fillOpacity: 0.1
    });
    
    setCommuteCircle(circle);
    
    // Adjust map zoom to fit circle
    const bounds = circle.getBounds();
    if (bounds) {
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

  const handleCheckboxChange = (category, field) => {
    setPreferences({
      ...preferences,
      [category]: {
        ...preferences[category],
        [field]: !preferences[category][field]
      }
    });
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
    setPreferences(prev => ({
      ...prev,
      commute: {
        ...prev.commute,
        travelMode: modeId,
        // If current distance exceeds max for this mode, adjust it
        maxCommuteDistance: Math.min(prev.commute.maxCommuteDistance, selectedMode.maxDistance)
      }
    }));
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
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setUploadStatus('success');
          // Parse the response and update preferences based on the analysis
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('Upload successful:', response);
            
            // If the server returns timeline data, pass it to the parent component
            if (response.timelineData && onTimelineData) {
              onTimelineData(response.timelineData);
            }
            
            // If the server suggests a user category, update it
            if (response.suggestedCategory) {
              setPreferences(prev => ({
                ...prev,
                userCategory: response.suggestedCategory
              }));
            }
          } catch (error) {
            console.error('Error parsing response:', error);
          }
        } else {
          setUploadStatus('error');
          console.error('Upload failed:', xhr.statusText);
        }
      });

      xhr.addEventListener('error', () => {
        setUploadStatus('error');
        console.error('Upload failed due to network error');
      });

      xhr.open('POST', 'http://192.168.0.118:3000/api/upload');
      xhr.send(formData);
    } catch (error) {
      setUploadStatus('error');
      console.error('Error uploading file:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(preferences);
  };

  // Get the current travel mode object
  const currentTravelMode = travelModes.find(mode => mode.id === preferences.commute.travelMode) || travelModes[3];

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
            <span className="progress-text">{uploadProgress}% Uploaded</span>
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
                className={`travel-mode ${preferences.commute.travelMode === mode.id ? 'selected' : ''}`}
                onClick={() => handleTravelModeSelect(mode.id)}
                style={{ borderColor: preferences.commute.travelMode === mode.id ? getTravelModeColor(mode.id) : 'transparent' }}
              >
                <div className="travel-mode-icon" style={{ backgroundColor: getTravelModeColor(mode.id) }}>
                  {mode.icon}
                </div>
                <span className="travel-mode-label">{mode.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="distance-slider-container">
          <label>
            Maximum Travel Distance: <span className="distance-value">{preferences.commute.maxCommuteDistance} km</span>
          </label>
          <input
            type="range"
            min="1"
            max={currentTravelMode.maxDistance}
            step="1"
            value={preferences.commute.maxCommuteDistance}
            onChange={(e) => handleInputChange('commute', 'maxCommuteDistance', parseInt(e.target.value))}
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
        <h3>Lifestyle Preferences</h3>
        <div className="checkbox-group">
          {Object.keys(preferences.lifestyle).map((item) => (
            <div key={item} className="checkbox-item">
              <input
                type="checkbox"
                id={`lifestyle-${item}`}
                checked={preferences.lifestyle[item]}
                onChange={() => handleCheckboxChange('lifestyle', item)}
              />
              <label htmlFor={`lifestyle-${item}`}>{item.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h3>Must-Haves</h3>
        <div className="checkbox-group">
          {Object.keys(preferences.mustHaves).map((item) => (
            <div key={item} className="checkbox-item">
              <input
                type="checkbox"
                id={`mustHave-${item}`}
                checked={preferences.mustHaves[item]}
                onChange={() => handleCheckboxChange('mustHaves', item)}
              />
              <label htmlFor={`mustHave-${item}`}>{item.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</label>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className="submit-btn">Find Neighborhoods</button>
    </form>
  );
};

export default PreferenceForm; 