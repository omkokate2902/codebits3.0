import React, { useEffect, useRef, useCallback } from 'react';
import '../styles/components/MapView.css';

const MapView = ({ locations, center, zoom = 12 }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const addMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !locations) return;

    const bounds = new window.google.maps.LatLngBounds();

    locations.forEach((location, index) => {
      const position = {
        lat: location.latitude,
        lng: location.longitude
      };

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: location.name,
        animation: window.google.maps.Animation.DROP,
        label: location.label || (index + 1).toString()
      });

      // Add info window
      if (location.description) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="info-window">
              <h3>${location.name}</h3>
              <p>${location.description}</p>
              ${location.address ? `<p>${location.address}</p>` : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });
      }

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Fit map to bounds if there are multiple locations
    if (locations.length > 1) {
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [locations]);

  useEffect(() => {
    // Load Google Maps API script
    const loadGoogleMapsAPI = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    };

    // Initialize map
    const initializeMap = () => {
      if (!window.google || !mapRef.current) return;

      const mapOptions = {
        center: center || { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
        zoom: zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
      };

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
      
      // Add markers if locations are provided
      if (locations && locations.length > 0) {
        addMarkers();
      }
    };

    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
    } else {
      loadGoogleMapsAPI();
    }

    return () => {
      // Clear markers when component unmounts
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
    };
  }, [center, zoom, locations, addMarkers]);

  // Add markers when locations change
  useEffect(() => {
    if (mapInstanceRef.current && locations && locations.length > 0) {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      
      addMarkers();
    }
  }, [locations, addMarkers]);

  return (
    <div className="map-container">
      <div ref={mapRef} className="google-map"></div>
    </div>
  );
};

export default MapView; 