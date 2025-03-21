import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const ORSMap = () => {
  const defaultPosition = [40.7128, -74.006]; // New York City coordinates
  // const [position, setPosition] = useState(position);
  // const [address, setAddress] = useState("");

  return (
    <div className="map-wrapper">
      <MapContainer 
        center={defaultPosition} 
        zoom={12} 
        style={{ height: "400px", width: "100%" }}
      >
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
    </div>
  );
};

export default ORSMap;