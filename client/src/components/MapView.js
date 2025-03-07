import React, { useEffect, useRef } from 'react';
import '../styles/components/MapView.css';

const MapView = ({ locations, center, zoom = 12 }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markers = useRef([]);

  useEffect(() => {
    // Initialize map if Google Maps API is loaded
    if (window.google && mapRef.current && !mapInstance.current) {
      // Use provided center or default to San Francisco
      const mapCenter = center || { lat: 37.7749, lng: -122.4194 };
      
      // Create the map
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
    }
    
    // Add markers when locations change
    if (window.google && mapInstance.current && locations && locations.length > 0) {
      // Clear existing markers
      markers.current.forEach(marker => marker.setMap(null));
      markers.current = [];
      
      // Create bounds object to fit all markers
      const bounds = new window.google.maps.LatLngBounds();
      
      // Add new markers
      locations.forEach((location, index) => {
        if (location.position) {
          const position = {
            lat: location.position.lat,
            lng: location.position.lng
          };
          
          // Create marker
          const marker = new window.google.maps.Marker({
            position,
            map: mapInstance.current,
            title: location.name,
            label: {
              text: (index + 1).toString(),
              color: 'white'
            },
            animation: window.google.maps.Animation.DROP
          });
          
          // Create info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="map-info-window">
                <h3>${location.name}</h3>
                <p>${location.type || 'Social Group'}</p>
              </div>
            `
          });
          
          // Add click listener to open info window
          marker.addListener('click', () => {
            infoWindow.open(mapInstance.current, marker);
          });
          
          // Add marker to array
          markers.current.push(marker);
          
          // Extend bounds to include this marker
          bounds.extend(position);
        }
      });
      
      // Fit map to bounds if we have markers
      if (markers.current.length > 0) {
        mapInstance.current.fitBounds(bounds);
        
        // Don't zoom in too far
        const listener = window.google.maps.event.addListener(mapInstance.current, 'idle', () => {
          if (mapInstance.current.getZoom() > 15) {
            mapInstance.current.setZoom(15);
          }
          window.google.maps.event.removeListener(listener);
        });
      }
    }
  }, [locations, center, zoom]);

  // If no locations, show a message
  if (!locations || locations.length === 0) {
    return (
      <div className="map-container empty">
        <div className="map-placeholder">
          <p>No locations to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div ref={mapRef} className="map"></div>
    </div>
  );
};

export default MapView; 