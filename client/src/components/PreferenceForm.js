import React, { useState, useRef, useEffect } from 'react';
import '../styles/components/PreferenceForm.css';
import { savePreferences, getHousingRecommendations } from '../services/api';
import { analyzeTimelineData } from '../utils/geminiApi';
import * as userStorage from '../utils/userStorage';

const PreferenceForm = ({ onSubmit, onTimelineData, userId }) => {
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
      if (addressMarker && typeof addressMarker.setMap === 'function') {
        addressMarker.setMap(null);
      }
      
      // Handle case where commuteCircle is an array of circles
      if (commuteCircle) {
        if (Array.isArray(commuteCircle)) {
          // Clear all circles in the array
          commuteCircle.forEach(circle => {
            if (circle && typeof circle.setMap === 'function') {
              circle.setMap(null);
            }
          });
        } else if (typeof commuteCircle.setMap === 'function') {
          // Clear single circle
          commuteCircle.setMap(null);
        }
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
        commuteCircle.forEach(circle => {
          if (circle && typeof circle.setMap === 'function') {
            circle.setMap(null);
          }
        });
      } else if (typeof commuteCircle.setMap === 'function') {
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
        try {
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
        } catch (error) {
          console.error(`Error creating circle for travel mode ${modeId}:`, error);
        }
      }
    });
    
    // Store all circles
    setCommuteCircle(circles);
    
    // Adjust map zoom to fit all circles
    if (circles.length > 0) {
      try {
        mapInstance.fitBounds(bounds);
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
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
      try {
        updateCommuteCircle(preferences.commute.coordinates);
      } catch (error) {
        console.error('Error updating commute circle:', error);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.json') || file.name.endsWith('.txt')) {
        setSelectedFile(file);
        setUploadStatus('ready');
      } else {
        setUploadStatus('error');
        setSelectedFile(null);
        alert('Please select a valid JSON or TXT file from Google Takeout');
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

    try {
      console.log('Processing file:', selectedFile.name);
      
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
      
      // Read the file content
      const fileContent = await readFileAsText(selectedFile);
      console.log('File content loaded, length:', fileContent.length);
      
      // Check if the file content is valid JSON (only for JSON files)
      if (selectedFile.name.endsWith('.json')) {
        try {
          JSON.parse(fileContent);
          console.log('File content is valid JSON');
        } catch (jsonError) {
          console.error('File content is not valid JSON:', jsonError);
          clearInterval(progressInterval);
          setUploadStatus('error');
          alert('The selected file is not a valid JSON file. Please select a valid timeline.json file.');
          return;
        }
      }
      
      // Update progress
      clearInterval(progressInterval);
      setUploadProgress(95);
      setUploadStatus('processing');
      
      // Analyze the timeline data using Gemini API
      console.log('Sending data to Gemini API for analysis...');
      const analysisResult = await analyzeTimelineData(fileContent);
      console.log('Timeline analysis result:', analysisResult);
      
      // Save analysis results to local storage if userId is available
      if (userId) {
        userStorage.saveUserAnalysis(userId, analysisResult);
        console.log('Analysis results saved for user:', userId);
        
        // Determine and save user persona based on personality traits
        if (analysisResult && analysisResult.personality_traits && analysisResult.personality_traits.length > 0) {
          // Simple algorithm to determine persona based on traits
          let persona = 'balanced';
          
          const traits = analysisResult.personality_traits.map(trait => trait.toLowerCase());
          
          if (traits.some(trait => 
            trait.includes('luxury') || 
            trait.includes('premium') || 
            trait.includes('high-end'))) {
            persona = 'luxury';
          } else if (traits.some(trait => 
            trait.includes('active') || 
            trait.includes('outdoor') || 
            trait.includes('adventurous'))) {
            persona = 'active';
          } else if (traits.some(trait => 
            trait.includes('social') || 
            trait.includes('outgoing') || 
            trait.includes('community'))) {
            persona = 'social';
          } else if (traits.some(trait => 
            trait.includes('budget') || 
            trait.includes('thrifty') || 
            trait.includes('economical'))) {
            persona = 'budget';
          } else if (traits.some(trait => 
            trait.includes('family') || 
            trait.includes('children') || 
            trait.includes('kid'))) {
            persona = 'family';
          }
          
          // Save the persona
          userStorage.saveUserPersona(userId, persona);
          console.log('User persona determined and saved:', persona);
        }
      }
      
      // Complete the progress
      setUploadProgress(100);
      setUploadStatus('success');
      
      // Show a more detailed success message
      alert(`Analysis complete! We've identified ${analysisResult.personality_traits.length} personality traits and ${analysisResult.lifestyle_indicators.length} lifestyle indicators.`);
      
      // Pass the analysis result to the parent component
      if (onTimelineData) {
        onTimelineData(analysisResult);
      }
      
      // Update user category based on analysis if possible
      if (analysisResult && analysisResult.personality_traits) {
        // Try to determine user category from personality traits
        const traits = analysisResult.personality_traits.map(trait => trait.toLowerCase());
        
        if (traits.some(trait => trait.includes('luxury') || trait.includes('premium'))) {
          setPreferences(prev => ({ ...prev, userCategory: 'luxury' }));
        } else if (traits.some(trait => trait.includes('comfort') || trait.includes('quality'))) {
          setPreferences(prev => ({ ...prev, userCategory: 'comfort' }));
        } else if (traits.some(trait => trait.includes('budget') || trait.includes('thrifty'))) {
          setPreferences(prev => ({ ...prev, userCategory: 'budget' }));
        }
      }
      
      // Update lifestyle preferences based on analysis
      if (analysisResult && analysisResult.lifestyle_indicators) {
        const lifestyleMap = {
          'active': 'activeLifestyle',
          'outdoor': 'outdoorActivities',
          'shopping': 'shopping',
          'dining': 'casualDining',
          'restaurant': 'casualDining',
          'fine dining': 'fineDining',
          'nightlife': 'nightlife',
          'cultural': 'cultural',
          'arts': 'artsAndMusic',
          'music': 'artsAndMusic',
          'family': 'familyFriendly',
          'quiet': 'quiet',
          'community': 'community',
          'social': 'socialGatherings'
        };
        
        // Create a new array of lifestyle preferences
        const newLifestylePrefs = [...preferences.lifestylePreferences];
        
        // Add lifestyle preferences based on indicators
        analysisResult.lifestyle_indicators.forEach(indicator => {
          // Check each keyword in the lifestyleMap
          Object.entries(lifestyleMap).forEach(([keyword, prefKey]) => {
            if (indicator.toLowerCase().includes(keyword) && !newLifestylePrefs.includes(prefKey)) {
              newLifestylePrefs.push(prefKey);
            }
          });
        });
        
        // Update preferences if we found any matches
        if (newLifestylePrefs.length > preferences.lifestylePreferences.length) {
          setPreferences(prev => ({
            ...prev,
            lifestylePreferences: newLifestylePrefs
          }));
        }
      }
      
      // Add frequent locations to priority list
      if (analysisResult && analysisResult.frequent_locations && analysisResult.frequent_locations.length > 0) {
        // Map location names to must-have items
        const locationToMustHaveMap = {
          'Home': 'parking',
          'Office': 'publicTransport',
          'Grocery Store': 'groceryStores',
          'Restaurant': 'restaurants',
          'Cafe': 'cafes',
          'Coffee Shop': 'cafes',
          'Gym': 'gym',
          'Park': 'parks',
          'School': 'schools'
        };
        
        // Get current priority items
        const currentPriorityItems = [...priorityItems];
        const currentPriorityNames = currentPriorityItems.map(item => item.name);
        
        // New items to add
        const newItems = [];
        
        // Process each frequent location
        analysisResult.frequent_locations.forEach(location => {
          // Find matching must-have item
          let mustHaveItem = null;
          
          // Direct mapping
          if (locationToMustHaveMap[location]) {
            mustHaveItem = locationToMustHaveMap[location];
          } else {
            // Try partial matching
            for (const [locKey, mustHaveKey] of Object.entries(locationToMustHaveMap)) {
              if (location.toLowerCase().includes(locKey.toLowerCase())) {
                mustHaveItem = mustHaveKey;
                break;
              }
            }
          }
          
          // If we found a matching must-have and it's not already in the list
          if (mustHaveItem && !currentPriorityNames.includes(mustHaveItem) && !newItems.includes(mustHaveItem)) {
            newItems.push(mustHaveItem);
          }
        });
        
        // Add new items to priorities
        newItems.forEach(item => {
          addToPriorities(item);
        });
        
        // If we added items, show a message
        if (newItems.length > 0) {
          console.log(`Added ${newItems.length} frequent locations to priorities: ${newItems.join(', ')}`);
        }
      }
      
    } catch (error) {
      console.error('Analysis failed:', error);
      setUploadStatus('error');
      
      // Show a more specific error message
      if (error.message) {
        alert(`Analysis failed: ${error.message}`);
      } else {
        alert('Analysis failed. Please try again.');
      }
    }
  };
  
  // Helper function to read file as text
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        
        // If it's a JSON file, try to parse it to validate
        if (file.name.endsWith('.json')) {
          try {
            // Just validate, but return the original text
            JSON.parse(content);
            resolve(content);
          } catch (error) {
            console.error('Invalid JSON file:', error);
            reject(new Error('Invalid JSON file. Please select a valid timeline.json file.'));
          }
        } else {
          // For TXT files, just return the content
          resolve(content);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
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
      
      // Save preferences to local storage if userId is available
      if (userId) {
        userStorage.saveUserPreferences(userId, finalPreferences);
        console.log('Preferences saved locally for user:', userId);
      }
      
      // Save preferences to backend
      const saveResponse = await savePreferences(finalPreferences);
      console.log('Preferences saved to backend:', saveResponse);
      
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

  // Load user data from local storage when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      loadUserData(userId);
    }
  }, [userId]);

  // Function to load user data from local storage
  const loadUserData = (uid) => {
    try {
      // Get user preferences from storage
      const savedPreferences = userStorage.getUserPreferences(uid);
      if (savedPreferences) {
        console.log('Loaded saved preferences for user:', uid);
        setPreferences(savedPreferences);
        
        // If there are prioritized must-haves, load them
        if (savedPreferences.prioritizedMustHaves) {
          const savedPriorityItems = savedPreferences.prioritizedMustHaves.map(item => ({
            name: item.name,
            priority: item.priority
          }));
          setPriorityItems(savedPriorityItems);
          setPrioritizedMustHaves(savedPriorityItems.map(item => item.name));
        }
      }
      
      // Get user analysis results from storage
      const savedAnalysis = userStorage.getUserAnalysis(uid);
      if (savedAnalysis && onTimelineData) {
        console.log('Loaded saved analysis for user:', uid);
        onTimelineData(savedAnalysis);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Add a function to render saved user data
  const renderSavedUserData = () => {
    if (!userId) return null;
    
    const savedAnalysis = userStorage.getUserAnalysis(userId);
    const savedPersona = userStorage.getUserPersona(userId);
    
    if (!savedAnalysis && !savedPersona) return null;
    
    // Define persona details
    const personaDetails = {
      luxury: {
        icon: '💎',
        color: '#9b59b6',
        description: 'You value premium experiences and high-quality amenities in your living environment.',
        traits: ['Appreciates quality', 'Enjoys premium services', 'Values aesthetics']
      },
      active: {
        icon: '🏃',
        color: '#2ecc71',
        description: 'You lead an energetic lifestyle and prefer neighborhoods with outdoor activities and fitness options.',
        traits: ['Energetic', 'Outdoor enthusiast', 'Health-conscious']
      },
      social: {
        icon: '🎭',
        color: '#f39c12',
        description: 'You thrive in vibrant communities with plenty of social gatherings and cultural events.',
        traits: ['Outgoing', 'Community-oriented', 'Enjoys events']
      },
      budget: {
        icon: '💰',
        color: '#3498db',
        description: 'You are practical and value-conscious, prioritizing affordability and essential amenities.',
        traits: ['Practical', 'Value-conscious', 'Resourceful']
      },
      family: {
        icon: '👨‍👩‍👧‍👦',
        color: '#e74c3c',
        description: 'You prioritize family-friendly environments with good schools and safe neighborhoods.',
        traits: ['Family-oriented', 'Safety-conscious', 'Community-minded']
      },
      balanced: {
        icon: '⚖️',
        color: '#34495e',
        description: 'You appreciate a well-rounded lifestyle with a mix of amenities and experiences.',
        traits: ['Adaptable', 'Well-rounded', 'Balanced priorities']
      }
    };
    
    // Get persona info
    const persona = savedPersona || 'balanced';
    const personaInfo = personaDetails[persona];
    
    return (
      <div className="saved-data-section">
        <h3>Your Saved Profile</h3>
        
        {savedPersona && (
          <div className="saved-persona">
            <div className="persona-card" style={{ borderColor: personaInfo.color }}>
              <div className="persona-icon" style={{ backgroundColor: personaInfo.color }}>
                {personaInfo.icon}
              </div>
              <div className="persona-content">
                <h4>You are a <span style={{ color: personaInfo.color }}>
                  {persona.charAt(0).toUpperCase() + persona.slice(1)}
                </span> Roommate</h4>
                <p className="persona-description">{personaInfo.description}</p>
                <div className="persona-traits">
                  {personaInfo.traits.map((trait, index) => (
                    <span key={index} className="persona-trait" style={{ backgroundColor: `${personaInfo.color}20`, color: personaInfo.color }}>
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="profile-data-grid">
          {savedAnalysis && savedAnalysis.personality_traits && savedAnalysis.personality_traits.length > 0 && (
            <div className="saved-traits">
              <h4>Your Personality Traits</h4>
              <div className="traits-list">
                {savedAnalysis.personality_traits.slice(0, 5).map((trait, index) => (
                  <span key={index} className="trait-badge">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {savedAnalysis && savedAnalysis.lifestyle_indicators && savedAnalysis.lifestyle_indicators.length > 0 && (
            <div className="saved-lifestyle">
              <h4>Your Lifestyle Indicators</h4>
              <div className="traits-list">
                {savedAnalysis.lifestyle_indicators.slice(0, 5).map((indicator, index) => (
                  <span key={index} className="trait-badge lifestyle-badge">
                    {indicator}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {savedAnalysis && savedAnalysis.frequent_locations && savedAnalysis.frequent_locations.length > 0 && (
          <div className="saved-locations">
            <h4>Your Frequent Locations</h4>
            <div className="locations-list">
              {savedAnalysis.frequent_locations.slice(0, 5).map((location, index) => (
                <div key={index} className="location-item">
                  <span className="location-icon">📍</span>
                  <span className="location-name">{location}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="saved-data-actions">
          <button 
            className="clear-data-btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your saved data? This will reset your profile and preferences.')) {
                userStorage.clearUserData(userId);
                window.location.reload();
              }
            }}
          >
            Reset Profile Data
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="preference-form-container">
      <h2 style={{textAlign: 'center'}}>Find Your Perfect Neighborhood</h2>
      
      {/* Display saved user data if available */}
      
      <form className="preference-form" onSubmit={handleSubmit}>
        <div className="form-section upload-section">
          <h3>Upload Your Google Timeline Data</h3>
          <p className="section-description">
            Upload your timeline.json file from Google Takeout to get personalized recommendations based on your movement patterns.
          </p>

          {renderSavedUserData()}

          
          <div className="file-upload-container">
            <div className="file-input-wrapper">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,.txt"
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
              disabled={!selectedFile || uploadStatus === 'uploading' || uploadStatus === 'processing'}
            >
              {uploadStatus === 'uploading' ? 'Uploading...' : 
               uploadStatus === 'processing' ? 'Analyzing...' : 'Upload File'}
            </button>
          </div>
          
          {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {uploadStatus === 'uploading' ? 
                  (uploadProgress < 100 ? `${uploadProgress}% Uploaded` : 'Processing file...') :
                  'Analyzing with AI... This may take a moment.'}
              </span>
            </div>
          )}
          
          {uploadStatus === 'success' && (
            <div className="upload-success">
              <span className="success-icon">✓</span>
              <span>
                File analyzed successfully! We've identified personality traits and lifestyle preferences.
                <br />
                <strong>Your preferences have been updated based on your movement patterns.</strong>
              </span>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="upload-error">
              <span className="error-icon">✗</span>
              <span>Error analyzing file. Please try again.</span>
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
    </div>
  );
};

export default PreferenceForm; 