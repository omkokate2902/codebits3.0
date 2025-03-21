import React, { useEffect, useRef } from 'react';
import '../styles/components/MapView.css';

const MapView = ({ markers = [], center, zoom = 12, radius = null }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const mapMarkers = useRef([]);
  const radiusCircle = useRef(null);

  useEffect(() => {
    console.log('MapView: Rendering with markers:', markers);
    console.log('MapView: Center:', center);
    console.log('MapView: Radius:', radius);
    
    // Check if Google Maps API is available
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      return;
    }

    // Initialize map if Google Maps API is loaded
    if (mapRef.current && !mapInstance.current) {
      console.log('MapView: Initializing map');
      // Use provided center or default to New Delhi (since we're focusing on Indian cities)
      const mapCenter = center || { lat: 28.6139, lng: 77.2090 };
      
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
      
      console.log('MapView: Map initialized');
    }
    
    // Update radius circle if needed
    if (mapInstance.current && center && radius) {
      // Clear existing radius circle
      if (radiusCircle.current) {
        radiusCircle.current.setMap(null);
      }
      
      // Create new radius circle
      radiusCircle.current = new window.google.maps.Circle({
        map: mapInstance.current,
        center: center,
        radius: radius.radius,
        ...radius.options
      });
      
      console.log('MapView: Radius circle added:', radius.radius, 'meters');
    } else if (radiusCircle.current) {
      // Remove circle if no radius provided
      radiusCircle.current.setMap(null);
      radiusCircle.current = null;
    }
    
    // Add markers when markers array changes
    if (mapInstance.current && markers && markers.length > 0) {
      console.log('MapView: Adding markers to map');
      
      // Clear existing markers
      mapMarkers.current.forEach(marker => marker.setMap(null));
      mapMarkers.current = [];
      
      // Create bounds object to fit all markers
      const bounds = new window.google.maps.LatLngBounds();
      
      // Add new markers
      markers.forEach((marker, index) => {
        if (marker.coordinates && marker.coordinates.lat && marker.coordinates.lng) {
          const position = {
            lat: parseFloat(marker.coordinates.lat),
            lng: parseFloat(marker.coordinates.lng)
          };
          
          console.log(`MapView: Adding marker ${index}:`, marker.name, position);
          
          // Determine marker icon based on category
          let icon = null;
          const categoryIcons = {
            'neighborhood': {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#4285f4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 10
            },
            'restaurant': {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
            },
            'cafe': {
              url: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
            },
            'gym': {
              url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
            },
            'park': {
              url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
            },
            'shopping_mall': {
              url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
            },
            'entertainment': {
              url: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png'
            }
          };
          
          // Use category-based icon or default to category label
          if (marker.category && categoryIcons[marker.category]) {
            icon = categoryIcons[marker.category];
          }
          
          // Create marker
          const mapMarker = new window.google.maps.Marker({
            position,
            map: mapInstance.current,
            title: marker.name,
            icon: icon,
            label: icon && icon.url ? {
              text: (index).toString(),
              color: 'white'
            } : null,
            animation: window.google.maps.Animation.DROP
          });
          
          // Create info window with more detailed content
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="map-info-window">
                <h3>${marker.name}</h3>
                ${marker.category === 'neighborhood' 
                  ? `<p class="info-window-type">Selected Neighborhood</p>` 
                  : `<p class="info-window-type">${marker.category.replace(/_/g, ' ')}</p>`
                }
                ${marker.address ? `<p class="info-window-address">${marker.address}</p>` : ''}
                ${marker.description ? `<p class="info-window-description">${marker.description}</p>` : ''}
                ${marker.category !== 'neighborhood' 
                  ? `<button class="info-window-directions" onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(marker.address || marker.name)}', '_blank')">Get Directions</button>` 
                  : ''
                }
              </div>
            `
          });
          
          // Add click listener to open info window
          mapMarker.addListener('click', () => {
            // Close any open info windows
            mapMarkers.current.forEach(m => {
              if (m.infoWindow && m.infoWindow.getMap()) {
                m.infoWindow.close();
              }
            });
            
            infoWindow.open(mapInstance.current, mapMarker);
            mapMarker.infoWindow = infoWindow;
          });
          
          // Add marker to array
          mapMarker.infoWindow = infoWindow;
          mapMarkers.current.push(mapMarker);
          
          // Extend bounds to include this marker
          bounds.extend(position);
        } else {
          console.warn(`MapView: Invalid coordinates for marker ${index}:`, marker);
        }
      });
      
      // Fit map to bounds if we have markers
      if (mapMarkers.current.length > 0) {
        console.log('MapView: Fitting bounds to markers');
        mapInstance.current.fitBounds(bounds);
        
        // Don't zoom in too far
        const listener = window.google.maps.event.addListener(mapInstance.current, 'idle', () => {
          if (mapInstance.current.getZoom() > 15) {
            mapInstance.current.setZoom(15);
          }
          window.google.maps.event.removeListener(listener);
        });
      }
    } else if (mapInstance.current && center) {
      // If we have a center but no markers, just center the map
      console.log('MapView: Centering map on provided coordinates');
      mapInstance.current.setCenter(center);
      mapInstance.current.setZoom(zoom);
    } else {
      console.log('MapView: No markers or center provided');
    }
  }, [markers, center, zoom, radius]);

  // If no markers, show a message
  if (!markers || markers.length === 0) {
    return (
      <div className="map-container empty">
        <div className="map-placeholder">
          <p>No locations to display</p>
          <p className="map-placeholder-subtitle">Select a neighborhood to see places</p>
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