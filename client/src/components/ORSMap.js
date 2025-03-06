import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// const ORS_API_KEY = '5b3ce3597851110001cf6248cce93eba32514921b61e4c2260ed1def';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function ORSMap() {
    const defaultPosition = [40.7128, -74.006];
    // const [position, setPosition] = useState(position);
    // const [address, setAddress] = useState("");


    return (
      <MapContainer center={defaultPosition} zoom={12} style={{ height: "400px", width: "100%" }}>
        {/* Load OpenRouteService tiles (OpenStreetMap-based) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
  
        {/* Marker for default location */}
        <Marker position={defaultPosition}>
          <Popup>New York City</Popup>
        </Marker>
      </MapContainer>
    );
}

export default ORSMap